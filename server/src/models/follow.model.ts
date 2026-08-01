import mongoose, { Document, Model, Schema } from 'mongoose';

export type FollowStatus = 'REQUESTED' | 'ACCEPTED' | 'BLOCKED';

export interface IFollow extends Document {
  _id: mongoose.Types.ObjectId;
  follower: mongoose.Types.ObjectId;
  following: mongoose.Types.ObjectId;
  status: FollowStatus;
  createdAt: Date;
  updatedAt: Date;
}

const followSchema = new Schema<IFollow>(
  {
    follower: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    following: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['REQUESTED', 'ACCEPTED', 'BLOCKED'],
      default: 'ACCEPTED',
      index: true,
    },
  },
  { timestamps: true }
);

followSchema.index({ follower: 1, following: 1 }, { unique: true });

export const Follow: Model<IFollow> = mongoose.model<IFollow>('Follow', followSchema);
