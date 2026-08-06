import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISongDedication extends Document {
  _id: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  songId: mongoose.Types.ObjectId;
  message?: string;
  reaction?: string;
  createdAt: Date;
}

const songDedicationSchema = new Schema<ISongDedication>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
    message: { type: String, default: '', maxlength: 500 },
    reaction: { type: String, default: '❤️' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
  }
);

songDedicationSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

export const SongDedication: Model<ISongDedication> = mongoose.model<ISongDedication>(
  'SongDedication',
  songDedicationSchema
);
