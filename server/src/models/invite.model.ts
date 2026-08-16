import mongoose, { Document, Model, Schema } from 'mongoose';
import { ROLES, UserRole } from '../constants';

export type InviteStatus = 'UNUSED' | 'USED' | 'EXPIRED' | 'REVOKED';

export interface IInvite extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  email?: string;
  relationship?: mongoose.Types.ObjectId;
  relationshipType?: string;
  inviteDisplayName?: string;
  targetRole: UserRole;
  enabledFeatures?: string[];
  expiresAt: Date;
  maxUses: number;
  currentUses: number;
  createdBy: mongoose.Types.ObjectId;
  revokedBy?: mongoose.Types.ObjectId;
  revokedAt?: Date;
  status: InviteStatus;
  isRevoked: boolean;
  isUsed: boolean;
  usedBy?: mongoose.Types.ObjectId;
  usedAt?: Date;
  metadata?: Record<string, any>;
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
    relationship: {
      type: Schema.Types.ObjectId,
      ref: 'Relationship',
      index: true,
    },
    relationshipType: {
      type: String,
      default: 'Couple',
    },
    inviteDisplayName: {
      type: String,
      default: '',
    },
    targetRole: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CO_OWNER,
    },
    enabledFeatures: {
      type: [String],
      default: [],
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    maxUses: {
      type: Number,
      default: 1,
    },
    currentUses: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    revokedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['UNUSED', 'USED', 'EXPIRED', 'REVOKED'],
      default: 'UNUSED',
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
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
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Invite: Model<IInvite> = mongoose.model<IInvite>('Invite', inviteSchema);
