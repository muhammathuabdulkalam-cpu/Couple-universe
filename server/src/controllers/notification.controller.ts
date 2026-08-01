import { Request, Response } from 'express';
import { HTTP_STATUS, PLATFORM_CONSTANTS } from '../constants';
import { Notification } from '../models/notification.model';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

/**
 * Get all notifications for the current user
 */
export const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const page = parseInt(req.query.page as string, 10) || PLATFORM_CONSTANTS.DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string, 10) || PLATFORM_CONSTANTS.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const total = await Notification.countDocuments({ recipientId: user._id });
  const notifications = await Notification.find({ recipientId: user._id })
    .populate('senderId', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return ApiResponse.success(res, 'Notifications retrieved.', notifications, HTTP_STATUS.OK, {
    page, limit, total, totalPages: Math.ceil(total / limit),
  });
});

/**
 * Get unread notification count
 */
export const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const count = await Notification.countDocuments({ recipientId: user._id, isRead: false });
  return ApiResponse.success(res, 'Unread count retrieved.', { count });
});

/**
 * Mark a single notification as read
 */
export const markRead = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const notif = await Notification.findOne({ _id: req.params.id, recipientId: user._id });

  if (!notif) throw new AppError('Notification not found.', HTTP_STATUS.NOT_FOUND);

  notif.isRead = true;
  await notif.save();

  return ApiResponse.success(res, 'Notification marked as read.', notif);
});

/**
 * Mark all notifications as read
 */
export const markAllRead = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  await Notification.updateMany({ recipientId: user._id, isRead: false }, { isRead: true });
  return ApiResponse.success(res, 'All notifications marked as read.');
});

/**
 * Delete a notification
 */
export const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const notif = await Notification.findOneAndDelete({ _id: req.params.id, recipientId: user._id });
  if (!notif) throw new AppError('Notification not found.', HTTP_STATUS.NOT_FOUND);
  return ApiResponse.success(res, 'Notification deleted.');
});
