import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { HTTP_STATUS, PLATFORM_CONSTANTS, ROLES } from '../constants';
import { Activity } from '../models/activity.model';
import { Album } from '../models/album.model';
import { IMedia, Media } from '../models/media.model';
import { CloudinaryService } from '../services/cloudinary.service';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

/**
 * Upload Single Media File
 */
export const uploadMedia = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No file provided for upload.', HTTP_STATUS.BAD_REQUEST);
  }

  const { title, description, caption, tags, visibility, album, targetFolder } = req.body;
  const user = req.user!;

  // Parse tags if provided as JSON string or comma list
  let parsedTags: string[] = [];
  if (Array.isArray(tags)) {
    parsedTags = tags;
  } else if (typeof tags === 'string') {
    try {
      parsedTags = JSON.parse(tags);
    } catch {
      parsedTags = tags.split(',').map((t) => t.trim());
    }
  }

  const isProfileUpload = parsedTags.includes('profile') || title === 'Profile Picture';

  // If uploading a new profile picture, clean up and delete previous profile avatar uploads
  if (isProfileUpload) {
    try {
      const oldProfileAssets = await Media.find({
        owner: user._id,
        $or: [{ tags: 'profile' }, { title: 'Profile Picture' }],
      });

      for (const oldAsset of oldProfileAssets) {
        if (oldAsset.cloudinaryPublicId) {
          await CloudinaryService.deleteAsset(oldAsset.cloudinaryPublicId);
        }
      }
      await Media.deleteMany({
        owner: user._id,
        $or: [{ tags: 'profile' }, { title: 'Profile Picture' }],
      });
    } catch (_err) {
      // Non-blocking cleanup
    }
  }

  // Determine Cloudinary target folder
  const folder = targetFolder || (isProfileUpload ? 'afrin-universe/profiles' : 'afrin-universe/gallery');

  // Upload file buffer to Cloudinary
  const uploadResult = await CloudinaryService.uploadBuffer(req.file.buffer, folder, req.file.originalname);

  // Calculate Aspect Ratio & Orientation
  const width = uploadResult.width;
  const height = uploadResult.height;
  const aspectRatio = parseFloat((width / height).toFixed(2));
  let orientation: 'PORTRAIT' | 'LANDSCAPE' | 'SQUARE' = 'SQUARE';

  if (width > height) {
    orientation = 'LANDSCAPE';
  } else if (height > width) {
    orientation = 'PORTRAIT';
  }

  // Create Media document in MongoDB Atlas
  const media = await Media.create({
    owner: user._id,
    createdBy: user._id,
    updatedBy: user._id,
    album: album || undefined,
    title: title || req.file.originalname,
    description,
    caption,
    tags: parsedTags,
    visibility: visibility || 'COUPLE',
    url: uploadResult.secureUrl,
    secureUrl: uploadResult.secureUrl,
    optimizedUrl: uploadResult.optimizedUrl,
    thumbnailUrl: uploadResult.thumbnailUrl,
    cloudinaryPublicId: uploadResult.publicId,
    cloudinaryFolder: folder,
    mimeType: req.file.mimetype,
    format: uploadResult.format,
    fileSize: uploadResult.bytes,
    width: uploadResult.width,
    height: uploadResult.height,
    aspectRatio,
    orientation,
    duration: uploadResult.duration,
  });

  if (album) {
    await Album.findByIdAndUpdate(album, {
      $inc: { mediaCount: 1 },
      coverImage: media.thumbnailUrl,
    });
  }

  return ApiResponse.created(res, 'Media uploaded successfully', media);
});

/**
 * Upload Multiple Media Files (Batch Upload)
 */
