import { Router } from 'express';
import {
  adminLogin,
  adminLogout,
  getAdminDashboard,
  getAdminRelationships,
  getAdminUserDetails,
  getAdminUsers,
} from '../controllers/admin.controller';
import { requireAdmin } from '../middlewares/admin.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import adminUserRouter from './adminUser.route';
import adminRelationshipRouter from './adminRelationship.route';

const router = Router();

// Public Admin Login Route
router.post('/login', adminLogin);

// Protected Admin Routes (Require Auth + ADMIN Role)
router.use(authenticate, requireAdmin);

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUserDetails);
router.get('/relationships', getAdminRelationships);
router.post('/logout', adminLogout);

// Phase 2 User & Relationship Management Routes
router.use('/users', adminUserRouter);
router.use('/relationships', adminRelationshipRouter);

export default router;

