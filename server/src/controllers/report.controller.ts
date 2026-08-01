import { Request, Response } from 'express';
import { HTTP_STATUS, PLATFORM_CONSTANTS, ROLES } from '../constants';
import { Report } from '../models/report.model';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

/**
 * Submit a report
 */
export const createReport = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { targetType, targetId, reason, description } = req.body;

  const existing = await Report.findOne({ reportedBy: user._id, targetId, targetType, status: 'OPEN' });
  if (existing) {
    return ApiResponse.success(res, 'You already have an open report for this content.', existing);
  }

  const report = await Report.create({
    reportedBy: user._id,
    targetType,
    targetId,
    reason,
    description,
  });

  return ApiResponse.created(res, 'Report submitted. Admins will review it shortly.', report);
});

/**
 * Get all reports — admin only
 */
export const getReports = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  if (user.role !== ROLES.SUPER_OWNER && user.role !== ROLES.CO_OWNER) {
    throw new AppError('Admin access required.', HTTP_STATUS.FORBIDDEN);
  }

  const page = parseInt(req.query.page as string, 10) || PLATFORM_CONSTANTS.DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string, 10) || PLATFORM_CONSTANTS.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.query.status) filter.status = req.query.status;

  const total = await Report.countDocuments(filter);
  const reports = await Report.find(filter)
    .populate('reportedBy', 'name email avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return ApiResponse.success(res, 'Reports retrieved.', reports, HTTP_STATUS.OK, {
    page, limit, total, totalPages: Math.ceil(total / limit),
  });
});

/**
 * Resolve a report — admin only
 */
export const resolveReport = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  if (user.role !== ROLES.SUPER_OWNER && user.role !== ROLES.CO_OWNER) {
    throw new AppError('Admin access required.', HTTP_STATUS.FORBIDDEN);
  }

  const report = await Report.findById(req.params.id);
  if (!report) throw new AppError('Report not found.', HTTP_STATUS.NOT_FOUND);

  report.status = req.body.status || 'RESOLVED';
  report.resolvedBy = user._id;
  report.resolvedAt = new Date();
  await report.save();

  return ApiResponse.success(res, 'Report resolved.', report);
});
