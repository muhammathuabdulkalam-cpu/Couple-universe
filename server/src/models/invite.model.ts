import mongoose, { Document, Model, Schema } from 'mongoose';
import { ROLES, UserRole } from '../constants';

export interface IInvite extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  email?: string;
  targetRole: UserRole;
  createdBy: mongoose.Types.ObjectId;
  isUsed: boolean;
  usedBy?: mongoose.Types.ObjectId;
  usedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inviteSchema = new Schema<IInvite>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    targetRole: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CO_OWNER,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    usedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    usedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export const Invite: Model<IInvite> = mongoose.model<IInvite>('Invite', inviteSchema);
