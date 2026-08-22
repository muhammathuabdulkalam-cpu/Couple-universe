import { Router } from 'express';
import {
  addSongToPlaylist,
  createDedication,
  createListenInvite,
  createPlaylist,
  deletePlaylist,
  deleteUploadedSong,
  endListenSession,
  getDashboardSummary,
  getDedications,
  getFavorites,
  getListenSessionStatus,
  getListenTargets,
  getLyrics,
  getPlaylistSongs,
  getPlaylists,
  getRecentlyPlayed,
  getUploadedSongs,
  recordRecentlyPlayed,
  reorderPlaylistSongs,
  removeSongFromPlaylist,
  respondListenInvite,
  searchMusic,
  toggleFavorite,
  updatePlaylist,
  uploadSong,
  playSongAudio,
  importSong,
  syncCloudinarySongs,
  getUploadSignature,
} from '../controllers/music.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

// Public / Optional-Auth Audio Stream (HTML <audio> src & fetch support)
router.get('/songs/:providerSongId/play', optionalAuthenticate, playSongAudio);

router.use(authenticate);

// Audio Upload Signature & Direct Upload
router.get('/upload-signature', getUploadSignature);
router.post(
  '/upload',
  uploadMiddleware.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  uploadSong
);

// Listen Together
router.get('/listen-together/targets', getListenTargets);
router.get('/listen-together/status', getListenSessionStatus);
router.post('/listen-together/invite', createListenInvite);
router.post('/listen-together/respond', respondListenInvite);
router.post('/listen-together/end', endListenSession);

// Search, Summary, Uploaded & Lyrics
router.get('/search', searchMusic);
router.get('/uploaded', getUploadedSongs);
router.post('/uploaded/sync', syncCloudinarySongs);
router.post('/uploaded/import', importSong);
router.delete('/uploaded/:providerSongId', deleteUploadedSong);
router.get('/summary', getDashboardSummary);
router.get('/lyrics', getLyrics);

// Playlists
router.get('/playlists', getPlaylists);
router.post('/playlists', createPlaylist);
router.put('/playlists/:id', updatePlaylist);
router.delete('/playlists/:id', deletePlaylist);
router.get('/playlists/:id/songs', getPlaylistSongs);
router.post('/playlists/:id/songs', addSongToPlaylist);
router.delete('/playlists/:id/songs/:songId', removeSongFromPlaylist);
router.put('/playlists/:id/reorder', reorderPlaylistSongs);

// Favorites
router.get('/favorites', getFavorites);
router.post('/favorites/toggle', toggleFavorite);

// Dedications
router.get('/dedications', getDedications);
router.post('/dedications', createDedication);

// Recently Played
router.get('/recently-played', getRecentlyPlayed);
router.post('/recently-played', recordRecentlyPlayed);

export default router;
