import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { HTTP_STATUS } from '../constants';
import { Relationship } from '../models/relationship.model';
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
  return ApiResponse.success(res, 'Relationship archived successfully', rel);
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
  } = req.body;

  const adminId = req.user?._id ? req.user._id.toString() : '';

  // If existing relationship ID provided and valid ObjectId, generate invite directly
  if (relationshipId && mongoose.Types.ObjectId.isValid(relationshipId) && relationshipId !== 'new' && relationshipId !== 'create') {
    const invite = await InviteService.generateToken({
      relationshipId,
      targetRole: targetRole || 'CO_OWNER',
      createdBy: adminId,
      expiryDays: expiryDays !== undefined ? Number(expiryDays) : 7,
      maxUses: maxUses ?? 1,
      enabledFeatures: enabledFeatures || [],
      inviteDisplayName: inviteDisplayName || '',
      relationshipType: relationshipType || 'Couple',
    });
    return ApiResponse.success(res, 'Relationship invite token generated', invite, 201);
  }

  if (!relationshipName || !relationshipName.trim()) {
    throw new AppError('Relationship Name is required when creating a new relationship.', HTTP_STATUS.BAD_REQUEST);
  }

  // Atomic Relationship + Invitation creation inside MongoDB transaction (with standalone fallback)
  const resultInvite = await runInSessionOrDirect(async (session) => {
    let relQuery = Relationship.findOne({ name: relationshipName.trim(), isDeleted: { $ne: true } });
    if (session) relQuery = relQuery.session(session);
    let rel = await relQuery.exec();

    if (!rel) {
      const createdDocs = await Relationship.create(
        [
          {
            name: relationshipName.trim(),
            type: relationshipType || 'Couple',
            status: 'ACTIVE',
            createdBy: toObjectId(adminId),
          },
        ],
        session ? { session } : {}
      );
      rel = createdDocs[0];
    }

    return await InviteService.generateToken(
      {
        relationshipId: rel._id.toString(),
        targetRole: targetRole || 'CO_OWNER',
        createdBy: adminId,
        expiryDays: expiryDays !== undefined ? Number(expiryDays) : 7,
        maxUses: maxUses ?? 1,
        enabledFeatures: enabledFeatures || [],
        inviteDisplayName: inviteDisplayName || '',
        relationshipType: relationshipType || rel.type || 'Couple',
      },
      session
    );
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
    maxUses: req.body.maxUses ?? 1,
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
