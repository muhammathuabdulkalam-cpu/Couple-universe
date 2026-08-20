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
  X,
} from 'lucide-react';
import { musicApi } from '../../api/musicApi.js';
import { useMusicPlayerStore } from '../../store/musicPlayerStore.js';
import { NormalizedSong, Playlist } from '../../types/music.types.js';
import { getNormalizedCoverUrl } from '../../utils/audioDecoder.js';

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
      // Silently handle error
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
    <div className="space-y-4">
      {/* Clean Compact Search Input Bar */}
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3 shadow-md text-white space-y-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists..."
            className="w-full bg-slate-800/90 border border-white/10 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 transition"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSearchTerm('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Minimal Provider Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {(['all', 'deezer', 'uploaded'] as const).map((prov) => (
            <button
              key={prov}
              type="button"
              onClick={() => setFilterProvider(prov)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition border ${
                filterProvider === prov
                  ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
              }`}
            >
              {prov === 'all' ? 'All' : prov === 'deezer' ? 'Deezer' : 'Uploaded'}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count Header */}
      {searchTerm && (
        <div className="flex items-center justify-between text-slate-300 px-1 text-xs">
          <span className="font-bold text-white">
            Results for <span className="text-rose-400">"{searchTerm}"</span>
          </span>
          <span className="text-[10px] text-slate-400">{total} tracks found</span>
        </div>
      )}

      {/* Search Results Grid / List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-900/40 border border-white/5 rounded-xl p-3 animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-white/10 rounded w-3/4" />
                <div className="h-2.5 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : !searchTerm || results.length === 0 || isError ? (
        /* Clean Minimal Empty State */
        <div className="text-center py-10 px-4 bg-slate-900/40 rounded-2xl border border-white/10 text-white">
          <Music2 className="w-8 h-8 text-rose-400/60 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-300">
            {!searchTerm ? 'Type a song title above to search' : 'No matching songs found'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Search Deezer streaming or uploaded library
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {results.map((song) => {
            const isCurrent = currentTrack?.providerSongId === song.providerSongId;
            const isSongPlaying = isCurrent && isPlaying;
            const isFav = favoritesMap[song.providerSongId];
            const hasPreview = Boolean(song.previewUrl);

            return (
              <div
                key={song.providerSongId}
                className="group bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-rose-500/30 rounded-xl p-2.5 transition flex items-center justify-between gap-2 shadow-sm"
              >
                {/* Artwork & Details */}
                <div
                  onClick={() => {
                    if (!hasPreview) return;
                    isCurrent ? togglePlay() : playTrack(song, results);
                  }}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                >
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-950">
                    <img
                      src={getNormalizedCoverUrl(song.coverUrl)}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                      {isSongPlaying ? (
                        <Pause className="w-4 h-4 fill-white text-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-white text-xs truncate group-hover:text-rose-300 transition">
                      {song.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">{song.artist}</p>
                  </div>
                </div>

                {/* Quick Actions: Favorite & Dedicate */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleFavorite(song)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition"
                    title="Favorite"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  <button
                    onClick={() => setSelectedSongForPlaylist(song)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                    title="Add to Playlist"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  {onOpenDedicateModal && (
                    <button
                      onClick={() => onOpenDedicateModal(song)}
                      className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px] font-semibold border border-rose-500/20 transition"
                      title="Dedicate Song"
                    >
                      <HeartHandshake className="w-3.5 h-3.5" />
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
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 w-full max-w-md text-white shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-bold text-sm">Add to Playlist</h3>
              <button
                onClick={() => setSelectedSongForPlaylist(null)}
                className="p-1 text-slate-400 hover:text-white rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-2.5">
              <img
                src={selectedSongForPlaylist.coverUrl || ''}
                alt={selectedSongForPlaylist.title}
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <p className="font-semibold text-xs truncate">{selectedSongForPlaylist.title}</p>
                <p className="text-[10px] text-slate-400 truncate">{selectedSongForPlaylist.artist}</p>
              </div>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {playlists.map((pl) => (
                <button
                  key={pl._id}
                  onClick={() => handleAddToPlaylist(pl._id)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 border border-white/5 flex items-center justify-between transition group text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-200 group-hover:text-rose-300">{pl.title}</p>
                    <p className="text-[10px] text-slate-500">{pl.songCount} tracks</p>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
