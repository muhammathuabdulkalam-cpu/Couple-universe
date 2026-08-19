import { Router } from 'express';
import {
  createInvitedUser,
  deleteInvitedUser,
  listInvitedUsers,
} from '../controllers/adminInvitedUser.controller';

const router = Router();

router.get('/', listInvitedUsers);
router.post('/', createInvitedUser);
router.delete('/:id', deleteInvitedUser);
router.post('/:id/delete', deleteInvitedUser);
router.all('/:id/delete', deleteInvitedUser);

export default router;
