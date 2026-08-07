import { parseBuffer } from 'music-metadata';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { logger } from '../config/logger.config';
import { HTTP_STATUS } from '../constants';
import { FavoriteSong } from '../models/favoriteSong.model';
import { ListeningSession } from '../models/listeningSession.model';
import { MusicActivity } from '../models/musicActivity.model';
import { Playlist } from '../models/playlist.model';
import { PlaylistSong } from '../models/playlistSong.model';
import { RecentlyPlayed } from '../models/recentlyPlayed.model';
import { ISong, Song } from '../models/song.model';
import { SongDedication } from '../models/songDedication.model';
import { User } from '../models/user.model';
import { CloudinaryService } from '../services/cloudinary.service';
import { MusicProviderFactory } from '../services/musicProviders/MusicProviderFactory';
import { NormalizedSong } from '../services/musicProviders/MusicProvider.interface';
import { getSocketServer } from '../utils/socketServer';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

const DEFAULT_PLAYLISTS = [
  { key: 'our_playlist', title: '❤️ Our Playlist', description: 'Our sacred shared collection of magical songs' },
  { key: 'rain_memories', title: '🌧 Rain Memories', description: 'Cozy acoustic tracks for rainy afternoons' },
  { key: 'road_trip', title: '🚗 Road Trip', description: 'Upbeat tracks for our open road adventures' },
  { key: 'birthday', title: '🎂 Birthday', description: 'Celebration vibes and sweet memory tracks' },
  { key: 'wedding', title: '💍 Wedding', description: 'Romantic, timeless love melodies' },
  { key: 'travel', title: '✈ Travel', description: 'Wanderlust grooves for our travels together' },
  { key: 'sleep', title: '🌙 Sleep', description: 'Calming lofi & gentle ambient melodies' },
  { key: 'chill', title: '🎧 Chill', description: 'Relaxed beats for casual evening vibes' },
];

/**
 * Helper to ensure song document exists in DB from normalized song input
 */
async function ensureSongExists(songData: NormalizedSong | any, userId?: string): Promise<ISong> {
  const provider = songData.provider || 'deezer';
  const providerSongId = String(songData.providerSongId || songData.id || songData._id);

  let song = await Song.findOne({ provider, providerSongId });
  if (!song) {
    song = await Song.create({
      provider,
      providerSongId,
      title: songData.title,
      artist: songData.artist,
      album: songData.album || '',
      coverUrl: songData.coverUrl || '',
      previewUrl: songData.previewUrl,
      duration: songData.duration || 30,
      externalUrl: songData.externalUrl || '',
      language: songData.language || 'english',
      genre: songData.genre || '',
      addedBy: userId ? new mongoose.Types.ObjectId(userId) : null,
    });
  }
  return song;
}

/**
 * Helper to seed default playlists if missing
 */
async function seedDefaultPlaylists() {
  for (const item of DEFAULT_PLAYLISTS) {
    const exists = await Playlist.findOne({ defaultKey: item.key });
    if (!exists) {
      await Playlist.create({
        title: item.title,
        description: item.description,
        isDefault: true,
        defaultKey: item.key,
        isShared: true,
        songCount: 0,
      });
    }
  }
}

export function cleanMetadataString(str: string): string {
  if (!str) return '';
  return str
    .replace(/(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.(com|dev|in|co|net|org|info|mobi|vip|site|cc|cz|fm|is|ws)/gi, '')
    .replace(/(MassTamilan|Starmusiq|PagalWorld|Sensongs|Isaimini|TamilMp3|Mp3Paw|Pendujatt|DjPunjab|NaaSongs|SongsLover|Kuttyweb|5starmusiq|VipTamilan)/gi, '')
    .replace(/\[\s*\d+\s*kbps\s*\]|\(\s*\d+\s*kbps\s*\)|\b\d+\s*kbps\b/gi, '')
    .replace(/\[\s*320\s*\]|\(\s*320\s*\)|\[\s*128\s*\]|\(\s*128\s*\)/gi, '')
    .replace(/\[\s*\]|\(\s*\)/g, '')
    .replace(/_/g, ' ')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-._]+|[\s\-._]+$/g, '')
    .trim();
}

