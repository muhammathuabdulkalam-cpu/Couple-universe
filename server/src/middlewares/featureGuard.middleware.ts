import { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS } from '../constants';
import { AppError } from '../utils/AppError';

export const requireFeature = (featureKey: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      throw new AppError('Authentication required to access feature.', HTTP_STATUS.UNAUTHORIZED);
    }

    // Bypass feature restrictions ONLY for SUPER_OWNER and CO_OWNER (NOT ADMIN)
    if (['SUPER_OWNER', 'CO_OWNER'].includes(user.role)) {
      return next();
    }

    // Single source of truth: user.enabledFeatures array stored in MongoDB
    const enabledFeatures = user.enabledFeatures || [];
    if (!enabledFeatures.includes(featureKey)) {
      throw new AppError(
        `Access denied. The '${featureKey}' feature is disabled for your account.`,
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  };
};
