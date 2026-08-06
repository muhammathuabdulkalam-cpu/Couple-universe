/**
 * System-wide constants for Afrin Universe ❤️
 */

export const ROLES = {
  SUPER_OWNER: 'SUPER_OWNER',
  CO_OWNER: 'CO_OWNER',
  INVITED_USER: 'INVITED_USER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  INVITED: 'INVITED',
  PENDING: 'PENDING',
  DELETED: 'DELETED',
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const PLATFORM_CONSTANTS = {
  APP_NAME: 'Afrin Universe ❤️',
  RELATIONSHIP_START_DATE: '2026-03-26',
  API_PREFIX: '/api/v1',
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  COOKIE_REFRESH_TOKEN_KEY: 'au_refresh_token',
} as const;

export const MESSAGES = {
  SERVER_HEALTHY: 'Afrin Universe ❤️ Core Server is online and operating optimally.',
  ROUTE_NOT_FOUND: 'The requested API route does not exist in Afrin Universe.',
  INTERNAL_ERROR: 'An unexpected system error occurred. Please try again later.',
  UNAUTHORIZED: 'Authentication required. Please log in to access this resource.',
  FORBIDDEN: 'Access denied. You do not possess the required permissions.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please cool down before retrying.',
} as const;
