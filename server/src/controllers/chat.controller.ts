import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { HTTP_STATUS, PLATFORM_CONSTANTS } from '../constants';
import { Conversation } from '../models/conversation.model';
import { Invite } from '../models/invite.model';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';
import { notificationService } from '../services/notification.service';
import { socketService } from '../services/socket.service';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

/**
 * Get total unread chat messages count across user conversations
 */
export const getUnreadChatCount = catchAsync(async (req: Request, res: Response) => {
  const currentUser = req.user!;

  const userConversations = await Conversation.find({
    participants: currentUser._id,
    isDeleted: false,
  }).select('_id');

  const conversationIds = userConversations.map((c) => c._id);

  const count = await Message.countDocuments({
    conversationId: { $in: conversationIds },
    sender: { $ne: currentUser._id },
    'readBy.userId': { $ne: currentUser._id },
    isDeleted: false,
  });

  return ApiResponse.success(res, 'Unread chat count retrieved', { count });
});

/**
 * Create or Get Existing Conversation
 */
export const createOrGetConversation = catchAsync(async (req: Request, res: Response) => {
  const { type, recipientId, groupName, groupDescription } = req.body;
  const currentUser = req.user!;

  if (type === 'PRIVATE') {
    if (!recipientId) {
      throw new AppError('Recipient ID is required for private conversations.', HTTP_STATUS.BAD_REQUEST);
    }

    // Check if private conversation already exists
    let conversation = await Conversation.findOne({
      type: 'PRIVATE',
      participants: { $all: [currentUser._id, recipientId] },
      isDeleted: false,
    })
      .populate('participants', 'name email avatar role')
      .populate('lastMessageId');

    if (!conversation) {
      conversation = await Conversation.create({
        type: 'PRIVATE',
        participants: [currentUser._id, recipientId],
        createdBy: currentUser._id,
      });

      conversation = await Conversation.findById(conversation._id).populate('participants', 'name email avatar role');
    }

    return ApiResponse.success(res, 'Private conversation ready', conversation);
  }

  if (type === 'RELATIONSHIP') {
    // Relationship Chat Room between Afzal & Amrin
    let conversation = await Conversation.findOne({
      type: 'RELATIONSHIP',
      isDeleted: false,
    })
      .populate('participants', 'name email avatar role')
      .populate('lastMessageId');

    if (!conversation) {
      // Find all owners
      const owners = await User.find({ role: { $in: ['SUPER_OWNER', 'CO_OWNER'] } }).select('_id');
      const ownerIds = owners.map((o) => o._id);

      conversation = await Conversation.create({
        type: 'RELATIONSHIP',
        participants: ownerIds.length > 0 ? ownerIds : [currentUser._id],
        createdBy: currentUser._id,
        groupInfo: {
          name: 'Afzal & Amrin Relationship Chat ❤️',
          description: 'Official private life communication room',
        },
      });

      conversation = await Conversation.findById(conversation._id).populate('participants', 'name email avatar role');
    }

    return ApiResponse.success(res, 'Relationship conversation ready', conversation);
  }

  // Group Chat
  const conversation = await Conversation.create({
    type: 'GROUP',
    participants: [currentUser._id],
    createdBy: currentUser._id,
    groupInfo: {
      name: groupName || 'New Group Chat',
      description: groupDescription || '',
    },
  });

  const populated = await Conversation.findById(conversation._id).populate('participants', 'name email avatar role');
  return ApiResponse.created(res, 'Group conversation created', populated);
});

/**
 * Get User Conversations
 */
