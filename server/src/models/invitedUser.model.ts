import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInvitedUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  relationshipId: mongoose.Types.ObjectId;
  relationshipName: string;
  relationshipType: string;
  ownerUserId: mongoose.Types.ObjectId;
  ownerName: string;
  ownerRole: string;
  tokenCode: string;
  targetRole: string;
  enabledFeatures: string[];
  status: 'PENDING' | 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  avatar?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const invitedUserSchema = new Schema<IInvitedUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: '' },
    relationshipId: { type: Schema.Types.ObjectId, ref: 'Relationship', default: null, index: true },
    relationshipName: { type: String, default: '' },
    relationshipType: { type: String, default: 'Friendship' },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerName: { type: String, required: true },
    ownerRole: { type: String, default: 'SUPER_OWNER' },
    tokenCode: { type: String, required: true, index: true },
    targetRole: { type: String, default: 'INVITED_USER' },
    enabledFeatures: [{ type: String }],
    status: { type: String, enum: ['PENDING', 'ACTIVE', 'REVOKED', 'EXPIRED'], default: 'PENDING', index: true },
    avatar: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const InvitedUser: Model<IInvitedUser> = mongoose.model<IInvitedUser>('InvitedUser', invitedUserSchema);
