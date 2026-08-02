import mongoose, { Document, Model, Schema } from 'mongoose';

export type NotificationType =
  | 'FOLLOW'
  | 'REACTION'
  | 'COMMENT'
  | 'COMMENT_REPLY'
  | 'STORY_REACTION'
  | 'STORY_VIEW'
  | 'STORY_REPLY'
  | 'MEMORY_REACTION'
  | 'BIRTHDAY'
  | 'ANNIVERSARY'
  | 'CALENDAR_REMINDER'
  | 'MESSAGE'
  | 'MENTION'
  | 'SYSTEM';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId;
  type: NotificationType;
  message: string;
  targetType?: string;
  targetId?: mongoose.Types.ObjectId;
  referenceId?: mongoose.Types.ObjectId;
  refModel?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    type: {
      type: String,
      enum: [
        'FOLLOW',
        'REACTION',
        'COMMENT',
        'COMMENT_REPLY',
        'STORY_REACTION',
        'STORY_VIEW',
        'STORY_REPLY',
        'MEMORY_REACTION',
        'BIRTHDAY',
        'ANNIVERSARY',
        'CALENDAR_REMINDER',
        'MESSAGE',
        'MENTION',
        'SYSTEM',
      ],
      required: true,
    },
    message: { type: String, required: true, maxlength: 500 },
    targetType: { type: String, default: null },
    targetId: { type: Schema.Types.ObjectId, default: null },
    referenceId: { type: Schema.Types.ObjectId, default: null },
    refModel: { type: String, default: null },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);
