import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { HTTP_STATUS, ROLES, UserRole } from '../constants';
import { Activity } from '../models/activity.model';
import { CalendarEvent } from '../models/calendarEvent.model';
import { Media } from '../models/media.model';
import { Relationship } from '../models/relationship.model';
import { TimelineEvent } from '../models/timelineEvent.model';
import { User } from '../models/user.model';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { getSocketServer } from '../utils/socketServer';

import { CloudinaryService } from '../services/cloudinary.service';
import { logger } from '../config/logger.config';

const getDefaultAvatar = (_name?: string, _role?: string) => {
  return '';
};

/**
 * Helper to resolve the parent owner user for an invited user
 */
export async function getParentOwnerForUser(userId: mongoose.Types.ObjectId | string): Promise<any> {
  const userDoc = await User.findById(userId).select('email relationshipId');
  if (!userDoc) return null;

  // 1. Check InvitedUser model (stores ownerUserId when invite is created by SUPER_OWNER or CO_OWNER)
  const { InvitedUser } = await import('../models/invitedUser.model');
  const invitedDoc = await InvitedUser.findOne({
    $or: [
      { registeredUserId: userId },
      { email: (userDoc.email || '').toLowerCase() },
    ],
  }).select('ownerUserId');

  if (invitedDoc && invitedDoc.ownerUserId) {
    const parent = await User.findById(invitedDoc.ownerUserId).select('-password');
    if (parent) return parent;
  }

  // 2. Check Invite model (createdBy field)
  const { Invite } = await import('../models/invite.model');
  const invite = await Invite.findOne({
    $or: [
      { usedBy: userId },
      { email: (userDoc.email || '').toLowerCase() },
    ],
  }).select('createdBy');

  if (invite && invite.createdBy) {
    const parent = await User.findById(invite.createdBy).select('-password');
    if (parent) return parent;
  }

  // 3. Fallback to relationship createdBy
  if (userDoc.relationshipId) {
    const rel = await Relationship.findById(userDoc.relationshipId);
    if (rel && rel.createdBy) {
      const parent = await User.findById(rel.createdBy).select('-password');
      if (parent) return parent;
    }
  }

  // Default fallback: SUPER_OWNER
  const superOwner = await User.findOne({ role: ROLES.SUPER_OWNER }).select('-password');
  return superOwner;
}

/**
 * Sync Cloudinary Profile Upload Assets into MongoDB User & Media documents
 */
export async function syncCloudinaryProfilesToDb(): Promise<void> {
  try {
    const profileAssets = await CloudinaryService.listGalleryAssets('afrin-universe/profiles');
    if (!profileAssets || profileAssets.length === 0) return;

    const superOwner = await User.findOne({ role: ROLES.SUPER_OWNER, isDeleted: false });
    const coOwner = await User.findOne({ role: ROLES.CO_OWNER, isDeleted: false });

    // Sort assets by creation date ascending so latest asset applies last
    const sortedAssets = [...profileAssets].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

    for (const asset of sortedAssets) {
      if (!asset.secure_url) continue;

      const filename = asset.public_id.toLowerCase();
      const isCoOwnerAsset = filename.includes('amrin') || filename.includes('co');
      const ownerId = isCoOwnerAsset ? coOwner?._id : superOwner?._id;

      if (ownerId) {
        await Media.updateOne(
          { cloudinaryPublicId: asset.public_id },
          {
            $setOnInsert: {
              owner: ownerId,
              createdBy: ownerId,
              updatedBy: ownerId,
              title: 'Profile Picture',
              tags: ['profile'],
              visibility: 'PUBLIC',
              memoryDate: new Date(asset.created_at || Date.now()),
              cloudinaryPublicId: asset.public_id,
              cloudinaryFolder: asset.folder || 'afrin-universe/profiles',
              url: asset.secure_url,
              secureUrl: asset.secure_url,
              optimizedUrl: asset.secure_url,
              thumbnailUrl: asset.secure_url,
              width: asset.width || 400,
              height: asset.height || 400,
              aspectRatio: 1,
              orientation: 'SQUARE',
              mimeType: `image/${asset.format || 'png'}`,
              fileSize: asset.bytes || 50000,
            },
          },
          { upsert: true }
        );
      }

      if (isCoOwnerAsset && coOwner) {
        if (!coOwner.avatar || coOwner.avatar.trim() === '' || coOwner.avatar.includes('unsplash')) {
          coOwner.avatar = asset.secure_url;
          await coOwner.save();
        }
      } else if (!isCoOwnerAsset && superOwner) {
        if (!superOwner.avatar || superOwner.avatar.trim() === '' || superOwner.avatar.includes('unsplash')) {
          superOwner.avatar = asset.secure_url;
          await superOwner.save();
        }
      }
    }
  } catch (err: any) {
    logger.warn(`⚠️ Cloudinary profile sync warning: ${err.message}`);
  }
}

