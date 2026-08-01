import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDiaryEntry extends Document {
  _id: mongoose.Types.ObjectId;
  relationshipId: string;
  createdBy: mongoose.Types.ObjectId;
  title: string;
  content: string;
  mediaIds: mongoose.Types.ObjectId[];
  mood: string;
  date: Date;
  visibility: 'PRIVATE' | 'COUPLE' | 'FAMILY';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const diaryEntrySchema = new Schema<IDiaryEntry>(
  {
    relationshipId: {
      type: String,
      default: 'AFZAL_AMRIN_AFRIN_VERSE',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Diary title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Diary content is required'],
    },
    mediaIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Media',
      },
    ],
    mood: {
      type: String,
      default: 'ROMANTIC',
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    visibility: {
      type: String,
      enum: ['PRIVATE', 'COUPLE', 'FAMILY'],
      default: 'COUPLE',
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

export const DiaryEntry: Model<IDiaryEntry> = mongoose.model<IDiaryEntry>(
  'DiaryEntry',
  diaryEntrySchema
);
