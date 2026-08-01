import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.config';
import { logger } from './logger.config';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: env.CLOUDINARY_API_KEY || '1234567890',
  api_secret: env.CLOUDINARY_API_SECRET || 'demo_secret',
  secure: true,
});

logger.info(`☁️ Cloudinary SDK configured for cloud: ${env.CLOUDINARY_CLOUD_NAME || 'demo'}`);

export default cloudinary;
