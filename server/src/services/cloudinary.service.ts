import { UploadApiResponse } from 'cloudinary';
import cloudinary from '../config/cloudinary.config';
import { logger } from '../config/logger.config';
import { AppError } from '../utils/AppError';

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  optimizedUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  resourceType: string;
  duration?: number;
}

export class CloudinaryService {
  /**
   * Upload Buffer directly to Cloudinary via Stream
   */
  public static async uploadBuffer(
    buffer: Buffer,
    folder: string = 'afrin-universe/gallery',
    filename?: string
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          filename_override: filename,
          use_filename: true,
          unique_filename: true,
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            logger.error(`❌ Cloudinary upload error: ${error?.message || 'Unknown upload error'}`);
            return reject(new AppError('Failed to upload file to Cloudinary storage.', 500));
          }

          const optimizedUrl = cloudinary.url(result.public_id, {
            fetch_format: 'auto',
            quality: 'auto',
            secure: true,
          });

          const thumbnailUrl = cloudinary.url(result.public_id, {
            width: 400,
            height: 400,
            crop: 'fill',
            gravity: 'auto',
            fetch_format: 'auto',
            quality: 'auto',
            secure: true,
          });

          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            optimizedUrl,
            thumbnailUrl,
            width: result.width || 800,
            height: result.height || 600,
            format: result.format || 'jpg',
            bytes: result.bytes || buffer.length,
            resourceType: result.resource_type || 'image',
            duration: result.duration,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Delete asset from Cloudinary by Public ID
   */
  public static async deleteAsset(publicId: string, resourceType: string = 'image'): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      logger.info(`🗑️ Cloudinary asset deleted [${publicId}]: ${result.result}`);
      return result.result === 'ok';
    } catch (error: any) {
      logger.error(`❌ Failed to delete Cloudinary asset [${publicId}]: ${error.message}`);
      return false;
    }
  }
}
