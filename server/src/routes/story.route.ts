import { Router } from 'express';
import {
  createStory,
  deleteStory,
  getActiveStories,
  getStoryById,
  reactToStory,
  viewStory,
} from '../controllers/story.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createStory);
router.get('/', getActiveStories);
router.get('/:id', getStoryById);
router.post('/:id/view', viewStory);
router.post('/:id/react', reactToStory);
router.delete('/:id', deleteStory);

export default router;