/**
 * Upload Custom Personal Song File (MP3, M4A, AAC, WAV, FLAC) to Cloudinary
 */
export const uploadSong = catchAsync(async (req: Request, res: Response) => {
  logger.info('✓ Route reached & Controller entered: uploadSong');
  const user = req.user!;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  logger.info('✓ Multer success: Multipart files parsed');
  if (!files || !files['audio'] || files['audio'].length === 0) {
    throw new AppError('Audio file is required (MP3, M4A, AAC, WAV, FLAC)', HTTP_STATUS.BAD_REQUEST);
  }

  const audioFile = files['audio'][0];
  const reqTitle = (req.body.title || '').trim();
  const reqArtist = (req.body.artist || '').trim();
  const reqAlbum = (req.body.album || '').trim();

  logger.info(`✓ Processing audio file: ${audioFile.originalname} (${audioFile.size} bytes, ${audioFile.mimetype})`);

  // 1. Parse ID3 Metadata & Embedded Cover Artwork from Audio Buffer
  let id3Title = '';
  let id3Artist = '';
  let id3Album = '';
  let id3Duration = 0;
  let embeddedCoverUrl = '';

  try {
    const metadata = await parseBuffer(audioFile.buffer, audioFile.mimetype);
    if (metadata.common) {
      if (metadata.common.title) id3Title = metadata.common.title.trim();
      if (metadata.common.artist) id3Artist = metadata.common.artist.trim();
      else if (metadata.common.albumartist) id3Artist = metadata.common.albumartist.trim();
      if (metadata.common.album) id3Album = metadata.common.album.trim();

      // Extract embedded picture artwork if present and custom cover was not uploaded
      if (metadata.common.picture && metadata.common.picture.length > 0 && (!files['cover'] || files['cover'].length === 0)) {
        const pic = metadata.common.picture[0];
        try {
          const ext = pic.format && pic.format.includes('png') ? 'png' : 'jpg';
          const coverUpload = await CloudinaryService.uploadBuffer(
            Buffer.from(pic.data),
            'afrin-universe/music/covers',
            `embedded_${Date.now()}.${ext}`
          );
          embeddedCoverUrl = coverUpload.optimizedUrl || coverUpload.secureUrl;
          logger.info('✓ Embedded ID3 cover artwork uploaded to Cloudinary:', embeddedCoverUrl);
        } catch (picErr: any) {
          logger.warn('⚠️ Could not upload embedded cover artwork:', picErr.message);
        }
      }
    }
    if (metadata.format && metadata.format.duration) {
      id3Duration = Math.round(metadata.format.duration);
    }
    logger.info('✓ ID3 tags extracted successfully:', { id3Title, id3Artist, id3Album, id3Duration });
  } catch (id3Err: any) {
    logger.warn('⚠️ ID3 Metadata parse warning:', id3Err.message);
  }

  // 2. Upload Audio File to Cloudinary
  let audioUploadUrl = '';
  let cloudinaryDuration = 0;

  try {
    const audioUpload = await CloudinaryService.uploadBuffer(
      audioFile.buffer,
      'afrin-universe/music/audio',
      audioFile.originalname,
      'video'
    );
    let rawUrl = audioUpload.secureUrl;
    // Format Cloudinary audio URL to deliver universal MP3 transcoding
    if (rawUrl && rawUrl.includes('cloudinary.com')) {
      rawUrl = rawUrl.replace(/\.(m4a|flac|wav|ogg|aac|wma|opus|aiff)$/i, '.mp3');
      if (!rawUrl.includes('/f_mp3') && rawUrl.includes('/upload/')) {
        rawUrl = rawUrl.replace('/upload/', '/upload/f_mp3,ac_mp3/');
      }
    }
    audioUploadUrl = rawUrl;
    cloudinaryDuration = Math.round(audioUpload.duration || 0);
    logger.info('✓ Cloudinary Upload success (MP3 transcoded):', audioUploadUrl);
  } catch (err: any) {
    logger.error('❌ Cloudinary upload warning (using base64 audio fallback):', err.message);
    const base64Audio = audioFile.buffer.toString('base64');
    audioUploadUrl = `data:${audioFile.mimetype || 'audio/mpeg'};base64,${base64Audio}`;
  }

  // 3. Resolve Cover Artwork (Custom Upload > ID3 Embedded > Default Artwork)
  let coverUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400';
  if (files['cover'] && files['cover'].length > 0) {
    try {
      const coverFile = files['cover'][0];
      const coverUpload = await CloudinaryService.uploadBuffer(
        coverFile.buffer,
        'afrin-universe/music/covers',
        coverFile.originalname
      );
      coverUrl = coverUpload.optimizedUrl || coverUpload.secureUrl;
    } catch (_cErr) { }
  } else if (embeddedCoverUrl) {
    coverUrl = embeddedCoverUrl;
  }

  // 4. Resolve Final Metadata (Sanitized Form Input > ID3 > Filename Fallback)
  const filenameWithoutExt = audioFile.originalname.replace(/\.[^/.]+$/, '');
  const cleanedFilename = cleanMetadataString(filenameWithoutExt);

  let finalTitle = cleanMetadataString(reqTitle) || cleanMetadataString(id3Title) || cleanedFilename;
  let finalArtist = cleanMetadataString(reqArtist) || cleanMetadataString(id3Artist);
  let finalAlbum = cleanMetadataString(reqAlbum) || cleanMetadataString(id3Album) || '';
  const finalDuration = id3Duration || cloudinaryDuration || 180;

  if (!finalArtist) {
    const parts = finalTitle.split(' - ');
    if (parts.length > 1) {
      finalArtist = parts[0].trim();
      finalTitle = parts.slice(1).join(' - ').trim();
    } else {
      finalArtist = 'Unknown Artist';
    }
  }

  const songId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const isBase64 = audioUploadUrl.startsWith('data:');
  const playUrl = `/api/v1/music/songs/${songId}/play`;

  const song = await Song.create({
    provider: 'local',
    providerSongId: songId,
    title: finalTitle,
    artist: finalArtist,
    album: finalAlbum,
    coverUrl,
    previewUrl: isBase64 ? playUrl : audioUploadUrl,
    duration: finalDuration,
    externalUrl: isBase64 ? playUrl : (audioUploadUrl.startsWith('http') ? audioUploadUrl : ''),
    audioData: isBase64 ? audioUploadUrl : '',
    addedBy: user._id,
  });

  logger.info('✓ MongoDB saved song with ID3 metadata:', song._id);

  const normalized: NormalizedSong = {
    provider: 'local',
    providerSongId: song.providerSongId,
    title: song.title,
    artist: song.artist,
    album: song.album || '',
    coverUrl: song.coverUrl || '',
    previewUrl: song.previewUrl || '',
    duration: song.duration || 180,
    externalUrl: song.externalUrl || '',
  };

  logger.info('✓ Response sent for uploadSong');
  return ApiResponse.created(res, 'Personal song uploaded successfully', normalized);
});

