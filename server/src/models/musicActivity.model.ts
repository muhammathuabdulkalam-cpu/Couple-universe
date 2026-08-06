import mongoose, { Document, Model, Schema } from 'mongoose';

export type MusicActionType = 'PLAY' | 'DEDICATE' | 'FAVORITE' | 'ADD_TO_PLAYLIST';

export interface IMusicActivity extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  action: MusicActionType;
  songId: mongoose.Types.ObjectId;
  playlistId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const musicActivitySchema = new Schema<IMusicActivity>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: {
      type: String,
      enum: ['PLAY', 'DEDICATE', 'FAVORITE', 'ADD_TO_PLAYLIST'],
      required: true,
    },
    songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
    playlistId: { type: Schema.Types.ObjectId, ref: 'Playlist', default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
  }
);

musicActivitySchema.index({ user: 1, createdAt: -1 });

export const MusicActivity: Model<IMusicActivity> = mongoose.model<IMusicActivity>(
  'MusicActivity',
  musicActivitySchema
);
