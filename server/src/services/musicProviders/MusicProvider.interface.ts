export interface NormalizedSong {
  provider: 'deezer' | 'spotify' | 'apple' | 'youtube' | 'local';
  providerSongId: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  previewUrl: string;
  duration: number;
  externalUrl?: string;
  language?: string;
  genre?: string;
}

export interface SearchOptions {
  query: string;
  index?: number;
  limit?: number;
}

export interface IMusicProvider {
  name: string;
  search(options: SearchOptions): Promise<{ songs: NormalizedSong[]; total: number }>;
  getSongById(id: string): Promise<NormalizedSong | null>;
}
