import { Request, Response } from 'express';
import { HTTP_STATUS, PLATFORM_CONSTANTS, ROLES } from '../constants';
import { CalendarEvent } from '../models/calendarEvent.model';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

/**
 * Create Calendar Event
 */
export const createCalendarEvent = catchAsync(async (req: Request, res: Response) => {
  const {
    title,
    description,
    eventType,
    startDate,
    endDate,
    allDay,
    timezone,
    location,
    visibility,
    priority,
    status,
    color,
    icon,
    coverMediaId,
    timelineEventId,
    participants,
    notifications,
    repeatRule,
    isCompleted,
  } = req.body;

  const user = req.user!;

  const calendarEvent = await CalendarEvent.create({
    owner: user._id,
    createdBy: user._id,
    updatedBy: user._id,
    title,
    description,
    eventType: eventType || 'DATE',
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    allDay: allDay || false,
    timezone: timezone || 'UTC',
    location,
    visibility: visibility || 'COUPLE',
    priority: priority || 'MEDIUM',
    status: status || 'SCHEDULED',
    color: color || '#06B6D4',
    icon: icon || '📅',
    coverMediaId: coverMediaId || undefined,
    timelineEventId: timelineEventId || undefined,
    participants: participants || [user._id],
    notifications: notifications || [],
    repeatRule: repeatRule || 'NONE',
    isCompleted: isCompleted || false,
  });

  return ApiResponse.created(res, 'Calendar event scheduled successfully', calendarEvent);
});

/**
 * Get Calendar Events (Range, Filters & Search)
 */
export const getCalendarEvents = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const {
    startDate,
    endDate,
    eventType,
    priority,
    status,
    isCompleted,
    repeatRule,
    search,
  } = req.query;

  const filter: any = { isDeleted: false };

  // Date Range Filter
  if (startDate && endDate) {
    filter.startDate = {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string),
    };
  }

  if (eventType) filter.eventType = eventType;
  if (priority) filter.priority = priority;
  if (status) filter.status = status;
  if (repeatRule) filter.repeatRule = repeatRule;
  if (isCompleted !== undefined) filter.isCompleted = isCompleted === 'true';

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'location.name': { $regex: search, $options: 'i' } },
    ];
  }

  // Role permissions
  if (user.role === ROLES.INVITED_USER) {
    filter.visibility = { $in: ['COUPLE', 'FAMILY', 'FRIENDS', 'PUBLIC'] };
  }

  const events = await CalendarEvent.find(filter)
    .populate('createdBy', 'name email avatar')
    .populate('coverMediaId', 'secureUrl thumbnailUrl optimizedUrl width height')
    .populate('timelineEventId', 'title eventDate chapter emoji')
    .populate('participants', 'name email avatar')
    .sort({ startDate: 1 });

  return ApiResponse.success(res, 'Calendar events retrieved', events);
});

/**
 * Get Today's Scheduled Events & Reminders
 */
export const getTodaySchedule = catchAsync(async (_req: Request, res: Response) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const events = await CalendarEvent.find({
    isDeleted: false,
    startDate: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate('coverMediaId', 'secureUrl thumbnailUrl optimizedUrl')
    .populate('timelineEventId', 'title chapter emoji')
    .sort({ startDate: 1 });

  return ApiResponse.success(res, "Today's schedule retrieved", events);
});

/**
 * Get Calendar Event by ID
 */
export const getCalendarEventById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const event = await CalendarEvent.findById(id)
    .populate('createdBy', 'name email avatar')
    .populate('coverMediaId')
    .populate('timelineEventId')
    .populate('participants', 'name email avatar');

  if (!event || event.isDeleted) {
    throw new AppError('Calendar event not found.', HTTP_STATUS.NOT_FOUND);
  }

  return ApiResponse.success(res, 'Calendar event retrieved', event);
});

/**
 * Update Calendar Event
 */
export const updateCalendarEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const event = await CalendarEvent.findById(id);
  if (!event || event.isDeleted) {
    throw new AppError('Calendar event not found.', HTTP_STATUS.NOT_FOUND);
  }

  const fields = [
    'title',
    'description',
    'eventType',
    'allDay',
    'timezone',
    'location',
    'visibility',
    'priority',
    'status',
    'color',
    'icon',
    'coverMediaId',
    'timelineEventId',
    'participants',
    'notifications',
    'repeatRule',
    'isCompleted',
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      (event as any)[field] = req.body[field];
    }
  });

  if (req.body.startDate) event.startDate = new Date(req.body.startDate);
  if (req.body.endDate) event.endDate = new Date(req.body.endDate);

  event.updatedBy = req.user!._id;
  await event.save();

  return ApiResponse.success(res, 'Calendar event updated successfully', event);
});

/**
 * Toggle Event Completion Status
 */
export const toggleComplete = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const event = await CalendarEvent.findById(id);
  if (!event || event.isDeleted) {
    throw new AppError('Calendar event not found.', HTTP_STATUS.NOT_FOUND);
  }

  event.isCompleted = !event.isCompleted;
  event.status = event.isCompleted ? 'COMPLETED' : 'SCHEDULED';
  event.updatedBy = req.user!._id;
  await event.save();

  return ApiResponse.success(res, `Event completion set to ${event.isCompleted}`, event);
});

/**
 * Soft Delete Calendar Event
 */
export const softDeleteCalendarEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const event = await CalendarEvent.findById(id);
  if (!event || event.isDeleted) {
    throw new AppError('Calendar event not found.', HTTP_STATUS.NOT_FOUND);
  }

  event.isDeleted = true;
  event.deletedAt = new Date();
  event.deletedBy = req.user!._id;
  await event.save();

  return ApiResponse.success(res, 'Calendar event moved to Trash (Soft Deleted).');
});

/**
 * Restore Soft-Deleted Calendar Event
 */
export const restoreCalendarEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const event = await CalendarEvent.findById(id);
  if (!event) {
    throw new AppError('Calendar event not found.', HTTP_STATUS.NOT_FOUND);
  }

  event.isDeleted = false;
  event.deletedAt = undefined;
  event.deletedBy = undefined;
  event.updatedBy = req.user!._id;
  await event.save();

  return ApiResponse.success(res, 'Calendar event restored successfully.');
});

/**
 * Permanent Delete Calendar Event
 */
export const permanentDeleteCalendarEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const event = await CalendarEvent.findById(id);
  if (!event) {
    throw new AppError('Calendar event not found.', HTTP_STATUS.NOT_FOUND);
  }

  await CalendarEvent.findByIdAndDelete(id);

  return ApiResponse.success(res, 'Calendar event permanently deleted.');
});
