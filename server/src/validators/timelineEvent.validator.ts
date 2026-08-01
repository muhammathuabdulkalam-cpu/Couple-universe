import { z } from 'zod';

export const createTimelineEventSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    content: z.string().optional(),
    shortDescription: z.string().max(500).optional(),
    eventDate: z.string().min(1, 'Event date is required'),
    eventType: z
      .enum([
        'FIRST_CONVERSATION',
        'FIRST_CALL',
        'FIRST_MEETING',
        'FIRST_PHOTO',
        'DATE',
        'TRIP',
        'BIRTHDAY',
        'ANNIVERSARY',
        'CELEBRATION',
        'ACHIEVEMENT',
        'FAMILY_EVENT',
        'MARRIAGE',
        'BABY',
        'TRAVEL',
        'CUSTOM',
      ])
      .default('CUSTOM'),
    chapter: z
      .enum([
        'LOVE',
        'ENGAGEMENT',
        'MARRIAGE',
        'HONEYMOON',
        'TRAVEL',
        'FAMILY',
        'BABY',
        'CAREER',
        'HOME',
        'CUSTOM',
      ])
      .default('LOVE'),
    coverMediaId: z.string().optional().nullable(),
    mediaIds: z.array(z.string()).optional(),
    location: z
      .object({
        name: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
      })
      .optional(),
    weather: z.enum(['SUNNY', 'RAINY', 'CLOUDY', 'SNOW', 'WINDY']).optional(),
    mood: z
      .enum(['HAPPY', 'ROMANTIC', 'EXCITED', 'PEACEFUL', 'GRATEFUL', 'NOSTALGIC', 'MEMORABLE'])
      .default('ROMANTIC'),
    emoji: z.string().default('❤️'),
    importance: z.enum(['NORMAL', 'IMPORTANT', 'MILESTONE']).default('NORMAL'),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
    tags: z.array(z.string()).optional(),
    people: z.array(z.string()).optional(),
    visibility: z.enum(['PRIVATE', 'COUPLE', 'FAMILY', 'FRIENDS', 'PUBLIC']).default('COUPLE'),
  }),
});

export const updateTimelineEventSchema = z.object({
  body: createTimelineEventSchema.shape.body.partial(),
});
