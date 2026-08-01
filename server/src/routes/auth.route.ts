import { Router } from 'express';
import {
  changePassword,
  forgotPassword,
  getSystemAuthStatus,
  login,
  logout,
  refreshToken,
  register,
  resetPassword,
} from '../controllers/auth.controller';
import { getActiveSessions, revokeSession } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/security.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';

const router = Router();

// Public Auth Routes (system-status and refresh-token are NOT rate-limited — called internally on every page load)
router.get('/system-status', getSystemAuthStatus);
router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), resetPassword);

// Protected Auth & Session Routes
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.get('/sessions', authenticate, getActiveSessions);
router.delete('/sessions/:sessionId', authenticate, revokeSession);

export default router;
