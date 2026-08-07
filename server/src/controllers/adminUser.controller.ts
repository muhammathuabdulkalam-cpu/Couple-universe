import { Request, Response } from 'express';
import { USER_STATUS } from '../constants';
import { InviteService } from '../services/invite.service';
import { UserService } from '../services/user.service';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';

/** GET /api/v1/admin/users */
export const listUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getPaginatedUsers({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    search: req.query.search as string,
    role: req.query.role as string,
    status: req.query.status as string,
  });
  return ApiResponse.success(res, 'Users retrieved', result);
});

/** GET /api/v1/admin/users/:id */
export const getUserDetail = catchAsync(async (req: Request, res: Response) => {
  const detail = await UserService.getUserDetailFull(req.params.id);
  return ApiResponse.success(res, 'User details retrieved', detail);
});

/** POST /api/v1/admin/users */
export const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.createUser(req.body, req.user!._id.toString());
  return ApiResponse.success(res, 'User created successfully', user, 201);
});

/** PUT /api/v1/admin/users/:id */
export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.updateUser(req.params.id, req.body, req.user!._id.toString());
  return ApiResponse.success(res, 'User updated successfully', user);
});

/** PATCH /api/v1/admin/users/:id/suspend */
export const suspendUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.setStatus(req.params.id, USER_STATUS.SUSPENDED, req.user!._id.toString());
  return ApiResponse.success(res, 'User suspended successfully', user);
});

/** PATCH /api/v1/admin/users/:id/activate */
export const activateUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.setStatus(req.params.id, USER_STATUS.ACTIVE, req.user!._id.toString());
  return ApiResponse.success(res, 'User activated successfully', user);
});

/** DELETE /api/v1/admin/users/:id */
export const softDeleteUser = catchAsync(async (req: Request, res: Response) => {
  await UserService.softDeleteUser(req.params.id, req.user!._id.toString());
  return ApiResponse.success(res, 'User soft deleted successfully');
});

/** PATCH /api/v1/admin/users/:id/restore */
export const restoreUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.restoreUser(req.params.id, req.user!._id.toString());
  return ApiResponse.success(res, 'User restored successfully', user);
});

/** POST /api/v1/admin/users/bulk */
export const bulkAction = catchAsync(async (req: Request, res: Response) => {
  const { action, userIds }: { action: string; userIds: string[] } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return ApiResponse.success(res, 'No users specified', { affected: 0 });
  }

  let affected = 0;
  for (const id of userIds) {
    try {
      if (action === 'suspend') {
        await UserService.setStatus(id, USER_STATUS.SUSPENDED, req.user!._id.toString());
      } else if (action === 'activate') {
        await UserService.setStatus(id, USER_STATUS.ACTIVE, req.user!._id.toString());
      } else if (action === 'delete') {
        await UserService.softDeleteUser(id, req.user!._id.toString());
      } else if (action === 'restore') {
        await UserService.restoreUser(id, req.user!._id.toString());
      }
      affected++;
    } catch (_err) {
      // continue on individual failure
    }
  }

  return ApiResponse.success(res, `Bulk ${action} applied`, { affected });
});

/** GET /api/v1/admin/users/export */
export const exportUsersCSV = catchAsync(async (req: Request, res: Response) => {
  const csv = await UserService.exportUsersCSV({
    search: req.query.search as string,
    role: req.query.role as string,
    status: req.query.status as string,
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
  res.status(200).send(csv);
});

/** POST /api/v1/admin/users/:id/invite */
export const generateUserInvite = catchAsync(async (req: Request, res: Response) => {
  const { relationshipId, targetRole, expiryDays, maxUses } = req.body;
  const invite = await InviteService.generateToken({
    relationshipId,
    targetRole: targetRole || 'INVITED_USER',
    createdBy: req.user!._id.toString(),
    expiryDays: expiryDays ?? 7,
    maxUses: maxUses ?? 1,
  });
  return ApiResponse.success(res, 'Invite token generated', { invite });
});
