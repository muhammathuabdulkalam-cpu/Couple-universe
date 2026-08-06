import crypto from 'crypto';
import mongoose from 'mongoose';
import { HTTP_STATUS } from '../constants';
import { Invite, IInvite } from '../models/invite.model';
import { Relationship } from '../models/relationship.model';
import { AppError } from '../utils/AppError';

export interface GenerateInviteInput {
  relationshipId: string;
  targetRole: string;
  createdBy: string;
  expiryDays?: number;
  maxUses?: number;
  email?: string;
}

export class InviteService {
  static async generateToken(input: GenerateInviteInput): Promise<IInvite> {
    const rel = await Relationship.findOne({ _id: input.relationshipId, isDeleted: { $ne: true } });
    if (!rel) {
      throw new AppError('Relationship not found.', HTTP_STATUS.NOT_FOUND);
    }

    const code = crypto.randomBytes(16).toString('hex').toUpperCase();
    const expiryDays = input.expiryDays ?? 7;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

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
      email: input.email,
      metadata: { relationshipName: rel.name },
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

  static async consumeToken(code: string, userId: string): Promise<void> {
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

    // Auto-join: add user to the relationship
    if (invite.relationship) {
      const rel = await Relationship.findById(invite.relationship);
      if (rel) {
        const isAlreadyMember = rel.members.some((m) => m.user.toString() === userId);
        if (!isAlreadyMember) {
          rel.members.push({
            user: new mongoose.Types.ObjectId(userId),
            role: invite.targetRole || 'MEMBER',
            joinedAt: new Date(),
          });
          await rel.save();
        }
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
    return this.generateToken({
      relationshipId: oldInvite.relationship?.toString() || '',
      targetRole: oldInvite.targetRole,
      createdBy: adminId,
      expiryDays: 7,
      maxUses: oldInvite.maxUses,
    });
  }

  static async getInvitesByRelationship(relationshipId: string): Promise<IInvite[]> {
    return Invite.find({ relationship: relationshipId }).sort({ createdAt: -1 });
  }
}
