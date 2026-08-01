import { Request, Response } from 'express';
import { HTTP_STATUS } from '../constants';
import { DiaryEntry } from '../models/diary.model';
import {
  BucketItem,
  Countdown,
  Goal,
  MemoryCapsule,
  MoodEntry,
  Note,
  WishlistItem,
} from '../models/lifeExperience.model';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

// ----------------------------------------------------
// 1. Shared Diary Controllers
// ----------------------------------------------------
export const createDiaryEntry = catchAsync(async (req: Request, res: Response) => {
  const { title, content, mediaIds, mood, date, visibility } = req.body;
  const user = req.user!;

  const entry = await DiaryEntry.create({
    createdBy: user._id,
    title,
    content,
    mediaIds: mediaIds || [],
    mood: mood || 'ROMANTIC',
    date: date ? new Date(date) : new Date(),
    visibility: visibility || 'COUPLE',
  });

  const populated = await DiaryEntry.findById(entry._id)
    .populate('createdBy', 'name email avatar')
    .populate('mediaIds', 'secureUrl thumbnailUrl optimizedUrl');

  return ApiResponse.created(res, 'Diary entry created successfully', populated);
});

export const getDiaryEntries = catchAsync(async (_req: Request, res: Response) => {
  const entries = await DiaryEntry.find({ isDeleted: false })
    .populate('createdBy', 'name email avatar')
    .populate('mediaIds', 'secureUrl thumbnailUrl optimizedUrl')
    .sort({ date: -1 });

  return ApiResponse.success(res, 'Diary entries fetched', entries);
});

export const deleteDiaryEntry = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await DiaryEntry.findByIdAndUpdate(id, { isDeleted: true });
  return ApiResponse.success(res, 'Diary entry deleted');
});

// ----------------------------------------------------
// 2. Bucket List Controllers
// ----------------------------------------------------
export const createBucketItem = catchAsync(async (req: Request, res: Response) => {
  const { title, description, category, priority, status, mediaId } = req.body;
  const user = req.user!;

  const item = await BucketItem.create({
    createdBy: user._id,
    title,
    description,
    category: category || 'TRAVEL',
    priority: priority || 'MEDIUM',
    status: status || 'PLANNED',
    mediaId: mediaId || undefined,
  });

  return ApiResponse.created(res, 'Bucket list item created', item);
});

export const getBucketItems = catchAsync(async (_req: Request, res: Response) => {
  const items = await BucketItem.find({ isDeleted: false })
    .populate('createdBy', 'name email avatar')
    .populate('mediaId', 'secureUrl thumbnailUrl')
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, 'Bucket list items fetched', items);
});

export const toggleBucketStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await BucketItem.findById(id);
  if (!item) throw new AppError('Item not found', HTTP_STATUS.NOT_FOUND);

  item.status = item.status === 'COMPLETED' ? 'PLANNED' : 'COMPLETED';
  if (item.status === 'COMPLETED') item.completedDate = new Date();
  await item.save();

  return ApiResponse.success(res, 'Bucket item status updated', item);
});

// ----------------------------------------------------
// 3. Wishlist Controllers
// ----------------------------------------------------
export const createWishlistItem = catchAsync(async (req: Request, res: Response) => {
  const { name, description, imageMediaId, price, priority, status } = req.body;
  const user = req.user!;

  const wish = await WishlistItem.create({
    createdBy: user._id,
    name,
    description,
    imageMediaId: imageMediaId || undefined,
    price,
    priority: priority || 'MEDIUM',
    status: status || 'WISHED',
  });

  return ApiResponse.created(res, 'Wishlist item created', wish);
});

export const getWishlistItems = catchAsync(async (_req: Request, res: Response) => {
  const wishes = await WishlistItem.find({ isDeleted: false })
    .populate('createdBy', 'name email avatar')
    .populate('imageMediaId', 'secureUrl thumbnailUrl')
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, 'Wishlist items fetched', wishes);
});

// ----------------------------------------------------
// 4. Goals Controllers
// ----------------------------------------------------
export const createGoal = catchAsync(async (req: Request, res: Response) => {
  const { title, description, progress, targetDate, status } = req.body;
  const user = req.user!;

  const goal = await Goal.create({
    createdBy: user._id,
    title,
    description,
    progress: progress || 0,
    targetDate: targetDate ? new Date(targetDate) : undefined,
    status: status || 'ACTIVE',
  });

  return ApiResponse.created(res, 'Relationship goal created', goal);
});