/**
 * Deezer / Multi-Provider + Local Uploads Music Search Proxy
 */
export const searchMusic = catchAsync(async (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  const providerName = (req.query.provider as string) || 'deezer';
  const index = parseInt(req.query.index as string, 10) || 0;
  const limit = parseInt(req.query.limit as string, 10) || 25;

  const provider = MusicProviderFactory.getProvider(providerName);
  const result = await provider.search({ query, index, limit });

  // Merge Local uploaded songs from MongoDB (all uploaded songs if query is empty or matching)
  const localQuery = query.trim()
    ? {
      provider: 'local',
      isDeleted: { $ne: true },
      $or: [
        { title: new RegExp(query.trim(), 'i') },
        { artist: new RegExp(query.trim(), 'i') },
        { album: new RegExp(query.trim(), 'i') },
      ],
    }
    : { provider: 'local', isDeleted: { $ne: true } };

  const localSongs = await Song.find(localQuery).populate('addedBy', 'name avatar').sort({ _id: -1 }).limit(20);

  const localNormalized: NormalizedSong[] = localSongs.map((s: any) => ({
    provider: 'local',
    providerSongId: s.providerSongId,
    title: s.title,
    artist: s.artist,
    album: s.album || '',
    coverUrl: s.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    previewUrl: s.previewUrl || '',
    duration: s.duration || 180,
    externalUrl: s.externalUrl || '',
    uploadedBy: s.addedBy ? { name: s.addedBy.name, avatar: s.addedBy.avatar } : undefined,
    uploadedAt: s.createdAt,
  }));

  result.songs = [...localNormalized, ...result.songs];
  result.total += localNormalized.length;

  return ApiResponse.success(res, 'Music search results retrieved successfully', result);
});

