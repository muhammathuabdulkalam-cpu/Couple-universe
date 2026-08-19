import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Heart,
  MoreVertical,
  Music,
  Plus,
  Radio,
  Trash2,
  UploadCloud,
  UserCheck,
} from 'lucide-react';
import { musicApi } from '../../api/musicApi';
import { useAuthStore } from '../../store/authStore';
import { useMusicPlayerStore } from '../../store/musicPlayerStore';
import { useUIStore } from '../../store/uiStore';
import { NormalizedSong, Playlist } from '../../types/music.types';
import { getNormalizedCoverUrl } from '../../utils/audioDecoder';
import { UploadSongModal } from './UploadSongModal';

export const UploadedSongsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const currentTrack = useMusicPlayerStore((s) => s.currentTrack);
  const playTrack = useMusicPlayerStore((s) => s.playTrack);
  const togglePlay = useMusicPlayerStore((s) => s.togglePlay);
  const { addToast } = useUIStore();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({});

  // 1. React Query for Uploaded Songs
  const { data, isLoading } = useQuery({
    queryKey: ['uploadedSongs'],
    queryFn: async () => {
      const res = await musicApi.getUploadedSongs(1, 100);
      // Pre-fetch favorites map
      musicApi
        .getFavorites()
        .then((favs) => {
          const map: Record<string, boolean> = {};
          favs.forEach((f) => (map[f.providerSongId] = true));
          setFavoritesMap(map);
        })
        .catch(() => { });

      // Pre-fetch playlists
      musicApi
        .getPlaylists()
        .then(setPlaylists)
        .catch(() => { });

      return res;
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const songs = data?.songs || [];
  const total = data?.total || 0;

  // 2. Soft Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (providerSongId: string) => musicApi.deleteUploadedSong(providerSongId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploadedSongs'] });
      addToast('Success', 'Song removed from library', 'success');
    },
    onError: () => {
      addToast('Error', 'Failed to delete song', 'error');
    },
  });

  // 3. Cloudinary Sync Mutation (disabled for UI clean display)
  // const syncMutation = useMutation({
  //   mutationFn: () => musicApi.syncCloudinarySongs(),
  //   onSuccess: (res) => {
  //     queryClient.invalidateQueries({ queryKey: ['uploadedSongs'] });
  //     addToast('Cloudinary Synced ✨', `Library updated! ${res.addedCount > 0 ? `Added ${res.addedCount} new song(s).` : 'All 38 assets up to date.'}`, 'success');
  //   },
  //   onError: () => {
  //     addToast('Sync Error', 'Failed to sync with Cloudinary', 'error');
  //   },
  // });

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleToggleFavorite = async (song: NormalizedSong) => {
    try {
      const res = await musicApi.toggleFavorite(song);
      setFavoritesMap((prev) => ({ ...prev, [song.providerSongId]: res.isFavorite }));
      addToast(
        res.isFavorite ? 'Added to Favorites ❤️' : 'Removed from Favorites',
        `"${song.title}"`,
        'success'
      );
    } catch (_err) {
      addToast('Error', 'Failed to update favorites', 'error');
    }
  };

  const handleAddToPlaylist = async (playlistId: string, song: NormalizedSong) => {
    try {
      await musicApi.addSongToPlaylist(playlistId, song);
      addToast('Added to Playlist', `"${song.title}" added to playlist`, 'success');
      setActiveMenuSongId(null);
    } catch (_err) {
      addToast('Error', 'Failed to add song to playlist', 'error');
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top Action Header */}
      <div className="flex items-center justify-between gap-3 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <UploadCloud className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 truncate">
              <span className="truncate">Uploaded Library</span>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold border border-rose-500/30 shrink-0">
                {total}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 hidden sm:block">
              Custom high-quality audio files uploaded by Afzal & Amrin with full playback support.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="px-3 py-2 sm:px-4 sm:py-3 rounded-full sm:rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition disabled:opacity-50"
            title="Sync audio files from Cloudinary storage"
          >
            <RefreshCw className={`w-4 h-4 text-rose-400 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Cloudinary</span>
          </button> */}

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3.5 py-2 sm:px-5 sm:py-3 rounded-full sm:rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg hover:scale-105 active:scale-95 transition shrink-0"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
            <span className="hidden sm:inline">Upload Song</span>
            <span className="sm:hidden">Upload</span>
          </button>
        </div>
      </div>

      {/* Upload Song Modal Component */}
      <UploadSongModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />

      {/* Loading Skeleton State */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : songs.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center p-12 rounded-3xl bg-slate-900/40 border border-white/10 text-white space-y-4">
          <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Music className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold">🎵 No Uploaded Songs Yet</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            Upload your favorite songs to build your personal music library.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition mt-2"
          >
            <UploadCloud className="w-5 h-5" />
            <span>Upload Song</span>
          </button>
        </div>
      ) : (
        /* Songs Table / Card List */
        <div className="space-y-2">
          {songs.map((song: NormalizedSong, idx: number) => {
            const isCurrent = currentTrack?.providerSongId === song.providerSongId;
            const isFav = Boolean(favoritesMap[song.providerSongId]);
            const isOwner =
              currentUser?.role === 'SUPER_OWNER' ||
              currentUser?.role === 'CO_OWNER' ||
              song.uploadedBy?.name === currentUser?.name ||
              song.uploadedBy?.id === currentUser?.id;

            return (
              <div
                key={song.providerSongId}
                className={`group relative flex items-center justify-between p-3 sm:p-4 rounded-2xl transition border ${isCurrent
                    ? 'bg-rose-500/10 border-rose-500/30 text-white shadow-lg'
                    : 'bg-slate-900/40 border-white/5 hover:bg-white/5 text-slate-200'
                  }`}
              >
                {/* Left: Index, Cover & Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-6 text-center text-xs font-bold text-slate-500 hidden sm:block">
                    {idx + 1}
                  </span>

                  <div
                    onClick={() => (isCurrent ? togglePlay() : playTrack(song, songs))}
                    className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 cursor-pointer shadow-md group/img"
                  >
                    <img
                      src={getNormalizedCoverUrl(song.coverUrl)}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        if (!e.currentTarget.src.includes('unsplash.com')) {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400';
                        }
                      }}
                    />
                    <div
                      className={`absolute inset-0 flex items-center justify-center bg-black/50 transition ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover/img:opacity-100'
                        }`}
                    >
                      <Radio className="w-6 h-6 text-rose-400 animate-pulse" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4
                      onClick={() => (isCurrent ? togglePlay() : playTrack(song, songs))}
                      className="font-bold text-sm sm:text-base text-white truncate cursor-pointer hover:text-rose-400 transition"
                    >
                      {song.title}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">
                      {song.artist} {song.album ? `• ${song.album}` : ''}
                    </p>
                  </div>
                </div>

                {/* Middle: Uploaded By Badge */}
                {song.uploadedBy && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                    <UserCheck className="w-3.5 h-3.5 text-rose-400" />
                    <span>{song.uploadedBy.name}</span>
                  </div>
                )}

                {/* Right: Duration & Action Buttons */}
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <span className="text-xs font-mono text-slate-400 hidden sm:flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {formatDuration(song.duration)}
                  </span>

                  <button
                    onClick={() => handleToggleFavorite(song)}
                    className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-rose-400 transition"
                  >
                    <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  {/* Add to Playlist & Delete Dropdown Menu */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveMenuSongId(activeMenuSongId === song.providerSongId ? null : song.providerSongId)
                      }
                      className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {activeMenuSongId === song.providerSongId && (
                      <div className="absolute right-0 top-10 z-30 w-52 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-2 text-xs space-y-1 animate-fadeIn">
                        <p className="px-3 py-1.5 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                          Add to Playlist
                        </p>
                        {playlists.map((pl) => (
                          <button
                            key={pl._id}
                            onClick={() => handleAddToPlaylist(pl._id, song)}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-white font-medium truncate transition"
                          >
                            {pl.title}
                          </button>
                        ))}

                        {isOwner && (
                          <div className="pt-1 border-t border-white/10">
                            <button
                              onClick={() => {
                                deleteMutation.mutate(song.providerSongId);
                                setActiveMenuSongId(null);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400 font-bold flex items-center gap-2 transition"
                            >
                              <Trash2 className="w-4 h-4 text-rose-400" />
                              <span>Delete Uploaded Song</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