export const uploadMultipleMedia = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    throw new AppError('No files provided for batch upload.', HTTP_STATUS.BAD_REQUEST);
  }

  const { visibility, album, targetFolder, tags } = req.body;
  const user = req.user!;
  const folder = targetFolder || 'afrin-universe/gallery';

  let parsedTags: string[] = [];
  if (Array.isArray(tags)) parsedTags = tags;
  else if (typeof tags === 'string') {
    try {
      parsedTags = JSON.parse(tags);
    } catch {
      parsedTags = tags.split(',').map((t) => t.trim());
    }
  }

  const uploadedMediaList: IMedia[] = [];

  for (const file of files) {
    const uploadResult = await CloudinaryService.uploadBuffer(file.buffer, folder, file.originalname);

    const width = uploadResult.width;
    const height = uploadResult.height;
    const aspectRatio = parseFloat((width / height).toFixed(2));
    let orientation: 'PORTRAIT' | 'LANDSCAPE' | 'SQUARE' = 'SQUARE';

    if (width > height) orientation = 'LANDSCAPE';
    else if (height > width) orientation = 'PORTRAIT';

    const media = await Media.create({
      owner: user._id,
      createdBy: user._id,
      updatedBy: user._id,
      album: album || undefined,
      title: file.originalname,
      tags: parsedTags,
      visibility: visibility || 'COUPLE',
      url: uploadResult.secureUrl,
      secureUrl: uploadResult.secureUrl,
      optimizedUrl: uploadResult.optimizedUrl,
      thumbnailUrl: uploadResult.thumbnailUrl,
      cloudinaryPublicId: uploadResult.publicId,
      cloudinaryFolder: folder,
      format: uploadResult.format,
      width,
      height,
      aspectRatio,
      orientation,
      mimeType: file.mimetype,
      fileSize: uploadResult.bytes,
      duration: uploadResult.duration,
    });

    uploadedMediaList.push(media);
  }

  if (album && uploadedMediaList.length > 0) {
    await Album.findByIdAndUpdate(album, {
      $inc: { mediaCount: uploadedMediaList.length },
      coverImage: uploadedMediaList[0].thumbnailUrl,
    });
  }

  return ApiResponse.created(res, `${uploadedMediaList.length} files uploaded successfully`, uploadedMediaList);
});

/**
 * Get Media Directory (Paginated, Filtered, Sorted)
 * Excludes profile pictures from gallery/vault by default
 */
