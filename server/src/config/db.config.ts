import mongoose from 'mongoose';
import { env } from './env.config';
import { logger } from './logger.config';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);

    mongoose.connection.on('connected', () => {
      logger.info('🍃 MongoDB connected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB connection lost. Reconnecting...');
    });

    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    // Seed initial Admin Account if missing
    const { seedAdminAccount } = await import('../utils/seedAdmin');
    await seedAdminAccount();
  } catch (error) {
    logger.error(`❌ Initial MongoDB connection failed: ${(error as Error).message}`);
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('🍃 MongoDB connection closed gracefully.');
  } catch (error) {
    logger.error(`❌ Error disconnecting MongoDB: ${(error as Error).message}`);
  }
};
