import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Reaction } from '../models/reaction.model';
import { User } from '../models/user.model';
import { notificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';

/**
 * Helper to build queries matching both ObjectId and String formats, including optional reference IDs
 */
const buildIdQuery = (id: any, refId?: any) => {
  const ids: string[] = [];
  if (id) ids.push(String(id));
  if (refId) ids.push(String(refId));

  const queryValues = ids.flatMap((idStr) => {
    if (mongoose.Types.ObjectId.isValid(idStr)) {
      return [new mongoose.Types.ObjectId(idStr), idStr];
    }
    return [idStr];
  });

  return { $in: queryValues };
};

/**
 * Helper to match equivalent social target types
 */
const buildTypeQuery = (type: string) => {
  const upper = (type || '').toUpperCase();
  if (upper === 'ACTIVITY' || upper === 'MEMORY') {
    return { $in: ['ACTIVITY', 'MEMORY'] };
  }
  return upper;
};

/**
 * Toggle reaction — adds if not present or changes emoji; removes if same emoji sent
 */
export const toggleReaction = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { targetType, targetId } = req.params;
  const { emoji = '❤️', authorId, referenceId } = req.body;

  const targetIdMatch = buildIdQuery(targetId, referenceId);
  const userIdMatch = buildIdQuery(user._id);
  const targetTypeMatch = buildTypeQuery(targetType);

  const existing = await Reaction.findOne({
    userId: userIdMatch,
    targetType: targetTypeMatch,
    targetId: targetIdMatch,
  });

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
    const targetIdObj = mongoose.Types.ObjectId.isValid(targetId) ? new mongoose.Types.ObjectId(targetId) : targetId;
    const userIdObj = mongoose.Types.ObjectId.isValid(user._id) ? new mongoose.Types.ObjectId(user._id) : user._id;
    result = await Reaction.create({ userId: userIdObj, targetId: targetIdObj, targetType: targetType.toUpperCase(), emoji });
    message = 'Reaction added.';

    // Notify content author via Notification Engine Service
    if (authorId && authorId.toString() !== user._id.toString()) {
      const notifType = targetType.toUpperCase() === 'STORY' ? 'STORY_REACTION' : 'REACTION';
      await notificationService.publish({
        recipientId: authorId,
        senderId: user._id,
        type: notifType,
        message: `${user.name} reacted ${emoji} to your ${targetType.toLowerCase()}.`,
        targetType: targetType.toUpperCase(),
        targetId,
        referenceId: targetId,
        refModel: targetType,
      });
    }
  }

  // Get updated reaction summary
  const summary = await Reaction.aggregate([
    { $match: { targetType: targetTypeMatch, targetId: targetIdMatch } },
    { $group: { _id: '$emoji', count: { $sum: 1 } } },
  ]);

  return ApiResponse.success(res, message, { reaction: result, summary });
});

/**
 * Get all reactions for a target
 */
export const getReactions = catchAsync(async (req: Request, res: Response) => {
  const { targetType, targetId } = req.params;
  const { referenceId } = req.query;

  const targetIdMatch = buildIdQuery(targetId, referenceId);
  const targetTypeMatch = buildTypeQuery(targetType);

  const rawReactions = await Reaction.find({
    targetType: targetTypeMatch,
    targetId: targetIdMatch,
  })
    .populate('userId', 'name avatar role')
    .sort({ createdAt: -1 });

  // Collect any unpopulated user IDs (if stored as String in DB)
  const unpopulatedUserIds: string[] = [];
  rawReactions.forEach((r: any) => {
    if (!r.userId || typeof r.userId === 'string' || r.userId instanceof mongoose.Types.ObjectId || !r.userId.name) {
      const idStr = String(r.userId?._id || r.userId || '');
      if (idStr && mongoose.Types.ObjectId.isValid(idStr)) {
        unpopulatedUserIds.push(idStr);
      }
    }
  });

  let userMap = new Map<string, any>();
  if (unpopulatedUserIds.length > 0) {
    const userObjs = await User.find({ _id: { $in: unpopulatedUserIds } }).select('name avatar role');
    userObjs.forEach((u: any) => {
      userMap.set(u._id.toString(), u);
    });
  }

  const reactions = rawReactions.map((r: any) => {
    const rObj = typeof r.toObject === 'function' ? r.toObject() : { ...r };
    if (!rObj.userId || typeof rObj.userId === 'string' || rObj.userId instanceof mongoose.Types.ObjectId || !rObj.userId.name) {
      const uIdStr = String(rObj.userId?._id || rObj.userId || '');
      const foundUser = userMap.get(uIdStr);
      if (foundUser) {
        rObj.userId = {
          _id: foundUser._id,
          name: foundUser.name,
          avatar: foundUser.avatar,
          role: foundUser.role,
        };
      }
    }
    return rObj;
  });

  const summary = reactions.reduce((acc: Record<string, number>, r: any) => {
    if (r.emoji) {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    }
    return acc;
  }, {});

  return ApiResponse.success(res, 'Reactions retrieved.', { reactions, summary, total: reactions.length });
});

/**
 * Get current user's reaction for a target
 */
export const getMyReaction = catchAsync(async (req: Request, res: Response) => {
  const { targetType, targetId } = req.params;
  const { referenceId } = req.query;
  const user = req.user!;

  const targetIdMatch = buildIdQuery(targetId, referenceId);
  const userIdMatch = buildIdQuery(user._id);
  const targetTypeMatch = buildTypeQuery(targetType);

  const reaction = await Reaction.findOne({
    userId: userIdMatch,
    targetType: targetTypeMatch,
    targetId: targetIdMatch,
  });

  return ApiResponse.success(res, 'My reaction retrieved.', reaction);
});