export const getUserConversations = catchAsync(async (req: Request, res: Response) => {
  const currentUser = req.user!;
  const currentUserIdStr = currentUser._id.toString();

  // Helper: get sub-user IDs for this owner using two sources of truth
  const getMySubUserIds = async (ownerId: mongoose.Types.ObjectId): Promise<Set<string>> => {
    const idSet = new Set<string>();

    // Source 1: Invite.usedBy where createdBy === this owner (usedBy set = someone registered with it)
    const ownerInvites = await Invite.find({
      createdBy: ownerId,
      usedBy: { $exists: true, $ne: null },
    }).select('usedBy');

    for (const inv of ownerInvites) {
      if (inv.usedBy) idSet.add(inv.usedBy.toString());
    }

    // Source 2: InvitedUser.ownerUserId (most reliable, always set at invite creation time)
    const { InvitedUser } = await import('../models/invitedUser.model');
    const invitedUserDocs = await InvitedUser.find({
      ownerUserId: ownerId,
      isDeleted: false,
    }).select('_id email tokenCode');

    // For each InvitedUser record, find the matching registered User by email or tokenCode
    for (const invDoc of invitedUserDocs) {
      // Try to find the registered User account linked to this invite slot
      // Match by the invite token code via Invite.usedBy
      const inviteRecord = await Invite.findOne({ code: invDoc.tokenCode }).select('usedBy');
      if (inviteRecord?.usedBy) {
        idSet.add(inviteRecord.usedBy.toString());
      }
      // Also try matching by email if set
      if (invDoc.email) {
        const matchedUser = await User.findOne({
          email: invDoc.email,
          role: 'INVITED_USER',
          isDeleted: false,
        }).select('_id');
        if (matchedUser) idSet.add(matchedUser._id.toString());
      }
    }

    return idSet;
  };

  // Helper: get the owner ID for an invited user using multi-level resolution
  const getMyOwnerIdStr = async (userId: mongoose.Types.ObjectId): Promise<string> => {
    const userDoc = await User.findById(userId).select('email name relationshipId role createdBy');

    // Priority 1: InvitedUser doc matching name or email
    const { InvitedUser } = await import('../models/invitedUser.model');
    if (userDoc?.email || userDoc?.name) {
      const orConditions: any[] = [];
      if (userDoc.email && userDoc.email.trim() !== '') {
        orConditions.push({ email: userDoc.email.toLowerCase() });
      }
      if (userDoc.name && userDoc.name.trim() !== '') {
        orConditions.push({ name: new RegExp(`^${userDoc.name.trim()}$`, 'i') });
      }
      if (orConditions.length > 0) {
        const invitedDoc = await InvitedUser.findOne({
          $or: orConditions,
          isDeleted: false,
        }).select('ownerUserId');

        if (invitedDoc?.ownerUserId) {
          const ownerDoc = await User.findById(invitedDoc.ownerUserId).select('role');
          if (ownerDoc && ownerDoc.role !== 'ADMIN') {
            return ownerDoc._id.toString();
          }
        }
      }
    }

    // Priority 2: Relationship membership owner (SUPER_OWNER or CO_OWNER)
    if (userDoc?.relationshipId) {
      const { Relationship } = await import('../models/relationship.model');
      const rel = await Relationship.findById(userDoc.relationshipId);
      if (rel && rel.members) {
        const ownerMem = rel.members.find((m: any) => {
          const roleUpper = (m.role || '').toUpperCase();
          return roleUpper === 'SUPER_OWNER' || roleUpper === 'CO_OWNER';
        });
        if (ownerMem && ownerMem.user) {
          const ownerUser = await User.findById(ownerMem.user).select('role');
          if (ownerUser && ownerUser.role !== 'ADMIN') {
            return ownerUser._id.toString();
          }
        }
      }
    }

    // Priority 3: Invite token usedBy -> check createdBy (ignoring ADMIN users)
    const myInvite = await Invite.findOne({ usedBy: userId }).select('createdBy relationship');
    if (myInvite?.createdBy) {
      const inviterDoc = await User.findById(myInvite.createdBy).select('role');
      if (inviterDoc && inviterDoc.role !== 'ADMIN') {
        return inviterDoc._id.toString();
      }
      if (myInvite.relationship) {
        const { Relationship } = await import('../models/relationship.model');
        const rel = await Relationship.findById(myInvite.relationship);
        if (rel && rel.members) {
          const ownerMem = rel.members.find((m: any) => {
            const roleUpper = (m.role || '').toUpperCase();
            return roleUpper === 'SUPER_OWNER' || roleUpper === 'CO_OWNER';
          });
          if (ownerMem && ownerMem.user) {
            return ownerMem.user.toString();
          }
        }
      }
    }

    // Priority 4: User doc createdBy (if not ADMIN)
    if ((userDoc as any)?.createdBy) {
      const creatorDoc = await User.findById((userDoc as any).createdBy).select('role');
      if (creatorDoc && creatorDoc.role !== 'ADMIN') {
        return creatorDoc._id.toString();
      }
    }

    // Fallback: SUPER_OWNER (Afzal)
    const superOwner = await User.findOne({ role: 'SUPER_OWNER', isDeleted: false }).select('_id');
    return superOwner ? superOwner._id.toString() : '';
  };

  // 1. Auto-initialize conversations scoped by ownership
  try {
    if (currentUser.role === 'SUPER_OWNER' || currentUser.role === 'CO_OWNER') {
      // Auto-create the RELATIONSHIP room between SUPER_OWNER & CO_OWNER if it doesn't exist
      const existingRelationshipRoom = await Conversation.findOne({
        type: 'RELATIONSHIP',
        isDeleted: false,
      });
      if (!existingRelationshipRoom) {
        const owners = await User.find({ role: { $in: ['SUPER_OWNER', 'CO_OWNER'] }, isDeleted: false }).select('_id');
        const ownerIds = owners.map((o) => o._id);
        await Conversation.create({
          type: 'RELATIONSHIP',
          participants: ownerIds.length > 0 ? ownerIds : [currentUser._id],
          createdBy: currentUser._id,
          groupInfo: {
            name: 'Afzal & Amrin Relationship Chat ❤️',
            description: 'Official private life communication room',
          },
        });
      }

      const mySubUserIdStrs = await getMySubUserIds(currentUser._id);

      for (const subUserIdStr of mySubUserIdStrs) {
        if (!mongoose.Types.ObjectId.isValid(subUserIdStr)) continue;
        const subUserId = new mongoose.Types.ObjectId(subUserIdStr);
        const exists = await Conversation.findOne({
          type: 'PRIVATE',
          participants: { $all: [currentUser._id, subUserId] },
          isDeleted: false,
        });
        if (!exists) {
          await Conversation.create({
            type: 'PRIVATE',
            participants: [currentUser._id, subUserId],
            createdBy: currentUser._id,
          });
        }
      }
    } else if (currentUser.role === 'INVITED_USER') {
      const ownerIdStr = await getMyOwnerIdStr(currentUser._id);
      if (ownerIdStr && mongoose.Types.ObjectId.isValid(ownerIdStr)) {
        const ownerId = new mongoose.Types.ObjectId(ownerIdStr);
        const exists = await Conversation.findOne({
          type: 'PRIVATE',
          participants: { $all: [currentUser._id, ownerId] },
          isDeleted: false,
        });
        if (!exists) {
          await Conversation.create({
            type: 'PRIVATE',
            participants: [currentUser._id, ownerId],
            createdBy: ownerId,
          });
        }
      }
    }
  } catch (initErr: any) {
    console.warn('⚠️ Auto chat thread sync notice:', initErr.message);
  }

  // 2. Fetch all conversations the current user is part of
  const conversations = await Conversation.find({
    participants: currentUser._id,
    isDeleted: false,
  })
    .populate('participants', 'name email avatar role')
    .populate({
      path: 'lastMessageId',
      populate: { path: 'sender', select: 'name email avatar' },
    })
    .sort({ updatedAt: -1 })
    .lean();

  // 3. Filter to enforce strict ownership isolation
  let filteredConvs = conversations;

  if (currentUser.role === 'INVITED_USER') {
    // Invited users see ONLY the 1-on-1 chat with their specific parent owner who invited them
    const myOwnerIdStr = await getMyOwnerIdStr(currentUser._id);

    filteredConvs = conversations.filter((conv) => {
      if (conv.type !== 'PRIVATE') return false;
      const otherPart = conv.participants?.find(
        (p: any) => (p._id || p.id || p)?.toString() !== currentUserIdStr
      );
      if (!otherPart) return false;
      const otherIdStr = (otherPart as any)._id?.toString();
      return Boolean(myOwnerIdStr && otherIdStr === myOwnerIdStr);
    });

    // Deduplicate: max 1 conversation per partner
    const seenPartners = new Set<string>();
    filteredConvs = filteredConvs.filter((conv) => {
      const otherPart = conv.participants?.find(
        (p: any) => (p._id || p.id || p)?.toString() !== currentUserIdStr
      );
      const key = (otherPart as any)?._id?.toString() || '';
      if (seenPartners.has(key)) return false;
      seenPartners.add(key);
      return true;
    });

  } else if (currentUser.role === 'SUPER_OWNER' || currentUser.role === 'CO_OWNER') {
    // Owners see:
    //   (a) RELATIONSHIP room (only for SUPER/CO owners)
    //   (b) PRIVATE chats with THEIR OWN sub-users only
    const mySubUserIdStrs = await getMySubUserIds(currentUser._id);

    filteredConvs = conversations.filter((conv) => {
      if (conv.type === 'RELATIONSHIP') return true;
      if (conv.type !== 'PRIVATE') return false;

      const otherPart = conv.participants?.find(
        (p: any) => (p._id || p.id || p)?.toString() !== currentUserIdStr
      );
      if (!otherPart) return false;

      const otherIdStr = (otherPart as any)._id?.toString();
      const otherRole = (otherPart as any).role;

      // Exclude chats with other owners (handled by RELATIONSHIP type)
      if (otherRole === 'SUPER_OWNER' || otherRole === 'CO_OWNER') return false;

      // Only include chats with THIS owner's own sub-users
      return mySubUserIdStrs.has(otherIdStr);
    });

    // Deduplicate: max 1 conversation per sub-user
    const seenPartners = new Set<string>();
    filteredConvs = filteredConvs.filter((conv) => {
      if (conv.type === 'RELATIONSHIP') return true;
      const otherPart = conv.participants?.find(
        (p: any) => (p._id || p.id || p)?.toString() !== currentUserIdStr
      );
      const key = (otherPart as any)?._id?.toString() || '';
      if (seenPartners.has(key)) return false;
      seenPartners.add(key);
      return true;
    });
  }

  const conversationsWithUnread = await Promise.all(
    filteredConvs.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        sender: { $ne: currentUser._id },
        'readBy.userId': { $ne: currentUser._id },
        isDeleted: false,
      });
      return { ...conv, unreadCount };
    })
  );

  return ApiResponse.success(res, 'User conversations retrieved', conversationsWithUnread);
});

