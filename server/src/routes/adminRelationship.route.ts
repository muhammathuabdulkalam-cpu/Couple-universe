import { Router } from 'express';
import {
  addMember,
  archiveRelationship,
  createRelationship,
  generateRelationshipInvite,
  getRelationshipInvites,
  listRelationships,
  regenerateRelationshipInvite,
  removeMember,
  replaceMember,
  restoreRelationship,
  revokeRelationshipInvite,
  updateRelationship,
} from '../controllers/adminRelationship.controller';

const router = Router();

router.get('/', listRelationships);
router.post('/', createRelationship);
router.put('/:id', updateRelationship);
router.patch('/:id/archive', archiveRelationship);
router.patch('/:id/restore', restoreRelationship);
router.post('/:id/members/add', addMember);
router.delete('/:id/members/:userId', removeMember);
router.patch('/:id/members/replace', replaceMember);
router.post('/:id/invite', generateRelationshipInvite);
router.patch('/:id/invite/:code/revoke', revokeRelationshipInvite);
router.post('/:id/invite/:code/regenerate', regenerateRelationshipInvite);
router.get('/:id/invites', getRelationshipInvites);

export default router;
