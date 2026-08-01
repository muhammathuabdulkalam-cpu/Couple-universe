import mongoose, { Document, Model, Schema } from 'mongoose';

export type StoryVisibility = 'PUBLIC' | 'FRIENDS' | 'PARTNER';

export interface IStoryReaction {
  userId: mongoose.Types.ObjectId;
  emoji: string;
  reactedAt: Date;
}

export interface IStory extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  mediaId: mongoose.Types.ObjectId;
  caption?: string;
  visibility: StoryVisibility;
  expiresAt: Date;
  viewedBy: mongoose.Types.ObjectId[];
  reactions: IStoryReaction[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const storyReactionSchema = new Schema<IStoryReaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true },
    reactedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const storySchema = new Schema<IStory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mediaId: { type: Schema.Types.ObjectId, ref: 'Media', required: true },
    caption: { type: String, maxlength: 500 },
    visibility: {
      type: String,
      enum: ['PUBLIC', 'FRIENDS', 'PARTNER'],
      default: 'PARTNER',
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      index: { expireAfterSeconds: 0 },
    },
    viewedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    reactions: [storyReactionSchema],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

storySchema.index({ userId: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Story: Model<IStory> = mongoose.model<IStory>('Story', storySchema);
