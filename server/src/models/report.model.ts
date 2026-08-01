import mongoose, { Document, Model, Schema } from 'mongoose';

export type ReportTargetType = 'USER' | 'MEMORY' | 'COMMENT' | 'STORY';
export type ReportReason = 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'OTHER';
export type ReportStatus = 'OPEN' | 'REVIEWING' | 'RESOLVED';

export interface IReport extends Document {
  _id: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  targetType: ReportTargetType;
  targetId: mongoose.Types.ObjectId;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: {
      type: String,
      enum: ['USER', 'MEMORY', 'COMMENT', 'STORY'],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    reason: {
      type: String,
      enum: ['SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'OTHER'],
      required: true,
    },
    description: { type: String, maxlength: 1000 },
    status: {
      type: String,
      enum: ['OPEN', 'REVIEWING', 'RESOLVED'],
      default: 'OPEN',
      index: true,
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });

export const Report: Model<IReport> = mongoose.model<IReport>('Report', reportSchema);
