import React, { useEffect, useState } from 'react';
import { Heart, Music, Pause, Play, Trash2 } from 'lucide-react';
import { musicApi } from '../../api/musicApi';
import { useMusicPlayerStore } from '../../store/musicPlayerStore';
import { NormalizedSong } from '../../types/music.types';

export const FavoritesTab: React.FC = () => {
  const [favorites, setFavorites] = useState<NormalizedSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { currentTrack, isPlaying, playTrack, togglePlay } = useMusicPlayerStore();

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const data = await musicApi.getFavorites();
      setFavorites(data || []);
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
    try {
      await musicApi.toggleFavorite(song);
      setFavorites((prev) => prev.filter((s) => s.providerSongId !== song.providerSongId));
    } catch (_err) {
      // Handle gracefully
    }
  };

  const playAllFavorites = () => {
    if (favorites.length === 0) return;
    playTrack(favorites[0], favorites);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <span>Favorite Tracks</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Your collection of loved tracks</p>
        </div>

        {favorites.length > 0 && (
          <button
            onClick={playAllFavorites}
            className="px-5 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold flex items-center gap-2 shadow-lg shadow-rose-500/30 transition hover:scale-105 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" /> Play All
          </button>
        )}
      </div>

      {/* Grid or Empty state */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-white/5 text-slate-400">
          <Music className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-semibold text-lg text-white">No favorite songs yet.</h3>
          <p className="text-sm text-slate-500 mt-1">
            Click the heart icon on any song to save it to your favorites list!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {favorites.map((song) => {
            const isCurrent = currentTrack?.providerSongId === song.providerSongId;
            const isSongPlaying = isCurrent && isPlaying;

            return (
              <div
                key={song.providerSongId}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                  isCurrent
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-slate-900/60 border-white/10 hover:border-rose-500/30 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={song.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                    alt={song.title}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate text-white">{song.title}</p>
                    <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => (isCurrent ? togglePlay() : playTrack(song, favorites))}
                    className="p-2 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition"
                  >
                    {isSongPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleRemoveFavorite(song)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition"
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