export const getGoals = catchAsync(async (_req: Request, res: Response) => {
  const goals = await Goal.find({ isDeleted: false }).sort({ createdAt: -1 });
  return ApiResponse.success(res, 'Goals fetched', goals);
});

export const updateGoalProgress = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { progress } = req.body;

  const goal = await Goal.findById(id);
  if (!goal) throw new AppError('Goal not found', HTTP_STATUS.NOT_FOUND);

  goal.progress = progress;
  if (progress >= 100) goal.status = 'ACHIEVED';
  await goal.save();

  return ApiResponse.success(res, 'Goal progress updated', goal);
});

// ----------------------------------------------------
// 5. Daily Mood Tracker Controllers
// ----------------------------------------------------
export const logMood = catchAsync(async (req: Request, res: Response) => {
  const { mood, note } = req.body;
  const user = req.user!;

  const moodEntry = await MoodEntry.create({
    userId: user._id,
    mood,
    note,
    date: new Date(),
  });

  return ApiResponse.created(res, 'Daily mood logged', moodEntry);
});

export const getMoodEntries = catchAsync(async (_req: Request, res: Response) => {
  const moods = await MoodEntry.find()
    .populate('userId', 'name email avatar')
    .sort({ date: -1 })
    .limit(30);

  return ApiResponse.success(res, 'Mood history fetched', moods);
});

// ----------------------------------------------------
// 6. Shared Notes Controllers
// ----------------------------------------------------
export const createNote = catchAsync(async (req: Request, res: Response) => {
  const { title, content, isPinned } = req.body;
  const user = req.user!;

  const note = await Note.create({
    createdBy: user._id,
    title,
    content,
    isPinned: isPinned || false,
  });

  return ApiResponse.created(res, 'Shared note created', note);
});

export const getNotes = catchAsync(async (_req: Request, res: Response) => {
  const notes = await Note.find({ isDeleted: false })
    .populate('createdBy', 'name email avatar')
    .sort({ isPinned: -1, updatedAt: -1 });

  return ApiResponse.success(res, 'Notes fetched', notes);
});

// ----------------------------------------------------
// 7. Memory Capsule Controllers
// ----------------------------------------------------
export const createMemoryCapsule = catchAsync(async (req: Request, res: Response) => {
  const { title, unlockDate, mediaIds, message } = req.body;
  const user = req.user!;

  const capsule = await MemoryCapsule.create({
    createdBy: user._id,
    title,
    unlockDate: new Date(unlockDate),
    mediaIds: mediaIds || [],
    message,
    status: 'LOCKED',
  });

  return ApiResponse.created(res, 'Memory capsule created and locked', capsule);
});

export const getMemoryCapsules = catchAsync(async (_req: Request, res: Response) => {
  const capsules = await MemoryCapsule.find({ isDeleted: false })
    .populate('createdBy', 'name email avatar')
    .populate('mediaIds', 'secureUrl thumbnailUrl')
    .sort({ unlockDate: 1 });

  // Update status dynamically if unlockDate passed
  const now = new Date();
  const processed = capsules.map((c) => {
    const obj = c.toObject();
    if (new Date(c.unlockDate) <= now) {
      obj.status = 'UNLOCKED';
    }
    return obj;
  });

  return ApiResponse.success(res, 'Memory capsules fetched', processed);
});

// ----------------------------------------------------
// 8. Countdowns Controllers
// ----------------------------------------------------
export const createCountdown = catchAsync(async (req: Request, res: Response) => {
  const { title, targetDate, type } = req.body;
  const user = req.user!;

  const countdown = await Countdown.create({
    createdBy: user._id,
    title,
    targetDate: new Date(targetDate),
    type: type || 'CUSTOM',
  });

  return ApiResponse.created(res, 'Countdown scheduled', countdown);
});

export const getCountdowns = catchAsync(async (_req: Request, res: Response) => {
  const countdowns = await Countdown.find({ isDeleted: false }).sort({ targetDate: 1 });
  return ApiResponse.success(res, 'Countdowns fetched', countdowns);
});
