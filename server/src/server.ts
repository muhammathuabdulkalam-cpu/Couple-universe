import dns from 'dns';
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

import app from './app';
import { connectDatabase, disconnectDatabase } from './config/db.config';
import { env } from './config/env.config';
import { logger } from './config/logger.config';
import { PLATFORM_CONSTANTS } from './constants';
import { socketService } from './services/socket.service';
import { syncCloudinaryAudioToDb } from './controllers/music.controller';
import { syncCloudinaryGalleryToDb } from './controllers/media.controller';
import { syncCloudinaryProfilesToDb } from './controllers/profile.controller';

import { User } from './models/user.model';
import { ROLES, USER_STATUS } from './constants';

let server: any;

async function ensureSystemAdminUserExists(): Promise<void> {
  try {
    let admin = await User.findOne({ email: 'admin@gmail.com' }).select('+password');
    if (!admin) {
      admin = new User({
        name: 'System Admin Console',
        email: 'admin@gmail.com',
        password: 'Admin@1234',
        role: ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
        isEmailVerified: true,
        isDeleted: false,
      });
      await admin.save();
      logger.info('🛡️ Auto-seeded System Admin account (admin@gmail.com / Admin@1234)');
    } else {
      let pwdValid = false;
      if (admin.password) {
        pwdValid = await admin.comparePassword('Admin@1234');
      }
      if (!pwdValid || admin.isDeleted || admin.status !== USER_STATUS.ACTIVE || admin.role !== ROLES.ADMIN) {
        admin.password = 'Admin@1234';
        admin.isDeleted = false;
        admin.status = USER_STATUS.ACTIVE;
        admin.role = ROLES.ADMIN;
        await admin.save();
        logger.info('🛡️ Auto-restored System Admin account active status & credentials');
      }
    }
  } catch (err: any) {
    logger.warn(`⚠️ System Admin auto-seed warning: ${err.message}`);
  }
}

import { Media } from './models/media.model';

async function ensureDefaultAvatarsPopulated(): Promise<void> {
  try {
    // Reset any broken 404 Cloudinary avatar strings to empty string so user's real uploaded media can be linked
    await User.updateMany(
      { avatar: { $regex: 'profile_avatar_e77eul', $options: 'i' } },
      { $set: { avatar: '' } }
    );

    await Media.deleteMany({
      $or: [
        { cloudinaryPublicId: { $regex: 'profile_avatar_e77eul', $options: 'i' } },
        { secureUrl: { $regex: 'profile_avatar_e77eul', $options: 'i' } },
        { url: { $regex: 'profile_avatar_e77eul', $options: 'i' } },
      ],
    });

    const usersWithoutAvatar = await User.find({
      $or: [
        { avatar: '' },
        { avatar: null },
        { avatar: { $exists: false } },
      ],
    });

    for (const u of usersWithoutAvatar) {
      const userMedia = await Media.findOne({
        owner: u._id,
        $or: [{ tags: 'profile' }, { title: 'Profile Picture' }],
      }).sort({ createdAt: -1 });

      if (userMedia && userMedia.secureUrl) {
        u.avatar = userMedia.secureUrl;
        await u.save();
      }
    }
  } catch (err: any) {
    logger.warn(`⚠️ Avatar auto-populate warning: ${err.message}`);
  }
}

