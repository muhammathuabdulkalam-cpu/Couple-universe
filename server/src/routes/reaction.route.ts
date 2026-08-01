import { Router } from 'express';
import {
  getMyReaction,
  getReactions,
  toggleReaction,
} from '../controllers/reaction.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/:targetType/:targetId', toggleReaction);
router.get('/:targetType/:targetId', getReactions);
router.get('/:targetType/:targetId/mine', getMyReaction);

export default router;
