import crypto from 'crypto';
import { Request, Response } from 'express';
import { HTTP_STATUS, ROLES } from '../constants';
import { StealthConfig } from '../models/stealthConfig.model';
import { Session } from '../models/session.model';
import { User } from '../models/user.model';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setRefreshTokenCookie,
} from '../utils/token.util';

const hashValue = (value: string): string => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

// Default secret expression hash (SHA-256 of "9894+9248+09")
const DEFAULT_SECRET_HASH = hashValue('9894+9248+09');

/**
 * Get Stealth Configuration (SUPER_OWNER)
 */
export const getStealthConfig = catchAsync(async (req: Request, res: Response) => {
  const config = await StealthConfig.findOne();

  if (!config) {
    return ApiResponse.success(res, 'Stealth configuration retrieved', {
      enabled: false,
      hasToken: false,
      isRevoked: true,
      lastUsed: null,
    });
  }

  return ApiResponse.success(res, 'Stealth configuration retrieved', {
    enabled: config.enabled,
    hasToken: !!config.hashedToken && config.hashedToken.length > 0,
    isRevoked: config.isRevoked,
    lastUsed: config.lastUsed,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  });
});

/**
 * Enable Stealth Mode (SUPER_OWNER)
 */
export const enableStealth = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id;

  const config = await StealthConfig.findOneAndUpdate(
    {},
    { enabled: true, createdBy: userId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (!config.secretExpressionHash) {
    config.secretExpressionHash = DEFAULT_SECRET_HASH;
    await config.save();
  }

  return ApiResponse.success(res, 'Stealth mode enabled');
});

/**
 * Disable Stealth Mode (SUPER_OWNER)
 */
export const disableStealth = catchAsync(async (_req: Request, res: Response) => {
  await StealthConfig.findOneAndUpdate(
    {},
    { enabled: false },
    { upsert: false }
  );

  return ApiResponse.success(res, 'Stealth mode disabled');
});

/**
 * Generate Private Token (SUPER_OWNER)
 */
export const generateToken = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const rawToken = crypto.randomBytes(24).toString('base64url');
  const tokenHash = hashValue(rawToken);

  const config = await StealthConfig.findOneAndUpdate(
    {},
    {
      hashedToken: tokenHash,
      isRevoked: false,
      createdBy: userId,
      secretExpressionHash: DEFAULT_SECRET_HASH,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (!config.secretExpressionHash) {
    config.secretExpressionHash = DEFAULT_SECRET_HASH;
    await config.save();
  }

  return ApiResponse.success(res, 'Private token generated', {
    token: rawToken,
  });
});

/**
 * Regenerate Private Token (SUPER_OWNER) — revokes old, creates new
 */
export const regenerateToken = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const rawToken = crypto.randomBytes(24).toString('base64url');
  const tokenHash = hashValue(rawToken);

  await StealthConfig.findOneAndUpdate(
    {},
    {
      hashedToken: tokenHash,
      isRevoked: false,
      createdBy: userId,
    },
    { upsert: true, new: true }
  );

  return ApiResponse.success(res, 'Private token regenerated. Previous link is now invalid.', {
    token: rawToken,
  });
});

/**
 * Revoke Current Token (SUPER_OWNER)
 */
export const revokeToken = catchAsync(async (_req: Request, res: Response) => {
  const config = await StealthConfig.findOne();

  if (!config || !config.hashedToken) {
    throw new AppError('No active token to revoke.', HTTP_STATUS.BAD_REQUEST);
  }

  config.isRevoked = true;
  config.hashedToken = '';
  await config.save();

  return ApiResponse.success(res, 'Private token revoked successfully');
});

/**
 * Update Secret Expression (SUPER_OWNER)
 */
export const updateSecret = catchAsync(async (req: Request, res: Response) => {
  const { expression } = req.body;
  const cleanExpr = expression.replace(/\s/g, '').replace(/=$/, '');
  const expressionHash = hashValue(cleanExpr);

  const config = await StealthConfig.findOneAndUpdate(
    {},
    { secretExpressionHash: expressionHash },
    { upsert: true, new: true }
  );

  if (!config) {
    throw new AppError('Failed to update secret expression.', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return ApiResponse.success(res, 'Secret expression updated');
});

/**
 * Validate Token (PUBLIC) — checks if token is active
 */
export const validateToken = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token) {
    return ApiResponse.success(res, 'Token validation result', { valid: false, enabled: false });
  }

  const tokenHash = hashValue(token);
  const config = await StealthConfig.findOne();

  if (!config || config.isRevoked || config.hashedToken !== tokenHash) {
    return ApiResponse.success(res, 'Token validation result', { valid: false, enabled: false });
  }

  return ApiResponse.success(res, 'Token validation result', {
    valid: true,
    enabled: config.enabled,
  });
});

/**
 * Unlock via Secret Expression (PUBLIC, rate-limited)
 * On successful unlock, automatically authenticates as CO_OWNER (or SUPER_OWNER fallback)
 * so the user enters the application directly without typing login credentials.
 */
export const unlockStealth = catchAsync(async (req: Request, res: Response) => {
  const { token, expressionHash } = req.body;

  if (!token || !expressionHash) {
    return ApiResponse.success(res, 'Unlock result', { unlocked: false });
  }

  const tokenHash = hashValue(token);
  const config = await StealthConfig.findOne();

  if (!config || !config.enabled || config.isRevoked) {
    return ApiResponse.success(res, 'Unlock result', { unlocked: false });
  }

  if (config.hashedToken !== tokenHash) {
    return ApiResponse.success(res, 'Unlock result', { unlocked: false });
  }

  if (config.secretExpressionHash !== expressionHash) {
    return ApiResponse.success(res, 'Unlock result', { unlocked: false });
  }

  // Update last used timestamp
  config.lastUsed = new Date();
  await config.save();

  // Find Co-Owner user (or fallback to Super Owner if Co-Owner not yet registered)
  let targetUser = await User.findOne({ role: ROLES.CO_OWNER });
  if (!targetUser) {
    targetUser = await User.findOne({ role: ROLES.SUPER_OWNER });
  }

  if (!targetUser) {
    return ApiResponse.success(res, 'Unlock result', { unlocked: true });
  }

  // Create Session & Lifetime Tokens (100 Years) for seamless login
  const userAgent = req.headers['user-agent'] || 'Unknown Browser';
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '0.0.0.0';

  const refreshToken = generateRefreshToken({ userId: targetUser._id.toString(), email: targetUser.email, role: targetUser.role });
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);

  const session = await Session.create({
    user: targetUser._id,
    refreshTokenHash,
    userAgent,
    ipAddress,
    expiresAt,
  });

  const accessToken = generateAccessToken({
    userId: targetUser._id.toString(),
    email: targetUser.email,
    role: targetUser.role,
    sessionId: session._id.toString(),
  });

  setRefreshTokenCookie(res, refreshToken);

  return ApiResponse.success(res, 'Stealth unlock successful', {
    unlocked: true,
    user: {
      id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      status: targetUser.status,
      avatar: targetUser.avatar,
      bio: targetUser.bio,
      birthday: (targetUser as any).birthday,
    },
    accessToken,
  });
});
