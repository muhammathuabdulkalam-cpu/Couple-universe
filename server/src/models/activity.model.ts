import mongoose, { Document, Model, Schema } from 'mongoose';

export type ActivityType =
  | 'MEMORY_CREATED'
  | 'STORY_CREATED'
  | 'GOAL_COMPLETED'
  | 'ANNIVERSARY'
  | 'CALENDAR_EVENT'
  | 'PROFILE_UPDATED'
  | 'RELATIONSHIP_MILESTONE'
  | 'BUCKET_COMPLETED';

export type ActivityRefModel = 'TimelineEvent' | 'Story' | 'CalendarEvent' | 'User' | 'Media';

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: ActivityType;
  referenceId?: mongoose.Types.ObjectId;
  refModel?: ActivityRefModel;
  title?: string;
  description?: string;
  imageUrl?: string;
  aspectRatio?: string;
  isPublic: boolean;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'MEMORY_CREATED',
        'STORY_CREATED',
        'GOAL_COMPLETED',
        'ANNIVERSARY',
        'CALENDAR_EVENT',
        'PROFILE_UPDATED',
        'RELATIONSHIP_MILESTONE',
        'BUCKET_COMPLETED',
      ],
      required: true,
    },
    referenceId: { type: Schema.Types.ObjectId, refPath: 'refModel', default: null },
    refModel: {
      type: String,
      enum: ['TimelineEvent', 'Story', 'CalendarEvent', 'User', 'Media'],
      default: 'Media',
    },
    title: { type: String, maxlength: 300 },
    description: { type: String, maxlength: 1000 },
    imageUrl: { type: String },
    aspectRatio: { type: String, default: '1:1' },
    isPublic: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

export const Activity: Model<IActivity> = mongoose.model<IActivity>('Activity', activitySchema);
