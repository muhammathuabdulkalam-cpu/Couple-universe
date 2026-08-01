import { Router } from 'express';
import {
  createReport,
  getReports,
  resolveReport,
} from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createReport);
router.get('/', getReports);
router.patch('/:id/resolve', resolveReport);

export default router;
