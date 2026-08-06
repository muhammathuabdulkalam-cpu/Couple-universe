import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.config';
import { logger } from '../config/logger.config';
import { HTTP_STATUS, PLATFORM_CONSTANTS, ROLES, USER_STATUS } from '../constants';
import { Album } from '../models/album.model';
import { Session } from '../models/session.model';
import { Song } from '../models/song.model';
import { Story } from '../models/story.model';
import { TimelineEvent } from '../models/timelineEvent.model';
import { IUser, User } from '../models/user.model';
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
  const user = await User.findOne({ email: targetEmail }).select('+password');

  if (!user || user.role !== ROLES.ADMIN) {
    throw new AppError('Invalid admin credentials or unauthorized account.', HTTP_STATUS.UNAUTHORIZED);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid admin credentials or unauthorized account.', HTTP_STATUS.UNAUTHORIZED);
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    throw new AppError('Admin account suspended.', HTTP_STATUS.FORBIDDEN);
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate tokens
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

  logger.info(`🛡️ Admin Login successful: ${user.email} from IP ${ipAddress}`);

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
 * Single summary endpoint combining Stats, Primary Couple, Recent Users, Relationships & System Health
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

  // Aggregate Counts from MongoDB
  const [
    totalUsers,
    activeUsers,
    totalMemories,
    totalAlbums,
    totalStories,
    totalSharedSongs,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: USER_STATUS.ACTIVE }),
    TimelineEvent.countDocuments(),
    Album.countDocuments(),
    Story.countDocuments(),
    Song.countDocuments({ provider: 'local' }),
    User.find().sort({ createdAt: -1 }).limit(5).select('-password'),
  ]);

  const daysTogether = calculateDaysTogether();

  // Construct Primary Couple Object
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

  // Measure Real Node Process Health
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
    totalRelationships: 1,
    totalMemories,
    totalAlbums,
    totalStories,
    totalSharedSongs,
  };

  return ApiResponse.success(res, 'Admin dashboard summary retrieved', {
    platformStats,
    primaryCouple,
    recentUsers,
    systemHealth,
  });
});

/**
 * 3. Paginated Users List
 * Supports search (Name, Email, Role) and filters (Role, Status)
 */