export const getMedia = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || PLATFORM_CONSTANTS.DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string, 10) || PLATFORM_CONSTANTS.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const user = req.user!;
  const { album, isFavorite, isArchived, isDeleted, search, tag, orientation } = req.query;

  const filter: any = {};

  // Soft Delete filter
  if (isDeleted === 'true') {
    filter.isDeleted = true;
  } else {
    filter.isDeleted = false;
  }

  // Favorite & Archive filters
  if (isFavorite === 'true') filter.isFavorite = true;
  if (isArchived === 'true') filter.isArchived = true;
  else if (isDeleted !== 'true') filter.isArchived = false;

  // Album filter
  if (album) filter.album = album;

  // Orientation & Tag filters
  if (orientation) filter.orientation = orientation;
  if (tag) {
    filter.tags = tag;
  } else {
    // Exclude profile avatar pictures from main gallery/vault views
    filter.tags = { $ne: 'profile' };
    filter.title = { $ne: 'Profile Picture' };
  }

  // Search Query filter (Title, Caption, Description)
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { caption: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  // Role visibility permissions
  if (user.role === ROLES.SUPER_OWNER || user.role === ROLES.CO_OWNER) {
    filter.visibility = { $in: ['COUPLE', 'PUBLIC', 'FRIENDS', 'PRIVATE'] };
  } else {
    filter.$or = [{ owner: user._id }, { visibility: { $in: ['PUBLIC', 'FRIENDS'] } }];
  }

  const total = await Media.countDocuments(filter);
  const mediaList = await Media.find(filter)
    .populate('owner', 'name email avatar role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return ApiResponse.success(res, 'Media retrieved successfully', mediaList, HTTP_STATUS.OK, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

/**
 * Get Media By ID
 */
export const getMediaById = catchAsync(async (req: Request, res: Response) => {
  const media = await Media.findOne({ _id: req.params.id, isDeleted: false }).populate(
    'owner',
    'name email avatar role'
  );

  if (!media) {
    throw new AppError('Media asset not found.', HTTP_STATUS.NOT_FOUND);
  }

  return ApiResponse.success(res, 'Media retrieved successfully', media);
});

/**
 * Update Media Metadata
 */
export const updateMedia = catchAsync(async (req: Request, res: Response) => {
  const { title, description, caption, tags, visibility, isFavorite, isArchived } = req.body;
  const user = req.user!;

  const media = await Media.findOne({ _id: req.params.id, isDeleted: false });
  if (!media) {
    throw new AppError('Media asset not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (media.owner.toString() !== user._id.toString() && user.role !== ROLES.SUPER_OWNER) {
    throw new AppError('Permission denied to edit this media asset.', HTTP_STATUS.FORBIDDEN);
  }

  if (title !== undefined) media.title = title;
  if (description !== undefined) media.description = description;
  if (caption !== undefined) media.caption = caption;
  if (tags !== undefined) media.tags = tags;
  if (visibility !== undefined) media.visibility = visibility;
  if (isFavorite !== undefined) media.isFavorite = isFavorite;
  if (isArchived !== undefined) media.isArchived = isArchived;

  media.updatedBy = user._id as any;
  await media.save();

  return ApiResponse.success(res, 'Media updated successfully', media);
});

/**
 * Toggle Favorite Status
 */
export const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
  const media = await Media.findOne({ _id: req.params.id, isDeleted: false });
  if (!media) {
    throw new AppError('Media asset not found.', HTTP_STATUS.NOT_FOUND);
  }

  media.isFavorite = !media.isFavorite;
  await media.save();

  return ApiResponse.success(
    res,
    `Media ${media.isFavorite ? 'marked as favorite' : 'removed from favorites'}`,
    media
  );
});

/**
 * Archive Media Asset
 */
export const archiveMedia = catchAsync(async (req: Request, res: Response) => {
  const media = await Media.findOne({ _id: req.params.id, isDeleted: false });
  if (!media) {
    throw new AppError('Media asset not found.', HTTP_STATUS.NOT_FOUND);
  }

  media.isArchived = true;
  await media.save();

  return ApiResponse.success(res, 'Media archived successfully', media);
});

/**
 * Soft Delete Media (Move to Recycle Bin) with Activity fallback
 */
export const softDeleteMedia = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  let media = await Media.findById(id);
  if (!media) {
    // Fallback: check if id belongs to an Activity (Social Feed Post)
    const activity = await Activity.findById(id);
    if (activity) {
      await activity.deleteOne();
      return ApiResponse.success(res, 'Post deleted successfully');
    }
    throw new AppError('Media asset not found.', HTTP_STATUS.NOT_FOUND);
  }

  // If Cloudinary asset exists, delete it
  if (media.cloudinaryPublicId) {
    try {
      await CloudinaryService.deleteAsset(media.cloudinaryPublicId);
    } catch (_e) {}
  }

  await media.deleteOne();

  return ApiResponse.success(res, 'Media permanently deleted', media);
});

/**
 * Restore Soft-Deleted Media
 */
export const restoreMedia = catchAsync(async (req: Request, res: Response) => {
  const media = await Media.findOne({ _id: req.params.id, isDeleted: true });
  if (!media) {
    throw new AppError('Media asset not found in trash.', HTTP_STATUS.NOT_FOUND);
  }

  media.isDeleted = false;
  media.deletedAt = undefined;
  await media.save();

  return ApiResponse.success(res, 'Media restored successfully', media);
});

/**
 * Permanent Delete Media (Deletes from Cloudinary & DB)
 */
export const permanentDeleteMedia = catchAsync(async (req: Request, res: Response) => {
  const media = await Media.findById(req.params.id);
  if (!media) {
    throw new AppError('Media asset not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (media.cloudinaryPublicId) {
    await CloudinaryService.deleteAsset(media.cloudinaryPublicId);
  }

  if (media.album) {
    await Album.findByIdAndUpdate(media.album, {
      $inc: { mediaCount: -1 },
    });
  }

  await media.deleteOne();

  return ApiResponse.success(res, 'Media permanently deleted');
});