/**
 * Get All Custom Uploaded Songs from MongoDB
 */
export const getUploadedSongs = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 100;
  const skip = (page - 1) * limit;

  const [songs, total] = await Promise.all([
    Song.find({ provider: 'local', isDeleted: { $ne: true } })
      .populate('addedBy', 'name avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Song.countDocuments({ provider: 'local', isDeleted: { $ne: true } }),
  ]);

  const normalized = songs.map((s: any) => ({
    provider: 'local',
    providerSongId: s.providerSongId,
    title: s.title,
    artist: s.artist,
    album: s.album || '',
    coverUrl: s.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    previewUrl: s.previewUrl || '',
    duration: s.duration || 180,
    externalUrl: s.externalUrl || '',
    uploadedBy: s.addedBy ? { name: s.addedBy.name, avatar: s.addedBy.avatar, id: s.addedBy._id } : undefined,
    uploadedAt: s.createdAt,
  }));

  return ApiResponse.success(res, 'Uploaded songs retrieved successfully', {
    songs: normalized,
    total,
    page,
    limit,
  });
});

/**
 * Soft Delete Uploaded Song (Only Uploader or SUPER_OWNER)
 */
export const deleteUploadedSong = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { providerSongId } = req.params;

  const song = await Song.findOne({ providerSongId, provider: 'local', isDeleted: { $ne: true } });
  if (!song) {
    throw new AppError('Song not found', HTTP_STATUS.NOT_FOUND);
  }

  if (user.role !== 'SUPER_OWNER' && song.addedBy?.toString() !== user._id.toString()) {
    throw new AppError('Permission denied. You can only delete songs you uploaded.', HTTP_STATUS.FORBIDDEN);
  }

  song.isDeleted = true;
  await song.save();

  return ApiResponse.success(res, 'Song deleted successfully', { providerSongId });
});

/**
 * Create Listen Together Invitation
 */
