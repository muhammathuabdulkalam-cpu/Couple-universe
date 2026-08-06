import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFavoriteSong extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  songId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const favoriteSongSchema = new Schema<IFavoriteSong>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
  }
);

favoriteSongSchema.index({ user: 1, songId: 1 }, { unique: true });
favoriteSongSchema.index({ user: 1, createdAt: -1 });

export const FavoriteSong: Model<IFavoriteSong> = mongoose.model<IFavoriteSong>(
  'FavoriteSong',
  favoriteSongSchema
);
