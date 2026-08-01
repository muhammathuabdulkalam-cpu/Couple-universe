import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { HTTP_STATUS, PLATFORM_CONSTANTS, ROLES } from '../constants';
import { Activity } from '../models/activity.model';
import { Media } from '../models/media.model';
import { CloudinaryService } from '../services/cloudinary.service';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

/**
 * Get activity feed (paginated, newest first)
 * Aggregates posts, memories, calendar events, profile updates
 * Excludes STORY_CREATED entries so stories remain strictly in top story rings
 */
export const getFeed = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || PLATFORM_CONSTANTS.DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string, 10) || PLATFORM_CONSTANTS.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  // Exclude STORY_CREATED activities from feed (allow isPublic: true or undefined)
  const filter: any = { type: { $ne: 'STORY_CREATED' } };
  if (req.query.type) filter.type = req.query.type;
  
  // Filter by User ID for Profile Posts Grid with robust ObjectId casting
  const targetUserId = req.query.userId || req.query.user;
  if (targetUserId && targetUserId !== 'undefined' && targetUserId !== 'null') {
    try {
      filter.userId = new mongoose.Types.ObjectId(targetUserId as string);
    } catch {
      filter.userId = targetUserId;
    }
  }

  // Filter posts with images/videos only if explicitly requested
  if (req.query.hasMedia === 'true') {
    filter.$or = [
      { imageUrl: { $exists: true, $ne: '' } },
      { referenceId: { $exists: true, $ne: null } },
    ];
  }

  const total = await Activity.countDocuments(filter);
  const activities = await Activity.find(filter)
    .populate('userId', 'name email avatar role')
    .populate('referenceId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return ApiResponse.success(res, 'Activity feed retrieved.', activities, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

/**
 * Create a Social Post Activity Entry (HTTP Controller)
 */
export const createActivityHandler = catchAsync(async (req: Request, res: Response) => {
  const { type, referenceId, refModel, title, description, imageUrl } = req.body;
  const user = req.user!;

  const activity = await Activity.create({
    userId: user._id,
    type: type || 'MEMORY_CREATED',
    referenceId: referenceId || undefined,
    refModel: refModel || 'Media',
    title: title || 'New Post',
    description,
    imageUrl,
    isPublic: true,
  });

  const populated = await activity.populate('userId', 'name email avatar role');

  return ApiResponse.created(res, 'Social post created successfully', populated);
});

/**
 * Delete a Social Post Activity Entry
 */
export const deleteActivity = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  const activity = await Activity.findById(id);
  if (!activity) {
    throw new AppError('Post activity not found.', HTTP_STATUS.NOT_FOUND);
  }

  const isAuthor = activity.userId.toString() === user._id.toString();
  const isOwner = user.role === ROLES.SUPER_OWNER || user.role === ROLES.CO_OWNER;

  if (!isAuthor && !isOwner) {
    throw new AppError('Permission denied to delete this post.', HTTP_STATUS.FORBIDDEN);
  }

  // If activity references a Media asset, clean up media asset as well
  if (activity.referenceId && activity.refModel === 'Media') {
    try {
      const mediaAsset = await Media.findById(activity.referenceId);
      if (mediaAsset) {
        if (mediaAsset.cloudinaryPublicId) {
          await CloudinaryService.deleteAsset(mediaAsset.cloudinaryPublicId);
        }
        await mediaAsset.deleteOne();
      }
    } catch (_err) {
      // Non-blocking cleanup
    }
  }

  await activity.deleteOne();

  return ApiResponse.success(res, 'Social post deleted successfully.');
});

/**
 * Create an activity entry — internal utility called by other controllers
 */
export const createActivity = async (
  userId: string,
  type: string,
  referenceId?: string,
  refModel?: string,
  title?: string,
  description?: string,
  imageUrl?: string
) => {
  try {
    await Activity.create({ userId, type, referenceId, refModel, title, description, imageUrl, isPublic: true });
  } catch (_err) {
    // Non-critical — activity logging should not break other flows
  }
};
