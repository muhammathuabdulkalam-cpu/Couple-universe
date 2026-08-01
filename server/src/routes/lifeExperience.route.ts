import { Router } from 'express';
import {
  createBucketItem,
  createCountdown,
  createDiaryEntry,
  createGoal,
  createMemoryCapsule,
  createNote,
  createWishlistItem,
  deleteDiaryEntry,
  getBucketItems,
  getCountdowns,
  getDiaryEntries,
  getGoals,
  getMemoryCapsules,
  getMoodEntries,
  getNotes,
  getWishlistItems,
  logMood,
  toggleBucketStatus,
  updateGoalProgress,
} from '../controllers/lifeExperience.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createBucketItemSchema,
  createCountdownSchema,
  createDiarySchema,
  createGoalSchema,
  createMemoryCapsuleSchema,
  createMoodEntrySchema,
  createNoteSchema,
  createWishlistItemSchema,
} from '../validators/lifeExperience.validator';

const router = Router();

router.use(authenticate);

// Diary Routes
router.post('/diary', validate(createDiarySchema), createDiaryEntry);
router.get('/diary', getDiaryEntries);
router.delete('/diary/:id', deleteDiaryEntry);

// Bucket List Routes
router.post('/bucket-list', validate(createBucketItemSchema), createBucketItem);
router.get('/bucket-list', getBucketItems);
router.patch('/bucket-list/:id/toggle', toggleBucketStatus);

// Wishlist Routes
router.post('/wishlist', validate(createWishlistItemSchema), createWishlistItem);
router.get('/wishlist', getWishlistItems);

// Goals Routes
router.post('/goals', validate(createGoalSchema), createGoal);
router.get('/goals', getGoals);
router.patch('/goals/:id/progress', updateGoalProgress);

// Mood Tracker Routes
router.post('/mood', validate(createMoodEntrySchema), logMood);
router.get('/mood', getMoodEntries);

// Shared Notes Routes
router.post('/notes', validate(createNoteSchema), createNote);
router.get('/notes', getNotes);

// Memory Capsules Routes
router.post('/memory-capsules', validate(createMemoryCapsuleSchema), createMemoryCapsule);
router.get('/memory-capsules', getMemoryCapsules);

// Countdowns Routes
router.post('/countdowns', validate(createCountdownSchema), createCountdown);
router.get('/countdowns', getCountdowns);

export default router;
