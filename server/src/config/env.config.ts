import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Allow both MONGODB_URI and MONGO_URI for hosting platforms
const rawMongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb+srv://afzal:Afrin1234@cluster0.6ajof6j.mongodb.net/afrin_universe?retryWrites=true&w=majority&appName=Cluster0';

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  MONGODB_URI: z.string().default(rawMongoUri),
  JWT_ACCESS_SECRET: z.string().default(process.env.JWT_ACCESS_SECRET || 'afrin_universe_jwt_access_secret_super_secure_key_2026'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().default(process.env.JWT_REFRESH_SECRET || 'afrin_universe_jwt_refresh_secret_super_secure_key_2026'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  YOUTUBE_API_KEY: z.string().optional().default(process.env.YOUTUBE_API_KEY || ''),
  RELATIONSHIP_START_DATE: z.string().default('2026-03-26'),
  ADMIN_EMAIL: z.string().email().default('admin@gmail.com'),
  ADMIN_PASSWORD: z.string().min(6).default('Afzal@1234'),
});

const _env = envSchema.safeParse({
  ...process.env,
  MONGODB_URI: rawMongoUri,
});

if (!_env.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(_env.error.format(), null, 2));
  process.exit(1);
}

export const env = _env.data;
