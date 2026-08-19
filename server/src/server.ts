import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import app from './app';
import { connectDatabase, disconnectDatabase } from './config/db.config';
import { env } from './config/env.config';
import { logger } from './config/logger.config';
import { PLATFORM_CONSTANTS } from './constants';
import { socketService } from './services/socket.service';
import { syncCloudinaryAudioToDb } from './controllers/music.controller';
import { syncCloudinaryGalleryToDb } from './controllers/media.controller';

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

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB Database
    await connectDatabase();

    // Ensure System Admin Account is Active & Restored
    await ensureSystemAdminUserExists();

    // Auto-sync Cloudinary audio & gallery libraries asynchronously on startup
    syncCloudinaryAudioToDb().catch((syncErr) => {
      logger.warn(`⚠️ Startup Cloudinary audio sync non-fatal error: ${syncErr.message}`);
    });
    syncCloudinaryGalleryToDb().catch((syncErr) => {
      logger.warn(`⚠️ Startup Cloudinary gallery sync non-fatal error: ${syncErr.message}`);
    });

    // Start Express HTTP Server
    server = app.listen(env.PORT, () => {
      logger.info(`🚀 ${PLATFORM_CONSTANTS.APP_NAME} server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
      logger.info(`🔗 Health status available at: http://localhost:${env.PORT}${PLATFORM_CONSTANTS.API_PREFIX}/health`);
    });

    // Initialize Real-Time Socket.io Server Engine
    socketService.init(server);
    logger.info('⚡ Real-time Socket.io communication engine initialized');
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
