import { Router } from 'express';
import { ROLES } from '../constants';
import {
  createCalendarEvent,
  getCalendarEventById,
  getCalendarEvents,
  getTodaySchedule,
  permanentDeleteCalendarEvent,
  restoreCalendarEvent,
  softDeleteCalendarEvent,
  toggleComplete,
  updateCalendarEvent,
} from '../controllers/calendarEvent.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createCalendarEventSchema,
  updateCalendarEventSchema,
} from '../validators/calendarEvent.validator';

const router = Router();

router.use(authenticate);

router.post('/', validate(createCalendarEventSchema), createCalendarEvent);
router.get('/', getCalendarEvents);
router.get('/today', getTodaySchedule);
router.get('/:id', getCalendarEventById);
router.patch('/:id', validate(updateCalendarEventSchema), updateCalendarEvent);
router.patch('/:id/complete', toggleComplete);
router.delete('/:id', softDeleteCalendarEvent);
router.patch('/:id/restore', restoreCalendarEvent);
router.delete('/:id/permanent', authorize(ROLES.SUPER_OWNER, ROLES.CO_OWNER), permanentDeleteCalendarEvent);

export default router;
