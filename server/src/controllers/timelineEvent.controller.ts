import { Request, Response } from 'express';
import { HTTP_STATUS, PLATFORM_CONSTANTS, ROLES } from '../constants';
import { TimelineEvent } from '../models/timelineEvent.model';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

/**
 * Create Timeline Event
 */
export const createTimelineEvent = catchAsync(async (req: Request, res: Response) => {
  const {
    title,
    content,
    shortDescription,
    eventDate,
    eventType,
    chapter,
    coverMediaId,
    mediaIds,
    location,
    weather,
    mood,
    emoji,
    importance,
    status,
    tags,
    people,
    visibility,
  } = req.body;

  const user = req.user!;

  const timelineEvent = await TimelineEvent.create({
    owner: user._id,
    createdBy: user._id,
    updatedBy: user._id,
    title,
    content,
    shortDescription,
    eventDate: new Date(eventDate),
    eventType: eventType || 'CUSTOM',
    chapter: chapter || 'LOVE',
    coverMediaId: coverMediaId || undefined,
    mediaIds: mediaIds || [],
    location,
    weather,
    mood: mood || 'ROMANTIC',
    emoji: emoji || '❤️',
    importance: importance || 'NORMAL',
    status: status || 'PUBLISHED',
    tags: tags || [],
    people: people || [],
    visibility: visibility || 'COUPLE',
  });

  return ApiResponse.created(res, 'Timeline memory event created successfully', timelineEvent);
});

/**
 * Get Relationship Timeline Events (Paginated, Grouped, Filtered)
 */
export const getTimelineEvents = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || PLATFORM_CONSTANTS.DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string, 10) || PLATFORM_CONSTANTS.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const user = req.user!;
  const {
    eventType,
    chapter,
    mood,
    weather,
    importance,
    search,
    tag,
    people,
    isFavorite,
    isArchived,
    year,
    month,
  } = req.query;

  const filter: any = { isDeleted: false };

  if (isArchived === 'true') {
    filter.status = 'ARCHIVED';
  } else {
    filter.status = { $ne: 'ARCHIVED' };
  }

  if (isFavorite === 'true') filter.isFavorite = true;
  if (eventType) filter.eventType = eventType;
  if (chapter) filter.chapter = chapter;
  if (mood) filter.mood = mood;
  if (weather) filter.weather = weather;
  if (importance) filter.importance = importance;
  if (tag) filter.tags = tag;
  if (people) filter.people = people;

  // Year and Month Date Filters
  if (year || month) {
    const yearNum = year ? parseInt(year as string, 10) : undefined;
    const monthNum = month ? parseInt(month as string, 10) : undefined; // 1-indexed (1 to 12)

    if (yearNum && monthNum) {
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
      filter.eventDate = { $gte: startDate, $lte: endDate };
    } else if (yearNum) {
      const startDate = new Date(yearNum, 0, 1);
      const endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);
      filter.eventDate = { $gte: startDate, $lte: endDate };
    }
  }

  // Enhanced Search Query across Title, Short Description, Content, Location Name, Tags, People
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { shortDescription: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { 'location.name': { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
      { people: { $regex: search, $options: 'i' } },
    ];
  }

  // Role permissions
  if (user.role === ROLES.INVITED_USER) {
    filter.visibility = { $in: ['COUPLE', 'FAMILY', 'FRIENDS', 'PUBLIC'] };
  }

  const total = await TimelineEvent.countDocuments(filter);
  const events = await TimelineEvent.find(filter)
    .populate('createdBy', 'name email avatar')
    .populate('coverMediaId', 'secureUrl thumbnailUrl optimizedUrl width height aspectRatio mimeType')
    .populate('mediaIds', 'secureUrl thumbnailUrl optimizedUrl width height aspectRatio mimeType')
    .sort({ eventDate: -1 })
    .skip(skip)
    .limit(limit);

  return ApiResponse.success(res, 'Timeline events retrieved', events, HTTP_STATUS.OK, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

/**
 * Get Today In History Memories
 */
export const getTodayInHistory = catchAsync(async (_req: Request, res: Response) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-indexed (1 to 12)
  const currentDay = now.getDate();

  // Mongo aggregation matching month and day of eventDate
  const todayMemories = await TimelineEvent.aggregate([
    {
      $match: {
        isDeleted: false,
        status: 'PUBLISHED',
      },
    },
    {
      $addFields: {
        eventMonth: { $month: '$eventDate' },
        eventDay: { $dayOfMonth: '$eventDate' },
      },
    },
    {
      $match: {
        eventMonth: currentMonth,
        eventDay: currentDay,
      },
    },
    {
      $sort: { eventDate: -1 },
    },
  ]);

  // Populate references
  const populatedMemories = await TimelineEvent.populate(todayMemories, [
    { path: 'coverMediaId', select: 'secureUrl thumbnailUrl optimizedUrl width height' },
    { path: 'mediaIds', select: 'secureUrl thumbnailUrl optimizedUrl width height mimeType' },
  ]);

  return ApiResponse.success(res, 'Today In History memories fetched', populatedMemories);
});

/**
 * Get Timeline Event by ID
 */
export const getTimelineEventById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const event = await TimelineEvent.findById(id)
    .populate('createdBy', 'name email avatar')
    .populate('coverMediaId')
    .populate('mediaIds');

  if (!event || event.isDeleted) {
    throw new AppError('Timeline event not found.', HTTP_STATUS.NOT_FOUND);
  }

  return ApiResponse.success(res, 'Timeline event details retrieved', event);
});

