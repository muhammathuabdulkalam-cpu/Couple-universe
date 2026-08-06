import { Request, Response } from 'express';
import { InviteService } from '../services/invite.service';
import { RelationshipService } from '../services/relationship.service';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';

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
  const rel = await RelationshipService.updateRelationship(req.params.id, req.body);
  return ApiResponse.success(res, 'Relationship updated successfully', rel);
});

/** PATCH /api/v1/admin/relationships/:id/archive */
export const archiveRelationship = catchAsync(async (req: Request, res: Response) => {
  const rel = await RelationshipService.archiveRelationship(req.params.id);
  return ApiResponse.success(res, `Relationship ${rel.status.toLowerCase()} successfully`, rel);
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

/** POST /api/v1/admin/relationships/:id/invite */
export const generateRelationshipInvite = catchAsync(async (req: Request, res: Response) => {
  const invite = await InviteService.generateToken({
    relationshipId: req.params.id,
    targetRole: req.body.targetRole || 'INVITED_USER',
    createdBy: req.user!._id.toString(),
    expiryDays: req.body.expiryDays ?? 7,
    maxUses: req.body.maxUses ?? 1,
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
