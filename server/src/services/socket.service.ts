import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env.config';
import { logger } from '../config/logger.config';
import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';
import { registerListenTogetherHandlers } from './listenTogether.socket';
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
