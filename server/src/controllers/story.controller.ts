import { Request, Response } from 'express';
import { HTTP_STATUS, PLATFORM_CONSTANTS, ROLES } from '../constants';
import { Activity } from '../models/activity.model';
import { Notification } from '../models/notification.model';
import { Story } from '../models/story.model';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { getSocketServer } from '../utils/socketServer';

/**
 * Create a new Story (references existing Media._id from the vault)
 */
export const createStory = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { mediaId, caption, visibility } = req.body;

  if (!mediaId) throw new AppError('mediaId is required to create a story.', HTTP_STATUS.BAD_REQUEST);

  const story = await Story.create({
    userId: user._id,
    mediaId,
    caption,
    visibility: visibility || 'PARTNER',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  // Log activity
  await Activity.create({
    userId: user._id,
    type: 'STORY_CREATED',
    referenceId: story._id,
    refModel: 'Story',
    title: `${user.name} shared a story`,
    description: caption,
  });

  const populated = await story.populate([
    { path: 'userId', select: 'name email avatar' },
    { path: 'mediaId', select: 'secureUrl thumbnailUrl optimizedUrl width height mimeType' },
  ]);

  return ApiResponse.created(res, 'Story created successfully.', populated);
});

/**
 * Get all active (non-expired, non-deleted) stories
 */
export const getActiveStories = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || PLATFORM_CONSTANTS.DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string, 10) || 50;
  const skip = (page - 1) * limit;

  const now = new Date();

  const stories = await Story.find({
    isDeleted: false,
    expiresAt: { $gt: now },
  })
    .populate('userId', 'name email avatar')
    .populate('mediaId', 'secureUrl thumbnailUrl optimizedUrl width height mimeType duration')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return ApiResponse.success(res, 'Active stories retrieved.', stories);
});

/**
 * Get a single story by ID
 */
export const getStoryById = catchAsync(async (req: Request, res: Response) => {
  const story = await Story.findById(req.params.id)
    .populate('userId', 'name email avatar')
    .populate('mediaId', 'secureUrl thumbnailUrl optimizedUrl width height mimeType duration')
    .populate('reactions.userId', 'name avatar');

  if (!story || story.isDeleted) throw new AppError('Story not found.', HTTP_STATUS.NOT_FOUND);

  return ApiResponse.success(res, 'Story retrieved.', story);
});

/**
 * Mark story as viewed + notify owner
 */
export const viewStory = catchAsync(async (req: Request, res: Response) => {
  const viewer = req.user!;
  const story = await Story.findById(req.params.id);

  if (!story || story.isDeleted) throw new AppError('Story not found.', HTTP_STATUS.NOT_FOUND);

  // Add viewer if not already present
  if (!story.viewedBy.some((id) => id.toString() === viewer._id.toString())) {
    story.viewedBy.push(viewer._id);
    await story.save();

    // Notify story owner (not for self-views)
    if (story.userId.toString() !== viewer._id.toString()) {
      const notif = await Notification.create({
        recipientId: story.userId,
        senderId: viewer._id,
        type: 'STORY_VIEW',
        message: `${viewer.name} viewed your story.`,
        referenceId: story._id,
        refModel: 'Story',
      });

      const io = getSocketServer();
      if (io) io.to(`user:${story.userId}`).emit('notification_created', notif);
    }
  }

  return ApiResponse.success(res, 'Story viewed.', { viewCount: story.viewedBy.length });
});

/**
 * React to a story (emoji reaction)
 */
export const reactToStory = catchAsync(async (req: Request, res: Response) => {
  const reactor = req.user!;
  const { emoji } = req.body;

  const story = await Story.findById(req.params.id);
  if (!story || story.isDeleted) throw new AppError('Story not found.', HTTP_STATUS.NOT_FOUND);

  // Remove existing reaction from same user, then add new one
  story.reactions = story.reactions.filter((r) => r.userId.toString() !== reactor._id.toString());
  if (emoji) {
    story.reactions.push({ userId: reactor._id, emoji, reactedAt: new Date() });
  }
  await story.save();

  // Notify owner
  if (emoji && story.userId.toString() !== reactor._id.toString()) {
    const notif = await Notification.create({
      recipientId: story.userId,
      senderId: reactor._id,
      type: 'STORY_REACTION',
      message: `${reactor.name} reacted ${emoji} to your story.`,
      referenceId: story._id,
      refModel: 'Story',
    });
    const io = getSocketServer();
    if (io) io.to(`user:${story.userId}`).emit('notification_created', notif);
  }

  return ApiResponse.success(res, emoji ? 'Reacted to story.' : 'Reaction removed.', story.reactions);
});

/**
 * Delete a story (soft delete)
 */
export const deleteStory = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const story = await Story.findById(req.params.id);

  if (!story || story.isDeleted) throw new AppError('Story not found.', HTTP_STATUS.NOT_FOUND);

  const isAuthor = story.userId.toString() === user._id.toString();
  const isOwner = user.role === ROLES.SUPER_OWNER || user.role === ROLES.CO_OWNER;

  if (!isAuthor && !isOwner) {
    throw new AppError('Permission denied to delete this story.', HTTP_STATUS.FORBIDDEN);
  }

  story.isDeleted = true;
  await story.save();

  // Also remove associated Activity entry if present
  try {
    await Activity.deleteOne({ referenceId: story._id, refModel: 'Story' });
  } catch (_e) {}

  return ApiResponse.success(res, 'Story deleted successfully.');
});
