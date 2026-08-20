import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  Folder,
  FolderPlus,
  ListMusic,
  Music,
  Pause,
  Play,
  Trash2,
  X,
  RefreshCw,
} from 'lucide-react';
import { musicApi } from '../../api/musicApi';
import { useMusicPlayerStore } from '../../store/musicPlayerStore';
import { NormalizedSong, Playlist, PlaylistSongItem } from '../../types/music.types';

export const PlaylistsTab: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<PlaylistSongItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const currentTrack = useMusicPlayerStore((s) => s.currentTrack);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const playTrack = useMusicPlayerStore((s) => s.playTrack);
  const togglePlay = useMusicPlayerStore((s) => s.togglePlay);

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const data = await musicApi.getPlaylists();
      setPlaylists(data || []);
    } catch (_err) {
      setPlaylists([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const UPLOADS_FOLDER_PLAYLIST: Playlist = {
    _id: 'uploads_folder',
    title: 'Uploads',
    description: 'Your personal uploaded MP3 songs',
    coverUrl: '',
    isDefault: true,
    isShared: true,
    songCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const openPlaylistDetail = async (playlist: Playlist) => {
    setActivePlaylist(playlist);
    setIsDetailLoading(true);
    try {
      if (playlist._id === 'uploads_folder') {
        const res = await musicApi.getUploadedSongs(1, 100);
        const songsList = Array.isArray(res) ? res : res?.songs || [];
        const mapped: PlaylistSongItem[] = songsList.map((s, idx) => ({
          _id: s.providerSongId,
          playlistId: 'uploads_folder',
          songId: s,
          addedBy: {
            _id: 'system',
            name: s.uploadedBy?.name || 'Afzal & Amrin',
            email: 'system@afrinverse.com',
            avatar: s.uploadedBy?.avatar || ''
          },
          position: idx,
          createdAt: s.createdAt || new Date().toISOString()
        }));
        setPlaylistSongs(mapped);
      } else {
        const res = await musicApi.getPlaylistSongs(playlist._id);
        setPlaylistSongs(res.songs || []);
      }
    } catch (_err) {
      setPlaylistSongs([]);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await musicApi.createPlaylist({
        title: newTitle.trim(),
        description: newDesc.trim(),
      });
      setPlaylists((prev) => [created, ...prev]);
      setIsCreatingModal(false);
      setNewTitle('');
      setNewDesc('');
    } catch (_err) {
      // Handle gracefully
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      await musicApi.deletePlaylist(playlistId);
      setPlaylists((prev) => prev.filter((p) => p._id !== playlistId));
      if (activePlaylist?._id === playlistId) {
        setActivePlaylist(null);
      }
    } catch (_err) {
      // Handle gracefully
    }
  };

  const handleRemoveSong = async (songId: string) => {
    if (!activePlaylist) return;
    try {
      if (activePlaylist._id === 'uploads_folder') {
        await musicApi.deleteUploadedSong(songId);
        setPlaylistSongs((prev) => prev.filter((s) => s.songId.providerSongId !== songId));
      } else {
        await musicApi.removeSongFromPlaylist(activePlaylist._id, songId);
        setPlaylistSongs((prev) => prev.filter((s) => s.songId._id !== songId && s.songId.providerSongId !== songId));
        fetchPlaylists();
      }
    } catch (_err) {
      // Handle gracefully
    }
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (!activePlaylist || toIndex < 0 || toIndex >= playlistSongs.length) return;
    const reordered = [...playlistSongs];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setPlaylistSongs(reordered);

    const songIds = reordered.map((item) => item.songId.providerSongId || item.songId._id!);
    try {
      await musicApi.reorderPlaylistSongs(activePlaylist._id, songIds);
    } catch (_err) {
      fetchPlaylists();
    }
  };

  const playAllInPlaylist = () => {
    if (playlistSongs.length === 0) return;
    const songList: NormalizedSong[] = playlistSongs.map((ps) => ps.songId);
    playTrack(songList[0], songList);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ListMusic className="w-6 h-6 text-rose-400" />
            <span>Shared & Custom Playlists</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Curated playlists for every mood and moment</p>
        </div>

        {!activePlaylist && (
          <button
            onClick={() => setIsCreatingModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 transition"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Playlist</span>
          </button>
        )}
      </div>

      {/* Detail View for Selected Playlist */}
      {activePlaylist ? (
        <div className="space-y-6 bg-slate-900/60 border border-white/10 rounded-2xl p-6 text-white backdrop-blur-xl">
          <button
            onClick={() => setActivePlaylist(null)}
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Playlists
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
                {activePlaylist._id === 'uploads_folder' ? 'Media Library Folder' : (activePlaylist.isDefault ? 'Default Shared Playlist' : 'Custom Playlist')}
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-1">{activePlaylist.title}</h1>
              {activePlaylist.description && (
                <p className="text-sm text-slate-400 mt-1">{activePlaylist.description}</p>
              )}
              <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                <span>{playlistSongs.length} Tracks</span>
                {activePlaylist._id === 'uploads_folder' && (
                  <button
                    onClick={() => openPlaylistDetail(activePlaylist)}
                    className="p-1 hover:text-emerald-400 text-slate-400 hover:scale-110 active:rotate-180 transition duration-350"
                    title="Refresh folder content"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {playlistSongs.length > 0 && (
              <button
                onClick={playAllInPlaylist}
                className="px-6 py-3 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold flex items-center gap-2 shadow-xl shadow-rose-500/30 transition hover:scale-105 active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" /> Play All
              </button>
            )}
          </div>

          {/* Track list */}
          {isDetailLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-16 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : playlistSongs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Music className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="font-semibold text-slate-300">No playlists available yet.</p>
              <p className="text-xs text-slate-500 mt-1">Use the Search tab to search and add tracks!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {playlistSongs.map((item, idx) => {
                const song = item.songId;
                const isCurrent = currentTrack?.providerSongId === song.providerSongId;
                const isSongPlaying = isCurrent && isPlaying;

                return (
                  <div
                    key={`${song.providerSongId}-${idx}`}
                    className={`flex items-center justify-between p-3 rounded-xl border transition ${
                      isCurrent
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-6 text-center text-xs font-mono text-slate-500">{idx + 1}</span>
                      <img
                        src={song.coverUrl || ''}
                        alt={song.title}
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{song.title}</p>
                        <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {activePlaylist._id !== 'uploads_folder' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleReorder(idx, idx - 1)}
                            disabled={idx === 0}
                            className="p-1 text-slate-500 hover:text-white disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReorder(idx, idx + 1)}
                            disabled={idx === playlistSongs.length - 1}
                            className="p-1 text-slate-500 hover:text-white disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() =>
                          isCurrent ? togglePlay() : playTrack(song, playlistSongs.map((ps) => ps.songId))
                        }
                        className="p-2 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition"
                      >
                        {isSongPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleRemoveSong(song.providerSongId || song._id!)}
                        className="p-2 text-slate-500 hover:text-rose-400 transition"
                        title="Remove track"
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
      ) : (
        /* Playlists Grid */
        isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-44 rounded-2xl bg-slate-900/60 border border-white/5 animate-pulse p-5 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-white/10" />
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Uploads Folder Card */}
          <div
            onClick={() => openPlaylistDetail(UPLOADS_FOLDER_PLAYLIST)}
            className="group relative bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-300 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg">
                  <Folder className="w-6 h-6 text-white" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                  Library Folder
                </span>
              </div>

              <h3 className="font-bold text-white text-base group-hover:text-emerald-300 transition">Uploads</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">Your custom uploaded MP3 library</p>
            </div>

            <div className="flex items-center justify-between mt-6 pt-3 border-t border-white/5 text-xs text-slate-500">
              <span>View Uploaded Songs</span>
            </div>
          </div>
          {playlists.map((pl) => (
            <div
              key={pl._id}
              onClick={() => openPlaylistDetail(pl)}
              className="group relative bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-rose-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-300 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {pl.title.charAt(0)}
                  </div>
                  {pl.isDefault && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] font-bold uppercase">
                      Default
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-white text-base group-hover:text-rose-300 transition">{pl.title}</h3>
                {pl.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{pl.description}</p>}
              </div>

              <div className="flex items-center justify-between mt-6 pt-3 border-t border-white/5 text-xs text-slate-500">
                <span>{pl.songCount} Tracks</span>
                {!pl.isDefault && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePlaylist(pl._id);
                    }}
                    className="p-1 hover:text-rose-400 transition"
                    title="Delete Playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        )
      )}

      {/* Create Playlist Modal */}
      {isCreatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="font-bold text-lg">Create Custom Playlist</h3>
              <button
                onClick={() => setIsCreatingModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-4 my-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Playlist Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Midnight Slow Jams"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Description (Optional)</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Write a sweet description..."
                  rows={3}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm shadow-lg shadow-rose-500/30"
                >
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
