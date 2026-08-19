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

let server: any;

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB Database
    await connectDatabase();

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
