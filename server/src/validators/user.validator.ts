import { z } from 'zod';
import { ROLES } from '../constants';

export const createInviteSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid target email format').optional().or(z.literal('')),
    targetRole: z.enum([ROLES.CO_OWNER, ROLES.INVITED_USER]).default(ROLES.CO_OWNER),
    expiresInDays: z.number().int().min(1).max(30).default(7),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum([ROLES.SUPER_OWNER, ROLES.CO_OWNER, ROLES.INVITED_USER]),
  }),
});