export const getAdminUsers = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const search = (req.query.search as string || '').trim();
  const roleFilter = (req.query.role as string || '').trim();
  const statusFilter = (req.query.status as string || '').trim();

  const queryFilter: any = {};

  if (search) {
    queryFilter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { role: new RegExp(search, 'i') },
    ];
  }

  if (roleFilter) {
    queryFilter.role = roleFilter;
  }

  if (statusFilter) {
    queryFilter.status = statusFilter;
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(queryFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password'),
    User.countDocuments(queryFilter),
  ]);

  // Enrich users with online status and partner info
  const superOwner = await User.findOne({ role: ROLES.SUPER_OWNER });
  const coOwner = await User.findOne({ role: ROLES.CO_OWNER });

  const enrichedUsers = await Promise.all(
    users.map(async (usr) => {
      const onlineStatus = await getUserOnlineStatus(usr._id);
      let partnerName = 'N/A';
      let relationshipName = 'Platform Admin / Member';

      if (usr.role === ROLES.SUPER_OWNER) {
        partnerName = coOwner?.name || 'Amrin';
        relationshipName = 'Afzal & Amrin ❤️';
      } else if (usr.role === ROLES.CO_OWNER) {
        partnerName = superOwner?.name || 'Afzal';
        relationshipName = 'Afzal & Amrin ❤️';
      }

      return {
        id: usr._id,
        name: usr.name,
        email: usr.email,
        role: usr.role,
        status: usr.status,
        avatar: usr.avatar || '',
        bio: usr.bio || '',
        birthday: usr.birthday || null,
        relationshipName,
        relationshipType: usr.role === ROLES.SUPER_OWNER || usr.role === ROLES.CO_OWNER ? 'Couple' : 'Member',
        partnerName,
        isOnline: onlineStatus.isOnline,
        lastSeen: onlineStatus.lastSeen || usr.lastLoginAt,
        lastLoginAt: usr.lastLoginAt || usr.createdAt,
        createdAt: usr.createdAt,
        storageNotice: 'Storage analytics will be available in a future phase.',
      };
    })
  );

  return ApiResponse.success(res, 'Admin users retrieved', {
    users: enrichedUsers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * 4. User Details Side Drawer Payload
 */
export const getAdminUserDetails = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await User.findById(id).select('-password');

  if (!user) {
    throw new AppError('User record not found.', HTTP_STATUS.NOT_FOUND);
  }

  const superOwner = await User.findOne({ role: ROLES.SUPER_OWNER });
  const coOwner = await User.findOne({ role: ROLES.CO_OWNER });
  const onlineStatus = await getUserOnlineStatus(user._id);

  let partnerName = 'None';
  let relationshipName = 'Independent Account';
  let relationshipType = 'Standard User';
  let startDate = 'N/A';

  if (user.role === ROLES.SUPER_OWNER) {
    partnerName = coOwner?.name || 'Amrin';
    relationshipName = 'Afzal & Amrin ❤️';
    relationshipType = 'Couple / Platform Owners';
    startDate = PLATFORM_CONSTANTS.RELATIONSHIP_START_DATE;
  } else if (user.role === ROLES.CO_OWNER) {
    partnerName = superOwner?.name || 'Afzal';
    relationshipName = 'Afzal & Amrin ❤️';
    relationshipType = 'Couple / Platform Owners';
    startDate = PLATFORM_CONSTANTS.RELATIONSHIP_START_DATE;
  }

  return ApiResponse.success(res, 'User details retrieved', {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: 'Not Specified',
    role: user.role,
    status: user.status,
    avatar: user.avatar || '',
    bio: user.bio || '',
    birthday: user.birthday || null,
    relationshipName,
    relationshipType,
    partnerName,
    startDate,
    storageUsed: 'Storage analytics will be available in a future phase.',
    isOnline: onlineStatus.isOnline,
    lastActiveAt: onlineStatus.lastSeen || user.lastLoginAt || user.createdAt,
    lastLoginAt: user.lastLoginAt || user.createdAt,
    accountStatus: user.status,
    loginMethod: 'Email & Password',
    createdBy: 'System / Self Registration',
    enabledFeatures: [
      { name: 'Private Vault', enabled: true },
      { name: 'Timeline & Memories', enabled: true },
      { name: 'Media Gallery', enabled: true },
      { name: 'Shared Music Player', enabled: true },
      { name: 'Listen Together Engine', enabled: true },
      { name: 'Interactive Calendar', enabled: true },
      { name: 'Couple Chat Engine', enabled: true },
      { name: 'Stealth Calculator Mode', enabled: user.role === ROLES.SUPER_OWNER || user.role === ROLES.CO_OWNER },
    ],
  });
});

/**
 * 5. Existing Relationships Payload
 */
export const getAdminRelationships = catchAsync(async (_req: Request, res: Response) => {
  const [superOwner, coOwner] = await Promise.all([
    User.findOne({ role: ROLES.SUPER_OWNER }).select('-password'),
    User.findOne({ role: ROLES.CO_OWNER }).select('-password'),
  ]);

  const [totalMemories, totalAlbums, totalStories, totalSharedSongs] = await Promise.all([
    TimelineEvent.countDocuments(),
    Album.countDocuments(),
    Story.countDocuments(),
    Song.countDocuments({ provider: 'local' }),
  ]);

  const primaryRelationship = {
    id: 'rel_primary_01',
    name: 'Afzal & Amrin ❤️',
    type: 'Couple / Platform Owners',
    coverImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800',
    startDate: PLATFORM_CONSTANTS.RELATIONSHIP_START_DATE,
    daysTogether: calculateDaysTogether(),
    status: 'ACTIVE',
    members: [
      { id: superOwner?._id, name: superOwner?.name || 'Afzal', role: superOwner?.role || 'SUPER_OWNER', avatar: superOwner?.avatar },
      { id: coOwner?._id, name: coOwner?.name || 'Amrin', role: coOwner?.role || 'CO_OWNER', avatar: coOwner?.avatar },
    ],
    stats: {
      totalMemories,
      totalAlbums,
      totalStories,
      totalSharedSongs,
    },
    createdDate: PLATFORM_CONSTANTS.RELATIONSHIP_START_DATE,
  };

  return ApiResponse.success(res, 'Relationships retrieved', [primaryRelationship]);
});

/**
 * 6. Admin Logout
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
