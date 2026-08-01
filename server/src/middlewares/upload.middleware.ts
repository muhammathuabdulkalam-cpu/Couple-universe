import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { HTTP_STATUS } from '../constants';
import { AppError } from '../utils/AppError';

// Multer Memory Storage Configuration
const storage = multer.memoryStorage();

const allowedMimes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Unsupported file type: ${file.mimetype}. Supported types: JPG, PNG, WEBP, HEIC, MP4, MOV`,
        HTTP_STATUS.UNPROCESSABLE_ENTITY
      )
    );
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB Max Limit
  },
});

export const uploadSingleMedia = uploadMiddleware.single('file');
export const uploadMultipleMedia = uploadMiddleware.array('files', 10);
