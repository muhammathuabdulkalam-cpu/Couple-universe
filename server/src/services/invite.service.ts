import crypto from 'crypto';
import mongoose from 'mongoose';
import { HTTP_STATUS } from '../constants';
import { Invite, IInvite } from '../models/invite.model';
import { Relationship } from '../models/relationship.model';
import { AppError } from '../utils/AppError';
import { AuditLogService } from './auditLog.service';

export interface GenerateInviteInput {
  relationshipId: string;
  targetRole: string;
  createdBy: string;
  expiryDays?: number; // 1, 3, 7, 30, or 36500 (Never Expires)
  maxUses?: number;
  email?: string;
  enabledFeatures?: string[];
  inviteDisplayName?: string;
  relationshipType?: string;
}

export function toObjectId(id?: any): mongoose.Types.ObjectId | null {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  if (typeof id === 'object' && id._id) {
    return toObjectId(id._id);
  }
  return null;
}

export class InviteService {
  static async generateToken(input: GenerateInviteInput, session?: mongoose.ClientSession): Promise<IInvite> {
    const relObjId = toObjectId(input.relationshipId);
    if (!relObjId) {
      throw new AppError('Invalid Relationship ID provided. Please select an existing relationship or specify a new relationship name.', HTTP_STATUS.BAD_REQUEST);
    }

    const adminObjId = toObjectId(input.createdBy) || new mongoose.Types.ObjectId();

    const relQuery = Relationship.findOne({ _id: relObjId, isDeleted: { $ne: true } });
    if (session) relQuery.session(session);
    const rel = await relQuery.exec();

    if (!rel) {
      throw new AppError('Relationship not found or archived.', HTTP_STATUS.NOT_FOUND);
    }

    if (rel.status === 'ARCHIVED') {
      throw new AppError('Cannot generate invite for an archived relationship. Please restore it first.', HTTP_STATUS.BAD_REQUEST);
    }

    const code = crypto.randomBytes(16).toString('hex').toUpperCase();
    const expiryDays = input.expiryDays !== undefined ? Number(input.expiryDays) : 7;
    const effectiveDays = expiryDays > 0 ? expiryDays : 36500;
    const expiresAt = new Date(Date.now() + effectiveDays * 24 * 60 * 60 * 1000);

    const inviteDocs = await Invite.create(
      [
        {
          code,
          relationship: relObjId,
          relationshipType: input.relationshipType || rel.type || 'Couple',
          inviteDisplayName: input.inviteDisplayName || rel.name || '',
          targetRole: input.targetRole,
          enabledFeatures: input.enabledFeatures || [],
          createdBy: adminObjId,
          expiresAt,
          maxUses: input.maxUses ?? 1,
          currentUses: 0,
          status: 'UNUSED',
          isRevoked: false,
          isUsed: false,
          email: input.email ? input.email.toLowerCase() : undefined,
          metadata: { relationshipName: rel.name, expiryOption: expiryDays },
        },
      ],
      session ? { session } : {}
    );
    const invite = inviteDocs[0];

    if (!session) {
      await AuditLogService.logAction({
        action: 'INVITE_GENERATED',
        adminUser: input.createdBy,
        targetRelationship: input.relationshipId,
        metadata: { code: invite.code, targetRole: input.targetRole, expiryDays, enabledFeatures: input.enabledFeatures },
      });
    }

    return invite;
  }

  static async validateToken(code: string, session?: mongoose.ClientSession): Promise<{
    invite: IInvite;
    relationship: any;
    status: 'ACTIVE' | 'EXPIRED' | 'FULLY_USED' | 'REVOKED';
    remainingUses: number;
  }> {
    const cleanCode = (code || '').trim().toUpperCase();
    const query = Invite.findOne({ code: cleanCode }).populate('relationship');
    if (session) {
      query.session(session);
    }
    const invite = await query.exec();

    if (!invite) {
      throw new AppError('Invite token is invalid or does not exist.', HTTP_STATUS.NOT_FOUND);
    }

    let status: 'ACTIVE' | 'EXPIRED' | 'FULLY_USED' | 'REVOKED' = 'ACTIVE';

    if (invite.isRevoked || invite.status === 'REVOKED') {
      status = 'REVOKED';
    } else if (new Date() > invite.expiresAt || invite.status === 'EXPIRED') {
      status = 'EXPIRED';
      if (!session && invite.status !== 'EXPIRED') {
        await Invite.findByIdAndUpdate(invite._id, { status: 'EXPIRED' });
      }
    } else if (invite.currentUses >= invite.maxUses || invite.status === 'USED') {
      status = 'FULLY_USED';
    }

    const remainingUses = Math.max(0, invite.maxUses - invite.currentUses);

    if (status === 'REVOKED') {
      throw new AppError('This invitation token has been revoked.', 410);
    }
    if (status === 'EXPIRED') {
      throw new AppError('This invitation token has expired.', 410);
    }
    if (status === 'FULLY_USED') {
      throw new AppError('This invitation token has reached its maximum number of users.', 410);
    }

    return { invite, relationship: invite.relationship, status, remainingUses };
  }

