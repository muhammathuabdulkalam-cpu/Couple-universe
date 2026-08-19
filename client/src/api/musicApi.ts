import { axiosClient, getMemoryAccessToken } from './axiosClient';
import {
  DashboardMusicSummary,
  ListeningSession,
  NormalizedSong,
  Playlist,
  PlaylistSongItem,
  RecentlyPlayedItem,
  SongDedication,
} from '../types/music.types';

export const musicApi = {
  uploadSong: async (
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ) => {
    const res = await axiosClient.post('/music/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000, // 5 minutes timeout for large audio uploads
      onUploadProgress,
    });
    return res.data.data as NormalizedSong;
  },

  importSong: async (song: NormalizedSong) => {
    const res = await axiosClient.post('/music/uploaded/import', song);
    return res.data.data as NormalizedSong;
  },

  syncCloudinarySongs: async () => {
    const res = await axiosClient.post('/music/uploaded/sync');
    return res.data.data as { addedCount: number; total: number };
  },

  getUploadedSongs: async (page: number = 1, limit: number = 500) => {
    const adminToken = localStorage.getItem('admin_access_token');
    const userToken = localStorage.getItem('access_token') || getMemoryAccessToken();
    const token = (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && adminToken)
      ? adminToken
      : (userToken || adminToken);
    
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axiosClient.get('/music/uploaded', { params: { page, limit }, headers });
    return res.data.data as { songs: NormalizedSong[]; total: number; page: number; limit: number };
  },

  deleteUploadedSong: async (providerSongId: string) => {
    const adminToken = localStorage.getItem('admin_access_token');
    const userToken = localStorage.getItem('access_token') || getMemoryAccessToken();
    const token = (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && adminToken)
      ? adminToken
      : (userToken || adminToken);

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axiosClient.delete(`/music/uploaded/${encodeURIComponent(providerSongId)}`, { headers });
    return res.data;
  },

  getListenSessionStatus: async () => {
    const res = await axiosClient.get('/music/listen-together/status');
    return res.data.data as ListeningSession | null;
  },

  createListenInvite: async () => {
    const res = await axiosClient.post('/music/listen-together/invite');
    return res.data.data as ListeningSession;
  },

  respondListenInvite: async (sessionId: string, action: 'accept' | 'decline') => {
    const res = await axiosClient.post('/music/listen-together/respond', { sessionId, action });
    return res.data.data as ListeningSession;
  },

  endListenSession: async () => {
    const res = await axiosClient.post('/music/listen-together/end');
    return res.data;
  },

  searchSongs: async (query: string, index: number = 0, limit: number = 25) => {
    const res = await axiosClient.get('/music/search', {
      params: { q: query, index, limit },
    });
    return res.data.data as { songs: NormalizedSong[]; total: number };
  },

  getPlaylists: async () => {
    const res = await axiosClient.get('/music/playlists');
    return res.data.data as Playlist[];
  },

  createPlaylist: async (data: { title: string; description?: string; coverUrl?: string }) => {
    const res = await axiosClient.post('/music/playlists', data);
    return res.data.data as Playlist;
  },

  updatePlaylist: async (id: string, data: { title?: string; description?: string; coverUrl?: string }) => {
    const res = await axiosClient.put(`/music/playlists/${id}`, data);
    return res.data.data as Playlist;
  },

  deletePlaylist: async (id: string) => {
    const res = await axiosClient.delete(`/music/playlists/${id}`);
    return res.data;
  },

  getPlaylistSongs: async (id: string) => {
    const res = await axiosClient.get(`/music/playlists/${id}/songs`);
    return res.data.data as { playlist: Playlist; songs: PlaylistSongItem[] };
  },

  addSongToPlaylist: async (playlistId: string, song: NormalizedSong) => {
    const res = await axiosClient.post(`/music/playlists/${playlistId}/songs`, song);
    return res.data.data as PlaylistSongItem;
  },

  removeSongFromPlaylist: async (playlistId: string, songId: string) => {
    const res = await axiosClient.delete(`/music/playlists/${playlistId}/songs/${songId}`);
    return res.data;
  },

  reorderPlaylistSongs: async (playlistId: string, songIds: string[]) => {
    const res = await axiosClient.put(`/music/playlists/${playlistId}/reorder`, { songIds });
    return res.data;
  },

  getFavorites: async () => {
    const res = await axiosClient.get('/music/favorites');
    return res.data.data as NormalizedSong[];
  },

  toggleFavorite: async (song: NormalizedSong) => {
    const res = await axiosClient.post('/music/favorites/toggle', song);
    return res.data.data as { isFavorite: boolean; song: NormalizedSong };
  },

  getDedications: async () => {
    const res = await axiosClient.get('/music/dedications');
    return res.data.data as SongDedication[];
  },

  createDedication: async (data: {
    songData: NormalizedSong;
    recipientId?: string;
    message?: string;
    reaction?: string;
  }) => {
    const res = await axiosClient.post('/music/dedications', data);
    return res.data.data as SongDedication;
  },

  getRecentlyPlayed: async () => {
    const res = await axiosClient.get('/music/recently-played');
    return res.data.data as RecentlyPlayedItem[];
  },

  recordRecentlyPlayed: async (song: NormalizedSong) => {
    const res = await axiosClient.post('/music/recently-played', song);
    return res.data.data;
  },

  getDashboardSummary: async () => {
    const res = await axiosClient.get('/music/summary');
    return res.data.data as DashboardMusicSummary;
  },

  getLyrics: async (artist: string, title: string) => {
    const res = await axiosClient.get('/music/lyrics', {
      params: { artist, title },
    });
    return res.data.data as { lyrics: string | null; message: string | null };
  },
};
