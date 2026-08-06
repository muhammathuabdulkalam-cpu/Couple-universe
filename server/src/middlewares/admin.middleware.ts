import { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS, ROLES } from '../constants';
import { AppError } from '../utils/AppError';

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication required to access Admin API.', HTTP_STATUS.UNAUTHORIZED));
  }

  if (req.user.role !== ROLES.ADMIN) {
    return next(
      new AppError(
        'Access denied. Enterprise Admin Console is restricted strictly to ADMIN accounts.',
        HTTP_STATUS.FORBIDDEN
      )
    );
  }

  next();
};
