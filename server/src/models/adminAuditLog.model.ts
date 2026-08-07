import mongoose, { Document, Model, Schema } from 'mongoose';

export type AdminAuditAction =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_SUSPENDED'
  | 'USER_ACTIVATED'
  | 'USER_DELETED'
  | 'USER_RESTORED'
  | 'RELATIONSHIP_CREATED'
  | 'RELATIONSHIP_UPDATED'
  | 'RELATIONSHIP_ARCHIVED'
  | 'RELATIONSHIP_RESTORED'
  | 'INVITE_GENERATED'
  | 'INVITE_REVOKED'
  | 'INVITE_REGENERATED';

export interface IAdminAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  action: AdminAuditAction;
  adminUser: mongoose.Types.ObjectId;
  targetUser?: mongoose.Types.ObjectId;
  targetRelationship?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    adminUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    targetRelationship: {
      type: Schema.Types.ObjectId,
      ref: 'Relationship',
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AdminAuditLog: Model<IAdminAuditLog> = mongoose.model<IAdminAuditLog>(
  'AdminAuditLog',
  adminAuditLogSchema
);
