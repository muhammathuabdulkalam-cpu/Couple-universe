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

const getDefaultAvatar = (name?: string, _role?: string) => {
  if (name && name.trim()) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=6366f1&color=fff`;
  }
  return 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff';
};

/**
 * Helper to resolve the parent owner user for an invited user
 */
export async function getParentOwnerForUser(userId: mongoose.Types.ObjectId | string): Promise<any> {
  const userDoc = await User.findById(userId).select('email relationshipId invitedByRole role');
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

  // 4. Check if invitedByRole is CO_OWNER
  if ((userDoc as any).invitedByRole === ROLES.CO_OWNER) {
    const coOwner = await User.findOne({ role: ROLES.CO_OWNER, isDeleted: { $ne: true } }).select('-password');
    if (coOwner) return coOwner;
  }

  // 5. Default Fallback: Super Owner is the default parent owner
  const defaultSuperOwner = await User.findOne({ role: ROLES.SUPER_OWNER, isDeleted: { $ne: true } }).select('-password');
  return defaultSuperOwner;
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
 * Helper to fetch all registered sub-users invited by a specific owner (Super Owner or Co-Owner)
 */
export async function getSubUsersForOwner(ownerId: mongoose.Types.ObjectId | string): Promise<any[]> {
  try {
    if (!ownerId) return [];

    const { InvitedUser } = await import('../models/invitedUser.model');
    const { Invite } = await import('../models/invite.model');

    const ownerIdStr = String(ownerId);
    const ownerIdObj = mongoose.Types.ObjectId.isValid(ownerIdStr) ? new mongoose.Types.ObjectId(ownerIdStr) : ownerIdStr;
    const ownerIdMatch = { $in: [ownerIdObj, ownerIdStr] };

    // 1. From InvitedUser model
    const invitedRecords = await InvitedUser.find({ ownerUserId: ownerIdMatch, isDeleted: false }).select('email registeredUserId');
    const invitedEmails = invitedRecords.map((r) => (r.email || '').toLowerCase()).filter(Boolean);
    const registeredUserIds = invitedRecords.map((r: any) => r.registeredUserId).filter(Boolean);

    // 2. From Invite model
    const inviteRecords = await Invite.find({ createdBy: ownerIdMatch }).select('usedBy email');
    const inviteUsedByIds = inviteRecords.map((r) => r.usedBy).filter(Boolean);
    const inviteEmails = inviteRecords.map((r) => (r.email || '').toLowerCase()).filter(Boolean);

    const allSubEmails = Array.from(new Set([...invitedEmails, ...inviteEmails]));
    const allUserIds = Array.from(new Set([...registeredUserIds.map((id) => String(id)), ...inviteUsedByIds.map((id) => String(id))]))
      .map((idStr) => (mongoose.Types.ObjectId.isValid(idStr) ? new mongoose.Types.ObjectId(idStr) : idStr));

    const queryConditions: any[] = [];
    if (allUserIds.length > 0) {
      queryConditions.push({ _id: { $in: allUserIds } });
    }
    if (allSubEmails.length > 0) {
      queryConditions.push({ email: { $in: allSubEmails } });
    }
    queryConditions.push({ invitedBy: ownerIdMatch });
    queryConditions.push({ createdBy: ownerIdMatch });

    const subUsers = await User.find({
      role: ROLES.INVITED_USER,
      isDeleted: { $ne: true },
      $or: queryConditions,
    }).select('-password');

    return subUsers;
  } catch (err: any) {
    logger.warn(`⚠️ getSubUsersForOwner error: ${err.message}`);
    return [];
  }
}

/**
 * Helper to fetch exact Followers list for any user profile (Super Owner, Co-Owner, or Invited User)
 */
export async function getProfileFollowersList(targetUser: any): Promise<any[]> {
  const followers: any[] = [];

  if (targetUser.role === ROLES.SUPER_OWNER || targetUser.role === ROLES.CO_OWNER) {
    // 1. Partner Owner
    const partnerRole = targetUser.role === ROLES.SUPER_OWNER ? ROLES.CO_OWNER : ROLES.SUPER_OWNER;
    const partner = await User.findOne({ role: partnerRole, isDeleted: { $ne: true } }).select('_id name email avatar role bio');
    if (partner) {
      followers.push({
        _id: partner._id,
        id: partner._id,
        name: partner.name,
        email: partner.email,
        avatar: partner.avatar || getDefaultAvatar(partner.name, partner.role),
        role: partner.role,
        bio: partner.bio || '',
      });
    }

    // 2. Sub-invited users invited by THIS specific owner user only (via getSubUsersForOwner)
    const subUsers = await getSubUsersForOwner(targetUser._id);
    subUsers.forEach((su) => {
      if (!followers.some((f) => f._id.toString() === su._id.toString())) {
        followers.push({
          _id: su._id,
          id: su._id,
          name: su.name,
          email: su.email,
          avatar: su.avatar || getDefaultAvatar(su.name, su.role),
          role: su.role,
          bio: su.bio || '',
        });
      }
    });
  } else {
    // Invited User: follower is their Parent Owner
    const parentOwner = await getParentOwnerForUser(targetUser._id);
    if (parentOwner) {
      followers.push({
        _id: parentOwner._id,
        id: parentOwner._id,
        name: parentOwner.name,
        email: parentOwner.email,
        avatar: parentOwner.avatar || getDefaultAvatar(parentOwner.name, parentOwner.role),
        role: parentOwner.role,
        bio: parentOwner.bio || '',
      });
    }
  }

  return followers;
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

  // Profile Privacy & Access Control Rules:
  // 1. All authenticated platform members can view user profiles.
  // 2. Explicitly PRIVATE profiles (isPrivate === true and visibility === 'PRIVATE') are accessible to self, owners, parent owners, and relationship members.
  const isProfileExplicitlyPrivate = user.isPrivate === true && user.visibility === 'PRIVATE';

  if (!isViewingSelf && isProfileExplicitlyPrivate) {
    let hasAccess = isRequestingUserOwner;

    if (!hasAccess) {
      const parentOwner = await getParentOwnerForUser(requestingUser._id);
      const isParentOwner = parentOwner && (
        parentOwner._id.toString() === user._id.toString() ||
        parentOwner.role === user.role
      );
      if (isParentOwner) {
        hasAccess = true;
      }
    }

    if (!hasAccess && requestingUser.relationshipId && user.relationshipId) {
      if (requestingUser.relationshipId.toString() === user.relationshipId.toString()) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      throw new AppError('This account is set to private by the user.', HTTP_STATUS.FORBIDDEN);
    }
  }

  // 1. Partner Resolution:
  let partner: any = null;
  if (user.role === ROLES.SUPER_OWNER) {
    partner = await User.findOne({ role: ROLES.CO_OWNER, isDeleted: { $ne: true } }).select('name email role avatar bio birthday');
  } else if (user.role === ROLES.CO_OWNER) {
    partner = await User.findOne({ role: ROLES.SUPER_OWNER, isDeleted: { $ne: true } }).select('name email role avatar bio birthday');
  }

  // Fast avatar fallback (avoid slow regex DB queries)
  if (!user.avatar || user.avatar.trim() === '' || user.avatar.includes('unsplash')) {
    user.avatar = getDefaultAvatar(user.name, user.role);
  }

  if (partner && (!partner.avatar || partner.avatar.trim() === '' || partner.avatar.includes('unsplash'))) {
    partner.avatar = getDefaultAvatar(partner.name, partner.role);
  }

  // Calculate stats & followers in parallel for maximum speed (~50ms)
  const [postsCount, memoriesCount, eventsCount, followersList] = await Promise.all([
    Activity.countDocuments({
      userId: user._id,
      type: { $ne: 'STORY_CREATED' },
    }),
    TimelineEvent.countDocuments({ owner: user._id, isDeleted: false }),
    CalendarEvent.countDocuments({ owner: user._id, isDeleted: false }),
    getProfileFollowersList(user),
  ]);

  const followingList = followersList;

  const userObj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  if (user.role === 'INVITED_USER' && requestingUser._id.toString() !== user._id.toString()) {
    delete userObj.birthday;
  }

  const partnerObj = partner ? (typeof partner.toObject === 'function' ? partner.toObject() : { ...partner }) : null;
  if (partnerObj && partner.role === 'INVITED_USER' && requestingUser._id.toString() !== (partner._id || partner.id)?.toString()) {
    delete partnerObj.birthday;
  }

  const profileData = {
    ...userObj,
    isPrivate: user.isPrivate ?? false,
    visibility: user.visibility || (user.isPrivate ? 'PRIVATE' : 'PUBLIC'),
    avatar: user.avatar || getDefaultAvatar(user.name, user.role),
    partner: partnerObj ? {
      ...partnerObj,
      avatar: partner.avatar || getDefaultAvatar(partner.name, partner.role),
    } : null,
    stats: {
      postsCount,
      memoriesCount,
      eventsCount,
      followersCount: followersList.length,
      followingCount: followingList.length,
    },
    followers: followersList,
    following: followingList,
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

  const followersList = await getProfileFollowersList(superOwner);

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
      followersCount: followersList.length,
      followingCount: followersList.length,
    },
    followers: followersList,
    following: followersList,
  };

  return ApiResponse.success(res, 'Super Owner profile details fetched successfully', profileData);
});

/**
 * Update User Profile & Broadcast Real-Time Update Event
 */
export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { name, avatar, bio, location, birthday, isPrivate, visibility } = req.body;

  if (name !== undefined) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;
  if (bio !== undefined) user.bio = bio;
  if (birthday !== undefined) (user as any).birthday = birthday ? new Date(birthday) : null;
  if (isPrivate !== undefined) (user as any).isPrivate = Boolean(isPrivate);
  if (visibility !== undefined) (user as any).visibility = visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE';

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
      isPrivate: (user as any).isPrivate,
      visibility: (user as any).visibility,
    });
  }

  return ApiResponse.success(res, 'Profile updated successfully', user);
});
