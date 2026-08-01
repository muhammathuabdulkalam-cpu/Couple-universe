import { Router } from 'express';
import { ROLES } from '../constants';
import {
  archiveTimelineEvent,
  createTimelineEvent,
  getTodayInHistory,
  getTimelineEventById,
  getTimelineEvents,
  permanentDeleteTimelineEvent,
  restoreTimelineEvent,
  softDeleteTimelineEvent,
  toggleFavorite,
  updateTimelineEvent,
} from '../controllers/timelineEvent.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createTimelineEventSchema,
  updateTimelineEventSchema,
} from '../validators/timelineEvent.validator';

const router = Router();

router.use(authenticate);

router.post('/', validate(createTimelineEventSchema), createTimelineEvent);
router.get('/', getTimelineEvents);
router.get('/today-in-history', getTodayInHistory);
router.get('/:id', getTimelineEventById);
router.patch('/:id', validate(updateTimelineEventSchema), updateTimelineEvent);
router.patch('/:id/favorite', toggleFavorite);
router.patch('/:id/archive', archiveTimelineEvent);
router.delete('/:id', softDeleteTimelineEvent);
router.patch('/:id/restore', restoreTimelineEvent);
router.delete('/:id/permanent', authorize(ROLES.SUPER_OWNER, ROLES.CO_OWNER), permanentDeleteTimelineEvent);

export default router;
