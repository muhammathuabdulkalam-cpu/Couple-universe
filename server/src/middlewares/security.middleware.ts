import cors from 'cors';
import { Request, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from '../config/env.config';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { ApiResponse } from '../utils/ApiResponse';

// Helmet Security Headers Middleware
export const helmetMiddleware = helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: env.NODE_ENV === 'production',
});

// CORS Configuration Middleware
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || origin === env.CORS_ORIGIN || env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy blocked access for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

/**
 * High-frequency internal endpoints that must be skipped by rate limiting.
 * These are called automatically by the React client on every page load / tab focus.
 */
const SKIP_RATE_LIMIT_PATHS = [
  '/api/v1/auth/refresh-token',
  '/api/v1/auth/system-status',
  '/api/v1/health',
];

const shouldSkip = (req: Request): boolean =>
  SKIP_RATE_LIMIT_PATHS.some((path) => req.path === path || req.url?.startsWith(path));

/**
 * Global Rate Limiter
 * Applied to every API route EXCEPT the whitelisted internal paths above.
 * 1 000 requests per 15-minute window per IP — generous for a private 2-person app.
 */
export const globalRateLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
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
 * Auth-specific Rate Limiter (login / register / password-reset)
 * Stricter: 50 attempts per 15-minute window to prevent brute-force.
 * Applied only on routes that need it (see auth.route.ts).
 */
export const authRateLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return ApiResponse.error(
      res,
      'Too many authentication attempts. Please wait 15 minutes before trying again.',
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  },
});