/**
 * Update Timeline Event
 */
export const updateTimelineEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const event = await TimelineEvent.findById(id);
  if (!event || event.isDeleted) {
    throw new AppError('Timeline event not found.', HTTP_STATUS.NOT_FOUND);
  }

  const fields = [
    'title',
    'content',
    'shortDescription',
    'eventType',
    'chapter',
    'coverMediaId',
    'mediaIds',
    'location',
    'weather',
    'mood',
    'emoji',
    'importance',
    'status',
    'tags',
    'people',
    'visibility',
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      (event as any)[field] = req.body[field];
    }
  });

  if (req.body.eventDate) {
    event.eventDate = new Date(req.body.eventDate);
  }

  event.updatedBy = req.user!._id;
  await event.save();

  return ApiResponse.success(res, 'Timeline event updated successfully', event);
});

/**
 * Toggle Favorite Status
 */
export const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const event = await TimelineEvent.findById(id);
  if (!event || event.isDeleted) {
    throw new AppError('Timeline event not found.', HTTP_STATUS.NOT_FOUND);
  }

  event.isFavorite = !event.isFavorite;
  event.updatedBy = req.user!._id;
  await event.save();

  return ApiResponse.success(res, `Event favorite set to ${event.isFavorite}`, event);
});

/**
 * Toggle Archive Status
 */
export const archiveTimelineEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const event = await TimelineEvent.findById(id);
  if (!event || event.isDeleted) {
    throw new AppError('Timeline event not found.', HTTP_STATUS.NOT_FOUND);
  }

  event.status = event.status === 'ARCHIVED' ? 'PUBLISHED' : 'ARCHIVED';
  event.updatedBy = req.user!._id;
  await event.save();

  return ApiResponse.success(res, `Event status set to ${event.status}`, event);
});

/**
 * Soft Delete Timeline Event
 */
export const softDeleteTimelineEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const event = await TimelineEvent.findById(id);
  if (!event || event.isDeleted) {
    throw new AppError('Timeline event not found.', HTTP_STATUS.NOT_FOUND);
  }

  event.isDeleted = true;
  event.deletedAt = new Date();
  event.deletedBy = req.user!._id;
  await event.save();

  return ApiResponse.success(res, 'Timeline event moved to Trash (Soft Deleted).');
});

/**
 * Restore Soft-Deleted Timeline Event
 */
export const restoreTimelineEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const event = await TimelineEvent.findById(id);
  if (!event) {
    throw new AppError('Timeline event not found.', HTTP_STATUS.NOT_FOUND);
  }

  event.isDeleted = false;
  event.deletedAt = undefined;
  event.deletedBy = undefined;
  event.updatedBy = req.user!._id;
  await event.save();

  return ApiResponse.success(res, 'Timeline event restored successfully.');
});

/**
 * Permanent Delete Timeline Event
 */
export const permanentDeleteTimelineEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const event = await TimelineEvent.findById(id);
  if (!event) {
    throw new AppError('Timeline event not found.', HTTP_STATUS.NOT_FOUND);
  }

  await TimelineEvent.findByIdAndDelete(id);

  return ApiResponse.success(res, 'Timeline event permanently deleted.');
});
