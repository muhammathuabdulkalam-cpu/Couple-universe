import { Router } from 'express';
import { getProfile, getSuperOwnerProfile, updateProfile } from '../controllers/profile.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/super-owner', getSuperOwnerProfile);
router.get('/:id?', getProfile);
router.patch('/', updateProfile);

export default router;
