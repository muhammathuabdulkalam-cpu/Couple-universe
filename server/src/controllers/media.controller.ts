import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { HTTP_STATUS, PLATFORM_CONSTANTS, ROLES } from '../constants';
import { Activity } from '../models/activity.model';
import { Album } from '../models/album.model';
import { IMedia, Media } from '../models/media.model';
import { User } from '../models/user.model';
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

  if (isProfileUpload) {
    await User.findByIdAndUpdate(user._id, { avatar: uploadResult.secureUrl });
  }

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
 * Helper to sync Cloudinary gallery assets into MongoDB Media records
 */
export async function syncCloudinaryGalleryToDb(ownerId?: mongoose.Types.ObjectId): Promise<number> {
  try {
    const assets = await CloudinaryService.listGalleryAssets('afrin-universe/gallery');
    if (!assets || assets.length === 0) return 0;

    let activeOwnerId = ownerId;
    if (!activeOwnerId) {
      const superOwner = await User.findOne({ role: ROLES.SUPER_OWNER, isDeleted: false });
      if (superOwner) activeOwnerId = superOwner._id;
      else {
        const adminUser = await User.findOne({ role: ROLES.ADMIN, isDeleted: false });
        if (adminUser) activeOwnerId = adminUser._id;
      }
    }
    const defaultOwnerId = activeOwnerId || new mongoose.Types.ObjectId();
    const existingMedia = await Media.find().lean();
    let addedCount = 0;

    for (const item of assets) {
      // Exclude cover images, profile pictures, and avatar assets from gallery album sync
      if (
        item.public_id.includes('covers') ||
        item.public_id.includes('profile') ||
        item.public_id.includes('avatar')
      ) {
        continue;
      }

      const exists = existingMedia.some(
        (m: any) => m.cloudinaryPublicId === item.public_id || m.secureUrl === item.secure_url || m.url === item.secure_url
      );

      if (exists) continue;

      const width = item.width || 800;
      const height = item.height || 600;
      const aspectRatio = parseFloat((width / height).toFixed(2));
      let orientation: 'PORTRAIT' | 'LANDSCAPE' | 'SQUARE' = 'SQUARE';
      if (width > height) orientation = 'LANDSCAPE';
      else if (height > width) orientation = 'PORTRAIT';

      let optimizedUrl = item.secure_url;
      let thumbnailUrl = item.secure_url;

      if (item.resource_type === 'image') {
        thumbnailUrl = item.secure_url.includes('/upload/')
          ? item.secure_url.replace('/upload/', '/upload/w_400,h_400,c_fill,g_auto,f_auto,q_auto/')
          : item.secure_url;
      } else if (item.resource_type === 'video') {
        thumbnailUrl = item.secure_url.includes('/upload/')
          ? item.secure_url.replace(/\.[^/.]+$/, '.jpg').replace('/upload/', '/upload/w_400,h_400,c_fill,f_auto,q_auto/')
          : item.secure_url;
      }

      const filename = item.public_id.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
      const withoutHash = filename.replace(/_[a-z0-9]{6}$/i, '');
      const title = withoutHash.replace(/_/g, ' ').replace(/\s+/g, ' ').trim() || 'Untitled Memory';

      let tags = ['gallery'];
      if (item.public_id.includes('story')) tags.push('story');
      if (item.public_id.includes('profile')) tags.push('profile');
      if (item.public_id.includes('instagram')) tags.push('instagram');

      await Media.create({
        owner: defaultOwnerId,
        createdBy: defaultOwnerId,
        updatedBy: defaultOwnerId,
        title,
        tags,
        visibility: 'COUPLE',
        memoryDate: new Date(item.created_at || Date.now()),
        cloudinaryPublicId: item.public_id,
        cloudinaryFolder: item.folder || 'afrin-universe/gallery',
        url: item.secure_url,
        secureUrl: item.secure_url,
        optimizedUrl,
        thumbnailUrl,
        width,
        height,
        aspectRatio,
        orientation,
        duration: item.duration || undefined,
        mimeType: item.resource_type === 'video' ? `video/${item.format || 'mp4'}` : `image/${item.format || 'jpeg'}`,
        fileSize: item.bytes || 500000,
        isFavorite: false,
        isArchived: false,
        isDeleted: false,
      });

      addedCount++;
    }

    return addedCount;
  } catch (_err: any) {
    return 0;
  }
}

