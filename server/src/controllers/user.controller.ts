import crypto from 'crypto';
import { Request, Response } from 'express';
import { HTTP_STATUS, PLATFORM_CONSTANTS, ROLES, USER_STATUS } from '../constants';
import { Invite } from '../models/invite.model';
import { Session } from '../models/session.model';
import { User } from '../models/user.model';
import { purgeUserAndAllData } from '../services/relationship.service';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

/**
 * Get Current Logged-in User Profile
 */
export const getMe = catchAsync(async (req: Request, res: Response) => {
  return ApiResponse.success(res, 'User profile retrieved', { user: req.user });
});

/**
 * List Users (SUPER_OWNER & CO_OWNER)
 */
export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || PLATFORM_CONSTANTS.DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string, 10) || PLATFORM_CONSTANTS.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;
  const searchQuery = (req.query.search as string || '').trim().toLowerCase();

  const requestingUser = req.user!;
  
  // User Search Scoping Rules:
  // 1. Parent Owners (SUPER_OWNER & CO_OWNER) can search/view: themselves, partner owner, and their created sub-users.
  // 2. Sub-users (INVITED_USER) can search/view: themselves and their parent owners.
  // 3. System Admin can search/view all active members.
  let allowedUserIds: any[] = [];

  if (requestingUser.role === ROLES.ADMIN) {
    const activeUsers = await User.find({ isDeleted: { $ne: true } }).select('_id');
    allowedUserIds = activeUsers.map((u) => u._id);
  } else if (requestingUser.role === ROLES.SUPER_OWNER || requestingUser.role === ROLES.CO_OWNER) {
    const owners = await User.find({
      role: { $in: [ROLES.SUPER_OWNER, ROLES.CO_OWNER] },
      isDeleted: { $ne: true },
    }).select('_id');
    const ownerIds = owners.map((u) => u._id);

    const { getSubUsersForOwner } = await import('./profile.controller');
    const subUsers = await getSubUsersForOwner(requestingUser._id);
    const subUserIds = subUsers.map((u) => u._id);

    allowedUserIds = Array.from(new Set([...ownerIds.map((id) => id.toString()), ...subUserIds.map((id) => id.toString())]));
  } else {
    // Invited Users
    const { getParentOwnerForUser } = await import('./profile.controller');
    const parentOwner = await getParentOwnerForUser(requestingUser._id);
    const parentId = parentOwner ? parentOwner._id : null;
    allowedUserIds = [requestingUser._id.toString(), parentId ? parentId.toString() : null].filter(Boolean);
  }

  // Query filter with optional search text
  const queryFilter: any = { _id: { $in: allowedUserIds }, isDeleted: { $ne: true } };
  if (searchQuery) {
    queryFilter.$or = [
      { name: new RegExp(searchQuery, 'i') },
      { email: new RegExp(searchQuery, 'i') },
      { username: new RegExp(searchQuery, 'i') },
    ];
  }

  const total = await User.countDocuments(queryFilter);
  const users = await User.find(queryFilter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return ApiResponse.success(
    res,
    'Users list retrieved',
    users,
    HTTP_STATUS.OK,
    {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  );
});

/**
 * Create Invitation Code (SUPER_OWNER only)
 */
export const createInvite = catchAsync(async (req: Request, res: Response) => {
  const { email, targetRole, expiresInDays } = req.body;

  const rawCode = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 char code
  const expiresAt = new Date(Date.now() + (expiresInDays || 7) * 24 * 60 * 60 * 1000);

  const invite = await Invite.create({
    code: rawCode,
    email: email ? email.toLowerCase() : undefined,
    targetRole: targetRole || ROLES.CO_OWNER,
    createdBy: req.user!._id,
    expiresAt,
  });

  return ApiResponse.created(res, 'Invitation code generated successfully', {
    inviteCode: invite.code,
    targetRole: invite.targetRole,
    email: invite.email,
    expiresAt: invite.expiresAt,
    inviteLink: `${req.protocol}://${req.get('host')}/register?inviteCode=${invite.code}`,
  });
});

/**
 * Get Invites (SUPER_OWNER only)
 */
