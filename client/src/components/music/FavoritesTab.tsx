import React, { useEffect, useState } from 'react';
import { Heart, Loader2, Music, Pause, Play, Trash2 } from 'lucide-react';
import { musicApi } from '../../api/musicApi';
import { useMusicPlayerStore } from '../../store/musicPlayerStore';
import { useUIStore } from '../../store/uiStore.js';
import { NormalizedSong } from '../../types/music.types';

export const FavoritesTab: React.FC = () => {
  const theme = useUIStore((s) => s.theme);
  const [favorites, setFavorites] = useState<NormalizedSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentTrack = useMusicPlayerStore((s) => s.currentTrack);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const isAudioLoading = useMusicPlayerStore((s) => s.isLoading);
  const playTrack = useMusicPlayerStore((s) => s.playTrack);
  const togglePlay = useMusicPlayerStore((s) => s.togglePlay);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const data = await musicApi.getFavorites();
      const validData = (data || []).filter((s): s is NormalizedSong => Boolean(s && (s.providerSongId || (s as any)._id)));
      setFavorites(validData);
    } catch (_err) {
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (song: NormalizedSong) => {
    if (!song) return;
    try {
      await musicApi.toggleFavorite(song);
      setFavorites((prev) => prev.filter((s) => s && s.providerSongId !== song.providerSongId));
    } catch (_err) {
      // Handle gracefully
    }
  };

  const playAllFavorites = () => {
    const validFavs = favorites.filter((s) => Boolean(s && s.providerSongId));
    if (validFavs.length === 0) return;
    playTrack(validFavs[0], validFavs);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            <Heart className={`w-6 h-6 ${theme === 'light' ? 'text-blue-600 fill-blue-600/35' : 'text-rose-500 fill-rose-500'}`} />
            <span>Favorite Tracks</span>
          </h2>
          <p className={`text-sm mt-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Your collection of loved tracks</p>
        </div>

        {favorites.length > 0 && (
          <button
            onClick={playAllFavorites}
            className={`px-5 py-2.5 rounded-full text-white font-bold flex items-center gap-2 shadow-lg transition hover:scale-105 active:scale-95 ${
              theme === 'light'
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
                : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
            }`}
          >
            <Play className="w-4 h-4 fill-current" /> Play All
          </button>
        )}
      </div>

      {/* Grid or Empty state */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`border rounded-2xl p-4 animate-pulse h-24 ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border border-white/5'
            }`} />
          ))}
        </div>
      ) : favorites.filter((s) => Boolean(s && s.providerSongId)).length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border ${
          theme === 'light'
            ? 'bg-slate-50 border-slate-200 text-slate-500'
            : 'bg-slate-900/40 border border-white/5 text-slate-400'
        }`}>
          <Music className={`w-12 h-12 mx-auto mb-3 ${theme === 'light' ? 'text-blue-400' : 'text-slate-600'}`} />
          <h3 className={`font-semibold text-lg ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>No favorite songs yet.</h3>
          <p className={`text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>
            Click the heart icon on any song to save it to your favorites list!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {favorites.filter((s) => Boolean(s && s.providerSongId)).map((song) => {
            const isCurrent = currentTrack?.providerSongId === song.providerSongId;
            const isSongPlaying = isCurrent && isPlaying;

            return (
              <div
                key={song.providerSongId}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                  isCurrent
                    ? theme === 'light'
                      ? 'bg-blue-50 border-blue-500/30 text-blue-900 font-bold'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : theme === 'light'
                      ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/60 text-slate-800'
                      : 'bg-slate-900/60 border-white/10 hover:border-rose-500/30 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={song.coverUrl || ''}
                    alt={song.title}
                    className="w-12 h-12 rounded-xl object-cover shadow-sm border border-slate-200/50 dark:border-white/5"
                  />
                  <div className="min-w-0">
                    <p className={`font-bold text-sm truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{song.title}</p>
                    <p className={`text-xs truncate ${theme === 'light' ? 'text-slate-550' : 'text-slate-400'}`}>{song.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => (isCurrent ? togglePlay() : playTrack(song, favorites))}
                    className={`p-2 rounded-full transition ${
                      theme === 'light'
                        ? 'bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white'
                        : 'bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white'
                    }`}
                  >
                    {isCurrent && isAudioLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-current" />
                    ) : isSongPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleRemoveFavorite(song)}
                    className={`p-2 transition ${
                      theme === 'light' ? 'text-slate-400 hover:text-blue-600' : 'text-slate-500 hover:text-rose-450'
                    }`}
                    title="Remove from Favorites"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
