import { Router } from 'express';
import { ROLES } from '../constants';
import {
  createInvite,
  deleteUser,
  forceLogoutUser,
  getInvites,
  getMe,
  getUsers,
  restoreUser,
  suspendUser,
  updateUserRole,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createInviteSchema, updateRoleSchema } from '../validators/user.validator';

const router = Router();

// Apply authentication to all user routes
router.use(authenticate);

router.get('/me', getMe);
router.get('/', authorize(ROLES.SUPER_OWNER, ROLES.CO_OWNER), getUsers);

// SUPER_OWNER Only Routes
router.post('/invites', authorize(ROLES.SUPER_OWNER), validate(createInviteSchema), createInvite);
router.get('/invites', authorize(ROLES.SUPER_OWNER), getInvites);
router.patch('/:id/suspend', authorize(ROLES.SUPER_OWNER), suspendUser);
router.patch('/:id/restore', authorize(ROLES.SUPER_OWNER), restoreUser);
router.delete('/:id', authorize(ROLES.SUPER_OWNER), deleteUser);
router.patch('/:id/role', authorize(ROLES.SUPER_OWNER), validate(updateRoleSchema), updateUserRole);
router.post('/:id/revoke-sessions', authorize(ROLES.SUPER_OWNER), forceLogoutUser);

export default router;