  static async getInvitePreview(code: string): Promise<{
    code: string;
    inviteDisplayName: string;
    relationshipName: string;
    relationshipType: string;
    targetRole: string;
    enabledFeatures: string[];
    email?: string;
    expiresAt: Date;
    maxUses: number;
    currentUses: number;
    remainingUses: number;
    status: 'ACTIVE' | 'EXPIRED' | 'FULLY_USED' | 'REVOKED';
  }> {
    const cleanCode = (code || '').trim().toUpperCase();
    const invite = await Invite.findOne({ code: cleanCode }).populate('relationship');

    if (!invite) {
      throw new AppError('Invite token is invalid or does not exist.', HTTP_STATUS.NOT_FOUND);
    }

    let computedStatus: 'ACTIVE' | 'EXPIRED' | 'FULLY_USED' | 'REVOKED' = 'ACTIVE';

    if (invite.isRevoked || invite.status === 'REVOKED') {
      computedStatus = 'REVOKED';
    } else if (new Date() > invite.expiresAt || invite.status === 'EXPIRED') {
      computedStatus = 'EXPIRED';
    } else if (invite.currentUses >= invite.maxUses || invite.status === 'USED') {
      computedStatus = 'FULLY_USED';
    }

    const rel: any = invite.relationship;
    const remainingUses = Math.max(0, invite.maxUses - invite.currentUses);

    return {
      code: invite.code,
      inviteDisplayName: invite.inviteDisplayName || (rel ? rel.name : 'Couple Universe'),
      relationshipName: rel ? rel.name : (invite.inviteDisplayName || 'Couple Universe'),
      relationshipType: invite.relationshipType || (rel ? rel.type : 'Couple'),
      targetRole: invite.targetRole,
      enabledFeatures: invite.enabledFeatures || [],
      email: invite.email,
      expiresAt: invite.expiresAt,
      maxUses: invite.maxUses,
      currentUses: invite.currentUses,
      remainingUses,
      status: computedStatus,
    };
  }

  static async consumeInviteAtomic(
    code: string,
    userId: string,
    session?: mongoose.ClientSession
  ): Promise<IInvite> {
    const cleanCode = (code || '').trim().toUpperCase();

    const updatedInvite = await Invite.findOneAndUpdate(
      {
        code: cleanCode,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
        $expr: { $lt: ['$currentUses', '$maxUses'] },
      },
      {
        $inc: { currentUses: 1 },
        $set: {
          usedBy: toObjectId(userId),
          usedAt: new Date(),
        },
      },
      { new: true, session }
    );

    if (!updatedInvite) {
      throw new AppError('Invite token is invalid, expired, revoked, or fully consumed.', HTTP_STATUS.BAD_REQUEST);
    }

    // Transition status to USED only if maxUses reached
    if (updatedInvite.currentUses >= updatedInvite.maxUses) {
      updatedInvite.status = 'USED';
      updatedInvite.isUsed = true;
      await updatedInvite.save({ session });
    }

    return updatedInvite;
  }

  static async revokeToken(code: string, adminId: string): Promise<IInvite> {
    const invite = await Invite.findOne({ code: code.toUpperCase() });
    if (!invite) {
      throw new AppError('Invite token not found.', HTTP_STATUS.NOT_FOUND);
    }

    invite.isRevoked = true;
    invite.status = 'REVOKED';
    invite.revokedBy = toObjectId(adminId) || undefined;
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
    oldInvite.revokedBy = toObjectId(adminId) || undefined;
    oldInvite.revokedAt = new Date();
    await oldInvite.save();

    // Generate new
    const newInvite = await this.generateToken({
      relationshipId: oldInvite.relationship?.toString() || '',
      targetRole: oldInvite.targetRole,
      createdBy: adminId,
      expiryDays: oldInvite.metadata?.expiryOption ?? 7,
      maxUses: oldInvite.maxUses,
      enabledFeatures: oldInvite.enabledFeatures,
      inviteDisplayName: oldInvite.inviteDisplayName,
      relationshipType: oldInvite.relationshipType,
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
    const relObjId = toObjectId(relationshipId);
    if (!relObjId) return [];
    return Invite.find({ relationship: relObjId }).sort({ createdAt: -1 });
  }
}
