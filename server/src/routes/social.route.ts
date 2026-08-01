import { Router } from 'express';
import {
  blockUser,
  followUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
  unblockUser,
  unfollowUser,
} from '../controllers/social.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/follow/:userId', followUser);
router.delete('/unfollow/:userId', unfollowUser);
router.get('/follow-status/:userId', getFollowStatus);
router.get('/followers/:userId', getFollowers);
router.get('/following/:userId', getFollowing);
router.post('/block/:userId', blockUser);
router.delete('/unblock/:userId', unblockUser);

export default router;
