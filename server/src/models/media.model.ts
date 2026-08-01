import mongoose, { Document, Model, Schema } from 'mongoose';

export type MediaVisibility = 'PRIVATE' | 'COUPLE' | 'FAMILY' | 'FRIENDS' | 'PUBLIC';
export type MediaOrientation = 'PORTRAIT' | 'LANDSCAPE' | 'SQUARE';

export interface IMedia extends Document {
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  album?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  caption?: string;
  tags: string[];
  peopleTagged: string[];
  location?: {
    name?: string;
    lat?: number;
    lng?: number;
  };
  visibility: MediaVisibility;
  takenAt?: Date;
  memoryDate: Date;
  cloudinaryPublicId: string;
  cloudinaryFolder: string;
  secureUrl: string;
  optimizedUrl: string;
  thumbnailUrl: string;
  blurHash?: string;
  width: number;
  height: number;
  aspectRatio: number;
  orientation: MediaOrientation;
  dominantColor?: string;
  duration?: number;
  mimeType: string;
  fileSize: number;
  isFavorite: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  reactionCount: number;
  commentCount: number;
  viewCount: number;
  downloadCount: number;
  shareCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<IMedia>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
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
    album: {
      type: Schema.Types.ObjectId,
      ref: 'Album',
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'Untitled Memory',
    },
    description: {
      type: String,
      trim: true,
    },
    caption: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
        index: true,
      },
    ],
    peopleTagged: [
      {
        type: String,
        trim: true,
      },
    ],
    location: {
      name: { type: String, trim: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    visibility: {
      type: String,
      enum: ['PRIVATE', 'COUPLE', 'FAMILY', 'FRIENDS', 'PUBLIC'],
      default: 'COUPLE',
      index: true,
    },
    takenAt: {
      type: Date,
    },
    memoryDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    cloudinaryFolder: {
      type: String,
      default: 'afrin-universe/gallery',
    },
    secureUrl: {
      type: String,
      required: true,
    },
    optimizedUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      required: true,
    },
    blurHash: {
      type: String,
      default: 'L6PZfSi_00Y.00%M%2oJ00_3~q9F',
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    aspectRatio: {
      type: Number,
      required: true,
    },
    orientation: {
      type: String,
      enum: ['PORTRAIT', 'LANDSCAPE', 'SQUARE'],
      required: true,
    },
    dominantColor: {
      type: String,
      default: '#090d16',
    },
    duration: {
      type: Number,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reactionCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Calculate aspect ratio and orientation pre-validate
mediaSchema.pre('validate', function (next) {
  if (this.width && this.height) {
    this.aspectRatio = parseFloat((this.width / this.height).toFixed(2));
    if (this.width > this.height) {
      this.orientation = 'LANDSCAPE';
    } else if (this.height > this.width) {
      this.orientation = 'PORTRAIT';
    } else {
      this.orientation = 'SQUARE';
    }
  }
  next();
});

export const Media: Model<IMedia> = mongoose.model<IMedia>('Media', mediaSchema);
