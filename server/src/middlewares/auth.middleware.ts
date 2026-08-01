import { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS, MESSAGES, USER_STATUS, UserRole } from '../constants';
import { IUser, User } from '../models/user.model';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { verifyAccessToken } from '../utils/token.util';

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      tokenPayload?: {
        userId: string;
        email: string;
        role: UserRole;
        sessionId?: string;
      };
    }
  }
}

export const authenticate = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return next(new AppError(MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED));
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', HTTP_STATUS.UNAUTHORIZED));
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      return next(
        new AppError('Your account has been suspended. Please contact the Super Owner.', HTTP_STATUS.FORBIDDEN)
      );
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error: any) {
    return next(new AppError('Invalid or expired token. Please log in again.', HTTP_STATUS.UNAUTHORIZED));
  }
});

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Permission denied. Role '${req.user.role}' is not authorized to perform this action.`,
          HTTP_STATUS.FORBIDDEN
        )
      );
    }

    next();
  };
};
