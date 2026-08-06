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
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/flac',
  'audio/x-flac',
  'audio/x-mpeg-3',
  'audio/x-mp3',
  'audio/mpg',
  'audio/x-mpg',
  'application/octet-stream',
  'audio/ogg',
];

const audioExtensions = ['.mp3', '.m4a', '.aac', '.wav', '.flac', '.ogg', '.wma'];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const mime = (file.mimetype || '').toLowerCase();
  const ext = (file.originalname || '').toLowerCase().slice(file.originalname.lastIndexOf('.'));

  if (allowedMimes.includes(mime) || audioExtensions.includes(ext) || mime.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Unsupported file type: ${file.mimetype}. Supported audio formats: MP3, M4A, AAC, WAV, FLAC`,
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
