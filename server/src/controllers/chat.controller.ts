import { Request, Response } from 'express';
import { HTTP_STATUS, PLATFORM_CONSTANTS } from '../constants';
import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';
import { socketService } from '../services/socket.service';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

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

  const conversations = await Conversation.find({
    participants: currentUser._id,
    isDeleted: false,
  })
    .populate('participants', 'name email avatar role')
    .populate({
      path: 'lastMessageId',
      populate: { path: 'sender', select: 'name email avatar' },
    })
    .sort({ updatedAt: -1 });

  return ApiResponse.success(res, 'User conversations retrieved', conversations);
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
 * Soft Delete Conversation
 */
export const deleteConversation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    throw new AppError('Conversation not found.', HTTP_STATUS.NOT_FOUND);
  }

  conversation.isDeleted = true;
  await conversation.save();

  return ApiResponse.success(res, 'Conversation deleted.');
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

  // Emit real-time socket event
  try {
    socketService.getIO().to(conversationId).emit('receive_message', populatedMessage);
  } catch (e) {
    // Socket emit fallback silent catch
  }

  return ApiResponse.created(res, 'Message sent successfully', populatedMessage);
});

/**
 * Get Conversation Messages (Paginated)
 */
export const getConversationMessages = catchAsync(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const page = parseInt(req.query.page as string, 10) || PLATFORM_CONSTANTS.DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string, 10) || 50;
  const skip = (page - 1) * limit;
  const currentUser = req.user!;

  const filter = {
    conversationId,
    isDeleted: false,
    deletedFor: { $ne: currentUser._id },
  };

  const total = await Message.countDocuments(filter);
  const messages = await Message.find(filter)
    .populate('sender', 'name email avatar')
    .populate('mediaId', 'secureUrl thumbnailUrl optimizedUrl mimeType width height')
    .populate('replyToMessageId', 'content sender type')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit);

  return ApiResponse.success(res, 'Messages retrieved', messages, HTTP_STATUS.OK, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
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
