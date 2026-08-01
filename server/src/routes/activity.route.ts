import { Router } from 'express';
import { createActivityHandler, deleteActivity, getFeed } from '../controllers/activity.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', getFeed);
router.post('/', createActivityHandler);
router.delete('/:id', deleteActivity);

export default router;
