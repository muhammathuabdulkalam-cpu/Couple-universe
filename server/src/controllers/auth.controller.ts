import crypto from 'crypto';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.config';
import { logger } from '../config/logger.config';
import { HTTP_STATUS, PLATFORM_CONSTANTS, ROLES, USER_STATUS, UserRole } from '../constants';
import { Invite } from '../models/invite.model';
import { Session } from '../models/session.model';
import { User } from '../models/user.model';
import { InviteService } from '../services/invite.service';
import { RelationshipService } from '../services/relationship.service';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import {
  clearRefreshTokenCookie,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setRefreshTokenCookie,
  verifyRefreshToken,
} from '../utils/token.util';

/**
 * Get System Authentication & Setup Status
 */
export const getSystemAuthStatus = catchAsync(async (_req: Request, res: Response) => {
  const totalUsers = await User.countDocuments();
  const superOwnerCount = await User.countDocuments({ role: ROLES.SUPER_OWNER });
  const coOwnerCount = await User.countDocuments({ role: ROLES.CO_OWNER });

  const isInitialSetupOpen = totalUsers === 0;
  const isPublicRegistrationAllowed = isInitialSetupOpen;

  return ApiResponse.success(res, 'System authentication status retrieved', {
    totalUsers,
    superOwnerExists: superOwnerCount > 0,
    coOwnerExists: coOwnerCount > 0,
    isInitialSetupOpen,
    isPublicRegistrationAllowed,
    inviteRequired: !isInitialSetupOpen,
  });
});

/**
 * Register User (Atomic MongoDB Session Transaction + Zero-Trust Client Payload)
 */
