import { z } from 'zod';

export const unlockSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    expressionHash: z.string().min(1, 'Expression hash is required'),
  }),
});

export const updateSecretSchema = z.object({
  body: z.object({
    expression: z.string().min(3, 'Expression must be at least 3 characters'),
  }),
});
