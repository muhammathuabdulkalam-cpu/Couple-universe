import { Router } from 'express';
import {
  adminLogin,
  adminLogout,
  getAdminDashboard,
} from '../controllers/admin.controller';
import { deleteUploadedSong, getUploadedSongs } from '../controllers/music.controller';
import { requireAdmin } from '../middlewares/admin.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import adminInvitedUserRouter from './adminInvitedUser.route';
import adminRelationshipRouter from './adminRelationship.route';
import adminUserRouter from './adminUser.route';

const router = Router();

// Public Admin Login Route
router.post('/login', adminLogin);

// Protected Admin Routes (Require Auth + ADMIN Role)
router.use(authenticate, requireAdmin);

router.get('/dashboard', getAdminDashboard);
router.post('/logout', adminLogout);

// Admin Songs Management Routes
router.get('/songs', getUploadedSongs);
router.delete('/songs/:providerSongId', deleteUploadedSong);

// Phase 2 User & Relationship Management Routes
router.use('/users', adminUserRouter);
router.use('/relationships', adminRelationshipRouter);
router.use('/invited-users', adminInvitedUserRouter);

export default router;
