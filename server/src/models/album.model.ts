import mongoose, { Document, Model, Schema } from 'mongoose';
import { MediaVisibility } from './media.model';

export type AlbumType =
  | 'DEFAULT'
  | 'FAVORITES'
  | 'TRAVEL'
  | 'MARRIAGE'
  | 'BABY'
  | 'FAMILY'
  | 'CUSTOM'
  | 'ARCHIVE';

export interface IAlbum extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  coverImage?: string;
  owner: mongoose.Types.ObjectId;
  parentAlbum?: mongoose.Types.ObjectId; // Prepared for future nested album hierarchies
  albumType: AlbumType;
  visibility: MediaVisibility;
  mediaCount: number;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const albumSchema = new Schema<IAlbum>(
  {
    name: {
      type: String,
      required: [true, 'Album name is required'],
      trim: true,
      maxlength: [100, 'Album name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      default: '',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    parentAlbum: {
      type: Schema.Types.ObjectId,
      ref: 'Album',
      default: null,
      index: true,
    },
    albumType: {
      type: String,
      enum: ['DEFAULT', 'FAVORITES', 'TRAVEL', 'MARRIAGE', 'BABY', 'FAMILY', 'CUSTOM', 'ARCHIVE'],
      default: 'CUSTOM',
      index: true,
    },
    visibility: {
      type: String,
      enum: ['PRIVATE', 'COUPLE', 'FAMILY', 'FRIENDS', 'PUBLIC'],
      default: 'COUPLE',
    },
    mediaCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Album: Model<IAlbum> = mongoose.model<IAlbum>('Album', albumSchema);
