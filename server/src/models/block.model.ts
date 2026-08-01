import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBlock extends Document {
  _id: mongoose.Types.ObjectId;
  blocker: mongoose.Types.ObjectId;
  blocked: mongoose.Types.ObjectId;
  createdAt: Date;
}

const blockSchema = new Schema<IBlock>(
  {
    blocker: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    blocked: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

export const Block: Model<IBlock> = mongoose.model<IBlock>('Block', blockSchema);
