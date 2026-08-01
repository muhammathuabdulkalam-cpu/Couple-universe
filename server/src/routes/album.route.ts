import { Router } from 'express';
import {
  addMediaToAlbum,
  createAlbum,
  deleteAlbum,
  getAlbumById,
  getAlbums,
  removeMediaFromAlbum,
  updateAlbum,
} from '../controllers/album.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createAlbumSchema, updateAlbumSchema } from '../validators/album.validator';

const router = Router();

router.use(authenticate);

router.post('/', validate(createAlbumSchema), createAlbum);
router.get('/', getAlbums);
router.get('/:id', getAlbumById);
router.patch('/:id', validate(updateAlbumSchema), updateAlbum);
router.delete('/:id', deleteAlbum);
router.post('/:id/media', addMediaToAlbum);
router.delete('/:id/media/:mediaId', removeMediaFromAlbum);

export default router;
