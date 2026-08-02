import { Router } from 'express';
import { createActivityHandler, deleteActivity, getActivityById, getFeed } from '../controllers/activity.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', getFeed);
router.get('/:id', getActivityById);
router.post('/', createActivityHandler);
router.delete('/:id', deleteActivity);

export default router;
