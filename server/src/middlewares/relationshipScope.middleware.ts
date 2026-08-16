import { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS } from '../constants';
import { AppError } from '../utils/AppError';

export const enforceRelationshipScope = (req: Request, _res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    throw new AppError('Authentication required.', HTTP_STATUS.UNAUTHORIZED);
  }

  // Attach relationshipId to request for route scopes
  (req as any).relationshipId = user.relationshipId ? user.relationshipId.toString() : undefined;
  next();
};
