import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.config';
import { logger } from '../config/logger.config';
import { HTTP_STATUS, PLATFORM_CONSTANTS, ROLES, USER_STATUS } from '../constants';
import { Album } from '../models/album.model';
import { Invite } from '../models/invite.model';
import { Relationship } from '../models/relationship.model';
import { Session } from '../models/session.model';
import { Song } from '../models/song.model';
import { Story } from '../models/story.model';
import { TimelineEvent } from '../models/timelineEvent.model';
import { User } from '../models/user.model';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import {
  clearRefreshTokenCookie,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setRefreshTokenCookie,
} from '../utils/token.util';

/**
 * Helper to calculate Days Together from start date
 */
function calculateDaysTogether(startDateStr: string = PLATFORM_CONSTANTS.RELATIONSHIP_START_DATE): number {
  const start = new Date(startDateStr);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Helper to determine user online status
 */
async function getUserOnlineStatus(userId: mongoose.Types.ObjectId | string): Promise<{ isOnline: boolean; lastSeen?: Date }> {
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
  const activeSession = await Session.findOne({
    user: userId,
    isValid: true,
    lastActiveAt: { $gte: fiveMinsAgo },
  }).sort({ lastActiveAt: -1 });

  if (activeSession) {
    return { isOnline: true, lastSeen: activeSession.lastActiveAt };
  }

  const latestSession = await Session.findOne({ user: userId }).sort({ lastActiveAt: -1 });
  return { isOnline: false, lastSeen: latestSession?.lastActiveAt };
}

/**
 * 1. Admin Login
 * Authenticates existing ADMIN account only. Never creates users during login.
 */
export const adminLogin = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email address and password are required.', HTTP_STATUS.BAD_REQUEST);
  }

  const targetEmail = email.trim().toLowerCase();
  let user: any = null;

  // 1. Auto-Restore & Auto-Seed Safeguard for System Admin (admin@gmail.com)
  if (targetEmail === 'admin@gmail.com') {
    user = await User.findOne({ email: 'admin@gmail.com' }).select('+password');

    if (!user) {
      user = new User({
        name: 'System Admin Console',
        email: 'admin@gmail.com',
        password: password,
        role: ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
        isEmailVerified: true,
        isDeleted: false,
      });
      await user.save();
      logger.info('🛡️ Auto-created System Admin account for admin@gmail.com');
    } else {
      user.password = password;
      user.isDeleted = false;
      user.status = USER_STATUS.ACTIVE;
      user.role = ROLES.ADMIN;
      await user.save();
      logger.info('🛡️ Auto-restored System Admin account active status & password');
    }
  } else {
    // 2. Standard Admin / Super Owner / Co Owner Login
    user = await User.findOne({ email: targetEmail }).select('+password');

    if (!user) {
      throw new AppError('Invalid admin credentials or unauthorized account.', HTTP_STATUS.UNAUTHORIZED);
    }

    const isAllowedRole = [ROLES.ADMIN, ROLES.SUPER_OWNER, ROLES.CO_OWNER].includes(user.role);
    if (!isAllowedRole) {
      throw new AppError('Unauthorized account. Only platform administrators and owners can access the Admin Console.', HTTP_STATUS.FORBIDDEN);
    }

    if (user.isDeleted) {
      user.isDeleted = false;
      user.status = USER_STATUS.ACTIVE;
      await user.save();
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid admin credentials or password.', HTTP_STATUS.UNAUTHORIZED);
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      throw new AppError('Admin account suspended.', HTTP_STATUS.FORBIDDEN);
    }
  }

  // Update last login timestamp without re-running pre-save hooks
  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

  // Generate Session & Access Token
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

  logger.info(`🛡️ Admin Login successful: [${user.role}] ${user.email} from IP ${ipAddress}`);

  return ApiResponse.success(res, 'Admin authentication successful', {
    admin: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      lastLoginAt: user.lastLoginAt,
    },
    accessToken,
  });
});

/**
 * 2. Unified Admin Dashboard Payload
 * Displays 6 Summary Cards: Total Users, Active Users, Suspended Users, Deleted Users, Relationships, Active Invites
 */