export const createListenInvite = catchAsync(async (req: Request, res: Response) => {
  const host = req.user!;
  const partner = await User.findOne({
    _id: { $ne: host._id },
    role: { $in: ['SUPER_OWNER', 'CO_OWNER'] },
  });

  if (!partner) {
    throw new AppError('Partner account not found', HTTP_STATUS.NOT_FOUND);
  }

  // Clear any old active/invited sessions for couple
  await ListeningSession.updateMany(
    {
      $or: [{ host: host._id }, { participant: host._id }],
      status: { $in: ['INVITED', 'ACTIVE'] },
    },
    { status: 'ENDED' }
  );

  const sessionId = `listen_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  const session = await ListeningSession.create({
    sessionId,
    host: host._id,
    participant: partner._id,
    status: 'INVITED',
    expiresAt,
  });

  const io = getSocketServer();
  if (io) {
    const payload = {
      sessionId,
      hostName: host.name,
      hostAvatar: host.avatar,
      expiresAt,
    };
    io.to(partner._id.toString()).emit('listen:invite', payload);
    io.to(`user:${partner._id.toString()}`).emit('listen:invite', payload);
  }

  return ApiResponse.created(res, 'Listen Together invitation sent to partner', session);
});

/**
 * Respond to Listen Together Invitation (Accept / Decline)
 */
export const respondListenInvite = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { sessionId, action } = req.body; // action: 'accept' | 'decline'

  const session = await ListeningSession.findOne({ sessionId });
  if (!session) {
    throw new AppError('Listening session invite not found', HTTP_STATUS.NOT_FOUND);
  }

  if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
    session.status = 'EXPIRED';
    await session.save();
    throw new AppError('Invitation has expired (10 minute limit)', HTTP_STATUS.BAD_REQUEST);
  }

  const io = getSocketServer();

  if (action === 'accept') {
    session.status = 'ACTIVE';
    await session.save();

    if (io) {
      io.to('listen_together_couple_room').emit('listen:accept', {
        sessionId,
        acceptedBy: user.name,
      });
    }
    return ApiResponse.success(res, 'Listen Together session started ❤️', session);
  } else {
    session.status = 'DECLINED';
    await session.save();

    if (io) {
      io.to('listen_together_couple_room').emit('listen:decline', {
        sessionId,
        declinedBy: user.name,
      });
    }
    return ApiResponse.success(res, 'Invitation declined', session);
  }
});

/**
 * Get Active Listen Together Session Status
 */
export const getListenSessionStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;

  const session = await ListeningSession.findOne({
    $or: [{ host: user._id }, { participant: user._id }],
    status: { $in: ['INVITED', 'ACTIVE'] },
  })
    .populate('host', 'name email avatar role')
    .populate('participant', 'name email avatar role')
    .populate('currentSong');

  if (session && session.expiresAt && new Date() > new Date(session.expiresAt) && session.status === 'INVITED') {
    session.status = 'EXPIRED';
    await session.save();
    return ApiResponse.success(res, 'Session status retrieved', null);
  }

  return ApiResponse.success(res, 'Session status retrieved', session);
});

/**
 * End Active Listen Together Session
 */
export const endListenSession = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;

  await ListeningSession.updateMany(
    {
      $or: [{ host: user._id }, { participant: user._id }],
      status: { $in: ['INVITED', 'ACTIVE'] },
    },
    { status: 'ENDED' }
  );

  const io = getSocketServer();
  if (io) {
    io.to('listen_together_couple_room').emit('listen:end', {
      reason: 'Session ended by user',
    });
  }

  return ApiResponse.success(res, 'Listening session ended');
});

/**
 * Get all playlists (Default + Custom)
 */
export const getPlaylists = catchAsync(async (_req: Request, res: Response) => {
  await seedDefaultPlaylists();
  const playlists = await Playlist.find().sort({ isDefault: -1, createdAt: -1 });
  return ApiResponse.success(res, 'Playlists retrieved successfully', playlists);
});

/**
 * Create custom playlist
 */
export const createPlaylist = catchAsync(async (req: Request, res: Response) => {
  const { title, description, coverUrl } = req.body;
  const user = req.user!;

  if (!title || !title.trim()) {
    throw new AppError('Playlist title is required', HTTP_STATUS.BAD_REQUEST);
  }

  const playlist = await Playlist.create({
    title: title.trim(),
    description: description || '',
    coverUrl: coverUrl || '',
    isDefault: false,
    owner: user._id,
    isShared: true,
    songCount: 0,
  });

  return ApiResponse.created(res, 'Playlist created successfully', playlist);
});

/**
 * Update custom playlist
 */
export const updatePlaylist = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, coverUrl } = req.body;

  const playlist = await Playlist.findById(id);
  if (!playlist) {
    throw new AppError('Playlist not found', HTTP_STATUS.NOT_FOUND);
  }

  if (playlist.isDefault) {
    throw new AppError('Default system playlists cannot be edited', HTTP_STATUS.BAD_REQUEST);
  }

  if (title) playlist.title = title.trim();
  if (description !== undefined) playlist.description = description;
  if (coverUrl !== undefined) playlist.coverUrl = coverUrl;

  await playlist.save();
  return ApiResponse.success(res, 'Playlist updated successfully', playlist);
});

/**
 * Delete custom playlist
 */
export const deletePlaylist = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const playlist = await Playlist.findById(id);
  if (!playlist) {
    throw new AppError('Playlist not found', HTTP_STATUS.NOT_FOUND);
  }

  if (playlist.isDefault) {
    throw new AppError('Default system playlists cannot be deleted', HTTP_STATUS.BAD_REQUEST);
  }

  await PlaylistSong.deleteMany({ playlistId: playlist._id });
  await playlist.deleteOne();

  return ApiResponse.success(res, 'Playlist deleted successfully');
});

/**
 * Get songs in a playlist
 */
export const getPlaylistSongs = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const playlist = await Playlist.findById(id);
  if (!playlist) {
    throw new AppError('Playlist not found', HTTP_STATUS.NOT_FOUND);
  }

  const playlistSongs = await PlaylistSong.find({ playlistId: id })
    .populate('songId')
    .populate('addedBy', 'name email avatar')
    .sort({ position: 1, createdAt: 1 });

  return ApiResponse.success(res, 'Playlist songs retrieved successfully', {
    playlist,
    songs: playlistSongs.map((ps) => ({
      ...ps.toJSON(),
      song: ps.songId,
    })),
  });
});

/**
 * Add song to playlist
 */
export const addSongToPlaylist = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const songData = req.body;
  const user = req.user!;

  const playlist = await Playlist.findById(id);
  if (!playlist) {
    throw new AppError('Playlist not found', HTTP_STATUS.NOT_FOUND);
  }

  const song = await ensureSongExists(songData, user._id.toString());

  const existingEntry = await PlaylistSong.findOne({ playlistId: playlist._id, songId: song._id });
  if (existingEntry) {
    return ApiResponse.success(res, 'Song already exists in this playlist', existingEntry);
  }

  const lastSong = await PlaylistSong.findOne({ playlistId: playlist._id }).sort({ position: -1 });
  const position = lastSong ? lastSong.position + 1 : 0;

  const playlistSong = await PlaylistSong.create({
    playlistId: playlist._id,
    songId: song._id,
    addedBy: user._id,
    position,
  });

  const count = await PlaylistSong.countDocuments({ playlistId: playlist._id });
  playlist.songCount = count;
  await playlist.save();

  await MusicActivity.create({
    user: user._id,
    action: 'ADD_TO_PLAYLIST',
    songId: song._id,
    playlistId: playlist._id,
  });

  const populated = await playlistSong.populate(['songId', { path: 'addedBy', select: 'name email avatar' }]);

  return ApiResponse.created(res, 'Song added to playlist', populated);
});

/**
 * Remove song from playlist
 */
export const removeSongFromPlaylist = catchAsync(async (req: Request, res: Response) => {
  const { id, songId } = req.params;

  const playlist = await Playlist.findById(id);
  if (!playlist) {
    throw new AppError('Playlist not found', HTTP_STATUS.NOT_FOUND);
  }

  await PlaylistSong.deleteMany({ playlistId: id, songId });

  const count = await PlaylistSong.countDocuments({ playlistId: id });
  playlist.songCount = count;
  await playlist.save();

  return ApiResponse.success(res, 'Song removed from playlist');
});

/**
 * Reorder playlist songs
 */
export const reorderPlaylistSongs = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { songIds } = req.body; // array of songId strings in new order

  if (!Array.isArray(songIds)) {
    throw new AppError('songIds array is required', HTTP_STATUS.BAD_REQUEST);
  }

  const updates = songIds.map((songId: string, index: number) =>
    PlaylistSong.updateOne({ playlistId: id, songId }, { position: index })
  );

  await Promise.all(updates);
  return ApiResponse.success(res, 'Playlist reordered successfully');
});

/**
 * Get user favorite songs
 */
export const getFavorites = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const favorites = await FavoriteSong.find({ user: user._id })
    .populate('songId')
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, 'Favorite songs retrieved', favorites.map((f) => f.songId));
});

/**
 * Toggle favorite song
 */
export const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
  const songData = req.body;
  const user = req.user!;

  const song = await ensureSongExists(songData, user._id.toString());

  const existing = await FavoriteSong.findOne({ user: user._id, songId: song._id });
  if (existing) {
    await existing.deleteOne();
    return ApiResponse.success(res, 'Removed from favorites', { isFavorite: false, song });
  } else {
    await FavoriteSong.create({ user: user._id, songId: song._id });
    await MusicActivity.create({ user: user._id, action: 'FAVORITE', songId: song._id });
    return ApiResponse.created(res, 'Added to favorites', { isFavorite: true, song });
  }
});

/**
 * Get dedications feed
 */
export const getDedications = catchAsync(async (_req: Request, res: Response) => {
  const dedications = await SongDedication.find()
    .populate('sender', 'name email avatar')
    .populate('recipient', 'name email avatar')
    .populate('songId')
    .sort({ createdAt: -1 })
    .limit(50);

  return ApiResponse.success(res, 'Dedications retrieved successfully', dedications);
});

/**
 * Create a song dedication
 */
export const createDedication = catchAsync(async (req: Request, res: Response) => {
  const { songData, recipientId, message, reaction } = req.body;
  const user = req.user!;

  const song = await ensureSongExists(songData, user._id.toString());

  const dedication = await SongDedication.create({
    sender: user._id,
    recipient: recipientId || user._id,
    songId: song._id,
    message: message || '',
    reaction: reaction || '❤️',
  });

  await MusicActivity.create({ user: user._id, action: 'DEDICATE', songId: song._id });

  const populated = await dedication.populate([
    'songId',
    { path: 'sender', select: 'name email avatar' },
    { path: 'recipient', select: 'name email avatar' },
  ]);

  return ApiResponse.created(res, 'Song dedicated successfully ❤️', populated);
});

/**
 * Get recently played songs
 */
export const getRecentlyPlayed = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;

  const recents = await RecentlyPlayed.find({ user: user._id })
    .populate('songId')
    .sort({ playedAt: -1 })
    .limit(30);

  return ApiResponse.success(res, 'Recently played tracks retrieved', recents);
});

/**
 * Record a played track
 */
export const recordRecentlyPlayed = catchAsync(async (req: Request, res: Response) => {
  const songData = req.body;
  const user = req.user!;

  const song = await ensureSongExists(songData, user._id.toString());

  const record = await RecentlyPlayed.findOneAndUpdate(
    { user: user._id, songId: song._id },
    { $set: { playedAt: new Date() }, $inc: { playCount: 1 } },
    { upsert: true, new: true }
  ).populate('songId');

  await MusicActivity.create({ user: user._id, action: 'PLAY', songId: song._id });

  return ApiResponse.success(res, 'Track play recorded', record);
});

/**
 * Get Dashboard summary widget data
 */
export const getDashboardSummary = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  await seedDefaultPlaylists();

  const [recent, latestDedication, favoritesCount, totalPlaylists] = await Promise.all([
    RecentlyPlayed.findOne({ user: user._id }).populate('songId').sort({ playedAt: -1 }),
    SongDedication.findOne()
      .populate('sender', 'name email avatar')
      .populate('songId')
      .sort({ createdAt: -1 }),
    FavoriteSong.countDocuments({ user: user._id }),
    Playlist.countDocuments(),
  ]);

  return ApiResponse.success(res, 'Dashboard summary retrieved', {
    recentPlayed: recent ? recent.songId : null,
    latestDedication: latestDedication || null,
    favoritesCount,
    totalPlaylists,
  });
});

/**
 * Proxy Lyrics from Lyrics.ovh API
 */
export const getLyrics = catchAsync(async (req: Request, res: Response) => {
  const artist = (req.query.artist as string) || '';
  const title = (req.query.title as string) || '';

  if (!artist || !title) {
    return ApiResponse.success(res, 'Lyrics query incomplete', {
      lyrics: null,
      message: 'Lyrics are currently unavailable.',
    });
  }

  try {
    const cleanArtist = encodeURIComponent(artist.trim());
    const cleanTitle = encodeURIComponent(title.trim().replace(/\(.*\)/g, '').replace(/\[.*\]/g, ''));
    const response = await fetch(`https://api.lyrics.ovh/v1/${cleanArtist}/${cleanTitle}`);

    if (response.ok) {
      const data: any = await response.json();
      if (data && data.lyrics) {
        return ApiResponse.success(res, 'Lyrics retrieved successfully', {
          lyrics: data.lyrics,
          message: null,
        });
      }
    }
  } catch (error) {
    console.error('[getLyrics] Error fetching lyrics:', error);
  }

  return ApiResponse.success(res, 'Lyrics unavailable', {
    lyrics: null,
    message: 'Lyrics are currently unavailable.',
  });
});

