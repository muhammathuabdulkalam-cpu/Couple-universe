import { RequestHandler } from 'express';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { AppError } from '../utils/AppError';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(`${MESSAGES.ROUTE_NOT_FOUND} Path: ${req.originalUrl}`, HTTP_STATUS.NOT_FOUND));
};
