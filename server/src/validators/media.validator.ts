import { z } from 'zod';

export const updateMediaSchema = z.object({
  body: z.object({
    title: z.string().trim().max(150).optional(),
    description: z.string().trim().max(1000).optional(),
    caption: z.string().trim().max(500).optional(),
    tags: z.array(z.string()).optional(),
    peopleTagged: z.array(z.string()).optional(),
    visibility: z.enum(['PRIVATE', 'COUPLE', 'FAMILY', 'FRIENDS', 'PUBLIC']).optional(),
    album: z.string().optional().nullable(),
    memoryDate: z.string().optional(),
  }),
});
