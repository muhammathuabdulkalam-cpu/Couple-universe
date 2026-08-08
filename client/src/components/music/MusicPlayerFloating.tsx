import React, { useEffect, useState } from 'react';
import {
  FileText,
  Heart,
  ListMusic,
  Loader2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useMusicPlayerStore } from '../../store/musicPlayerStore';
import { musicApi } from '../../api/musicApi';
import { useUIStore } from '../../store/uiStore';
import { NormalizedSong } from '../../types/music.types';
import { LyricsModal } from './LyricsModal';
import { MobileFullPlayerModal } from './MobileFullPlayerModal';

let favsCachePromise: Promise<Set<string>> | null = null;
let favsCacheSet: Set<string> | null = null;

export const MusicPlayerFloating: React.FC = React.memo(() => {
  const currentTrack = useMusicPlayerStore((s) => s.currentTrack);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const isLoading = useMusicPlayerStore((s) => s.isLoading);
  const currentTime = useMusicPlayerStore((s) => s.currentTime);
  const duration = useMusicPlayerStore((s) => s.duration);
  const volume = useMusicPlayerStore((s) => s.volume);
  const isMuted = useMusicPlayerStore((s) => s.isMuted);
  const isShuffle = useMusicPlayerStore((s) => s.isShuffle);
  const repeatMode = useMusicPlayerStore((s) => s.repeatMode);
  const queue = useMusicPlayerStore((s) => s.queue);
  const isQueueDrawerOpen = useMusicPlayerStore((s) => s.isQueueDrawerOpen);
  const togglePlay = useMusicPlayerStore((s) => s.togglePlay);
  const nextTrack = useMusicPlayerStore((s) => s.nextTrack);
  const prevTrack = useMusicPlayerStore((s) => s.prevTrack);
  const seekTo = useMusicPlayerStore((s) => s.seekTo);
  const setVolume = useMusicPlayerStore((s) => s.setVolume);
  const toggleMute = useMusicPlayerStore((s) => s.toggleMute);
  const toggleShuffle = useMusicPlayerStore((s) => s.toggleShuffle);
  const cycleRepeatMode = useMusicPlayerStore((s) => s.cycleRepeatMode);
  const toggleQueueDrawer = useMusicPlayerStore((s) => s.toggleQueueDrawer);
  const toggleLyricsModal = useMusicPlayerStore((s) => s.toggleLyricsModal);
  const toggleMobileFullPlayer = useMusicPlayerStore((s) => s.toggleMobileFullPlayer);
  const playTrack = useMusicPlayerStore((s) => s.playTrack);
  const closePlayer = useMusicPlayerStore((s) => s.closePlayer);

  const { addToast } = useUIStore();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!currentTrack) return;

    // Deduplicate getFavorites API calls using in-memory cached promise
    if (!favsCachePromise) {
      favsCachePromise = musicApi.getFavorites().then((favs) => {
        favsCacheSet = new Set(favs.map((f) => f.providerSongId));
        return favsCacheSet;
      });
    }

    favsCachePromise
      .then((set) => {
        setIsFavorite(set.has(currentTrack.providerSongId));
      })
      .catch(() => { });
  }, [currentTrack]);

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleToggleFavorite = async () => {
    try {
      const res = await musicApi.toggleFavorite(currentTrack);
      setIsFavorite(res.isFavorite);
      if (favsCacheSet) {
        if (res.isFavorite) {
          favsCacheSet.add(currentTrack.providerSongId);
        } else {
          favsCacheSet.delete(currentTrack.providerSongId);
        }
      }
      addToast(
        res.isFavorite ? 'Added to Favorites ❤️' : 'Removed from Favorites',
        `"${currentTrack.title}"`,
        'success'
      );
    } catch (_err) {
      addToast('Error', 'Failed to update favorites', 'error');
    }
  };

  return (
    <>
      {/* Lyrics Modal */}
      <LyricsModal />

      {/* Mobile Swipe-Up Full Screen Player Modal */}
      <MobileFullPlayerModal />

      {/* Queue Drawer Modal */}
      {isQueueDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900/95 border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl text-white">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ListMusic className="w-5 h-5 text-rose-400" />
                  <h3 className="text-lg font-bold">Now Playing Queue</h3>
                </div>
                <button
                  onClick={() => toggleQueueDrawer(false)}
                  className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {queue.map((track: NormalizedSong, idx: number) => {
                  const isCurrent = track.providerSongId === currentTrack.providerSongId;
                  return (
                    <div
                      key={`${track.providerSongId}-${idx}`}
                      onClick={() => playTrack(track, queue)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition ${isCurrent
                          ? 'bg-rose-500/20 border border-rose-500/30 text-rose-300'
                          : 'hover:bg-white/5 text-slate-300'
                        }`}
                    >
                      <img
                        src={track.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                        alt={track.title}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{track.title}</p>
                        <p className="text-xs text-slate-400 truncate">{track.artist}</p>
                      </div>
                      {isCurrent && isPlaying && (
                        <div className="flex items-end gap-0.5 h-4">
                          <span className="w-1 bg-rose-400 animate-pulse h-full rounded"></span>
                          <span className="w-1 bg-rose-400 animate-pulse h-2/3 rounded"></span>
                          <span className="w-1 bg-rose-400 animate-pulse h-4/5 rounded"></span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center mt-4">
              Deezer Provider • 30s High Quality Preview Audio
            </p>
          </div>
        </div>
      )}

      {/* Main Floating Bottom Player Bar */}
      <div
        className={`fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-5xl transition-all duration-300 ${isCollapsed ? 'translate-y-[calc(100%-3.5rem)]' : ''
          }`}
      >
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-rose-950/20 text-white p-3 md:p-4 pr-10 md:pr-12">
          {/* Top-Right Dedicated Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              closePlayer();
            }}
            className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-all duration-200 shadow-md group"
            title="Close Player"
            aria-label="Close Player"
          >
            <X className="w-4 h-4 transition-transform group-hover:scale-110" />
          </button>

          {/* Subtle Top Glowing Progress Line */}
          <div
            className="absolute top-0 left-0 right-0 h-1 bg-white/10 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              seekTo(pos * (duration || 30));
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 transition-all duration-150"
              style={{ width: `${(currentTime / (duration || 30)) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-4 mt-1">
            {/* Left: Track Metadata & Cover */}
            <div
              className="flex items-center gap-3 min-w-0 md:w-1/4 cursor-pointer"
              onClick={() => toggleMobileFullPlayer(true)}
            >
              <div className="relative group shrink-0">
                <img
                  src={currentTrack.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                  alt={currentTrack.title}
                  className={`w-12 h-12 rounded-xl object-cover shadow-md transition-transform duration-500 ${isPlaying ? 'animate-spin-slow scale-105 ring-2 ring-rose-500/50' : ''
                    }`}
                />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm truncate text-white hover:text-rose-300 transition">
                  {currentTrack.title}
                </h4>
                <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite();
                }}
                className="p-1.5 rounded-full hover:bg-white/10 transition text-slate-400 hover:text-rose-400 ml-1 shrink-0"
                title="Toggle Favorite"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            {/* Middle: Controls & Main Seek Bar */}
            <div className="flex-1 max-w-md flex flex-col items-center gap-1">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleShuffle()}
                  className={`p-1.5 rounded-full hover:bg-white/10 transition ${isShuffle ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  title="Shuffle"
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                <button
                  onClick={() => prevTrack()}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-200 hover:text-white transition"
                  title="Previous"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={() => togglePlay()}
                  disabled={!currentTrack.previewUrl}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition ${currentTrack.previewUrl
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:scale-105 active:scale-95'
                      : 'bg-slate-700 opacity-50 cursor-not-allowed'
                    }`}
                  title={!currentTrack.previewUrl ? 'Preview unavailable.' : isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => nextTrack()}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-200 hover:text-white transition"
                  title="Next"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                <button
                  onClick={() => cycleRepeatMode()}
                  className={`p-1.5 rounded-full hover:bg-white/10 transition ${repeatMode !== 'none' ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  title={`Repeat: ${repeatMode}`}
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                </button>
              </div>

              {/* Time Slider */}
              <div className="w-full flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-8 text-right font-mono">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 30}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <span className="w-8 font-mono">{formatTime(duration || 30)}</span>
              </div>
            </div>

            {/* Right: Volume, Lyrics & Extra Controls */}
            <div className="hidden md:flex items-center justify-end gap-3 w-1/4">
              <button
                onClick={() => toggleLyricsModal(true)}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold"
                title="Song Lyrics"
              >
                <FileText className="w-4 h-4 text-rose-400" />
                <span>Lyrics</span>
              </button>

              <button
                onClick={() => toggleQueueDrawer()}
                className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold ${isQueueDrawerOpen
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'hover:bg-white/10 text-slate-300'
                  }`}
                title="Queue"
              >
                <ListMusic className="w-4 h-4" />
                <span>{queue.length}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
                title={isCollapsed ? 'Expand Player' : 'Collapse Player'}
              >
                {isCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
