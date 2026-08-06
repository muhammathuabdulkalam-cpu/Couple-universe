export interface NormalizedSong {
  _id?: string;
  provider: 'deezer' | 'spotify' | 'apple' | 'youtube' | 'local';
  providerSongId: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  previewUrl: string;
  duration: number;
  externalUrl?: string;
  language?: string;
  genre?: string;
  addedBy?: string;
  uploadedBy?: { name: string; avatar?: string; id?: string };
  uploadedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Playlist {
  _id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  isDefault: boolean;
  defaultKey?: string;
  owner?: string;
  isShared: boolean;
  songCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistSongItem {
  _id: string;
  playlistId: string;
  songId: NormalizedSong;
  addedBy: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  position: number;
  createdAt: string;
}

export interface SongDedication {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  recipient: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  songId: NormalizedSong;
  message?: string;
  reaction?: string;
  createdAt: string;
}

export interface RecentlyPlayedItem {
  _id: string;
  user: string;
  songId: NormalizedSong;
  playedAt: string;
  playCount: number;
}

export interface DashboardMusicSummary {
  recentPlayed: NormalizedSong | null;
  latestDedication: SongDedication | null;
  favoritesCount: number;
  totalPlaylists: number;
}

export interface LyricsResponse {
  lyrics: string | null;
  message: string | null;
}

export interface ListeningSession {
  _id: string;
  sessionId: string;
  host: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  participant: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  status: 'INVITED' | 'ACTIVE' | 'ENDED' | 'EXPIRED' | 'DECLINED';
  currentSong?: NormalizedSong;
  currentTime: number;
  isPlaying: boolean;
  queue: NormalizedSong[];
  shuffle: boolean;
  repeat: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListenInvitePayload {
  sessionId: string;
  hostName: string;
  hostAvatar?: string;
  expiresAt: string;
}
