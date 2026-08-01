import mongoose, { Document, Model, Schema } from 'mongoose';

export type ConversationType = 'PRIVATE' | 'GROUP' | 'RELATIONSHIP';

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  type: ConversationType;
  participants: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  groupInfo?: {
    name?: string;
    avatarMediaId?: mongoose.Types.ObjectId;
    description?: string;
  };
  lastMessageId?: mongoose.Types.ObjectId;
  relationshipId?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      enum: ['PRIVATE', 'GROUP', 'RELATIONSHIP'],
      default: 'PRIVATE',
      index: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    groupInfo: {
      name: { type: String, trim: true },
      avatarMediaId: { type: Schema.Types.ObjectId, ref: 'Media' },
      description: { type: String, trim: true },
    },
    lastMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    relationshipId: {
      type: String,
      default: 'AFZAL_AMRIN_AFRIN_VERSE',
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

// Index participants array for fast conversation lookup
conversationSchema.index({ participants: 1 });

export const Conversation: Model<IConversation> = mongoose.model<IConversation>(
  'Conversation',
  conversationSchema
);
