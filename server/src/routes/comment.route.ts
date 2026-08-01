import { Router } from 'express';
import {
  createComment,
  deleteComment,
  getComments,
  likeComment,
  updateComment,
} from '../controllers/comment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createComment);
router.get('/:targetType/:targetId', getComments);
router.patch('/:id', updateComment);
router.delete('/:id', deleteComment);
router.post('/:id/like', likeComment);

export default router;