function detectAudioMimeType(rawMime: string, buffer?: Buffer): string {
  if (buffer && buffer.length > 4) {
    // ID3 (MP3)
    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) return 'audio/mpeg';
    // MP3 Sync Word
    if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return 'audio/mpeg';
    // RIFF (WAV)
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return 'audio/wav';
    // fLaC (FLAC)
    if (buffer[0] === 0x66 && buffer[1] === 0x4c && buffer[2] === 0x61 && buffer[3] === 0x43) return 'audio/flac';
    // OggS (OGG)
    if (buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) return 'audio/ogg';
    // ftyp (M4A / MP4)
    if (buffer.length > 12 && buffer.subarray(4, 8).toString() === 'ftyp') return 'audio/mp4';
  }

  const clean = (rawMime || '').toLowerCase();
  if (clean.includes('mp3') || clean.includes('mpeg')) return 'audio/mpeg';
  if (clean.includes('wav')) return 'audio/wav';
  if (clean.includes('m4a') || clean.includes('mp4') || clean.includes('aac')) return 'audio/mp4';
  if (clean.includes('flac')) return 'audio/flac';
  if (clean.includes('ogg') || clean.includes('opus')) return 'audio/ogg';

  return 'audio/mpeg';
}

/**
 * Play/stream custom uploaded song binary audio with HTTP 206 Byte Range support
 */
