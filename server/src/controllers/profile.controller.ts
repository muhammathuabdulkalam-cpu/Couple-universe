import { Request, Response } from 'express';
import { HTTP_STATUS, ROLES } from '../constants';
import { Activity } from '../models/activity.model';
import { CalendarEvent } from '../models/calendarEvent.model';
import { TimelineEvent } from '../models/timelineEvent.model';
import { User } from '../models/user.model';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { getSocketServer } from '../utils/socketServer';

/**
 * Get Profile Details with Activity Metrics & Partner Information
 */
export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id || req.user!._id;

  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new AppError('User profile not found.', HTTP_STATUS.NOT_FOUND);
  }

  // Find partner user (if current user is SUPER_OWNER, partner is CO_OWNER; if CO_OWNER, partner is SUPER_OWNER)
  const partnerRole = user.role === ROLES.SUPER_OWNER ? ROLES.CO_OWNER : ROLES.SUPER_OWNER;
  const partner = await User.findOne({ role: partnerRole }).select('name email role avatar bio birthday');

  // Calculate stats (Social Posts created by this user, memories count, events count)
  const postsCount = await Activity.countDocuments({
    userId: user._id,
    imageUrl: { $exists: true, $ne: '' },
    type: { $ne: 'STORY_CREATED' },
  });
  const memoriesCount = await TimelineEvent.countDocuments({ owner: user._id, isDeleted: false });
  const eventsCount = await CalendarEvent.countDocuments({ owner: user._id, isDeleted: false });

  const profileData = {
    ...user.toObject(),
    partner: partner ? partner.toObject() : null,
    stats: {
      postsCount,
      memoriesCount,
      eventsCount,
      followersCount: partner ? 1 : 0,
      followingCount: partner ? 1 : 0,
    },
    followers: partner ? [{ _id: partner._id, name: partner.name, email: partner.email, avatar: partner.avatar, role: partner.role }] : [],
    following: partner ? [{ _id: partner._id, name: partner.name, email: partner.email, avatar: partner.avatar, role: partner.role }] : [],
    relationshipStartDate: '2026-03-26T00:00:00.000Z',
  };

  return ApiResponse.success(res, 'Profile details fetched successfully', profileData);
});

/**
 * Get Super Owner (CO) Profile Details
 */
export const getSuperOwnerProfile = catchAsync(async (req: Request, res: Response) => {
  const superOwner = await User.findOne({ role: ROLES.SUPER_OWNER }).select('-password');
  if (!superOwner) {
    throw new AppError('Super Owner profile not found.', HTTP_STATUS.NOT_FOUND);
  }

  const partner = await User.findOne({ role: ROLES.CO_OWNER }).select('name email role avatar bio birthday');

  const postsCount = await Activity.countDocuments({
    userId: superOwner._id,
    type: { $ne: 'STORY_CREATED' },
  });
  const memoriesCount = await TimelineEvent.countDocuments({ owner: superOwner._id, isDeleted: false });
  const eventsCount = await CalendarEvent.countDocuments({ owner: superOwner._id, isDeleted: false });

  const profileData = {
    ...superOwner.toObject(),
    partner: partner ? partner.toObject() : null,
    stats: {
      postsCount,
      memoriesCount,
      eventsCount,
      followersCount: partner ? 1 : 0,
      followingCount: partner ? 1 : 0,
    },
    followers: partner ? [{ _id: partner._id, name: partner.name, email: partner.email, avatar: partner.avatar, role: partner.role }] : [],
    following: partner ? [{ _id: partner._id, name: partner.name, email: partner.email, avatar: partner.avatar, role: partner.role }] : [],
  };

  return ApiResponse.success(res, 'Super Owner profile details fetched successfully', profileData);
});

/**
 * Update User Profile & Broadcast Real-Time Update Event
 */
export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { name, avatar, bio, location, birthday } = req.body;

  if (name !== undefined) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;
  if (bio !== undefined) user.bio = bio;
  if (birthday !== undefined) (user as any).birthday = birthday ? new Date(birthday) : null;

  await user.save();

  // Broadcast real-time profile_updated event to all connected sockets
  const io = getSocketServer();
  if (io) {
    io.emit('profile_updated', {
      userId: user._id.toString(),
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      birthday: (user as any).birthday,
    });
  }

  return ApiResponse.success(res, 'Profile updated successfully', user);
});
