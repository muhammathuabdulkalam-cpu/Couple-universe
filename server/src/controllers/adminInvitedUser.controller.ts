import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { InvitedUser } from '../models/invitedUser.model';
import { Relationship } from '../models/relationship.model';
import { Invite } from '../models/invite.model';
import { User } from '../models/user.model';
import { purgeUserAndAllData } from '../services/relationship.service';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';
import { InviteService } from '../services/invite.service';

/** GET /api/v1/admin/invited-users */
export const listInvitedUsers = catchAsync(async (req: Request, res: Response) => {
  const items = await InvitedUser.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
  return ApiResponse.success(res, 'Invited users retrieved', items);
});

/** POST /api/v1/admin/invited-users */
export const createInvitedUser = catchAsync(async (req: Request, res: Response) => {
  const {
    name,
    email,
    relationshipId,
    relationshipName,
    relationshipType,
    ownerUserId,
    ownerName,
    ownerRole,
    targetRole,
    enabledFeatures,
    expiryDays,
    maxUses,
  } = req.body;

  const adminId = req.user?._id ? req.user._id.toString() : '';
  const resolvedOwnerId = ownerUserId || adminId;
  const ownerUser = await User.findById(resolvedOwnerId);

  // Generate invite token
  const invite = await InviteService.generateToken({
    relationshipId: relationshipId || '',
    targetRole: targetRole || 'INVITED_USER',
    createdBy: adminId,
    expiryDays: expiryDays !== undefined ? Number(expiryDays) : 7,
    maxUses: maxUses ?? 1,
    enabledFeatures: enabledFeatures || [],
    inviteDisplayName: name || relationshipName || '',
    relationshipType: relationshipType || 'Friendship',
  });

  const doc = await InvitedUser.create({
    name: name || relationshipName || 'Invited User',
    email: email || '',
    relationshipId: relationshipId && mongoose.Types.ObjectId.isValid(relationshipId) ? new mongoose.Types.ObjectId(relationshipId) : null,
    relationshipName: relationshipName || name || '',
    relationshipType: relationshipType || 'Friendship',
    ownerUserId: new mongoose.Types.ObjectId(resolvedOwnerId),
    ownerName: ownerName || ownerUser?.name || 'Super Owner',
    ownerRole: ownerRole || ownerUser?.role || 'SUPER_OWNER',
    tokenCode: invite.code,
    targetRole: targetRole || 'INVITED_USER',
    enabledFeatures: enabledFeatures || [],
    status: 'PENDING',
    avatar: '',
    isDeleted: false,
  });

  return ApiResponse.success(res, 'Invited user document created in collection', doc, 201);
});

/** DELETE /api/v1/admin/invited-users/:id */
export const deleteInvitedUser = catchAsync(async (req: Request, res: Response) => {
  const targetId = req.params.id;

  if (mongoose.Types.ObjectId.isValid(targetId)) {
    // 1. Delete from dedicated InvitedUser collection
    const invitedDoc = await InvitedUser.findByIdAndDelete(targetId);

    if (invitedDoc) {
      // Delete linked invites & relationships by token or relationshipId
      if (invitedDoc.tokenCode) {
        await Invite.deleteMany({ code: invitedDoc.tokenCode });
      }
      if (invitedDoc.relationshipId) {
        await Relationship.findByIdAndDelete(invitedDoc.relationshipId);
        await Invite.deleteMany({ relationship: invitedDoc.relationshipId });
      }
      // Purge any registered user matching email or relationship
      if (invitedDoc.email) {
        const linkedUsers = await User.find({ email: invitedDoc.email.toLowerCase() });
        for (const u of linkedUsers) {
          await purgeUserAndAllData(u._id.toString());
        }
      }
    } else {
      // If targetId is a relationshipId or tokenCode or user ID
      const docs = await InvitedUser.find({
        $or: [
          { _id: new mongoose.Types.ObjectId(targetId) },
          { relationshipId: new mongoose.Types.ObjectId(targetId) },
          { tokenCode: targetId },
        ],
      });
      for (const d of docs) {
        if (d.email) {
          const linked = await User.find({ email: d.email.toLowerCase() });
          for (const u of linked) {
            await purgeUserAndAllData(u._id.toString());
          }
        }
      }
      await InvitedUser.deleteMany({
        $or: [
          { _id: new mongoose.Types.ObjectId(targetId) },
          { relationshipId: new mongoose.Types.ObjectId(targetId) },
          { tokenCode: targetId },
        ],
      });
      await Relationship.findByIdAndDelete(targetId);
      await Invite.deleteMany({ $or: [{ relationship: targetId }, { code: targetId }] });
      await purgeUserAndAllData(targetId);
    }
  } else {
    const docs = await InvitedUser.find({ tokenCode: targetId });
    for (const d of docs) {
      if (d.email) {
        const linked = await User.find({ email: d.email.toLowerCase() });
        for (const u of linked) {
          await purgeUserAndAllData(u._id.toString());
        }
      }
    }
    await InvitedUser.deleteMany({ tokenCode: targetId });
    await Invite.deleteMany({ code: targetId });
  }

  return ApiResponse.success(res, 'Invited user and total collection documents permanently deleted');
});
