import { Router } from 'express';
import { validateInviteToken } from '../controllers/publicInvite.controller';

const router = Router();

router.get('/validate/:token', validateInviteToken);

export default router;