async function cleanupOrphanedInvitedUsers(): Promise<void> {
  try {
    const { InvitedUser } = await import('./models/invitedUser.model');
    const { Invite } = await import('./models/invite.model');
    const { Relationship } = await import('./models/relationship.model');

    const pendingInvites = await InvitedUser.find({
      status: { $in: ['PENDING', 'ACTIVE', 'INVITED'] },
      isDeleted: false,
    });

    for (const inv of pendingInvites) {
      let matchedUser: any = null;

      if (inv.registeredUserId) {
        matchedUser = await User.findById(inv.registeredUserId);
      }

      if (!matchedUser && inv.email) {
        matchedUser = await User.findOne({ email: inv.email.toLowerCase(), isDeleted: { $ne: true } });
      }

      if (!matchedUser && inv.tokenCode) {
        const inviteObj = await Invite.findOne({ code: inv.tokenCode });
        if (inviteObj && inviteObj.usedBy) {
          matchedUser = await User.findById(inviteObj.usedBy);
        }
      }

      if (!matchedUser && inv.relationshipId) {
        const rel = await Relationship.findById(inv.relationshipId);
        if (rel && rel.members) {
          const nonOwnerMember = rel.members.find((m: any) => {
            const role = (m.role || '').toUpperCase();
            return role !== 'SUPER_OWNER' && role !== 'CO_OWNER';
          });
          if (nonOwnerMember && nonOwnerMember.user) {
            matchedUser = await User.findById(nonOwnerMember.user);
          }
        }
      }

      if (matchedUser) {
        inv.status = 'REGISTERED';
        inv.registeredUserId = matchedUser._id;
        inv.email = matchedUser.email;
        inv.name = matchedUser.name;
        if (matchedUser.avatar) inv.avatar = matchedUser.avatar;
        await inv.save();
        logger.info(`🧹 Cleaned up and linked registered user [${matchedUser.name}] to InvitedUser document [${inv._id}]`);
      }
    }
  } catch (err: any) {
    logger.warn(`⚠️ InvitedUser cleanup warning: ${err.message}`);
  }
}

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB Database FIRST before opening HTTP server port
    await connectDatabase();

    // Start Express HTTP Server after DB is connected and ready
    server = app.listen(env.PORT, () => {
      logger.info(`🚀 ${PLATFORM_CONSTANTS.APP_NAME} server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
      logger.info(`🔗 Health status available at: http://localhost:${env.PORT}${PLATFORM_CONSTANTS.API_PREFIX}/health`);
    });

    // Initialize Real-Time Socket.io Server Engine
    socketService.init(server);
    logger.info('⚡ Real-time Socket.io communication engine initialized');

    // Run startup seeds and asset syncs asynchronously in background
    ensureSystemAdminUserExists().catch((err) => {
      logger.warn(`⚠️ System Admin auto-seed warning: ${err.message}`);
    });
    ensureDefaultAvatarsPopulated().catch((err) => {
      logger.warn(`⚠️ Avatar auto-populate warning: ${err.message}`);
    });
    cleanupOrphanedInvitedUsers().catch((err) => {
      logger.warn(`⚠️ InvitedUser cleanup warning: ${err.message}`);
    });

    // Auto-sync Cloudinary audio, gallery & profile libraries asynchronously on startup
    syncCloudinaryAudioToDb().catch((syncErr) => {
      logger.warn(`⚠️ Startup Cloudinary audio sync non-fatal error: ${syncErr.message}`);
    });
    syncCloudinaryGalleryToDb().catch((syncErr) => {
      logger.warn(`⚠️ Startup Cloudinary gallery sync non-fatal error: ${syncErr.message}`);
    });
    syncCloudinaryProfilesToDb().catch((syncErr) => {
      logger.warn(`⚠️ Startup Cloudinary profile sync non-fatal error: ${syncErr.message}`);
    });

    // Background Cloudinary auto-sync every 5 minutes
    setInterval(() => {
      syncCloudinaryAudioToDb().catch(() => {});
      syncCloudinaryGalleryToDb().catch(() => {});
      syncCloudinaryProfilesToDb().catch(() => {});
    }, 5 * 60 * 1000);
  } catch (error) {
    logger.error(`❌ Fatal server startup error: ${(error as Error).message}`);
    process.exit(1);
  }
};

// Graceful Shutdown Logic
const shutdown = async (signal: string) => {
  logger.warn(`⚠️ ${signal} received. Initiating graceful shutdown...`);
  
  if (server) {
    server.close(async () => {
      logger.info('🔒 HTTP server closed.');
      await disconnectDatabase();
      logger.info('👋 Process terminated safely.');
      process.exit(0);
    });
  } else {
    await disconnectDatabase();
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error: Error) => {
  logger.error(`💥 Uncaught Exception: ${error.stack || error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error(`💥 Unhandled Promise Rejection: ${reason?.stack || reason}`);
  process.exit(1);
});

startServer();
