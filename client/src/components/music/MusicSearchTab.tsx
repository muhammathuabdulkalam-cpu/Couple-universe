import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Heart,
  HeartHandshake,
  Music2,
  Pause,
  Play,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { musicApi } from '../../api/musicApi';
import { useMusicPlayerStore } from '../../store/musicPlayerStore';
import { NormalizedSong, Playlist } from '../../types/music.types';

const SUGGESTIONS = [
  { label: '❤️ Love', query: 'Love' },
  { label: 'Chill', query: 'Chill' },
  { label: 'EDM', query: 'EDM' },
  { label: 'Pop', query: 'Pop' },
  { label: 'Folk', query: 'Folk' },
  { label: 'Indie', query: 'Indie' },
  { label: '🎵 Ed Sheeran', query: 'Ed Sheeran' },
  { label: '🎶 Arijit Singh', query: 'Arijit Singh' },
  { label: '🎧 Sid Sriram', query: 'Sid Sriram' },
  { label: '🌸 Taylor Swift', query: 'Taylor Swift' },
];

interface MusicSearchTabProps {
  onOpenDedicateModal?: (song: NormalizedSong) => void;
}

export const MusicSearchTab: React.FC<MusicSearchTabProps> = ({ onOpenDedicateModal }) => {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<'all' | 'deezer' | 'uploaded'>('all');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<NormalizedSong | null>(null);
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({});

  const currentTrack = useMusicPlayerStore((s) => s.currentTrack);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const playTrack = useMusicPlayerStore((s) => s.playTrack);
  const togglePlay = useMusicPlayerStore((s) => s.togglePlay);

  // Debounced input search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Load playlists & favorites silently
  useEffect(() => {
    musicApi
      .getPlaylists()
      .then(setPlaylists)
      .catch(() => {});

    musicApi
      .getFavorites()
      .then((favs) => {
        const map: Record<string, boolean> = {};
        favs.forEach((f) => (map[f.providerSongId] = true));
        setFavoritesMap(map);
      })
      .catch(() => {});
  }, []);

  // React Query cached search with auto-retry
  const { data: searchData, isLoading, isError } = useQuery({
    queryKey: ['musicSearch', searchTerm],
    queryFn: () => musicApi.searchSongs(searchTerm, 0, 30),
    enabled: Boolean(searchTerm.trim()),
    staleTime: 1000 * 60 * 10,
    retry: 2,
  });

  const rawResults = searchData?.songs || [];
  const results = rawResults.filter((s) => {
    if (filterProvider === 'uploaded') return s.provider === 'local';
    if (filterProvider === 'deezer') return s.provider !== 'local';
    return true;
  });
  const total = results.length;

  const handleToggleFavorite = async (song: NormalizedSong) => {
    try {
      const res = await musicApi.toggleFavorite(song);
      setFavoritesMap((prev) => ({
        ...prev,
        [song.providerSongId]: res.isFavorite,
      }));
    } catch (_err) {
      // Silently handle error or inline feedback
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!selectedSongForPlaylist) return;
    try {
      await musicApi.addSongToPlaylist(playlistId, selectedSongForPlaylist);
      setSelectedSongForPlaylist(null);
    } catch (_err) {
      // Silently handle
    }
  };

  return (
    <div className="space-y-6">
      {/* Sticky Search Bar on Mobile / Standard Header on Desktop */}
      <div className="sticky top-16 z-20 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-xl text-white">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, albums on Deezer..."
            className="w-full bg-slate-800/80 border border-white/10 rounded-xl pl-12 pr-12 py-3 md:py-3.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 transition text-sm md:text-base"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSearchTerm('');
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Provider Filter Tabs: All, Deezer, Uploaded */}
        <div className="mt-3 flex items-center gap-2">
          {(['all', 'deezer', 'uploaded'] as const).map((prov) => (
            <button
              key={prov}
              type="button"
              onClick={() => setFilterProvider(prov)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition border ${
                filterProvider === prov
                  ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
              }`}
            >
              {prov === 'all' ? 'All Tracks' : prov === 'deezer' ? 'Deezer Only' : '🎵 Uploaded Only'}
            </button>
          ))}
        </div>

        {/* Suggestion Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Search:
          </span>
          {SUGGESTIONS.map((item) => (
            <button
              key={item.query}
              onClick={() => {
                setQuery(item.query);
                setSearchTerm(item.query);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                searchTerm === item.query
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      {searchTerm && (
        <div className="flex items-center justify-between text-slate-300 px-1">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <span>Results for</span>
            <span className="text-rose-400 italic">"{searchTerm}"</span>
          </h3>
          <span className="text-xs text-slate-400">{total} tracks found</span>
        </div>
      )}

      {/* Results Grid / Loading Skeletons / Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 animate-pulse">
              <div className="w-full aspect-square bg-white/10 rounded-xl mb-3" />
              <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : !searchTerm || results.length === 0 || isError ? (
        /* Premium Empty State Required */
        <div className="text-center py-16 px-4 bg-slate-900/50 rounded-3xl border border-white/10 backdrop-blur-xl text-white my-8">
          <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Music2 className="w-10 h-10 animate-pulse" />
          </div>
          <h3 className="text-2xl font-black tracking-tight text-white">No songs yet</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
            Search for your favorite songs to start listening together.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
            {SUGGESTIONS.map((item) => (
              <button
                key={item.query}
                onClick={() => {
                  setQuery(item.query);
                  setSearchTerm(item.query);
                }}
                className="px-4 py-2 rounded-full bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/30 text-rose-300 border border-white/10 text-xs font-semibold transition"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((song) => {
            const isCurrent = currentTrack?.providerSongId === song.providerSongId;
            const isSongPlaying = isCurrent && isPlaying;
            const isFav = favoritesMap[song.providerSongId];
            const hasPreview = Boolean(song.previewUrl);

            return (
              <div
                key={song.providerSongId}
                className="group relative bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-rose-500/40 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-rose-950/20"
              >
                {/* Cover Image & Play Overlay */}
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-slate-950">
                  <img
                    src={song.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300'}
                    alt={song.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    onClick={() => {
                      if (!hasPreview) return;
                      isCurrent ? togglePlay() : playTrack(song, results);
                    }}
                    className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center transition-opacity ${
                      hasPreview ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
                    } ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                    {hasPreview ? (
                      <button className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition">
                        {isSongPlaying ? (
                          <Pause className="w-6 h-6 fill-current" />
                        ) : (
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        )}
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-black/70 text-slate-300 text-[10px] font-bold">
                        Preview unavailable
                      </span>
                    )}
                  </div>
                </div>

                {/* Track Details */}
                <div className="min-w-0">
                  <h4 className="font-bold text-white text-sm truncate group-hover:text-rose-300 transition">
                    {song.title}
                  </h4>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{song.artist}</p>
                  {song.album && <p className="text-[11px] text-slate-500 truncate mt-0.5">{song.album}</p>}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleFavorite(song)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition"
                      title="Favorite"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>

                    <button
                      onClick={() => setSelectedSongForPlaylist(song)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                      title="Add to Playlist"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {onOpenDedicateModal && (
                    <button
                      onClick={() => onOpenDedicateModal(song)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1 border border-rose-500/20 transition"
                    >
                      <HeartHandshake className="w-3.5 h-3.5" />
                      <span>Dedicate</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add To Playlist Modal */}
      {selectedSongForPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="font-bold text-lg">Add to Playlist</h3>
              <button
                onClick={() => setSelectedSongForPlaylist(null)}
                className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 flex items-center gap-3 bg-white/5 rounded-xl p-3 my-4">
              <img
                src={selectedSongForPlaylist.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                alt={selectedSongForPlaylist.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{selectedSongForPlaylist.title}</p>
                <p className="text-xs text-slate-400 truncate">{selectedSongForPlaylist.artist}</p>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {playlists.map((pl) => (
                <button
                  key={pl._id}
                  onClick={() => handleAddToPlaylist(pl._id)}
                  className="w-full text-left p-3 rounded-xl hover:bg-white/10 border border-white/5 flex items-center justify-between transition group"
                >
                  <div>
                    <p className="font-semibold text-sm text-slate-200 group-hover:text-rose-300">{pl.title}</p>
                    <p className="text-xs text-slate-500">{pl.songCount} tracks</p>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
