import mongoose, { Document, Model, Schema } from 'mongoose';

export type MusicProviderType = 'deezer' | 'spotify' | 'apple' | 'youtube' | 'local';

export interface ISong extends Document {
  _id: mongoose.Types.ObjectId;
  provider: MusicProviderType;
  providerSongId: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  previewUrl: string;
  duration: number; // in seconds
  externalUrl?: string;
  language?: string;
  genre?: string;
  addedBy?: mongoose.Types.ObjectId;
  isDeleted?: boolean;
  audioData?: string;
  isUploaded?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const songSchema = new Schema<ISong>(
  {
    provider: { type: String, required: true, default: 'deezer' },
    providerSongId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    album: { type: String, default: '' },
    coverUrl: { type: String, default: '' },
    previewUrl: { type: String, required: true },
    duration: { type: Number, default: 30 },
    externalUrl: { type: String, default: '' },
    language: { type: String, default: 'english' },
    genre: { type: String, default: '' },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false },
    audioData: { type: String, select: false, default: '' },
    isUploaded: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

songSchema.index({ provider: 1, providerSongId: 1 }, { unique: true });
songSchema.index({ provider: 1, isDeleted: 1, _id: -1 });
songSchema.index({ provider: 1, isDeleted: 1, createdAt: -1 });
songSchema.index(
  { title: 'text', artist: 'text', album: 'text' },
  { default_language: 'english' }
);

export const Song: Model<ISong> = mongoose.model<ISong>('Song', songSchema);
