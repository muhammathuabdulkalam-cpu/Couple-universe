import { Router } from 'express';
import { ROLES } from '../constants';
import {
  archiveMedia,
  getMedia,
  getMediaById,
  permanentDeleteMedia,
  restoreMedia,
  softDeleteMedia,
  toggleFavorite,
  updateMedia,
  uploadMedia,
  uploadMultipleMedia,
} from '../controllers/media.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { uploadMultipleMedia as uploadMultipleMulter, uploadSingleMedia as uploadSingleMulter } from '../middlewares/upload.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateMediaSchema } from '../validators/media.validator';

const router = Router();

// Apply authentication middleware
router.use(authenticate);

// Single file upload routes (support both /upload and /)
router.post('/upload', uploadSingleMulter, uploadMedia);
router.post('/', uploadSingleMulter, uploadMedia);

// Multiple file upload route
router.post('/upload-multiple', uploadMultipleMulter, uploadMultipleMedia);

// Media Directory & Metadata routes
router.get('/', getMedia);
router.get('/:id', getMediaById);
router.patch('/:id', validate(updateMediaSchema), updateMedia);
router.patch('/:id/favorite', toggleFavorite);
router.patch('/:id/archive', archiveMedia);
router.delete('/:id', softDeleteMedia);
router.patch('/:id/restore', restoreMedia);
router.delete('/:id/permanent', authorize(ROLES.SUPER_OWNER, ROLES.CO_OWNER), permanentDeleteMedia);

export default router;
