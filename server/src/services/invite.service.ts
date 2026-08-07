import crypto from 'crypto';
import mongoose from 'mongoose';
import { HTTP_STATUS } from '../constants';
import { Invite, IInvite } from '../models/invite.model';
import { Relationship } from '../models/relationship.model';
import { AppError } from '../utils/AppError';
import { AuditLogService } from './auditLog.service';
import { RelationshipService } from './relationship.service';

export interface GenerateInviteInput {
  relationshipId: string;
  targetRole: string;
  createdBy: string;
  expiryDays?: number; // 1, 7, 30, or 36500 (Never Expires)
  maxUses?: number;
  email?: string;
}

export class InviteService {
  static async generateToken(input: GenerateInviteInput): Promise<IInvite> {
    const rel = await Relationship.findOne({ _id: input.relationshipId, isDeleted: { $ne: true } });
    if (!rel) {
      throw new AppError('Relationship not found or archived.', HTTP_STATUS.NOT_FOUND);
    }

    if (rel.status === 'ARCHIVED') {
      throw new AppError('Cannot generate invite for an archived relationship. Please restore it first.', HTTP_STATUS.BAD_REQUEST);
    }

    const code = crypto.randomBytes(16).toString('hex').toUpperCase();
    const expiryDays = input.expiryDays !== undefined ? Number(input.expiryDays) : 7;
    // 36500 days = 100 years for Never Expires
    const effectiveDays = expiryDays > 0 ? expiryDays : 36500;
    const expiresAt = new Date(Date.now() + effectiveDays * 24 * 60 * 60 * 1000);

    const invite = await Invite.create({
      code,
      relationship: new mongoose.Types.ObjectId(input.relationshipId),
      relationshipType: rel.type,
      targetRole: input.targetRole,
      createdBy: new mongoose.Types.ObjectId(input.createdBy),
      expiresAt,
      maxUses: input.maxUses ?? 1,
      currentUses: 0,
      status: 'UNUSED',
      isRevoked: false,
      isUsed: false,
      email: input.email ? input.email.toLowerCase() : undefined,
      metadata: { relationshipName: rel.name, expiryOption: expiryDays },
    });

    await AuditLogService.logAction({
      action: 'INVITE_GENERATED',
      adminUser: input.createdBy,
      targetRelationship: input.relationshipId,
      metadata: { code: invite.code, targetRole: input.targetRole, expiryDays },
    });

    return invite;
  }

  static async validateToken(code: string): Promise<{
    invite: IInvite;
    relationship: any;
  }> {
    const invite = await Invite.findOne({ code: code.toUpperCase() }).populate('relationship');
    if (!invite) {
      throw new AppError('Invite token is invalid or does not exist.', HTTP_STATUS.NOT_FOUND);
    }

    if (invite.isRevoked || invite.status === 'REVOKED') {
      throw new AppError('This invite token has been revoked.', 410);
    }

    if (new Date() > invite.expiresAt || invite.status === 'EXPIRED') {
      await Invite.findByIdAndUpdate(invite._id, { status: 'EXPIRED' });
      throw new AppError('This invite token has expired.', 410);
    }

    if (invite.currentUses >= invite.maxUses || invite.status === 'USED') {
      throw new AppError('This invite token has already been used.', 410);
    }

    return { invite, relationship: invite.relationship };
  }

  static async consumeInvite(code: string, userId: string): Promise<void> {
    const invite = await Invite.findOne({ code: code.toUpperCase() });
    if (!invite) return;

    invite.currentUses += 1;
    invite.usedBy = new mongoose.Types.ObjectId(userId);
    invite.usedAt = new Date();

    if (invite.currentUses >= invite.maxUses) {
      invite.isUsed = true;
      invite.status = 'USED';
    }

    await invite.save();

    // Automatically join user to relationship using RelationshipService
    if (invite.relationship) {
      try {
        await RelationshipService.addMember(
          invite.relationship.toString(),
          userId,
          invite.targetRole || 'MEMBER'
        );
      } catch (err) {
        console.error('Failed to auto-join user to relationship during invite consumption:', err);
      }
    }
  }

  static async revokeToken(code: string, adminId: string): Promise<IInvite> {
    const invite = await Invite.findOne({ code: code.toUpperCase() });
    if (!invite) {
      throw new AppError('Invite token not found.', HTTP_STATUS.NOT_FOUND);
    }

    invite.isRevoked = true;
    invite.status = 'REVOKED';
    invite.revokedBy = new mongoose.Types.ObjectId(adminId);
    invite.revokedAt = new Date();
    await invite.save();

    await AuditLogService.logAction({
      action: 'INVITE_REVOKED',
      adminUser: adminId,
      targetRelationship: invite.relationship?.toString(),
      metadata: { code: invite.code },
    });

    return invite;
  }

  static async regenerateToken(code: string, adminId: string): Promise<IInvite> {
    const oldInvite = await Invite.findOne({ code: code.toUpperCase() });
    if (!oldInvite) {
      throw new AppError('Original invite token not found.', HTTP_STATUS.NOT_FOUND);
    }

    // Revoke old
    oldInvite.isRevoked = true;
    oldInvite.status = 'REVOKED';
    oldInvite.revokedBy = new mongoose.Types.ObjectId(adminId);
    oldInvite.revokedAt = new Date();
    await oldInvite.save();

    // Generate new
    const newInvite = await this.generateToken({
      relationshipId: oldInvite.relationship?.toString() || '',
      targetRole: oldInvite.targetRole,
      createdBy: adminId,
      expiryDays: oldInvite.metadata?.expiryOption ?? 7,
      maxUses: oldInvite.maxUses,
    });

    await AuditLogService.logAction({
      action: 'INVITE_REGENERATED',
      adminUser: adminId,
      targetRelationship: oldInvite.relationship?.toString(),
      metadata: { oldCode: code, newCode: newInvite.code },
    });

    return newInvite;
  }

  static async getInvitesByRelationship(relationshipId: string): Promise<IInvite[]> {
    return Invite.find({ relationship: relationshipId }).sort({ createdAt: -1 });
  }
}
