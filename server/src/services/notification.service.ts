import mongoose from 'mongoose';
import { logger } from '../config/logger.config';
import { INotification, Notification, NotificationType } from '../models/notification.model';
import { User } from '../models/user.model';
import { getSocketServer } from '../utils/socketServer';

export interface NotificationPublishPayload {
  recipientId: string | mongoose.Types.ObjectId;
  senderId?: string | mongoose.Types.ObjectId;
  type: NotificationType;
  message: string;
  targetType: string;
  targetId: string | mongoose.Types.ObjectId;
  referenceId?: string | mongoose.Types.ObjectId;
  refModel?: string;
  allowSelfNotification?: boolean;
}

class NotificationService {
  /**
   * Central Event Bus method to publish notifications across all platform modules.
   * Creates database record, populates sender info, and emits real-time Socket.io events.
   */
  public async publish(payload: NotificationPublishPayload): Promise<INotification | null> {
    try {
      const {
        recipientId,
        senderId,
        type,
        message,
        targetType,
        targetId,
        referenceId,
        refModel,
        allowSelfNotification = false,
      } = payload;

      const recipientStr = recipientId.toString();
      const senderStr = senderId ? senderId.toString() : null;

      // Prevent self-notifications unless explicitly allowed
      if (senderStr && senderStr === recipientStr && !allowSelfNotification) {
        return null;
      }

      // Verify recipient exists
      const recipientUser = await User.findById(recipientId).select('_id');
      if (!recipientUser) {
        logger.warn(`NotificationService: Recipient user ${recipientStr} not found. Event ignored.`);
        return null;
      }

      // Save standardized notification
      const notifDoc = await Notification.create({
        recipientId,
        senderId: senderId || null,
        type,
        message,
        targetType,
        targetId,
        referenceId: referenceId || targetId,
        refModel: refModel || targetType,
        isRead: false,
      });

      // Populate sender information
      const populatedNotif = await Notification.findById(notifDoc._id).populate('senderId', 'name avatar role');

      if (!populatedNotif) return null;

      // Calculate total unread notifications for recipient
      const unreadCount = await Notification.countDocuments({
        recipientId: recipientUser._id,
        isRead: false,
      });

      // Real-time Socket.io Emission
      const io = getSocketServer();
      if (io) {
        // Emit to user specific room (supports both user:id and id)
        const userRoom = `user:${recipientStr}`;
        io.to(userRoom).to(recipientStr).emit('notification_created', populatedNotif);
        io.to(userRoom).to(recipientStr).emit('unread_count_updated', { count: unreadCount, type: 'NOTIFICATIONS' });
      }

      logger.info(`🔔 Notification published [${type}] to User ${recipientStr}: "${message}"`);
      return populatedNotif;
    } catch (error) {
      logger.error('❌ NotificationService publish error:', error);
      return null;
    }
  }

  /**
   * Get unread notification count for a user
   */
  public async getUnreadCount(userId: string | mongoose.Types.ObjectId): Promise<number> {
    return Notification.countDocuments({ recipientId: userId, isRead: false });
  }

  /**
   * Broadcast real-time unread notification count update
   */
  public async syncUnreadCount(userId: string | mongoose.Types.ObjectId): Promise<number> {
    const count = await this.getUnreadCount(userId);
    const io = getSocketServer();
    if (io) {
      const userStr = userId.toString();
      io.to(`user:${userStr}`).to(userStr).emit('unread_count_updated', { count, type: 'NOTIFICATIONS' });
    }
    return count;
  }
}

export const notificationService = new NotificationService();
