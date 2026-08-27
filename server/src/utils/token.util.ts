import crypto from 'crypto';
import { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { PLATFORM_CONSTANTS, UserRole } from '../constants';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId?: string;
}

// Lifetime token generation (100 years duration = never expires)
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: '36500d',
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: '36500d',
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};

export const hashToken = (rawToken: string): string => {
  if (!rawToken || typeof rawToken !== 'string') return '';
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

// 100 years cookie expiration for lifetime persistent sessions
export const getCookieOptions = (): CookieOptions => {
  const maxAgeMs = 100 * 365 * 24 * 60 * 60 * 1000;

  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: maxAgeMs,
    path: '/',
  };
};

export const setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
  res.cookie(PLATFORM_CONSTANTS.COOKIE_REFRESH_TOKEN_KEY, refreshToken, getCookieOptions());
};

export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(PLATFORM_CONSTANTS.COOKIE_REFRESH_TOKEN_KEY, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
};
