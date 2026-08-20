import { Request, Response } from 'express';
import { HTTP_STATUS, ROLES } from '../constants';
import { Album } from '../models/album.model';
import { Media } from '../models/media.model';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

/**
 * Create Album
 */
export const createAlbum = catchAsync(async (req: Request, res: Response) => {
  const { name, description, coverImage, albumType, visibility, parentAlbum } = req.body;
  const user = req.user!;

  const album = await Album.create({
    name,
    description,
    coverImage,
    albumType: albumType || 'CUSTOM',
    visibility: visibility || 'COUPLE',
    parentAlbum: parentAlbum || null,
    owner: user._id,
    createdBy: user._id,
    updatedBy: user._id,
  });

  return ApiResponse.created(res, 'Album created successfully', album);
});

/**
 * Get Albums List
 */
export const getAlbums = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const filter: any = { isDeleted: false };

  if (user.role === ROLES.INVITED_USER) {
    filter.owner = user._id;
  }

  const albums = await Album.find(filter)
    .populate('createdBy', 'name email avatar')
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, 'Albums retrieved successfully', albums);
});

/**
 * Get Album by ID
 */
export const getAlbumById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const album = await Album.findById(id).populate('createdBy', 'name email avatar');
  if (!album || album.isDeleted) {
    throw new AppError('Album not found.', HTTP_STATUS.NOT_FOUND);
  }

  return ApiResponse.success(res, 'Album retrieved', album);
});

/**
 * Update Album
 */
export const updateAlbum = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, coverImage, visibility } = req.body;

  const album = await Album.findById(id);
  if (!album || album.isDeleted) {
    throw new AppError('Album not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (name !== undefined) album.name = name;
  if (description !== undefined) album.description = description;
  if (coverImage !== undefined) album.coverImage = coverImage;
  if (visibility !== undefined) album.visibility = visibility;

  album.updatedBy = req.user!._id;
  await album.save();

  return ApiResponse.success(res, 'Album updated successfully', album);
});

/**
 * Soft Delete Album
 */
export const deleteAlbum = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const album = await Album.findById(id);
  if (!album || album.isDeleted) {
    throw new AppError('Album not found.', HTTP_STATUS.NOT_FOUND);
  }

  album.isDeleted = true;
  await album.save();

  // Unassign media from this album
  await Media.updateMany({ album: id }, { $unset: { album: 1 } });

  return ApiResponse.success(res, 'Album deleted successfully');
});

/**
 * Add Media Items to Album
 */
export const addMediaToAlbum = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; // Album ID
  const { mediaIds } = req.body; // Array of media IDs

  if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
    throw new AppError('Please provide an array of mediaIds.', HTTP_STATUS.BAD_REQUEST);
  }

  const album = await Album.findById(id);
  if (!album || album.isDeleted) {
    throw new AppError('Album not found.', HTTP_STATUS.NOT_FOUND);
  }

  const result = await Media.updateMany({ _id: { $in: mediaIds } }, { album: id, updatedBy: req.user!._id });

  // Update album media count & cover image
  const updatedCount = await Media.countDocuments({ album: id, isDeleted: false });
  album.mediaCount = updatedCount;

  if (!album.coverImage && mediaIds.length > 0) {
    const firstMedia = await Media.findById(mediaIds[0]);
    if (firstMedia) {
      album.coverImage = firstMedia.thumbnailUrl;
    }
  }

  await album.save();

  return ApiResponse.success(res, `${result.modifiedCount} media item(s) added to album.`, album);
});

/**
 * Remove Media Item from Album
 */
export const removeMediaFromAlbum = catchAsync(async (req: Request, res: Response) => {
  const { id, mediaId } = req.params;

  const media = await Media.findById(mediaId);
  if (!media) {
    throw new AppError('Media item not found.', HTTP_STATUS.NOT_FOUND);
  }

  media.album = undefined;
  await media.save();

  const updatedCount = await Media.countDocuments({ album: id, isDeleted: false });
  await Album.findByIdAndUpdate(id, { mediaCount: updatedCount });

  return ApiResponse.success(res, 'Media removed from album successfully.');
});
