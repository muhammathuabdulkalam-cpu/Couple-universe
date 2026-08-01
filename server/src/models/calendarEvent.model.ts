import mongoose, { Document, Model, Schema } from 'mongoose';
import { MediaVisibility } from './media.model';

export type CalendarEventType =
  | 'ANNIVERSARY'
  | 'BIRTHDAY'
  | 'FIRST_CHAT'
  | 'FIRST_CALL'
  | 'FIRST_MEETING'
  | 'DATE'
  | 'TRIP'
  | 'VACATION'
  | 'SHOPPING'
  | 'MOVIE'
  | 'DINNER'
  | 'WORK'
  | 'FAMILY'
  | 'MARRIAGE'
  | 'ENGAGEMENT'
  | 'BABY'
  | 'DOCTOR'
  | 'REMINDER'
  | 'CUSTOM';

export type RepeatRule = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type EventPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type CalendarEventStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ICalendarNotification {
  triggerTime: Date;
  offsetMinutes: number;
  channel: 'IN_APP' | 'EMAIL' | 'PUSH';
}

export interface ICalendarEvent extends Document {
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  eventType: CalendarEventType;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  timezone: string;
  location?: {
    name?: string;
    lat?: number;
    lng?: number;
  };
  visibility: MediaVisibility;
  priority: EventPriority;
  status: CalendarEventStatus;
  color: string;
  icon: string;
  coverMediaId?: mongoose.Types.ObjectId;
  timelineEventId?: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  notifications: ICalendarNotification[];
  repeatRule: RepeatRule;
  isCompleted: boolean;
  isCancelled: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const calendarNotificationSchema = new Schema<ICalendarNotification>(
  {
    triggerTime: { type: Date, required: true },
    offsetMinutes: { type: Number, required: true, default: 15 },
    channel: { type: String, enum: ['IN_APP', 'EMAIL', 'PUSH'], default: 'IN_APP' },
  },
  { _id: false }
);

const calendarEventSchema = new Schema<ICalendarEvent>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
    },
    eventType: {
      type: String,
      enum: [
        'ANNIVERSARY',
        'BIRTHDAY',
        'FIRST_CHAT',
        'FIRST_CALL',
        'FIRST_MEETING',
        'DATE',
        'TRIP',
        'VACATION',
        'SHOPPING',
        'MOVIE',
        'DINNER',
        'WORK',
        'FAMILY',
        'MARRIAGE',
        'ENGAGEMENT',
        'BABY',
        'DOCTOR',
        'REMINDER',
        'CUSTOM',
      ],
      default: 'DATE',
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    location: {
      name: { type: String, trim: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    visibility: {
      type: String,
      enum: ['PRIVATE', 'COUPLE', 'FAMILY', 'FRIENDS', 'PUBLIC'],
      default: 'COUPLE',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
      index: true,
    },
    color: {
      type: String,
      default: '#06B6D4',
    },
    icon: {
      type: String,
      default: '📅',
    },
    coverMediaId: {
      type: Schema.Types.ObjectId,
      ref: 'Media',
    },
    timelineEventId: {
      type: Schema.Types.ObjectId,
      ref: 'TimelineEvent',
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    notifications: [calendarNotificationSchema],
    repeatRule: {
      type: String,
      enum: ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
      default: 'NONE',
      index: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    isCancelled: {
      type: Boolean,
      default: false,
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

export const CalendarEvent: Model<ICalendarEvent> = mongoose.model<ICalendarEvent>(
  'CalendarEvent',
  calendarEventSchema
);
