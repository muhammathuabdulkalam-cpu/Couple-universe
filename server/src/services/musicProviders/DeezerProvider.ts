import { IMusicProvider, NormalizedSong, SearchOptions } from './MusicProvider.interface';

export class DeezerProvider implements IMusicProvider {
  public name = 'deezer';
  private baseUrl = 'https://api.deezer.com';

  public async search(options: SearchOptions): Promise<{ songs: NormalizedSong[]; total: number }> {
    const { query, index = 0, limit = 25 } = options;
    if (!query || !query.trim()) {
      return { songs: [], total: 0 };
    }

    const cleanQuery = query.trim();

    // 1. Try Deezer Search API first
    try {
      const url = `${this.baseUrl}/search?q=${encodeURIComponent(cleanQuery)}&index=${index}&limit=${limit}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      });

      if (response.ok) {
        const data: any = await response.json();
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          const songs: NormalizedSong[] = data.data.map((item: any) => ({
            provider: 'deezer',
            providerSongId: String(item.id),
            title: item.title || 'Untitled Track',
            artist: item.artist?.name || 'Unknown Artist',
            album: item.album?.title || '',
            coverUrl: item.album?.cover_medium || item.album?.cover_big || item.album?.cover || '',
            previewUrl: item.preview || '',
            duration: item.duration || 30,
            externalUrl: item.link || '',
          }));

          const validSongs = songs.filter((s) => Boolean(s.previewUrl));
          if (validSongs.length > 0) {
            return {
              songs: validSongs,
              total: data.total || validSongs.length,
            };
          }
        }
      }
    } catch (error) {
      console.warn('[DeezerProvider] Deezer search primary attempt failed:', error);
    }

    // 2. Fallback to iTunes Search API for 100% reliability
    try {
      const iTunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
        cleanQuery
      )}&media=music&entity=song&limit=${limit}`;
      const itunesRes = await fetch(iTunesUrl);
      if (itunesRes.ok) {
        const itunesData: any = await itunesRes.json();
        if (itunesData && Array.isArray(itunesData.results) && itunesData.results.length > 0) {
          const songs: NormalizedSong[] = itunesData.results.map((item: any) => ({
            provider: 'deezer',
            providerSongId: String(item.trackId || Math.random().toString(36).substring(2, 9)),
            title: item.trackName || 'Untitled Track',
            artist: item.artistName || 'Unknown Artist',
            album: item.collectionName || '',
            coverUrl: item.artworkUrl100?.replace('100x100bb', '400x400bb') || item.artworkUrl100 || '',
            previewUrl: item.previewUrl || '',
            duration: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 30,
            externalUrl: item.trackViewUrl || '',
          }));

          const validSongs = songs.filter((s) => Boolean(s.previewUrl));
          return {
            songs: validSongs,
            total: itunesData.resultCount || validSongs.length,
          };
        }
      }
    } catch (fallbackError) {
      console.error('[DeezerProvider] iTunes fallback error:', fallbackError);
    }

    return { songs: [], total: 0 };
  }

  public async getSongById(id: string): Promise<NormalizedSong | null> {
    try {
      const url = `${this.baseUrl}/track/${encodeURIComponent(id)}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      });

      if (response.ok) {
        const item: any = await response.json();
        if (item && !item.error && item.id) {
          return {
            provider: 'deezer',
            providerSongId: String(item.id),
            title: item.title || 'Untitled Track',
            artist: item.artist?.name || 'Unknown Artist',
            album: item.album?.title || '',
            coverUrl: item.album?.cover_medium || item.album?.cover_big || item.album?.cover || '',
            previewUrl: item.preview || '',
            duration: item.duration || 30,
            externalUrl: item.link || '',
          };
        }
      }
    } catch (error) {
      console.error(`[DeezerProvider] GetSongById error for ID ${id}:`, error);
    }
    return null;
  }
}

export const deezerProvider = new DeezerProvider();
