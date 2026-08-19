import { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS } from '../constants';
import { AppError } from '../utils/AppError';

export const requireOnboardingCompleted = (req: Request, _res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    throw new AppError('Authentication required.', HTTP_STATUS.UNAUTHORIZED);
  }

  // SUPER_OWNER, CO_OWNER, and ADMIN always bypass onboarding check
  if (['SUPER_OWNER', 'CO_OWNER', 'ADMIN'].includes(user.role)) {
    return next();
  }

  if (user.onboardingCompleted === false) {
    throw new AppError(
      'Profile onboarding is incomplete. Please complete onboarding at /onboarding before proceeding.',
      HTTP_STATUS.FORBIDDEN
    );
  }

  next();
};
