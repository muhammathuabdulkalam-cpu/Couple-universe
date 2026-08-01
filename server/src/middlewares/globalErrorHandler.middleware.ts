import { ErrorRequestHandler } from 'express';
import { env } from '../config/env.config';
import { logger } from '../config/logger.config';
import { HTTP_STATUS } from '../constants';
import { ApiResponse } from '../utils/ApiResponse';

export const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let statusCode: number = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message: string = err.message || 'Internal server error occurred';
  let errors: any = err.errors || null;

  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = `Invalid value for field: ${err.path}`;
  }

  if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists.`;
  }

  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    message = 'Validation failed for one or more fields.';
    errors = Object.values(err.errors || {}).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
  }

  if (err.name === 'ZodError') {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    message = 'Request validation failed.';
    errors = err.errors;
  }

  if (statusCode >= 500) {
    logger.error(`💥 Unhandled Application Error [${statusCode}]: ${err.stack || message}`);
  } else {
    logger.warn(`⚠️ Operational Error [${statusCode}]: ${message}`);
  }

  return ApiResponse.error(
    res,
    message,
    statusCode,
    env.NODE_ENV === 'development' ? { details: errors, stack: err.stack } : errors
  );
};