/**
 * Get Conversation Details by ID
 */
export const getConversationById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const conversation = await Conversation.findById(id)
    .populate('participants', 'name email avatar role')
    .populate('lastMessageId');

  if (!conversation || conversation.isDeleted) {
    throw new AppError('Conversation not found.', HTTP_STATUS.NOT_FOUND);
  }

  return ApiResponse.success(res, 'Conversation retrieved', conversation);
});

/**
 * Soft Delete Conversation (hides from all participants + deletes all messages)
 */
export const deleteConversation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user!;

  const conversation = await Conversation.findOne({
    _id: id,
    participants: currentUser._id,
    isDeleted: false,
  });

  if (!conversation) {
    throw new AppError('Conversation not found or you are not a participant.', HTTP_STATUS.NOT_FOUND);
  }

  // Hard-delete all messages in this conversation
  await Message.deleteMany({ conversationId: conversation._id });

  // Soft-delete the conversation itself
  conversation.isDeleted = true;
  await conversation.save();

  // Emit socket event to notify all participants in real-time
  try {
    const io = socketService.getIO();
    conversation.participants.forEach((pId) => {
      io.to(pId.toString()).emit('conversation_deleted', { conversationId: id });
      io.to(`user:${pId.toString()}`).emit('conversation_deleted', { conversationId: id });
    });
  } catch (_e) {}

  return ApiResponse.success(res, 'Conversation and all messages deleted.');
});

