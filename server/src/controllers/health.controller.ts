import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.config';
import { MESSAGES, PLATFORM_CONSTANTS } from '../constants';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';

export const getHealthStatus = catchAsync(async (_req: Request, res: Response) => {
  const startDate = new Date(PLATFORM_CONSTANTS.RELATIONSHIP_START_DATE);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - startDate.getTime());
  
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const totalMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const healthData = {
    app: {
      name: PLATFORM_CONSTANTS.APP_NAME,
      version: '1.0.0',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    },
    database: {
      status: dbStatusMap[mongoose.connection.readyState] || 'unknown',
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A',
    },
    system: {
      memoryUsage: {
        rssMB: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        heapTotalMB: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)),
        heapUsedMB: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
      },
      nodeVersion: process.version,
    },
    relationshipTimeline: {
      couple: 'Afzal & Amrin ❤️',
      startDate: PLATFORM_CONSTANTS.RELATIONSHIP_START_DATE,
      togetherness: {
        days: totalDays,
        hours: totalHours,
        minutes: totalMinutes,
      },
    },
  };

  return ApiResponse.success(res, MESSAGES.SERVER_HEALTHY, healthData);
});
