import mongoose, { Document, Model, Schema } from 'mongoose';
import { RELATIONSHIP_TYPES, RelationshipType } from '../constants/relationshipTypes';

export interface IRelationshipMember {
  user: mongoose.Types.ObjectId;
  role: string;
  joinedAt: Date;
}

export interface IRelationship extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: RelationshipType;
  coverImage?: string;
  startDate?: Date;
  description?: string;
  members: IRelationshipMember[];
  status: 'ACTIVE' | 'ARCHIVED';
  createdBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const relationshipSchema = new Schema<IRelationship>(
  {
    name: {
      type: String,
      required: [true, 'Relationship name is required'],
      trim: true,
      maxlength: [100, 'Relationship name cannot exceed 100 characters'],
    },
    type: {
      type: String,
      enum: Object.values(RELATIONSHIP_TYPES),
      default: RELATIONSHIP_TYPES.COUPLE,
      required: true,
      index: true,
    },
    coverImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, default: 'MEMBER' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

relationshipSchema.index({ 'members.user': 1 });

export const Relationship: Model<IRelationship> = mongoose.model<IRelationship>('Relationship', relationshipSchema);