/**
 * Send Message (HTTP Endpoint Fallback)
 */
export const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const { conversationId, type, content, mediaId, replyToMessageId } = req.body;
  const currentUser = req.user!;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation || conversation.isDeleted) {
    throw new AppError('Conversation not found.', HTTP_STATUS.NOT_FOUND);
  }

  const message = await Message.create({
    conversationId,
    sender: currentUser._id,
    type: type || 'TEXT',
    content,
    mediaId: mediaId || undefined,
    replyToMessageId: replyToMessageId || undefined,
    status: 'SENT',
    readBy: [{ userId: currentUser._id, readAt: new Date() }],
  });

  conversation.lastMessageId = message._id;
  conversation.updatedAt = new Date();
  await conversation.save();

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name email avatar')
    .populate('mediaId', 'secureUrl thumbnailUrl optimizedUrl mimeType width height')
    .populate('replyToMessageId', 'content sender type');

  // Emit real-time socket event to conversation room AND all participant user rooms
  try {
    const io = socketService.getIO();
    io.to(conversationId).emit('receive_message', populatedMessage);
    if (conversation.participants) {
      conversation.participants.forEach((pId) => {
        io.to(pId.toString()).emit('receive_message', populatedMessage);
        io.to(`user:${pId.toString()}`).emit('receive_message', populatedMessage);
      });
    }
  } catch (e) {}

  return ApiResponse.created(res, 'Message sent successfully', populatedMessage);
});

/**
 * Get ALL Conversation Messages (UNLIMITED - Zero Pagination Limits)
 * Retrieves full chronological message history from beginning to end.
 */
export const getConversationMessages = catchAsync(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const currentUser = req.user!;

  const filter = {
    conversationId,
    isDeleted: false,
    deletedFor: { $ne: currentUser._id },
  };

  const total = await Message.countDocuments(filter);

  // Return ALL messages without any pagination limits in chronological order (oldest -> newest)
  const messages = await Message.find(filter)
    .populate('sender', 'name email avatar')
    .populate('mediaId', 'secureUrl thumbnailUrl optimizedUrl mimeType width height')
    .populate('replyToMessageId', 'content sender type')
    .sort({ createdAt: 1 });

  return ApiResponse.success(res, 'Messages retrieved', messages, HTTP_STATUS.OK, {
    total,
  });
});

/**
 * Mark Conversation Messages as Read
 */