/**
 * Get Profile Details with Activity Metrics & Partner Information
 */
export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const paramId = req.params.id;
  let user: any = null;

  if (paramId) {
    if (mongoose.Types.ObjectId.isValid(paramId)) {
      user = await User.findById(paramId).select('-password');
    }

    if (!user) {
      const lower = String(paramId).toLowerCase();
      if (lower.includes('co') || lower.includes('amrin')) {
        user = await User.findOne({ role: ROLES.CO_OWNER }).select('-password');
      } else if (lower.includes('super') || lower.includes('afzal')) {
        user = await User.findOne({ role: ROLES.SUPER_OWNER }).select('-password');
      } else {
        user = await User.findOne({
          $or: [{ email: lower }, { name: new RegExp(lower, 'i') }],
        }).select('-password');
      }
    }
  }

  if (!user) {
    user = await User.findById(req.user!._id).select('-password');
  }

  if (!user) {
    throw new AppError('User profile not found.', HTTP_STATUS.NOT_FOUND);
  }

  const requestingUser = req.user!;
  const isViewingSelf = requestingUser._id.toString() === user._id.toString();
  const isRequestingUserOwner = requestingUser.role === ROLES.SUPER_OWNER || requestingUser.role === ROLES.CO_OWNER;

  // Profile Access Control Rules:
  // - SUPER_OWNER & CO_OWNER: Can view all user profiles.
  // - INVITED_USER: Can view their OWN profile and THEIR SPECIFIC parent owner profile ONLY.
  // - INVITED_USER: Cannot view other owner profiles or another INVITED_USER's profile.
  if (!isRequestingUserOwner && !isViewingSelf) {
    const parentOwner = await getParentOwnerForUser(requestingUser._id);
    const isTargetUserTheirParentOwner = parentOwner && parentOwner._id.toString() === user._id.toString();

    if (!isTargetUserTheirParentOwner) {
      throw new AppError('Permission denied. Invited users can only view their own profile or their parent owner profile.', HTTP_STATUS.FORBIDDEN);
    }
  }

  // 1. Partner Resolution:
  let partner: any = null;
  if (user.role === ROLES.SUPER_OWNER) {
    partner = await User.findOne({ role: ROLES.CO_OWNER, isDeleted: { $ne: true } }).select('name email role avatar bio birthday');
  } else if (user.role === ROLES.CO_OWNER) {
    partner = await User.findOne({ role: ROLES.SUPER_OWNER, isDeleted: { $ne: true } }).select('name email role avatar bio birthday');
  } else {
    // For Invited Users, their partner card ALWAYS resolves to their exact parent owner!
    const parentOwner = await getParentOwnerForUser(user._id);
    if (parentOwner && parentOwner._id.toString() !== user._id.toString()) {
      partner = {
        _id: parentOwner._id,
        id: parentOwner._id,
        name: parentOwner.name,
        email: parentOwner.email,
        role: parentOwner.role,
        avatar: parentOwner.avatar,
        bio: parentOwner.bio,
        birthday: parentOwner.birthday,
      };
    }
  }

  // Resolve original profile avatar from user's uploaded Media or Activity posts
  const isUserAvatarNeedsResolution =
    !user.avatar ||
    user.avatar.trim() === '' ||
    user.avatar.includes('unsplash') ||
    user.avatar.includes('profile_avatar_e77eul');

  if (isUserAvatarNeedsResolution) {
    let realAvatarUrl = '';

    // 1. Try explicit profile media
    const userProfileMedia = await Media.findOne({
      owner: user._id,
      $or: [{ tags: 'profile' }, { title: 'Profile Picture' }],
      secureUrl: { $not: { $regex: 'profile_avatar_e77eul', $options: 'i' } },
    }).sort({ createdAt: -1 });

    if (userProfileMedia && userProfileMedia.secureUrl) {
      realAvatarUrl = userProfileMedia.secureUrl;
    }

    // 2. Try latest uploaded image media
    if (!realAvatarUrl) {
      const latestMedia = await Media.findOne({
        owner: user._id,
        mimeType: /^image\//,
      }).sort({ createdAt: -1 });
      if (latestMedia && latestMedia.secureUrl) {
        realAvatarUrl = latestMedia.secureUrl;
      }
    }

    // 3. Try latest activity post image
    if (!realAvatarUrl) {
      const latestActivity = await Activity.findOne({
        userId: user._id,
        imageUrl: { $exists: true, $ne: null },
      }).sort({ createdAt: -1 });
      if (latestActivity && latestActivity.imageUrl && typeof latestActivity.imageUrl === 'string') {
        realAvatarUrl = latestActivity.imageUrl;
      }
    }

    if (realAvatarUrl) {
      user.avatar = realAvatarUrl;
      await User.findByIdAndUpdate(user._id, { avatar: realAvatarUrl });
    } else {
      user.avatar = getDefaultAvatar(user.name, user.role);
    }
  }

  if (partner) {
    const isPartnerAvatarNeedsResolution =
      !partner.avatar ||
      partner.avatar.trim() === '' ||
      partner.avatar.includes('unsplash') ||
      partner.avatar.includes('profile_avatar_e77eul');

    if (isPartnerAvatarNeedsResolution) {
      let realPartnerAvatarUrl = '';

      const partnerProfileMedia = await Media.findOne({
        owner: partner._id,
        $or: [{ tags: 'profile' }, { title: 'Profile Picture' }],
        secureUrl: { $not: { $regex: 'profile_avatar_e77eul', $options: 'i' } },
      }).sort({ createdAt: -1 });

      if (partnerProfileMedia && partnerProfileMedia.secureUrl) {
        realPartnerAvatarUrl = partnerProfileMedia.secureUrl;
      }

      if (!realPartnerAvatarUrl) {
        const latestPartnerMedia = await Media.findOne({
          owner: partner._id,
          mimeType: /^image\//,
        }).sort({ createdAt: -1 });
        if (latestPartnerMedia && latestPartnerMedia.secureUrl) {
          realPartnerAvatarUrl = latestPartnerMedia.secureUrl;
        }
      }

      if (!realPartnerAvatarUrl) {
        const latestPartnerActivity = await Activity.findOne({
          userId: partner._id,
          imageUrl: { $exists: true, $ne: null },
        }).sort({ createdAt: -1 });
        if (latestPartnerActivity && latestPartnerActivity.imageUrl && typeof latestPartnerActivity.imageUrl === 'string') {
          realPartnerAvatarUrl = latestPartnerActivity.imageUrl;
        }
      }

      if (realPartnerAvatarUrl) {
        partner.avatar = realPartnerAvatarUrl;
        await User.findByIdAndUpdate(partner._id, { avatar: realPartnerAvatarUrl });
      } else {
        partner.avatar = getDefaultAvatar(partner.name, partner.role);
      }
    }
  }

  // Calculate stats (Social Posts created by this user, memories count, events count)
  const postsCount = await Activity.countDocuments({
    userId: user._id,
    type: { $ne: 'STORY_CREATED' },
  });
  const memoriesCount = await TimelineEvent.countDocuments({ owner: user._id, isDeleted: false });
  const eventsCount = await CalendarEvent.countDocuments({ owner: user._id, isDeleted: false });

  const userObj = user.toObject();
  if (user.role === 'INVITED_USER' && requestingUser._id.toString() !== user._id.toString()) {
    delete userObj.birthday;
  }

  const partnerObj = partner ? partner.toObject() : null;
  if (partner && partner.role === 'INVITED_USER' && requestingUser._id.toString() !== partner._id.toString()) {
    delete partnerObj.birthday;
  }

  const profileData = {
    ...userObj,
    avatar: user.avatar || getDefaultAvatar(user.name, user.role),
    partner: partnerObj ? {
      ...partnerObj,
      avatar: partner.avatar || getDefaultAvatar(partner.name, partner.role),
    } : null,
    stats: {
      postsCount,
      memoriesCount,
      eventsCount,
      followersCount: partner ? 1 : 0,
      followingCount: partner ? 1 : 0,
    },
    followers: partner ? [{ _id: partner._id, name: partner.name, email: partner.email, avatar: partner.avatar || getDefaultAvatar(partner.name, partner.role), role: partner.role }] : [],
    following: partner ? [{ _id: partner._id, name: partner.name, email: partner.email, avatar: partner.avatar || getDefaultAvatar(partner.name, partner.role), role: partner.role }] : [],
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

  let partner: any = await User.findOne({ role: ROLES.CO_OWNER }).select('name email role avatar bio birthday');
  if (!partner) {
    partner = await User.findOne({ _id: { $ne: superOwner._id }, isDeleted: { $ne: true } }).select('name email role avatar bio birthday');
  }

  if (!superOwner.avatar) superOwner.avatar = getDefaultAvatar(superOwner.name, superOwner.role);
  if (partner && !partner.avatar) partner.avatar = getDefaultAvatar(partner.name, partner.role);

  const postsCount = await Activity.countDocuments({
    userId: superOwner._id,
    type: { $ne: 'STORY_CREATED' },
  });
  const memoriesCount = await TimelineEvent.countDocuments({ owner: superOwner._id, isDeleted: false });
  const eventsCount = await CalendarEvent.countDocuments({ owner: superOwner._id, isDeleted: false });

  const profileData = {
    ...superOwner.toObject(),
    avatar: superOwner.avatar,
    partner: partner ? {
      ...partner.toObject(),
      avatar: partner.avatar,
    } : null,
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
