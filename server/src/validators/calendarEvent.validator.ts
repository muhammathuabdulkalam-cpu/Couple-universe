import { z } from 'zod';

export const createCalendarEventSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(1000).optional(),
    eventType: z
      .enum([
        'ANNIVERSARY',
        'BIRTHDAY',
        'FIRST_CHAT',
        'FIRST_CALL',
        'FIRST_MEETING',
        'DATE',
        'TRIP',
        'VACATION',
        'SHOPPING',
        'MOVIE',
        'DINNER',
        'WORK',
        'FAMILY',
        'MARRIAGE',
        'ENGAGEMENT',
        'BABY',
        'DOCTOR',
        'REMINDER',
        'CUSTOM',
      ])
      .default('DATE'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    allDay: z.boolean().default(false),
    timezone: z.string().default('UTC'),
    location: z
      .object({
        name: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
      })
      .optional(),
    visibility: z.enum(['PRIVATE', 'COUPLE', 'FAMILY', 'FRIENDS', 'PUBLIC']).default('COUPLE'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
    color: z.string().default('#06B6D4'),
    icon: z.string().default('📅'),
    coverMediaId: z.string().optional().nullable(),
    timelineEventId: z.string().optional().nullable(),
    participants: z.array(z.string()).optional(),
    notifications: z
      .array(
        z.object({
          triggerTime: z.string(),
          offsetMinutes: z.number().default(15),
          channel: z.enum(['IN_APP', 'EMAIL', 'PUSH']).default('IN_APP'),
        })
      )
      .optional(),
    repeatRule: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('NONE'),
    isCompleted: z.boolean().default(false),
  }),
});

export const updateCalendarEventSchema = z.object({
  body: createCalendarEventSchema.shape.body.partial(),
});
