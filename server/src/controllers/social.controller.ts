import { Request, Response } from 'express';
import { HTTP_STATUS } from '../constants';
import { Block } from '../models/block.model';
import { Follow } from '../models/follow.model';
import { User } from '../models/user.model';
import { notificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

/**
 * Follow a user
 */
export const followUser = catchAsync(async (req: Request, res: Response) => {
  const actor = req.user!;
  const targetId = req.params.userId;

  if (actor._id.toString() === targetId) {
    throw new AppError('You cannot follow yourself.', HTTP_STATUS.BAD_REQUEST);
  }

  const target = await User.findById(targetId);
  if (!target) throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);

  // Block check
  const isBlocked = await Block.findOne({
    $or: [
      { blocker: actor._id, blocked: targetId },
      { blocker: targetId, blocked: actor._id },
    ],
  });
  if (isBlocked) throw new AppError('Cannot follow this user.', HTTP_STATUS.FORBIDDEN);

  const existing = await Follow.findOne({ follower: actor._id, following: targetId });
  if (existing) {
    return ApiResponse.success(res, 'Already following this user.', existing);
  }

  const follow = await Follow.create({
    follower: actor._id,
    following: targetId,
    status: 'ACCEPTED',
  });

  // Send notification via Notification Engine Service
  await notificationService.publish({
    recipientId: targetId,
    senderId: actor._id,
    type: 'FOLLOW',
    message: `${actor.name} started following you.`,
    targetType: 'USER',
    targetId: actor._id,
    referenceId: follow._id,
    refModel: 'Follow',
  });

  return ApiResponse.created(res, 'Followed successfully.', follow);
});

/**
 * Unfollow a user
 */
export const unfollowUser = catchAsync(async (req: Request, res: Response) => {
  const actor = req.user!;
  const targetId = req.params.userId;

  await Follow.findOneAndDelete({ follower: actor._id, following: targetId });

  return ApiResponse.success(res, 'Unfollowed successfully.');
});

/**
 * Get followers of a user
 */
export const getFollowers = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  const { getProfileFollowersList } = await import('./profile.controller');
  const followersList = await getProfileFollowersList(targetUser);

  const formattedFollowers = followersList.map((f) => ({
    _id: f._id,
    follower: f,
    createdAt: new Date(),
  }));

  return ApiResponse.success(res, 'Followers retrieved.', formattedFollowers, HTTP_STATUS.OK, {
    page: 1,
    limit: formattedFollowers.length,
    total: formattedFollowers.length,
    totalPages: 1,
  });
});

/**
 * Get users a user is following
 */
export const getFollowing = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  const { getProfileFollowersList } = await import('./profile.controller');
  const followingList = await getProfileFollowersList(targetUser);

  const formattedFollowing = followingList.map((f) => ({
    _id: f._id,
    following: f,
    createdAt: new Date(),
  }));

  return ApiResponse.success(res, 'Following retrieved.', formattedFollowing, HTTP_STATUS.OK, {
    page: 1,
    limit: formattedFollowing.length,
    total: formattedFollowing.length,
    totalPages: 1,
  });
});

/**
 * Block a user
 */
export const blockUser = catchAsync(async (req: Request, res: Response) => {
  const actor = req.user!;
  const targetId = req.params.userId;

  if (actor._id.toString() === targetId) {
    throw new AppError('Cannot block yourself.', HTTP_STATUS.BAD_REQUEST);
  }

  // Remove any existing follow relationships
  await Follow.deleteMany({
    $or: [
      { follower: actor._id, following: targetId },
      { follower: targetId, following: actor._id },
    ],
  });

  // Upsert block
  const block = await Block.findOneAndUpdate(
    { blocker: actor._id, blocked: targetId },
    { blocker: actor._id, blocked: targetId },
    { upsert: true, new: true }
  );

  return ApiResponse.created(res, 'User blocked successfully.', block);
});

/**
 * Unblock a user
 */
export const unblockUser = catchAsync(async (req: Request, res: Response) => {
  const actor = req.user!;
  const targetId = req.params.userId;

  await Block.findOneAndDelete({ blocker: actor._id, blocked: targetId });

  return ApiResponse.success(res, 'User unblocked successfully.');
});

/**
 * Get follow status between current user and target
 */
export const getFollowStatus = catchAsync(async (req: Request, res: Response) => {
  const actor = req.user!;
  const { userId } = req.params;

  const isFollowing = await Follow.findOne({ follower: actor._id, following: userId, status: 'ACCEPTED' });
  const isFollower = await Follow.findOne({ follower: userId, following: actor._id, status: 'ACCEPTED' });
  const isBlocked = await Block.findOne({ blocker: actor._id, blocked: userId });

  return ApiResponse.success(res, 'Follow status retrieved.', {
    isFollowing: !!isFollowing,
    isFollower: !!isFollower,
    isBlocked: !!isBlocked,
  });
});
