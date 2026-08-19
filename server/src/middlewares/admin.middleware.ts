import { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS, ROLES } from '../constants';
import { AppError } from '../utils/AppError';

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication required to access Admin API.', HTTP_STATUS.UNAUTHORIZED));
  }

  if (![ROLES.ADMIN, ROLES.SUPER_OWNER, ROLES.CO_OWNER].includes(req.user.role as any)) {
    return next(
      new AppError(
        'Access denied. Enterprise Admin Console is restricted strictly to Admins and Owners.',
        HTTP_STATUS.FORBIDDEN
      )
    );
  }

  next();
};
