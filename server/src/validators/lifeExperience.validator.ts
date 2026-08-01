import { z } from 'zod';

export const createDiarySchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    mediaIds: z.array(z.string()).optional(),
    mood: z.string().optional().default('ROMANTIC'),
    date: z.string().optional(),
    visibility: z.enum(['PRIVATE', 'COUPLE', 'FAMILY']).default('COUPLE'),
  }),
});

export const createBucketItemSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    category: z.string().default('TRAVEL'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
    status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED']).default('PLANNED'),
    mediaId: z.string().optional().nullable(),
  }),
});

export const createWishlistItemSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    imageMediaId: z.string().optional().nullable(),
    price: z.number().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
    status: z.enum(['WISHED', 'PURCHASED']).default('WISHED'),
  }),
});

export const createGoalSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    progress: z.number().min(0).max(100).default(0),
    targetDate: z.string().optional(),
    status: z.enum(['ACTIVE', 'ACHIEVED', 'PAUSED']).default('ACTIVE'),
  }),
});

export const createMoodEntrySchema = z.object({
  body: z.object({
    mood: z.enum(['HAPPY', 'LOVED', 'SAD', 'EXCITED', 'ANGRY', 'TIRED']),
    note: z.string().optional(),
  }),
});

export const createNoteSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    isPinned: z.boolean().default(false),
  }),
});

export const createMemoryCapsuleSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    unlockDate: z.string().min(1, 'Unlock date is required'),
    mediaIds: z.array(z.string()).optional(),
    message: z.string().optional(),
  }),
});

export const createCountdownSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    targetDate: z.string().min(1, 'Target date is required'),
    type: z.enum(['ANNIVERSARY', 'BIRTHDAY', 'TRIP', 'GOAL', 'CUSTOM']).default('CUSTOM'),
  }),
});
