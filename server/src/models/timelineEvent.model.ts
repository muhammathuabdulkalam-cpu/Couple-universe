import mongoose, { Document, Model, Schema } from 'mongoose';
import { MediaVisibility } from './media.model';

export type EventType =
  | 'FIRST_CONVERSATION'
  | 'FIRST_CALL'
  | 'FIRST_MEETING'
  | 'FIRST_PHOTO'
  | 'DATE'
  | 'TRIP'
  | 'BIRTHDAY'
  | 'ANNIVERSARY'
  | 'CELEBRATION'
  | 'ACHIEVEMENT'
  | 'FAMILY_EVENT'
  | 'MARRIAGE'
  | 'BABY'
  | 'TRAVEL'
  | 'CUSTOM';

export type ChapterType =
  | 'LOVE'
  | 'ENGAGEMENT'
  | 'MARRIAGE'
  | 'HONEYMOON'
  | 'TRAVEL'
  | 'FAMILY'
  | 'BABY'
  | 'CAREER'
  | 'HOME'
  | 'CUSTOM';

export type WeatherType = 'SUNNY' | 'RAINY' | 'CLOUDY' | 'SNOW' | 'WINDY';

export type MemoryMood =
  | 'HAPPY'
  | 'ROMANTIC'
  | 'EXCITED'
  | 'PEACEFUL'
  | 'GRATEFUL'
  | 'NOSTALGIC'
  | 'MEMORABLE';

export type EventImportance = 'NORMAL' | 'IMPORTANT' | 'MILESTONE';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ITimelineEvent extends Document {
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  title: string;
  content?: string;
  shortDescription?: string;
  eventDate: Date;
  eventType: EventType;
  chapter: ChapterType;
  coverMediaId?: mongoose.Types.ObjectId;
  mediaIds: mongoose.Types.ObjectId[];
  location?: {
    name?: string;
    lat?: number;
    lng?: number;
  };
  weather?: WeatherType;
  mood: MemoryMood;
  emoji: string;
  importance: EventImportance;
  status: EventStatus;
  tags: string[];
  people: string[];
  visibility: MediaVisibility;
  sortOrder: number;
  isFavorite: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const timelineEventSchema = new Schema<ITimelineEvent>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Timeline event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Short description cannot exceed 500 characters'],
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        'FIRST_CONVERSATION',
        'FIRST_CALL',
        'FIRST_MEETING',
        'FIRST_PHOTO',
        'DATE',
        'TRIP',
        'BIRTHDAY',
        'ANNIVERSARY',
        'CELEBRATION',
        'ACHIEVEMENT',
        'FAMILY_EVENT',
        'MARRIAGE',
        'BABY',
        'TRAVEL',
        'CUSTOM',
      ],
      default: 'CUSTOM',
      index: true,
    },
    chapter: {
      type: String,
      enum: [
        'LOVE',
        'ENGAGEMENT',
        'MARRIAGE',
        'HONEYMOON',
        'TRAVEL',
        'FAMILY',
        'BABY',
        'CAREER',
        'HOME',
        'CUSTOM',
      ],
      default: 'LOVE',
      index: true,
    },
    coverMediaId: {
      type: Schema.Types.ObjectId,
      ref: 'Media',
    },
    mediaIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Media',
      },
    ],
    location: {
      name: { type: String, trim: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    weather: {
      type: String,
      enum: ['SUNNY', 'RAINY', 'CLOUDY', 'SNOW', 'WINDY'],
    },
    mood: {
      type: String,
      enum: ['HAPPY', 'ROMANTIC', 'EXCITED', 'PEACEFUL', 'GRATEFUL', 'NOSTALGIC', 'MEMORABLE'],
      default: 'ROMANTIC',
    },
    emoji: {
      type: String,
      default: '❤️',
    },
    importance: {
      type: String,
      enum: ['NORMAL', 'IMPORTANT', 'MILESTONE'],
      default: 'NORMAL',
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'PUBLISHED',
      index: true,
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
        index: true,
      },
    ],
    people: [
      {
        type: String,
        trim: true,
      },
    ],
    visibility: {
      type: String,
      enum: ['PRIVATE', 'COUPLE', 'FAMILY', 'FRIENDS', 'PUBLIC'],
      default: 'COUPLE',
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isFavorite: {
      type: Boolean,
      default: false,
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
  },
  {
    timestamps: true,
  }
);

export const TimelineEvent: Model<ITimelineEvent> = mongoose.model<ITimelineEvent>(
  'TimelineEvent',
  timelineEventSchema
);
