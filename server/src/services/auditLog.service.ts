import mongoose from 'mongoose';
import { AdminAuditAction, AdminAuditLog } from '../models/adminAuditLog.model';

export interface LogActionParams {
  action: AdminAuditAction;
  adminUser: string | mongoose.Types.ObjectId;
  targetUser?: string | mongoose.Types.ObjectId;
  targetRelationship?: string | mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
}

export class AuditLogService {
  static async logAction(params: LogActionParams): Promise<void> {
    try {
      if (!params.adminUser || !mongoose.Types.ObjectId.isValid(params.adminUser)) {
        return;
      }

      await AdminAuditLog.create({
        action: params.action,
        adminUser: new mongoose.Types.ObjectId(params.adminUser),
        targetUser:
          params.targetUser && mongoose.Types.ObjectId.isValid(params.targetUser)
            ? new mongoose.Types.ObjectId(params.targetUser)
            : undefined,
        targetRelationship:
          params.targetRelationship && mongoose.Types.ObjectId.isValid(params.targetRelationship)
            ? new mongoose.Types.ObjectId(params.targetRelationship)
            : undefined,
        metadata: params.metadata || {},
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('AuditLogService.logAction error:', err);
    }
  }
}
