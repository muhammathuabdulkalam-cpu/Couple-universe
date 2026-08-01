import { z } from 'zod';

export const createConversationSchema = z.object({
  body: z.object({
    type: z.enum(['PRIVATE', 'GROUP', 'RELATIONSHIP']).default('PRIVATE'),
    recipientId: z.string().optional(),
    groupName: z.string().optional(),
    groupDescription: z.string().optional(),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    conversationId: z.string().min(1, 'Conversation ID is required'),
    type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'VOICE', 'GIF', 'FILE']).default('TEXT'),
    content: z.string().optional(),
    mediaId: z.string().optional().nullable(),
    replyToMessageId: z.string().optional().nullable(),
  }),
});

export const addReactionSchema = z.object({
  body: z.object({
    emoji: z.string().min(1, 'Emoji is required'),
  }),
});

export const forwardMessageSchema = z.object({
  body: z.object({
    targetConversationId: z.string().min(1, 'Target Conversation ID is required'),
  }),
});
