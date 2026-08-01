import { z } from 'zod';

export const createAlbumSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Album name is required').max(100),
    description: z.string().max(500).optional(),
    coverImage: z.string().optional(),
    albumType: z.enum(['DEFAULT', 'FAVORITES', 'TRAVEL', 'MARRIAGE', 'BABY', 'FAMILY', 'CUSTOM', 'ARCHIVE']).default('CUSTOM'),
    visibility: z.enum(['PRIVATE', 'COUPLE', 'FAMILY', 'FRIENDS', 'PUBLIC']).default('COUPLE'),
    parentAlbum: z.string().optional().nullable(),
  }),
});

export const updateAlbumSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    coverImage: z.string().optional(),
    visibility: z.enum(['PRIVATE', 'COUPLE', 'FAMILY', 'FRIENDS', 'PUBLIC']).optional(),
  }),
});
