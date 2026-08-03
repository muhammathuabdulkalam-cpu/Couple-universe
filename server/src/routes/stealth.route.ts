import { RequestHandler } from 'express';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  disableStealth,
  enableStealth,
  generateToken,
  getStealthConfig,
  regenerateToken,
  revokeToken,
  unlockStealth,
  updateSecret,
  validateToken,
} from '../controllers/stealth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { unlockSchema, updateSecretSchema } from '../validators/stealth.validator';
import { HTTP_STATUS } from '../constants';
import { ApiResponse } from '../utils/ApiResponse';

const router = Router();

// Rate limiter for public stealth endpoints (unlock attempts)
const stealthUnlockLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
  handler: (_req, res) => {
    return ApiResponse.error(
      res,
      'Too many requests. Please try again later.',
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  },
});

// Protected Routes (SUPER_OWNER only)
router.get('/config', authenticate, authorize('SUPER_OWNER'), getStealthConfig);
router.patch('/enable', authenticate, authorize('SUPER_OWNER'), enableStealth);
router.patch('/disable', authenticate, authorize('SUPER_OWNER'), disableStealth);
router.post('/generate', authenticate, authorize('SUPER_OWNER'), generateToken);
router.post('/regenerate', authenticate, authorize('SUPER_OWNER'), regenerateToken);
router.post('/revoke', authenticate, authorize('SUPER_OWNER'), revokeToken);
router.patch('/secret', authenticate, authorize('SUPER_OWNER'), validate(updateSecretSchema), updateSecret);

// Public Routes
router.get('/validate/:token', validateToken);
router.post('/unlock', stealthUnlockLimiter, validate(unlockSchema), unlockStealth);

export default router;
