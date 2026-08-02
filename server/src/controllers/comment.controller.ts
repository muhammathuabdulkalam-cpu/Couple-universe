import { Request, Response } from 'express';
import { HTTP_STATUS, PLATFORM_CONSTANTS } from '../constants';
import { Comment } from '../models/comment.model';
import { notificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

import { socketService } from '../services/socket.service';

/**
 * Create a comment or reply
 */
export const createComment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { targetType, targetId, content, parentCommentId, authorId } = req.body;

  const comment = await Comment.create({
    userId: user._id,
    targetType,
    targetId,
    content,
    parentCommentId: parentCommentId || null,
  });

  const populated = await comment.populate('userId', 'name email avatar');

  // Notify content author via Notification Engine Service
  if (authorId && authorId !== user._id.toString()) {
    const notifType = parentCommentId ? 'COMMENT_REPLY' : 'COMMENT';
    await notificationService.publish({
      recipientId: authorId,
      senderId: user._id,
      type: notifType,
      message: parentCommentId
        ? `${user.name} replied to your comment.`
        : `${user.name} commented on your ${targetType.toLowerCase()}.`,
      targetType: targetType.toUpperCase(),
      targetId,
      referenceId: targetId,
      refModel: targetType,
    });
  }

  // Emit real-time socket event for instant comment updates
  try {
    socketService.getIO().emit('comment_added', {
      targetType,
      targetId,
      comment: populated,
    });
  } catch (_err) {}

  return ApiResponse.created(res, 'Comment added.', populated);
});

/**
 * Get comments for a target (paginated, threaded)
 */
export const getComments = catchAsync(async (req: Request, res: Response) => {
  const { targetType, targetId } = req.params;
  const page = parseInt(req.query.page as string, 10) || PLATFORM_CONSTANTS.DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string, 10) || PLATFORM_CONSTANTS.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  // Get root comments
  const total = await Comment.countDocuments({ targetType, targetId, parentCommentId: null, isDeleted: false });
  const comments = await Comment.find({ targetType, targetId, parentCommentId: null, isDeleted: false })
    .populate('userId', 'name email avatar')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit);

  // Attach replies
  const commentsWithReplies = await Promise.all(
    comments.map(async (c) => {
      const replies = await Comment.find({ parentCommentId: c._id, isDeleted: false })
        .populate('userId', 'name email avatar')
        .sort({ createdAt: 1 });
      return { ...c.toJSON(), replies };
    })
  );

  return ApiResponse.success(res, 'Comments retrieved.', commentsWithReplies, HTTP_STATUS.OK, {
    page, limit, total, totalPages: Math.ceil(total / limit),
  });
});

/**
 * Update comment (owner only)
 */
export const updateComment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const comment = await Comment.findById(req.params.id);

  if (!comment || comment.isDeleted) throw new AppError('Comment not found.', HTTP_STATUS.NOT_FOUND);
  if (comment.userId.toString() !== user._id.toString()) {
    throw new AppError('You can only edit your own comments.', HTTP_STATUS.FORBIDDEN);
  }

  comment.content = req.body.content || comment.content;
  await comment.save();

  return ApiResponse.success(res, 'Comment updated.', comment);
});

/**
 * Delete comment (soft delete — owner or admin)
 */
export const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const comment = await Comment.findById(req.params.id);

  if (!comment || comment.isDeleted) throw new AppError('Comment not found.', HTTP_STATUS.NOT_FOUND);

  const isOwner = comment.userId.toString() === user._id.toString();
  const isAdmin = user.role === 'SUPER_OWNER' || user.role === 'CO_OWNER';
  if (!isOwner && !isAdmin) throw new AppError('Not authorized to delete this comment.', HTTP_STATUS.FORBIDDEN);

  comment.isDeleted = true;
  await comment.save();

  return ApiResponse.success(res, 'Comment deleted.');
});

/**
 * Like / unlike a comment
 */
export const likeComment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const comment = await Comment.findById(req.params.id);

  if (!comment || comment.isDeleted) throw new AppError('Comment not found.', HTTP_STATUS.NOT_FOUND);

  const alreadyLiked = comment.likedBy.some((id) => id.toString() === user._id.toString());
  if (alreadyLiked) {
    comment.likedBy = comment.likedBy.filter((id) => id.toString() !== user._id.toString());
  } else {
    comment.likedBy.push(user._id);
  }
  await comment.save();

  return ApiResponse.success(res, alreadyLiked ? 'Comment unliked.' : 'Comment liked.', {
    likeCount: comment.likedBy.length,
    isLiked: !alreadyLiked,
  });
});