/**
 * Trigger Cloudinary to MongoDB Gallery Sync Endpoint
 */
export const syncGallery = catchAsync(async (req: Request, res: Response) => {
  const addedCount = await syncCloudinaryGalleryToDb(req.user?._id as mongoose.Types.ObjectId);
  const total = await Media.countDocuments({ isDeleted: false });
  return ApiResponse.success(res, `Synced Cloudinary gallery successfully. Added ${addedCount} new photo/video asset(s).`, {
    addedCount,
    total,
  });
});

/**
 * Get Media Directory (Paginated, Filtered, Sorted)
 * Excludes profile pictures from gallery/vault by default
 */
export const getMedia = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || PLATFORM_CONSTANTS.DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string, 10) || PLATFORM_CONSTANTS.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  if (req.query.sync === 'true') {
    await syncCloudinaryGalleryToDb(req.user?._id as mongoose.Types.ObjectId);
  }

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

  // Role & relationship visibility isolation (Gallery & Vault)
  const isSuperOwner = user.role === ROLES.SUPER_OWNER || user.email === 'afzal@afrinuniverse.com';
  const isCoOwner = user.role === ROLES.CO_OWNER || user.email === 'amrin@afrinuniverse.com';
  const isPrimaryCouple = isSuperOwner || isCoOwner || user.role === ROLES.ADMIN;

  if (isPrimaryCouple) {
    // Primary couple (Afzal & Amrin) see media owned by Afzal, Amrin, or System Admin (the primary couple space)
    const primaryUsers = await User.find({
      $or: [
        { role: ROLES.SUPER_OWNER },
        { role: ROLES.CO_OWNER },
        { email: 'afzal@afrinuniverse.com' },
        { email: 'amrin@afrinuniverse.com' },
      ],
      isDeleted: false,
    }).select('_id');
    const primaryUserIds = primaryUsers.map((u) => u._id);

    filter.owner = { $in: primaryUserIds };
  } else {
    // Invited users / friends strictly see media uploaded by themselves OR their linked relationship creator/partner
    const allowedOwnerIds: any[] = [user._id];
    if ((user as any).createdBy) {
      allowedOwnerIds.push((user as any).createdBy);
    }
    filter.$or = [
      { owner: { $in: allowedOwnerIds } },
      { createdBy: { $in: allowedOwnerIds } },
    ];
  }

  let total = 0;
  let mediaList: any[] = [];

  try {
    total = await Media.countDocuments(filter);

    // Auto-sync Cloudinary gallery assets ONLY for primary couple
    if (isPrimaryCouple && (total < 10 || req.query.sync === 'true')) {
      const syncedCount = await syncCloudinaryGalleryToDb(req.user?._id as mongoose.Types.ObjectId);
      if (syncedCount > 0 || total < 10) {
        total = await Media.countDocuments(filter);
      }
    }

    mediaList = await Media.find(filter)
      .populate('owner', 'name email avatar role')
      .populate('createdBy', 'name email avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  } catch (err: any) {
    // Fail-safe fallback query
    const fallbackFilter: any = { isDeleted: false, tags: { $ne: 'profile' } };
    if (!isPrimaryCouple) {
      fallbackFilter.owner = user._id;
    }
    total = await Media.countDocuments(fallbackFilter);
    mediaList = await Media.find(fallbackFilter)
      .populate('owner', 'name email avatar role')
      .populate('createdBy', 'name email avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  return ApiResponse.success(res, 'Media retrieved successfully', mediaList, HTTP_STATUS.OK, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
});

/**
 * Get Media By ID
 */
export const getMediaById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const media = await Media.findOne({ _id: req.params.id, isDeleted: false }).populate(
    'owner',
    'name email avatar role'
  );

  if (!media) {
    throw new AppError('Media asset not found.', HTTP_STATUS.NOT_FOUND);
  }

  const isPlatformOwner = user.role === ROLES.SUPER_OWNER || user.role === ROLES.CO_OWNER || user.role === ROLES.ADMIN;
  const mediaOwnerId = media.owner?._id ? media.owner._id.toString() : media.owner?.toString();

  if (!isPlatformOwner && mediaOwnerId !== user._id.toString()) {
    throw new AppError('Permission denied to view this media asset.', HTTP_STATUS.FORBIDDEN);
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
    } catch (_e) { }
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