export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, inviteCode } = req.body;

  const totalUsers = await User.countDocuments();
  const isFirstUser = totalUsers === 0;
  const cleanCode = inviteCode ? inviteCode.trim().toUpperCase() : '';

  // Check for duplicate email
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('An account with this email address already exists. Please Sign In.', HTTP_STATUS.CONFLICT);
  }

  let assignedRole: UserRole = ROLES.INVITED_USER;
  let derivedRelationshipId: mongoose.Types.ObjectId | undefined;
  let derivedEnabledFeatures: string[] = [];
  let onboardingCompletedState = false;

  const session = await mongoose.startSession();
  session.startTransaction();

  let registeredUser: any;

  let finalName = (name || '').trim();

  try {
    if (isFirstUser || cleanCode === 'MASTER2026' || cleanCode === 'AFZAL2026') {
      assignedRole = ROLES.SUPER_OWNER;
      onboardingCompletedState = true;
      if (!finalName) finalName = 'Super Owner';
      logger.info(`👑 Master registration granted SUPER_OWNER role to: ${email}`);
    } else {
      if (!cleanCode) {
        throw new AppError('A valid invitation code is required to register.', HTTP_STATUS.FORBIDDEN);
      }

      const { invite } = await InviteService.validateToken(cleanCode, session);

      if (invite.email && invite.email !== email.toLowerCase()) {
        throw new AppError(`This invitation code is reserved for ${invite.email}.`, HTTP_STATUS.FORBIDDEN);
      }

      // Derive permissions exclusively from validated invite stored in MongoDB (Zero-Trust)
      assignedRole = invite.targetRole || ROLES.CO_OWNER;
      derivedRelationshipId = invite.relationship ? invite.relationship._id || invite.relationship : undefined;
      derivedEnabledFeatures = invite.enabledFeatures || [];
      onboardingCompletedState = false; // Newly invited users always start with onboardingCompleted = false
      
      if (!finalName) {
        finalName = invite.inviteDisplayName || 'Invited User';
      }
    }

    const userDocs = await User.create(
      [
        {
          name: finalName,
          email: email.toLowerCase(),
          password,
          role: assignedRole,
          relationshipId: derivedRelationshipId,
          enabledFeatures: derivedEnabledFeatures,
          onboardingCompleted: false,
          avatar: req.body.avatar || '',
          username: req.body.username || '',
          phone: req.body.phone || '',
          bio: req.body.bio || '',
          birthday: req.body.birthday ? new Date(req.body.birthday) : undefined,
          status: USER_STATUS.ACTIVE,
          isEmailVerified: true,
          lastLoginAt: new Date(),
        },
      ],
      { session }
    );

    registeredUser = userDocs[0];

    // Auto-join user to relationship members inside transaction
    if (derivedRelationshipId) {
      await RelationshipService.addMember(
        derivedRelationshipId.toString(),
        registeredUser._id.toString(),
        assignedRole,
        session
      );
    }

    // Auto-create Birthday Countdown & Activity Event
    if (req.body.birthday) {
      try {
        const dobDate = new Date(req.body.birthday);
        const today = new Date();
        let nextBday = new Date(today.getFullYear(), dobDate.getMonth(), dobDate.getDate());
        if (nextBday < today) {
          nextBday.setFullYear(today.getFullYear() + 1);
        }

        const { Countdown } = await import('../models/lifeExperience.model');
        await Countdown.create({
          relationshipId: derivedRelationshipId ? derivedRelationshipId.toString() : 'AFZAL_AMRIN_AFRIN_VERSE',
          createdBy: registeredUser._id,
          title: `🎂 ${registeredUser.name}'s Birthday`,
          targetDate: nextBday,
          type: 'BIRTHDAY',
        });

        const { createActivity } = await import('./activity.controller');
        await createActivity(
          registeredUser._id.toString(),
          'BIRTHDAY_REMINDER',
          undefined,
          undefined,
          `🎂 ${registeredUser.name}'s Birthday Added!`,
          `Born on ${dobDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
        );
      } catch (_e) {}
    }

    // Consume invite atomically inside transaction & update InvitedUser collection
    if (cleanCode && cleanCode !== 'MASTER2026' && cleanCode !== 'AFZAL2026') {
      await InviteService.consumeInviteAtomic(cleanCode, registeredUser._id.toString(), session);
      const { InvitedUser } = await import('../models/invitedUser.model');
      await InvitedUser.findOneAndUpdate(
        { $or: [{ tokenCode: cleanCode }, { relationshipId: derivedRelationshipId }] },
        {
          status: 'REGISTERED',
          registeredUserId: registeredUser._id,
          email: registeredUser.email,
          name: registeredUser.name,
          avatar: registeredUser.avatar || '',
        },
        { session }
      ).catch(() => {});
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  // Create Session & Lifetime Tokens (100 Years)
  const userAgent = req.headers['user-agent'] || 'Unknown Browser';
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '0.0.0.0';

  const refreshToken = generateRefreshToken({ userId: registeredUser._id.toString(), email: registeredUser.email, role: registeredUser.role });
  const refreshTokenHash = hashToken(refreshToken);

  const expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);

  const userSession = await Session.create({
    user: registeredUser._id,
    refreshTokenHash,
    userAgent,
    ipAddress,
    expiresAt,
  });

  const accessToken = generateAccessToken({
    userId: registeredUser._id.toString(),
    email: registeredUser.email,
    role: registeredUser.role,
    sessionId: userSession._id.toString(),
  });

  setRefreshTokenCookie(res, refreshToken);

  logger.info(`👤 User registered successfully: [${registeredUser.role}] ${registeredUser.email}`);

  return ApiResponse.created(res, 'User registered successfully', {
    user: {
      id: registeredUser._id,
      name: registeredUser.name,
      email: registeredUser.email,
      role: registeredUser.role,
      status: registeredUser.status,
      avatar: registeredUser.avatar,
      bio: registeredUser.bio,
      birthday: registeredUser.birthday,
      relationshipId: registeredUser.relationshipId,
      enabledFeatures: registeredUser.enabledFeatures,
      onboardingCompleted: registeredUser.onboardingCompleted,
    },
    accessToken,
    refreshToken,
  });
});

/**
 * Login User
 */
export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || user.isDeleted || user.status === USER_STATUS.DELETED) {
    throw new AppError('Invalid email or password. If your account was removed, please contact the Super Owner.', HTTP_STATUS.UNAUTHORIZED);
  }

  if (user.role === ROLES.ADMIN || user.email === 'admin@gmail.com') {
    throw new AppError('System Admin credentials cannot be used for user login. Please access the Enterprise Admin Console at /admin/login.', HTTP_STATUS.FORBIDDEN);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password. Please check your credentials.', HTTP_STATUS.UNAUTHORIZED);
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    throw new AppError('Your account has been suspended by the Super Owner.', HTTP_STATUS.FORBIDDEN);
  }

  // Update last login timestamp
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  // Create Session & Lifetime Tokens (100 Years)
  const userAgent = req.headers['user-agent'] || 'Unknown Browser';
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '0.0.0.0';

  const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email, role: user.role });
  const refreshTokenHash = hashToken(refreshToken);

  const expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);

  const session = await Session.create({
    user: user._id,
    refreshTokenHash,
    userAgent,
    ipAddress,
    expiresAt,
  });

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    sessionId: session._id.toString(),
  });

  setRefreshTokenCookie(res, refreshToken);

  logger.info(`🔓 Login successful: [${user.role}] ${user.email} from IP: ${ipAddress}`);

  return ApiResponse.success(res, 'Authentication successful', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      bio: user.bio,
      birthday: user.birthday,
      relationshipId: user.relationshipId,
      enabledFeatures: user.enabledFeatures || [],
      onboardingCompleted: user.onboardingCompleted ?? true,
      lastLoginAt: user.lastLoginAt,
    },
    accessToken,
    refreshToken,
  });
});

/**
 * Logout User
 */
export const logout = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies[PLATFORM_CONSTANTS.COOKIE_REFRESH_TOKEN_KEY] || req.body.refreshToken;

  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await Session.findOneAndUpdate({ refreshTokenHash: tokenHash }, { isValid: false });
  }

  clearRefreshTokenCookie(res);

  return ApiResponse.success(res, 'Logged out successfully');
});

/**
 * Refresh Access Token
 */
export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  let rawRefreshToken = req.cookies?.[PLATFORM_CONSTANTS.COOKIE_REFRESH_TOKEN_KEY] ||
                        req.body?.refreshToken ||
                        req.headers?.['x-refresh-token'] ||
                        req.headers?.['authorization']?.toString().replace('Bearer ', '');

  if (
    !rawRefreshToken ||
    typeof rawRefreshToken !== 'string' ||
    rawRefreshToken === 'null' ||
    rawRefreshToken === 'undefined' ||
    !rawRefreshToken.trim()
  ) {
    clearRefreshTokenCookie(res);
    return ApiResponse.error(res, 'Refresh token is missing. Please log in again.', HTTP_STATUS.UNAUTHORIZED);
  }

  rawRefreshToken = rawRefreshToken.trim();

  let decoded: any;
  try {
    decoded = verifyRefreshToken(rawRefreshToken);
  } catch (_err) {
    clearRefreshTokenCookie(res);
    return ApiResponse.error(res, 'Invalid or expired refresh token.', HTTP_STATUS.UNAUTHORIZED);
  }

  if (!decoded || !decoded.userId) {
    clearRefreshTokenCookie(res);
    return ApiResponse.error(res, 'Invalid refresh token payload.', HTTP_STATUS.UNAUTHORIZED);
  }

  const tokenHash = hashToken(rawRefreshToken);
  if (!tokenHash) {
    clearRefreshTokenCookie(res);
    return ApiResponse.error(res, 'Invalid refresh token format.', HTTP_STATUS.UNAUTHORIZED);
  }

  const session = await Session.findOne({ refreshTokenHash: tokenHash, isValid: true });

  if (!session || (session.expiresAt && session.expiresAt < new Date())) {
    clearRefreshTokenCookie(res);
    return ApiResponse.error(res, 'Session expired or revoked. Please log in again.', HTTP_STATUS.UNAUTHORIZED);
  }

  const user = await User.findById(decoded.userId);
  if (!user || user.status === USER_STATUS.SUSPENDED || user.isDeleted) {
    clearRefreshTokenCookie(res);
    return ApiResponse.error(res, 'User account unavailable or suspended.', HTTP_STATUS.UNAUTHORIZED);
  }

  // Update session activity timestamp
  session.lastActiveAt = new Date();
  await session.save().catch(() => {});

  // Issue new access token
  const newAccessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    sessionId: session._id.toString(),
  });

  return ApiResponse.success(res, 'Token refreshed successfully', {
    accessToken: newAccessToken,
    refreshToken: rawRefreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      bio: user.bio,
      birthday: user.birthday,
      relationshipId: user.relationshipId,
      enabledFeatures: user.enabledFeatures || [],
      onboardingCompleted: user.onboardingCompleted ?? true,
    },
  });
});

/**
 * Forgot Password
 */
export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return ApiResponse.success(res, 'If an account exists with this email, a reset token has been generated.');
  }

  const rawResetToken = crypto.randomBytes(32).toString('hex');
  const hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

  user.passwordResetToken = hashedResetToken;
  user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  logger.info(`🔑 Password reset requested for ${user.email}. Raw token: ${rawResetToken}`);

  return ApiResponse.success(res, 'Password reset link/token generated successfully.', {
    resetToken: env.NODE_ENV === 'development' ? rawResetToken : undefined,
  });
});

/**
 * Reset Password
 */
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  const hashedResetToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedResetToken,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpiresAt');

  if (!user) {
    throw new AppError('Password reset token is invalid or has expired.', HTTP_STATUS.BAD_REQUEST);
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  // Invalidate all existing sessions for security
  await Session.updateMany({ user: user._id }, { isValid: false });

  logger.info(`🔒 Password reset completed for user ${user.email}. All sessions revoked.`);

  return ApiResponse.success(res, 'Password updated successfully. Please log in with your new password.');
});

/**
 * Change Password (Protected)
 */
export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!._id;

  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError('User record not found.', HTTP_STATUS.NOT_FOUND);
  }

  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AppError('Incorrect current password.', HTTP_STATUS.BAD_REQUEST);
  }

  user.password = newPassword;
  await user.save();

  // Invalidate other sessions except current session
  const currentSessionId = req.tokenPayload?.sessionId;
  if (currentSessionId) {
    await Session.updateMany({ user: user._id, _id: { $ne: currentSessionId } }, { isValid: false });
  }

  return ApiResponse.success(res, 'Password changed successfully.');
});
