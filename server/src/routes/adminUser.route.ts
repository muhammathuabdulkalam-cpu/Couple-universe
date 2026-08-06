import { Router } from 'express';
import {
  activateUser,
  bulkAction,
  createUser,
  exportUsersCSV,
  generateUserInvite,
  listUsers,
  softDeleteUser,
  suspendUser,
  updateUser,
} from '../controllers/adminUser.controller';

const router = Router();

router.get('/', listUsers);
router.get('/export', exportUsersCSV);
router.post('/', createUser);
router.post('/bulk', bulkAction);
router.put('/:id', updateUser);
router.patch('/:id/suspend', suspendUser);
router.patch('/:id/activate', activateUser);
router.delete('/:id', softDeleteUser);
router.post('/:id/invite', generateUserInvite);

export default router;
