import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPlaylist extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  coverUrl?: string;
  isDefault: boolean;
  defaultKey?: string;
  owner?: mongoose.Types.ObjectId;
  isShared: boolean;
  songCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const playlistSchema = new Schema<IPlaylist>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    coverUrl: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
    defaultKey: { type: String, default: null },
    owner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isShared: { type: Boolean, default: true },
    songCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

playlistSchema.index({ owner: 1 });
playlistSchema.index({ defaultKey: 1 });

export const Playlist: Model<IPlaylist> = mongoose.model<IPlaylist>('Playlist', playlistSchema);
