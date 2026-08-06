import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPlaylistSong extends Document {
  _id: mongoose.Types.ObjectId;
  playlistId: mongoose.Types.ObjectId;
  songId: mongoose.Types.ObjectId;
  addedBy: mongoose.Types.ObjectId;
  position: number;
  createdAt: Date;
}

const playlistSongSchema = new Schema<IPlaylistSong>(
  {
    playlistId: { type: Schema.Types.ObjectId, ref: 'Playlist', required: true, index: true },
    songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    position: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
  }
);

playlistSongSchema.index({ playlistId: 1, songId: 1 }, { unique: true });
playlistSongSchema.index({ playlistId: 1, position: 1 });

export const PlaylistSong: Model<IPlaylistSong> = mongoose.model<IPlaylistSong>(
  'PlaylistSong',
  playlistSongSchema
);
