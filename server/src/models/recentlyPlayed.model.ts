import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IRecentlyPlayed extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  songId: mongoose.Types.ObjectId;
  playedAt: Date;
  playCount: number;
}

const recentlyPlayedSchema = new Schema<IRecentlyPlayed>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
    playedAt: { type: Date, default: Date.now },
    playCount: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

recentlyPlayedSchema.index({ user: 1, songId: 1 }, { unique: true });
recentlyPlayedSchema.index({ user: 1, playedAt: -1 });

export const RecentlyPlayed: Model<IRecentlyPlayed> = mongoose.model<IRecentlyPlayed>(
  'RecentlyPlayed',
  recentlyPlayedSchema
);
