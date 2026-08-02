import { Router } from 'express';
import {
  addReaction,
  createOrGetConversation,
  deleteConversation,
  deleteMessage,
  forwardMessage,
  getConversationById,
  getConversationMessages,
  getUnreadChatCount,
  getUserConversations,
  markMessageRead,
  searchChat,
  sendMessage,
  togglePinMessage,
} from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  addReactionSchema,
  createConversationSchema,
  forwardMessageSchema,
  sendMessageSchema,
} from '../validators/chat.validator';

const router = Router();

router.use(authenticate);

// Unread Count Endpoint
router.get('/unread-count', getUnreadChatCount);

// Search Endpoint
router.get('/search', searchChat);

// Conversation Endpoints
router.post('/conversations', validate(createConversationSchema), createOrGetConversation);
router.get('/conversations', getUserConversations);
router.get('/conversations/:id', getConversationById);
router.delete('/conversations/:id', deleteConversation);

// Message Endpoints
router.post('/messages', validate(sendMessageSchema), sendMessage);
router.get('/messages/:conversationId', getConversationMessages);
router.patch('/messages/:id/read', markMessageRead);
router.patch('/messages/:id/pin', togglePinMessage);
router.post('/messages/:id/reaction', validate(addReactionSchema), addReaction);
router.post('/messages/:id/forward', validate(forwardMessageSchema), forwardMessage);
router.delete('/messages/:id', deleteMessage);

export default router;
