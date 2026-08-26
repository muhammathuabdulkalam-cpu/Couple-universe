import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env.config';
import { logger } from '../config/logger.config';
import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';
import { registerListenTogetherHandlers } from './listenTogether.socket';
import { registerYouTubeListenTogetherHandlers } from './youtubeListenTogether.socket';
import { setSocketServer } from '../utils/socketServer';

export interface UserPresence {
  userId: string;
  socketId: string;
  lastSeen: Date;
  status: 'ONLINE' | 'OFFLINE' | 'AWAY';
}

class SocketService {
  private io: Server | null = null;
  public userPresenceMap: Map<string, UserPresence> = new Map();

  public init(httpServer: HttpServer): Server {
    this.io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin || origin.endsWith('.vercel.app') || origin === env.CORS_ORIGIN || env.NODE_ENV === 'development') {
            callback(null, true);
          } else {
            callback(null, true);
          }
        },
        credentials: true,
      },
      pingTimeout: 60000,
    });

    // Register global IO instance for notification controllers
    setSocketServer(this.io);

    // JWT Authentication Middleware for Socket Connection
    this.io.use(async (socket: Socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };
        const user = await User.findById(decoded.userId).select('_id name email role avatar relationshipId');

        if (!user) {
          return next(new Error('User not found'));
        }

        (socket as any).user = user;
        next();
      } catch (err) {
        logger.error('Socket authentication failed:', err);
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const user = (socket as any).user;
      logger.info(`🔌 Socket Connected: User ${user.name} (${user._id}) [SocketID: ${socket.id}]`);

      // Track Online Presence
      this.userPresenceMap.set(user._id.toString(), {
        userId: user._id.toString(),
        socketId: socket.id,
        lastSeen: new Date(),
        status: 'ONLINE',
      });

      // Broadcast user online event
      this.io?.emit('user_online', {
        userId: user._id.toString(),
        status: 'ONLINE',
        lastSeen: new Date(),
      });

      // Join Personal Rooms (both plain userId and user:userId for notifications)
      socket.join(user._id.toString());
      socket.join(`user:${user._id.toString()}`);

      // Register Listen Together Socket Handlers
      registerListenTogetherHandlers(this.io!, socket);
      registerYouTubeListenTogetherHandlers(this.io!, socket);

      // Socket Event Handlers
      socket.on('join_conversation', (conversationId: string) => {
        socket.join(conversationId);
        logger.info(`User ${user.name} joined conversation room: ${conversationId}`);
      });

      socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(conversationId);
      });

      // Typing Indicators
      socket.on('typing_start', ({ conversationId }: { conversationId: string }) => {
        socket.to(conversationId).emit('typing_start', {
          conversationId,
          userId: user._id.toString(),
          userName: user.name,
        });
      });

      socket.on('typing_stop', ({ conversationId }: { conversationId: string }) => {
        socket.to(conversationId).emit('typing_stop', {
          conversationId,
          userId: user._id.toString(),
        });
      });

      // Send Message Event
      socket.on('send_message', async (data: { conversationId: string; type?: string; content?: string; mediaId?: string; replyToMessageId?: string }) => {
        try {
          const { conversationId, type, content, mediaId, replyToMessageId } = data;

          const message = await Message.create({
            conversationId,
            sender: user._id,
            type: type || 'TEXT',
            content,
            mediaId: mediaId || undefined,
            replyToMessageId: replyToMessageId || undefined,
            status: 'SENT',
            readBy: [{ userId: user._id, readAt: new Date() }],
          });

          // Update Conversation lastMessageId
          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessageId: message._id,
            updatedAt: new Date(),
          });

          const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name email avatar')
            .populate('mediaId', 'secureUrl thumbnailUrl optimizedUrl mimeType')
            .populate('replyToMessageId', 'content sender type');

          // Emit to conversation room AND all participant user rooms for guaranteed instant delivery
          this.io?.to(conversationId).emit('receive_message', populatedMessage);
          const convDoc = await Conversation.findById(conversationId).select('participants');
          if (convDoc && convDoc.participants) {
            convDoc.participants.forEach((pId) => {
              this.io?.to(pId.toString()).emit('receive_message', populatedMessage);
              this.io?.to(`user:${pId.toString()}`).emit('receive_message', populatedMessage);
            });
          }

          // Update status to DELIVERED
          message.status = 'DELIVERED';
          await message.save();

          this.io?.to(conversationId).emit('message_delivered', {
            messageId: message._id,
            conversationId,
            status: 'DELIVERED',
          });
        } catch (err) {
          logger.error('Error handling socket send_message:', err);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Read Receipts
      socket.on('mark_read', async ({ conversationId, messageIds }: { conversationId: string; messageIds: string[] }) => {
        try {
          if (!messageIds || messageIds.length === 0) return;

          await Message.updateMany(
            { _id: { $in: messageIds }, 'readBy.userId': { $ne: user._id } },
            {
              $set: { status: 'READ' },
              $push: { readBy: { userId: user._id, readAt: new Date() } },
            }
          );

          this.io?.to(conversationId).emit('message_read', {
            conversationId,
            readByUserId: user._id.toString(),
            messageIds,
            status: 'READ',
          });
        } catch (err) {
          logger.error('Error handling socket mark_read:', err);
        }
      });

      // ─── WebRTC Call Signaling Relay ──────────────────────────────────────
      // All call events are relayed to the target user's personal room.
      // The server acts as a relay with automatic partner ID resolution fallback.

      const resolveTargetId = async (targetId: string): Promise<string> => {
        const userIdStr = user._id.toString();
        if (
          targetId &&
          mongoose.Types.ObjectId.isValid(targetId) &&
          targetId !== 'super-owner-id' &&
          targetId !== 'co-owner-id' &&
          targetId !== userIdStr
        ) {
          return targetId;
        }
        if (user.role === 'CO_OWNER') {
          const superOwner = await User.findOne({ role: 'SUPER_OWNER', isDeleted: { $ne: true } });
          if (superOwner) return superOwner._id.toString();
        } else if (user.role === 'SUPER_OWNER') {
          const coOwner = await User.findOne({ role: 'CO_OWNER', isDeleted: { $ne: true } });
          if (coOwner) return coOwner._id.toString();
        }
        return targetId;
      };

      socket.on('call:initiate', async (data: { targetUserId: string; callType: 'audio' | 'video'; callerName: string; callerAvatar?: string }) => {
        const { callType, callerName, callerAvatar } = data;
        const targetUserId = await resolveTargetId(data.targetUserId);

        logger.info(`📞 Call initiated by ${user.name} (${user._id}) → User ${targetUserId} [${callType}]`);

        const payload = {
          callType,
          callerId: user._id.toString(),
          callerName: callerName || user.name,
          callerAvatar: callerAvatar || user.avatar,
        };

        // Relay to target user's personal rooms and active socketId
        this.io?.to(targetUserId).emit('call:incoming', payload);
        this.io?.to(`user:${targetUserId}`).emit('call:incoming', payload);

        for (const [id, presence] of this.userPresenceMap.entries()) {
          if (id === targetUserId && presence.socketId) {
            this.io?.to(presence.socketId).emit('call:incoming', payload);
          }
        }
      });

      socket.on('call:accept', async (data: { callerId: string }) => {
        const callerId = await resolveTargetId(data.callerId);
        logger.info(`✅ Call accepted by ${user.name} → Caller ${callerId}`);
        const payload = {
          acceptedBy: user._id.toString(),
          acceptedByName: user.name,
        };
        this.io?.to(callerId).emit('call:accepted', payload);
        this.io?.to(`user:${callerId}`).emit('call:accepted', payload);
      });

      socket.on('call:reject', async (data: { callerId: string }) => {
        const callerId = await resolveTargetId(data.callerId);
        logger.info(`❌ Call rejected by ${user.name} → Caller ${callerId}`);
        const payload = {
          rejectedBy: user._id.toString(),
        };
        this.io?.to(callerId).emit('call:rejected', payload);
        this.io?.to(`user:${callerId}`).emit('call:rejected', payload);
      });

      socket.on('call:end', async (data: { targetUserId: string }) => {
        const targetUserId = await resolveTargetId(data.targetUserId);
        logger.info(`nitifying call end: ${user.name} → User ${targetUserId}`);
        const payload = {
          endedBy: user._id.toString(),
        };
        this.io?.to(targetUserId).emit('call:ended', payload);
        this.io?.to(`user:${targetUserId}`).emit('call:ended', payload);
      });

      // Save call history message into conversation thread
      socket.on('call:log_history', async (data: {
        targetUserId: string;
        callType: 'audio' | 'video';
        duration?: number;
        status: 'COMPLETED' | 'MISSED' | 'DECLINED';
      }) => {
        try {
          const { Conversation } = await import('../models/conversation.model');
          const { Message } = await import('../models/message.model');
          const targetUserId = await resolveTargetId(data.targetUserId);

          const conversation = await Conversation.findOne({
            participants: { $all: [user._id, targetUserId] },
            isDeleted: false,
          });

          if (!conversation) return;

          let contentText = '';
          const isVideo = data.callType === 'video';
          const icon = isVideo ? '📹' : '📞';
          const callLabel = isVideo ? 'Video Call' : 'Audio Call';

          if (data.status === 'COMPLETED') {
            const dur = data.duration || 0;
            const m = Math.floor(dur / 60);
            const s = dur % 60;
            const durFormatted = m > 0 ? `${m}m ${s}s` : `${s}s`;
            contentText = `${icon} ${callLabel} • ${durFormatted}`;
          } else if (data.status === 'DECLINED') {
            contentText = `${icon} Declined ${callLabel}`;
          } else {
            contentText = `${icon} Missed ${callLabel}`;
          }

          const message = await Message.create({
            conversationId: conversation._id,
            sender: user._id,
            type: 'CALL',
            content: contentText,
            status: 'SENT',
            readBy: [{ userId: user._id, readAt: new Date() }],
          });

          conversation.lastMessageId = message._id;
          conversation.updatedAt = new Date();
          await conversation.save();

          const populated = await Message.findById(message._id)
            .populate('sender', 'name email avatar');

          if (this.io) {
            this.io.to(conversation._id.toString()).emit('receive_message', populated);
            conversation.participants.forEach((pId: any) => {
              this.io?.to(pId.toString()).emit('receive_message', populated);
              this.io?.to(`user:${pId.toString()}`).emit('receive_message', populated);
            });
          }
        } catch (err: any) {
          logger.warn(`⚠️ call:log_history error: ${err.message}`);
        }
      });

      // WebRTC SDP Offer
      socket.on('call:webrtc-offer', async (data: { targetUserId: string; offer: Record<string, any> }) => {
        const targetUserId = await resolveTargetId(data.targetUserId);
        const payload = {
          offer: data.offer,
          fromUserId: user._id.toString(),
        };
        this.io?.to(targetUserId).emit('call:webrtc-offer', payload);
        this.io?.to(`user:${targetUserId}`).emit('call:webrtc-offer', payload);
      });

      // WebRTC SDP Answer
      socket.on('call:webrtc-answer', async (data: { targetUserId: string; answer: Record<string, any> }) => {
        const targetUserId = await resolveTargetId(data.targetUserId);
        const payload = {
          answer: data.answer,
          fromUserId: user._id.toString(),
        };
        this.io?.to(targetUserId).emit('call:webrtc-answer', payload);
        this.io?.to(`user:${targetUserId}`).emit('call:webrtc-answer', payload);
      });

      // ICE Candidate Exchange
      socket.on('call:ice-candidate', async (data: { targetUserId: string; candidate: Record<string, any> }) => {
        const targetUserId = await resolveTargetId(data.targetUserId);
        const payload = {
          candidate: data.candidate,
          fromUserId: user._id.toString(),
        };
        this.io?.to(targetUserId).emit('call:ice-candidate', payload);
        this.io?.to(`user:${targetUserId}`).emit('call:ice-candidate', payload);
      });
      // ─────────────────────────────────────────────────────────────────────

      // Disconnect Handler
      socket.on('disconnect', () => {
        logger.info(`❌ Socket Disconnected: User ${user.name} (${user._id})`);
        const now = new Date();

        this.userPresenceMap.set(user._id.toString(), {
          userId: user._id.toString(),
          socketId: socket.id,
          lastSeen: now,
          status: 'OFFLINE',
        });

        this.io?.emit('user_offline', {
          userId: user._id.toString(),
          status: 'OFFLINE',
          lastSeen: now,
        });
      });
    });

    return this.io;
  }

  public getIO(): Server {
    if (!this.io) {
      throw new Error('Socket.io server has not been initialized');
    }
    return this.io;
  }
}

export const socketService = new SocketService();
