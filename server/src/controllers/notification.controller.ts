import { Request, Response } from 'express';
import { HTTP_STATUS, PLATFORM_CONSTANTS } from '../constants';
import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';
import { Notification } from '../models/notification.model';
import { notificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

/**
 * Get all notifications for the current user (chronological, newest first)
 */
export const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const page = parseInt(req.query.page as string, 10) || PLATFORM_CONSTANTS.DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string, 10) || PLATFORM_CONSTANTS.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const [total, notifications] = await Promise.all([
    Notification.countDocuments({ recipientId: user._id, type: { $ne: 'MESSAGE' } }),
    Notification.find({ recipientId: user._id, type: { $ne: 'MESSAGE' } })
      .populate('senderId', 'name avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return ApiResponse.success(res, 'Notifications retrieved.', notifications, HTTP_STATUS.OK, {
    page, limit, total, totalPages: Math.ceil(total / limit),
  });
});

/**
 * Get unread notification and chat counts
 */
export const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const notifCount = await notificationService.getUnreadCount(user._id);

  const userConversations = await Conversation.find({
    participants: user._id,
    isDeleted: false,
  }).select('_id');

  const conversationIds = userConversations.map((c) => c._id);

  const chatCount = await Message.countDocuments({
    conversationId: { $in: conversationIds },
    sender: { $ne: user._id },
    'readBy.userId': { $ne: user._id },
    isDeleted: false,
  });

  return ApiResponse.success(res, 'Unread count retrieved.', {
    count: notifCount,
    unreadNotifications: notifCount,
    unreadChat: chatCount,
  });
});

/**
 * Mark a single notification as read
 */
export const markRead = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const notif = await Notification.findOne({ _id: req.params.id, recipientId: user._id });

  if (!notif) throw new AppError('Notification not found.', HTTP_STATUS.NOT_FOUND);

  if (!notif.isRead) {
    notif.isRead = true;
    await notif.save();
    await notificationService.syncUnreadCount(user._id);
  }

  return ApiResponse.success(res, 'Notification marked as read.', notif);
});

/**
 * Mark all notifications as read
 */
export const markAllRead = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  await Notification.updateMany({ recipientId: user._id, isRead: false }, { isRead: true });
  await notificationService.syncUnreadCount(user._id);
  return ApiResponse.success(res, 'All notifications marked as read.');
});

/**
 * Delete a notification
 */
export const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const notif = await Notification.findOneAndDelete({ _id: req.params.id, recipientId: user._id });
  if (!notif) throw new AppError('Notification not found.', HTTP_STATUS.NOT_FOUND);
  await notificationService.syncUnreadCount(user._id);
  return ApiResponse.success(res, 'Notification deleted.');
});
