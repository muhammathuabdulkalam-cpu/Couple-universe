import mongoose, { Document, Model, Schema } from 'mongoose';

export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'VOICE' | 'GIF' | 'FILE';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface IMessageReaction {
  userId: mongoose.Types.ObjectId;
  emoji: string;
}

export interface IMessageReadReceipt {
  userId: mongoose.Types.ObjectId;
  readAt: Date;
}

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  type: MessageType;
  content?: string;
  mediaId?: mongoose.Types.ObjectId;
  replyToMessageId?: mongoose.Types.ObjectId;
  forwardedFromMessageId?: mongoose.Types.ObjectId;
  reactions: IMessageReaction[];
  status: MessageStatus;
  readBy: IMessageReadReceipt[];
  deletedFor: mongoose.Types.ObjectId[];
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageReactionSchema = new Schema<IMessageReaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true },
  },
  { _id: false }
);

const messageReadReceiptSchema = new Schema<IMessageReadReceipt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['TEXT', 'IMAGE', 'VIDEO', 'VOICE', 'GIF', 'FILE'],
      default: 'TEXT',
      index: true,
    },
    content: {
      type: String,
      trim: true,
    },
    mediaId: {
      type: Schema.Types.ObjectId,
      ref: 'Media',
    },
    replyToMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    forwardedFromMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    reactions: [messageReactionSchema],
    status: {
      type: String,
      enum: ['SENT', 'DELIVERED', 'READ'],
      default: 'SENT',
      index: true,
    },
    readBy: [messageReadReceiptSchema],
    deletedFor: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Full-Text Index on Message Content for Search Engine
messageSchema.index({ content: 'text' });
messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message: Model<IMessage> = mongoose.model<IMessage>('Message', messageSchema);
