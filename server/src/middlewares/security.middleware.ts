import cors from 'cors';
import { Request, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from '../config/env.config';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { ApiResponse } from '../utils/ApiResponse';

// Helmet Security Headers Middleware (Configured for Vercel + Render production deployment)
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Disabled to allow cross-origin media & fonts
  crossOriginEmbedderPolicy: false,
});

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile native apps, curl, or server-to-server)
    if (!origin) return callback(null, true);

    // Reflect origin to allow all HTTP/HTTPS web clients (mobile devices, secondary browsers, local IP network, hosted domains)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

/**
 * High-frequency internal endpoints that must be skipped by rate limiting.
 */
const SKIP_RATE_LIMIT_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/logout',
  '/api/v1/auth/refresh-token',
  '/api/v1/auth/system-status',
  '/api/v1/health',
  '/api/v1/notifications/unread-count',
  '/api/v1/chat/unread-count',
];

const shouldSkip = (req: Request): boolean => {
  // Always skip rate limiting in development environment
  if (env.NODE_ENV === 'development') return true;
  const targetUrl = req.originalUrl || req.url || req.path || '';
  return SKIP_RATE_LIMIT_PATHS.some((path) => targetUrl.includes(path));
};

/**
 * Global Rate Limiter
 */
export const globalRateLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  handler: (_req, res) => {
    return ApiResponse.error(
      res,
      MESSAGES.RATE_LIMIT_EXCEEDED,
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  },
});

/**
 * Auth-specific Rate Limiter
 */
export const authRateLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  handler: (_req, res) => {
    return ApiResponse.error(
      res,
      'Too many authentication attempts. Please wait 15 minutes before trying again.',
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  },
});