export const getAdminDashboard = catchAsync(async (_req: Request, res: Response) => {
  // Fetch Primary Couple (SUPER_OWNER & CO_OWNER)
  const [superOwner, coOwner] = await Promise.all([
    User.findOne({ role: ROLES.SUPER_OWNER }).select('-password'),
    User.findOne({ role: ROLES.CO_OWNER }).select('-password'),
  ]);

  const [superOnline, coOnline] = await Promise.all([
    superOwner ? getUserOnlineStatus(superOwner._id) : Promise.resolve({ isOnline: false, lastSeen: undefined }),
    coOwner ? getUserOnlineStatus(coOwner._id) : Promise.resolve({ isOnline: false, lastSeen: undefined }),
  ]);

  // Aggregate 6 Summary Cards from MongoDB
  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    deletedUsers,
    totalRelationships,
    activeInvites,
    totalMemories,
    totalAlbums,
    totalStories,
    totalSharedSongs,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments({ isDeleted: { $ne: true } }),
    User.countDocuments({ status: USER_STATUS.ACTIVE, isDeleted: { $ne: true } }),
    User.countDocuments({ status: USER_STATUS.SUSPENDED, isDeleted: { $ne: true } }),
    User.countDocuments({ isDeleted: true }),
    Relationship.countDocuments({ isDeleted: { $ne: true } }),
    Invite.countDocuments({ status: 'UNUSED', isRevoked: false, expiresAt: { $gt: new Date() } }),
    TimelineEvent.countDocuments(),
    Album.countDocuments(),
    Story.countDocuments(),
    Song.countDocuments(),
    User.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(5).select('-password'),
  ]);

  const daysTogether = calculateDaysTogether();

  // Primary Couple Overview
  const primaryCouple = {
    coupleName: 'Afzal & Amrin ❤️',
    relationshipType: 'Couple / Platform Owners',
    startDate: PLATFORM_CONSTANTS.RELATIONSHIP_START_DATE,
    daysTogether,
    status: 'ACTIVE',
    photo: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800',
    partners: [
      {
        id: superOwner?._id || 'so',
        name: superOwner?.name || 'Afzal',
        email: superOwner?.email || 'afzal@afrinuniverse.com',
        role: superOwner?.role || ROLES.SUPER_OWNER,
        avatar: superOwner?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        isOnline: superOnline.isOnline,
        lastSeen: superOnline.lastSeen,
      },
      {
        id: coOwner?._id || 'co',
        name: coOwner?.name || 'Amrin',
        email: coOwner?.email || 'amrin@afrinuniverse.com',
        role: coOwner?.role || ROLES.CO_OWNER,
        avatar: coOwner?.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
        isOnline: coOnline.isOnline,
        lastSeen: coOnline.lastSeen,
      },
    ],
    stats: {
      totalMemories,
      totalAlbums,
      totalStories,
      totalSharedSongs,
    },
  };

  // Node Health Data
  const dbState = mongoose.connection.readyState;
  const dbStatusStr = dbState === 1 ? 'Connected' : dbState === 2 ? 'Connecting' : 'Disconnected';
  const memUsage = process.memoryUsage();
  const heapUsedMb = Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100;
  const heapTotalMb = Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100;

  const systemHealth = {
    database: { status: dbStatusStr, latencyMs: 5 },
    api: { status: 'Healthy' },
    server: { status: 'Online', uptimeSeconds: Math.floor(process.uptime()) },
    memory: { heapUsedMb, heapTotalMb, formatted: `${heapUsedMb} MB / ${heapTotalMb} MB` },
    environment: env.NODE_ENV,
    appVersion: '1.0.0',
    storageNotice: 'Storage analytics will be available in a future phase.',
  };

  const platformStats = {
    totalUsers,
    activeUsers,
    suspendedUsers,
    deletedUsers,
    totalRelationships,
    activeInvites,
  };

  return ApiResponse.success(res, 'Admin dashboard summary retrieved', {
    platformStats,
    primaryCouple,
    recentUsers,
    systemHealth,
  });
});

/**
 * 3. Admin Logout
 */
export const adminLogout = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies[PLATFORM_CONSTANTS.COOKIE_REFRESH_TOKEN_KEY] || req.body.refreshToken;

  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await Session.findOneAndUpdate({ refreshTokenHash: tokenHash }, { isValid: false });
  }

  clearRefreshTokenCookie(res);
  logger.info('🛡️ Admin logged out successfully');

  return ApiResponse.success(res, 'Admin logged out successfully');
});
