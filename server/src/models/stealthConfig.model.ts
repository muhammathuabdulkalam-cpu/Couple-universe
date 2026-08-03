import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IStealthConfig extends Document {
  _id: mongoose.Types.ObjectId;
  enabled: boolean;
  hashedToken: string;
  secretExpressionHash: string;
  createdBy: mongoose.Types.ObjectId;
  lastUsed: Date | null;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const stealthConfigSchema = new Schema<IStealthConfig>(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    hashedToken: {
      type: String,
      default: '',
    },
    secretExpressionHash: {
      type: String,
      default: '',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastUsed: {
      type: Date,
      default: null,
    },
    isRevoked: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'stealthconfig',
  }
);

export const StealthConfig: Model<IStealthConfig> = mongoose.model<IStealthConfig>(
  'StealthConfig',
  stealthConfigSchema
);