export const markMessageRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user!;

  const message = await Message.findById(id);
  if (!message || message.isDeleted) {
    throw new AppError('Message not found.', HTTP_STATUS.NOT_FOUND);
  }

  const alreadyRead = message.readBy.some((r) => r.userId.toString() === currentUser._id.toString());
  if (!alreadyRead) {
    message.readBy.push({ userId: currentUser._id, readAt: new Date() });
    message.status = 'READ';
    await message.save();
  }

  return ApiResponse.success(res, 'Message marked as read', message);
});

/**
 * Toggle Message Pin Status
 */
export const togglePinMessage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const message = await Message.findById(id);
  if (!message || message.isDeleted) {
    throw new AppError('Message not found.', HTTP_STATUS.NOT_FOUND);
  }

  message.isPinned = !message.isPinned;
  await message.save();

  return ApiResponse.success(res, `Message pin status set to ${message.isPinned}`, message);
});

/**
 * Add / Toggle Emoji Reaction
 */
export const addReaction = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { emoji } = req.body;
  const currentUser = req.user!;

  const message = await Message.findById(id);
  if (!message || message.isDeleted) {
    throw new AppError('Message not found.', HTTP_STATUS.NOT_FOUND);
  }

  const existingIdx = message.reactions.findIndex((r) => r.userId.toString() === currentUser._id.toString());

  if (existingIdx > -1) {
    if (message.reactions[existingIdx].emoji === emoji) {
      // Toggle off if same emoji
      message.reactions.splice(existingIdx, 1);
    } else {
      // Update emoji
      message.reactions[existingIdx].emoji = emoji;
    }
  } else {
    message.reactions.push({ userId: currentUser._id, emoji });
  }

  await message.save();

  try {
    socketService.getIO().to(message.conversationId.toString()).emit('message_reaction_added', {
      messageId: message._id,
      conversationId: message.conversationId,
      reactions: message.reactions,
    });
  } catch (e) {}

  return ApiResponse.success(res, 'Reaction updated', message);
});

/**
 * Forward Message to Target Conversation
 */
export const forwardMessage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { targetConversationId } = req.body;
  const currentUser = req.user!;

  const originalMessage = await Message.findById(id);
  if (!originalMessage || originalMessage.isDeleted) {
    throw new AppError('Original message not found.', HTTP_STATUS.NOT_FOUND);
  }

  const forwardedMessage = await Message.create({
    conversationId: targetConversationId,
    sender: currentUser._id,
    type: originalMessage.type,
    content: originalMessage.content,
    mediaId: originalMessage.mediaId,
    forwardedFromMessageId: originalMessage._id,
    status: 'SENT',
    readBy: [{ userId: currentUser._id, readAt: new Date() }],
  });

  const populated = await Message.findById(forwardedMessage._id)
    .populate('sender', 'name email avatar')
    .populate('mediaId', 'secureUrl thumbnailUrl optimizedUrl mimeType');

  return ApiResponse.created(res, 'Message forwarded successfully', populated);
});

/**
 * Delete Message (For Me / For Everyone)
 */
export const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { deleteForEveryone } = req.query;
  const currentUser = req.user!;

  const message = await Message.findById(id);
  if (!message) {
    throw new AppError('Message not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (deleteForEveryone === 'true') {
    if (message.sender.toString() !== currentUser._id.toString()) {
      throw new AppError('You can only delete your own messages for everyone.', HTTP_STATUS.FORBIDDEN);
    }
    message.content = 'This message was deleted';
    message.isDeleted = true;
    await message.save();
  } else {
    // Delete for me
    if (!message.deletedFor.includes(currentUser._id)) {
      message.deletedFor.push(currentUser._id);
      await message.save();
    }
  }

  return ApiResponse.success(res, 'Message deleted');
});

/**
 * Full-Text Chat Search Engine
 */
export const searchChat = catchAsync(async (req: Request, res: Response) => {
  const { q } = req.query;
  const currentUser = req.user!;

  if (!q) {
    return ApiResponse.success(res, 'Search query empty', []);
  }

  // Find conversations user is part of
  const userConversations = await Conversation.find({
    participants: currentUser._id,
    isDeleted: false,
  }).select('_id');

  const conversationIds = userConversations.map((c) => c._id);

  const messages = await Message.find({
    conversationId: { $in: conversationIds },
    isDeleted: false,
    content: { $regex: q as string, $options: 'i' },
  })
    .populate('sender', 'name email avatar')
    .populate('conversationId', 'type groupInfo')
    .sort({ createdAt: -1 })
    .limit(30);

  return ApiResponse.success(res, 'Chat search results retrieved', messages);
});
