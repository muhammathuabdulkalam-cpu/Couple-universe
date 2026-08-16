import { Router } from 'express';
import { completeOnboarding, getOnboardingState, updateProfileDetails } from '../controllers/onboarding.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/state', getOnboardingState);
router.patch('/profile', updateProfileDetails);
router.post('/complete', completeOnboarding);

export default router;
