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
    filename?: string,
    resourceType: 'auto' | 'image' | 'video' | 'raw' = 'auto'
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          filename_override: filename,
          use_filename: true,
          unique_filename: true,
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            logger.error(`❌ Cloudinary upload error: ${error?.message || 'Unknown upload error'}`);
            return reject(new AppError('Failed to upload file to Cloudinary storage.', 500));
          }

          let optimizedUrl = result.secure_url;
          let thumbnailUrl = result.secure_url;

          if (result.resource_type === 'image') {
            optimizedUrl = cloudinary.url(result.public_id, {
              fetch_format: 'auto',
              quality: 'auto',
              secure: true,
            });

            thumbnailUrl = cloudinary.url(result.public_id, {
              width: 400,
              height: 400,
              crop: 'fill',
              gravity: 'auto',
              fetch_format: 'auto',
              quality: 'auto',
              secure: true,
            });
          }

          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            optimizedUrl,
            thumbnailUrl,
            width: result.width || 800,
            height: result.height || 600,
            format: result.format || 'mp3',
            bytes: result.bytes || buffer.length,
            resourceType: result.resource_type || resourceType,
            duration: result.duration,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Delete asset from Cloudinary by Public ID (with fallback resource types & CDN cache invalidation)
   */
  public static async deleteAsset(publicId: string, resourceType: string = 'image'): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
      logger.info(`🗑️ Cloudinary asset delete [${publicId}] (${resourceType}): ${result.result}`);
      if (result.result === 'ok') return true;

      const alternates = ['video', 'raw', 'image'].filter((t) => t !== resourceType);
      for (const altType of alternates) {
        const altResult = await cloudinary.uploader.destroy(publicId, { resource_type: altType, invalidate: true });
        if (altResult.result === 'ok') {
          logger.info(`🗑️ Cloudinary asset deleted on fallback [${publicId}] (${altType}): ${altResult.result}`);
          return true;
        }
      }
      return false;
    } catch (error: any) {
      logger.error(`❌ Failed to delete Cloudinary asset [${publicId}]: ${error.message}`);
      return false;
    }
  }

  /**
   * Fetch all audio resources from Cloudinary (both video & raw resource_types)
   */
  public static async listAudioAssets(folderPrefix: string = 'afrin-universe/music/audio'): Promise<any[]> {
    const fetchResourcesForType = async (resourceType: string) => {
      let resources: any[] = [];
      let nextCursor: string | undefined = undefined;
      do {
        const options: any = {
          type: 'upload',
          resource_type: resourceType,
          prefix: folderPrefix,
          max_results: 500,
        };
        if (nextCursor) options.next_cursor = nextCursor;
        const res = await cloudinary.api.resources(options);
        resources = resources.concat(res.resources || []);
        nextCursor = res.next_cursor;
      } while (nextCursor);
      return resources;
    };

    const [videoAssets, rawAssets] = await Promise.all([
      fetchResourcesForType('video').catch(() => []),
      fetchResourcesForType('raw').catch(() => []),
    ]);

    return [...videoAssets, ...rawAssets];
  }

  /**
   * Fetch all gallery image & video resources from Cloudinary
   */
  public static async listGalleryAssets(folderPrefix: string = 'afrin-universe/gallery'): Promise<any[]> {
    const fetchResourcesForType = async (resourceType: string) => {
      let resources: any[] = [];
      let nextCursor: string | undefined = undefined;
      do {
        const options: any = {
          type: 'upload',
          resource_type: resourceType,
          prefix: folderPrefix,
          max_results: 500,
        };
        if (nextCursor) options.next_cursor = nextCursor;
        const res = await cloudinary.api.resources(options);
        resources = resources.concat(res.resources || []);
        nextCursor = res.next_cursor;
      } while (nextCursor);
      return resources;
    };

    const [imageAssets, videoAssets] = await Promise.all([
      fetchResourcesForType('image').catch(() => []),
      fetchResourcesForType('video').catch(() => []),
    ]);

    // Filter out audio files stored as video resource_type
    const trueVideoAssets = videoAssets.filter((v: any) => v.format !== 'mp3' && !v.public_id.includes('/music/audio'));

    return [...imageAssets, ...trueVideoAssets];
  }
}