export const getInvites = catchAsync(async (_req: Request, res: Response) => {
  const invites = await Invite.find()
    .populate('createdBy', 'name email')
    .populate('usedBy', 'name email')
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, 'Invites list retrieved', invites);
});

/**
 * Suspend User (SUPER_OWNER only)
 */
export const suspendUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (id === req.user!._id.toString()) {
    throw new AppError('Super Owner cannot suspend their own account.', HTTP_STATUS.BAD_REQUEST);
  }

  const targetUser = await User.findById(id);
  if (!targetUser) {
    throw new AppError('Target user not found.', HTTP_STATUS.NOT_FOUND);
  }

  targetUser.status = USER_STATUS.SUSPENDED;
  await targetUser.save();

  // Invalidate all active sessions
  await Session.updateMany({ user: targetUser._id }, { isValid: false });

  // Revoke all invitation tokens linked to this user
  await Invite.updateMany(
    { $or: [{ usedBy: targetUser._id }, { createdBy: targetUser._id }] },
    { $set: { isRevoked: true, status: 'REVOKED', revokedAt: new Date() } }
  );

  return ApiResponse.success(res, `User ${targetUser.email} has been inactivated/suspended, logged out, and invitation tokens disabled.`);
});

/**
 * Restore User (SUPER_OWNER only)
 */
export const restoreUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const targetUser = await User.findById(id);
  if (!targetUser) {
    throw new AppError('Target user not found.', HTTP_STATUS.NOT_FOUND);
  }

  targetUser.status = USER_STATUS.ACTIVE;
  await targetUser.save();

  return ApiResponse.success(res, `User ${targetUser.email} status restored to ACTIVE.`);
});

/**
 * Delete User (SUPER_OWNER only)
 */
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (id === req.user!._id.toString()) {
    throw new AppError('Super Owner cannot delete their own account.', HTTP_STATUS.BAD_REQUEST);
  }

  const targetUser = await User.findByIdAndDelete(id);
  if (!targetUser) {
    throw new AppError('Target user not found.', HTTP_STATUS.NOT_FOUND);
  }

  await Session.deleteMany({ user: id });
  await Invite.updateMany(
    { $or: [{ usedBy: id }, { createdBy: id }] },
    { $set: { isRevoked: true, status: 'REVOKED', revokedAt: new Date() } }
  );

  return ApiResponse.success(res, `User ${targetUser.email} account has been deleted and invitation tokens disabled.`);
});

/**
 * Update User Role (SUPER_OWNER only)
 */
export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (id === req.user!._id.toString()) {
    throw new AppError('Super Owner cannot change their own role.', HTTP_STATUS.BAD_REQUEST);
  }

  const targetUser = await User.findById(id);
  if (!targetUser) {
    throw new AppError('Target user not found.', HTTP_STATUS.NOT_FOUND);
  }

  targetUser.role = role;
  await targetUser.save();

  return ApiResponse.success(res, `Role for ${targetUser.email} updated to ${role}.`);
});

/**
 * Get Active Sessions
 */
export const getActiveSessions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId || req.user!._id.toString();

  // Non-super owners can only view their own sessions
  if (req.user!.role !== ROLES.SUPER_OWNER && userId !== req.user!._id.toString()) {
    throw new AppError('Permission denied to view another user sessions.', HTTP_STATUS.FORBIDDEN);
  }

  const sessions = await Session.find({ user: userId, isValid: true, expiresAt: { $gt: new Date() } })
    .sort({ lastActiveAt: -1 });

  return ApiResponse.success(res, 'Active sessions retrieved', sessions);
});

/**
 * Revoke Specific Session
 */
export const revokeSession = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const session = await Session.findById(sessionId);
  if (!session) {
    throw new AppError('Session record not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (req.user!.role !== ROLES.SUPER_OWNER && session.user.toString() !== req.user!._id.toString()) {
    throw new AppError('Permission denied to revoke this session.', HTTP_STATUS.FORBIDDEN);
  }

  session.isValid = false;
  await session.save();

  return ApiResponse.success(res, 'Session revoked successfully.');
});

/**
 * Force Logout User / Revoke All Sessions (SUPER_OWNER only)
 */
export const forceLogoutUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  await Session.updateMany({ user: id }, { isValid: false });

  return ApiResponse.success(res, 'All active sessions for this user have been revoked.');
});
