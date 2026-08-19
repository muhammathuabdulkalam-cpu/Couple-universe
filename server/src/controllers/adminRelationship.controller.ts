import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { HTTP_STATUS } from '../constants';
import { InvitedUser } from '../models/invitedUser.model';
import { Invite } from '../models/invite.model';
import { Relationship } from '../models/relationship.model';
import { User } from '../models/user.model';
import { InviteService, toObjectId } from '../services/invite.service';
import { RelationshipService } from '../services/relationship.service';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

/**
 * Transaction session helper with graceful fallback for standalone MongoDB instances
 */
async function runInSessionOrDirect<T>(fn: (session?: mongoose.ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T;
    try {
      session.startTransaction();
      result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (txErr: any) {
      await session.abortTransaction();
      // Fallback for standalone MongoDB (without replica set enabled)
      if (
        txErr?.message?.includes('Transaction numbers') ||
        txErr?.message?.includes('replica set') ||
        txErr?.code === 20
      ) {
        return await fn(undefined);
      }
      throw txErr;
    }
  } finally {
    await session.endSession();
  }
}

/** GET /api/v1/admin/relationships */
export const listRelationships = catchAsync(async (req: Request, res: Response) => {
  // Purge any old empty test relationships created under old model without registered members
  await Relationship.deleteMany({
    $or: [
      { members: { $size: 0 } },
      { 'members.0': { $exists: false } },
      { name: { $in: ['Swetha', 'surya', 'sueya', 'Surya', 'Afzal & Swetha', 'Afzal & surya', 'Afzal & sueya', 'Afzal & Surya'] } },
    ],
  }).catch(() => {});
  await Invite.deleteMany({
    $or: [
      { code: { $in: ['173146E7E60CE426B6D5F687F1348969', '4EE9B3DBCBE909A3101979592107B560', 'BECC945339E5A60340A93216DD3B7BE8', '542455DCA5601A1A623F86E6847C37E9'] } },
    ],
  }).catch(() => {});

  const rels = await RelationshipService.getRelationships(
    req.query.search as string,
    req.query.type as string,
    req.query.status as string
  );
  return ApiResponse.success(res, 'Relationships retrieved', rels);
});

/** POST /api/v1/admin/relationships */
export const createRelationship = catchAsync(async (req: Request, res: Response) => {
  const rel = await RelationshipService.createRelationship({
    ...req.body,
    createdBy: req.user!._id.toString(),
  });
  return ApiResponse.success(res, 'Relationship created successfully', rel, 201);
});

/** PUT /api/v1/admin/relationships/:id */
export const updateRelationship = catchAsync(async (req: Request, res: Response) => {
  const rel = await RelationshipService.updateRelationship(req.params.id, req.body, req.user!._id.toString());
  return ApiResponse.success(res, 'Relationship updated successfully', rel);
});

/** PATCH /api/v1/admin/relationships/:id/archive */
export const archiveRelationship = catchAsync(async (req: Request, res: Response) => {
  const rel = await RelationshipService.archiveRelationship(req.params.id, req.user!._id.toString());
  return ApiResponse.success(res, 'Relationship archived successfully and invitation tokens disabled', rel);
});

/** DELETE /api/v1/admin/relationships/:id */
export const deleteRelationship = catchAsync(async (req: Request, res: Response) => {
  const rel = await RelationshipService.deleteRelationship(req.params.id, req.user!._id.toString());
  return ApiResponse.success(res, 'Relationship deleted successfully and invitation tokens disabled', rel);
});

/** PATCH /api/v1/admin/relationships/:id/restore */
export const restoreRelationship = catchAsync(async (req: Request, res: Response) => {
  const rel = await RelationshipService.restoreRelationship(req.params.id, req.user!._id.toString());
  return ApiResponse.success(res, 'Relationship restored successfully', rel);
});

/** POST /api/v1/admin/relationships/:id/members/add */
export const addMember = catchAsync(async (req: Request, res: Response) => {
  const rel = await RelationshipService.addMember(req.params.id, req.body.userId, req.body.role);
  return ApiResponse.success(res, 'Member added to relationship', rel);
});

/** DELETE /api/v1/admin/relationships/:id/members/:userId */
export const removeMember = catchAsync(async (req: Request, res: Response) => {
  const rel = await RelationshipService.removeMember(req.params.id, req.params.userId);
  return ApiResponse.success(res, 'Member removed from relationship', rel);
});

/** PATCH /api/v1/admin/relationships/:id/members/replace */
export const replaceMember = catchAsync(async (req: Request, res: Response) => {
  const rel = await RelationshipService.replaceMember(req.params.id, req.body.oldUserId, req.body.newUserId);
  return ApiResponse.success(res, 'Member replaced in relationship', rel);
});

/**
 * POST /api/v1/admin/relationships/invite/create
 * Standalone invitation creation with atomic relationship creation transaction support
 */
export const createStandaloneInvite = catchAsync(async (req: Request, res: Response) => {
  const {
    relationshipId,
    relationshipName,
    relationshipType,
    inviteDisplayName,
    targetRole,
    enabledFeatures,
    expiryDays,
    maxUses,
    partnerUserId,
  } = req.body;

  const adminId = req.user?._id ? req.user._id.toString() : '';

  // If existing relationship ID provided and valid ObjectId, generate invite directly
  if (relationshipId && mongoose.Types.ObjectId.isValid(relationshipId) && relationshipId !== 'new' && relationshipId !== 'create') {
    // Also link partner if provided and not already in members
    if (partnerUserId && mongoose.Types.ObjectId.isValid(partnerUserId)) {
      const relObj = await Relationship.findById(relationshipId);
      if (relObj) {
        const isMember = relObj.members.some((m: any) => m.user.toString() === partnerUserId);
        if (!isMember) {
          const partnerUser = await User.findById(partnerUserId);
          if (partnerUser) {
            relObj.members.push({
              user: partnerUser._id,
              role: partnerUser.role,
              joinedAt: new Date(),
            });
            await relObj.save();
          }
        }
      }
    }

    const invite = await InviteService.generateToken({
      relationshipId,
      targetRole: targetRole || 'CO_OWNER',
      createdBy: adminId,
      expiryDays: expiryDays !== undefined ? Number(expiryDays) : 7,
      maxUses: maxUses ?? 999,
      enabledFeatures: enabledFeatures || [],
      inviteDisplayName: inviteDisplayName || '',
      relationshipType: relationshipType || 'Couple',
    });
    return ApiResponse.success(res, 'Relationship invite token generated', invite, 201);
  }

  const resolvedRelName =
    relationshipName && relationshipName.trim()
      ? relationshipName.trim()
      : inviteDisplayName && inviteDisplayName.trim()
      ? `${inviteDisplayName.trim()} Relationship`
      : 'Friendship Relationship';

  // Atomic Relationship + Invitation creation inside MongoDB transaction (with standalone fallback)
  let partnerUserDoc: any = null;
  if (partnerUserId && mongoose.Types.ObjectId.isValid(partnerUserId)) {
    partnerUserDoc = await User.findById(partnerUserId);
  }

  const resultInvite = await runInSessionOrDirect(async (session) => {
    let relQuery = Relationship.findOne({ name: resolvedRelName });
    if (session) relQuery = relQuery.session(session);
    let rel = await relQuery.exec();

    if (rel) {
      if (rel.status === 'ARCHIVED' || rel.isDeleted) {
        rel.status = 'ACTIVE';
        rel.isDeleted = false;
        await rel.save(session ? { session } : {});
      }
      if (partnerUserDoc) {
        const isMember = rel.members.some((m: any) => m.user.toString() === partnerUserId);
        if (!isMember) {
          rel.members.push({
            user: partnerUserDoc._id,
            role: partnerUserDoc.role,
            joinedAt: new Date(),
          });
          await rel.save(session ? { session } : {});
        }
      }
    } else {
      const members: any[] = [];
      if (partnerUserDoc) {
        members.push({
          user: partnerUserDoc._id,
          role: partnerUserDoc.role,
          joinedAt: new Date(),
        });
      }

      const createdDocs = await Relationship.create(
        [
          {
            name: resolvedRelName,
            type: relationshipType || 'Couple',
            status: 'ACTIVE',
            createdBy: toObjectId(adminId),
            members,
          },
        ],
        session ? { session } : {}
      );
      rel = createdDocs[0];
    }

    const generatedToken = await InviteService.generateToken(
      {
        relationshipId: rel._id.toString(),
        targetRole: targetRole || 'CO_OWNER',
        createdBy: adminId,
        expiryDays: expiryDays !== undefined ? Number(expiryDays) : 7,
        maxUses: maxUses ?? 999,
        enabledFeatures: enabledFeatures || [],
        inviteDisplayName: inviteDisplayName || resolvedRelName,
        relationshipType: relationshipType || rel.type || 'Couple',
      },
      session
    );

    // Also insert document into dedicated InvitedUser MongoDB collection
    await InvitedUser.create({
      name: inviteDisplayName || resolvedRelName,
      email: '',
      relationshipId: rel._id,
      relationshipName: rel.name,
      relationshipType: relationshipType || rel.type || 'Friendship',
      ownerUserId: partnerUserDoc ? partnerUserDoc._id : toObjectId(adminId),
      ownerName: partnerUserDoc ? partnerUserDoc.name : 'Super Owner',
      ownerRole: partnerUserDoc ? partnerUserDoc.role : 'SUPER_OWNER',
      tokenCode: generatedToken.code,
      targetRole: targetRole || 'INVITED_USER',
      enabledFeatures: enabledFeatures || [],
      status: 'PENDING',
      avatar: '',
      isDeleted: false,
    }).catch(() => {});

    return generatedToken;
  });

  return ApiResponse.success(res, 'Relationship invitation created successfully', resultInvite, 201);
});

/** POST /api/v1/admin/relationships/:id/invite */
export const generateRelationshipInvite = catchAsync(async (req: Request, res: Response, next: any) => {
  const targetId = req.params.id;

  if (
    !mongoose.Types.ObjectId.isValid(targetId) ||
    targetId === 'new' ||
    targetId === 'invite' ||
    targetId === 'create' ||
    (req.body.relationshipName && !req.body.relationshipId)
  ) {
    return createStandaloneInvite(req, res, next);
  }

  const invite = await InviteService.generateToken({
    relationshipId: targetId,
    targetRole: req.body.targetRole || 'CO_OWNER',
    createdBy: req.user!._id.toString(),
    expiryDays: req.body.expiryDays !== undefined ? Number(req.body.expiryDays) : 7,
    maxUses: req.body.maxUses ?? 999,
    enabledFeatures: req.body.enabledFeatures || [],
    inviteDisplayName: req.body.inviteDisplayName || req.body.relationshipName || '',
    relationshipType: req.body.relationshipType || 'Couple',
  });
  return ApiResponse.success(res, 'Relationship invite token generated', invite);
});

/** PATCH /api/v1/admin/relationships/:id/invite/:code/revoke */
export const revokeRelationshipInvite = catchAsync(async (req: Request, res: Response) => {
  const invite = await InviteService.revokeToken(req.params.code, req.user!._id.toString());
  return ApiResponse.success(res, 'Invite token revoked', invite);
});

/** POST /api/v1/admin/relationships/:id/invite/:code/regenerate */
export const regenerateRelationshipInvite = catchAsync(async (req: Request, res: Response) => {
  const invite = await InviteService.regenerateToken(req.params.code, req.user!._id.toString());
  return ApiResponse.success(res, 'New invite token generated', invite);
});

/** GET /api/v1/admin/relationships/:id/invites */
export const getRelationshipInvites = catchAsync(async (req: Request, res: Response) => {
  const invites = await InviteService.getInvitesByRelationship(req.params.id);
  return ApiResponse.success(res, 'Relationship invites retrieved', invites);
});
