import mongoose, { Document, Model, Schema } from 'mongoose';

export type ReactionTargetType = 'MEMORY' | 'STORY' | 'COMMENT' | 'ACTIVITY';
export type ReactionEmoji = '❤️' | '😂' | '🔥' | '😍' | '👍' | '😢';

export interface IReaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  targetId: mongoose.Types.ObjectId;
  targetType: ReactionTargetType;
  emoji: ReactionEmoji | string;
  createdAt: Date;
}

const reactionSchema = new Schema<IReaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    targetType: {
      type: String,
      enum: ['MEMORY', 'STORY', 'COMMENT', 'ACTIVITY'],
      required: true,
    },
    emoji: { type: String, required: true, default: '❤️' },
  },
  { timestamps: true }
);

// One reaction per user per target
reactionSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });
reactionSchema.index({ targetId: 1, targetType: 1 });

export const Reaction: Model<IReaction> = mongoose.model<IReaction>('Reaction', reactionSchema);
