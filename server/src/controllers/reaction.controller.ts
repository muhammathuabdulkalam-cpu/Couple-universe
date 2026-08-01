import { Request, Response } from 'express';
import { HTTP_STATUS } from '../constants';
import { Notification } from '../models/notification.model';
import { Reaction } from '../models/reaction.model';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';
import { getSocketServer } from '../utils/socketServer';

/**
 * Toggle reaction — adds if not present or changes emoji; removes if same emoji sent
 */
export const toggleReaction = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { targetType, targetId } = req.params;
  const { emoji = '❤️', authorId } = req.body;

  const existing = await Reaction.findOne({ userId: user._id, targetId, targetType });

  let result: any;
  let message: string;

  if (existing && existing.emoji === emoji) {
    // Same emoji → remove (toggle off)
    await existing.deleteOne();
    result = null;
    message = 'Reaction removed.';
  } else if (existing) {
    // Different emoji → update
    existing.emoji = emoji;
    await existing.save();
    result = existing;
    message = 'Reaction updated.';
  } else {
    // New reaction
    result = await Reaction.create({ userId: user._id, targetId, targetType, emoji });
    message = 'Reaction added.';

    // Notify content author (if provided and not self)
    if (authorId && authorId !== user._id.toString()) {
      const notif = await Notification.create({
        recipientId: authorId,
        senderId: user._id,
        type: 'REACTION',
        message: `${user.name} reacted ${emoji} to your ${targetType.toLowerCase()}.`,
        referenceId: targetId,
        refModel: targetType,
      });
      const io = getSocketServer();
      if (io) io.to(`user:${authorId}`).emit('notification_created', notif);
    }
  }

  // Get updated reaction summary
  const summary = await Reaction.aggregate([
    { $match: { targetId: result?.targetId || existing?.targetId || { $oid: targetId }, targetType } },
    { $group: { _id: '$emoji', count: { $sum: 1 } } },
  ]);

  return ApiResponse.success(res, message, { reaction: result, summary });
});

/**
 * Get all reactions for a target
 */
export const getReactions = catchAsync(async (req: Request, res: Response) => {
  const { targetType, targetId } = req.params;

  const reactions = await Reaction.find({ targetId, targetType })
    .populate('userId', 'name avatar')
    .sort({ createdAt: -1 });

  const summary = reactions.reduce((acc: Record<string, number>, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  return ApiResponse.success(res, 'Reactions retrieved.', { reactions, summary, total: reactions.length });
});

/**
 * Get current user's reaction for a target
 */
export const getMyReaction = catchAsync(async (req: Request, res: Response) => {
  const { targetType, targetId } = req.params;
  const user = req.user!;

  const reaction = await Reaction.findOne({ userId: user._id, targetId, targetType });

  return ApiResponse.success(res, 'My reaction retrieved.', reaction);
});
