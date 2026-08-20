import React, { useEffect, useState } from 'react';
import {
  Music,
  Play,
  Pause,
  Trash2,
  Upload,
  Search,
  Loader2,
  Disc,
  User as UserIcon,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { useMusicPlayerStore } from '../../store/musicPlayerStore';
import { useUIStore } from '../../store/uiStore';
import { NormalizedSong } from '../../types/music.types';

interface AdminSongsViewerProps {
  onOpenUploadModal: () => void;
  onSongDeleted?: () => void;
}

export const AdminSongsViewer: React.FC<AdminSongsViewerProps> = ({
  onOpenUploadModal,
  onSongDeleted,
}) => {
  const [songs, setSongs] = useState<NormalizedSong[]>([]);
  const [total, setTotal] = useState(0);
  const [page] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentTrack = useMusicPlayerStore((s) => s.currentTrack);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const playTrack = useMusicPlayerStore((s) => s.playTrack);
  const togglePlay = useMusicPlayerStore((s) => s.togglePlay);
  const { addToast } = useUIStore();

  useEffect(() => {
    fetchSongs();
  }, [page]);

  const fetchSongs = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getUploadedSongs(page, 500);
      setSongs(res.songs || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch uploaded songs for admin:', err);
      addToast('Error', err?.message || 'Failed to fetch uploaded songs for Admin', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSong = async (providerSongId: string, songTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${songTitle}"?`)) return;
    setDeletingId(providerSongId);
    try {
      await adminApi.deleteUploadedSong(providerSongId);
      addToast('Song Deleted', `"${songTitle}" removed from platform`, 'success');
      setSongs((prev) => prev.filter((s) => s.providerSongId !== providerSongId));
      setTotal((prev) => Math.max(0, prev - 1));
      if (onSongDeleted) onSongDeleted();
    } catch (err: any) {
      addToast('Error', err?.message || 'Failed to delete song', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.album && s.album.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.uploadedBy?.name && s.uploadedBy.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDuration = (secs?: number) => {
    if (!secs) return '3:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 p-0.5 flex items-center justify-center shadow-lg shadow-rose-950/50">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-rose-400">
              <Disc className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
              <span>Platform Uploaded Songs</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold">
                {total} Tracks
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Manage custom music files uploaded by Super Owner, Co Owner, and Members.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search uploaded songs..."
              className="w-full bg-slate-800 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            />
          </div>

          <button
            onClick={onOpenUploadModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-950/40 transition hover:scale-105 active:scale-95 shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Song</span>
          </button>
        </div>
      </div>

      {/* Directory Content Table */}
      {isLoading ? (
        <div className="py-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold">Loading uploaded music library...</p>
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="py-12 text-center space-y-2 border border-white/5 rounded-2xl bg-slate-950/40">
          <Music className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">No uploaded songs found</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? `No results matching "${searchQuery}"` : 'Upload custom music files to make them available across the platform.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                <th className="py-3 px-3">Song Details</th>
                <th className="py-3 px-3">Album</th>
                <th className="py-3 px-3">Uploaded By</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSongs.map((song) => {
                const isCurrent = currentTrack?.providerSongId === song.providerSongId;
                const isSongPlaying = isCurrent && isPlaying;
                const isDeleting = deletingId === song.providerSongId;

                return (
                  <tr key={song.providerSongId} className="hover:bg-white/5 transition group">
                    {/* Song Details */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-white/10">
                          <img
                            src={song.coverUrl || ''}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => (isCurrent ? togglePlay() : playTrack(song, filteredSongs))}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            {isSongPlaying ? (
                              <Pause className="w-4 h-4 text-rose-400 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                            )}
                          </button>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate text-xs group-hover:text-rose-300 transition">
                            {song.title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
                        </div>
                      </div>
                    </td>

                    {/* Album */}
                    <td className="py-3 px-3 text-slate-300 font-medium truncate max-w-[140px]">
                      {song.album || 'Single'}
                    </td>

                    {/* Uploaded By */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {song.uploadedBy?.avatar ? (
                          <img
                            src={song.uploadedBy.avatar}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover border border-white/10"
                           onError={(e) => { if (!e.currentTarget.src || e.currentTarget.src.includes('unsplash.com')) { e.currentTarget.style.display='none'; } }}/>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-rose-300">
                            <UserIcon className="w-3 h-3 text-slate-400" />
                          </div>
                        )}
                        <span className="font-semibold text-slate-200 truncate max-w-[120px]">
                          {song.uploadedBy?.name || 'Admin'}
                        </span>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                      {formatDuration(song.duration)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => (isCurrent ? togglePlay() : playTrack(song, filteredSongs))}
                          className={`p-1.5 rounded-lg border transition ${
                            isCurrent
                              ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                          }`}
                          title="Preview Track"
                        >
                          {isSongPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          )}
                        </button>

                        <button
                          disabled={isDeleting}
                          onClick={() => handleDeleteSong(song.providerSongId, song.title)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 hover:text-rose-300 transition disabled:opacity-30"
                          title="Delete Uploaded Song"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
