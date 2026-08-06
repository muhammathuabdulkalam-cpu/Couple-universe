import { axiosClient } from './axiosClient';
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
  uploadSong: async (formData: FormData) => {
    const res = await axiosClient.post('/music/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data as NormalizedSong;
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