export const playSongAudio = catchAsync(async (req: Request, res: Response) => {
  const { providerSongId } = req.params;

  const song = await Song.findOne({ providerSongId }).select('+audioData');
  if (!song) {
    throw new AppError('Song not found', HTTP_STATUS.NOT_FOUND);
  }

  const rawAudio = song.audioData || (song.previewUrl && song.previewUrl.startsWith('data:') ? song.previewUrl : '');

  // Handle Base64 Data URI streaming
  if (rawAudio && rawAudio.startsWith('data:')) {
    const matches = rawAudio.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new AppError('Invalid audio data format', HTTP_STATUS.BAD_REQUEST);
    }

    const rawMime = matches[1] || 'audio/mpeg';
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const contentType = detectAudioMimeType(rawMime, buffer);
    const totalSize = buffer.length;

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        res.status(416).setHeader('Content-Range', `bytes */${totalSize}`);
        return res.end();
      }

      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      });
      return res.end(buffer.subarray(start, end + 1));
    } else {
      res.writeHead(200, {
        'Content-Length': totalSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      });
      return res.end(buffer);
    }
  }

  // If it's a normal Cloudinary HTTP/S URL, redirect the browser to it (converting to MP3 transcode format)
  if (song.previewUrl && song.previewUrl.startsWith('http')) {
    let redirectUrl = song.previewUrl;
    if (redirectUrl.includes('cloudinary.com')) {
      redirectUrl = redirectUrl.replace(/\.(m4a|flac|wav|ogg|aac|wma|opus|aiff)$/i, '.mp3');
      if (!redirectUrl.includes('/f_mp3') && redirectUrl.includes('/upload/')) {
        redirectUrl = redirectUrl.replace('/upload/', '/upload/f_mp3,ac_mp3/');
      }
    }
    return res.redirect(redirectUrl);
  }

  throw new AppError('Audio preview unavailable', HTTP_STATUS.BAD_REQUEST);
});
