import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Heart,
  MoreVertical,
  Pause,
  Play,
  Radio,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { musicApi } from '../../api/musicApi';
import { useListenTogetherStore } from '../../store/listenTogetherStore';
import { useMusicPlayerStore } from '../../store/musicPlayerStore';
import { useUIStore } from '../../store/uiStore';
import { extractDominantColor } from '../../utils/colorExtractor';

export const MobileFullPlayerModal: React.FC = React.memo(() => {
  const currentTrack = useMusicPlayerStore((s) => s.currentTrack);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const currentTime = useMusicPlayerStore((s) => s.currentTime);
  const duration = useMusicPlayerStore((s) => s.duration);
  const isShuffle = useMusicPlayerStore((s) => s.isShuffle);
  const repeatMode = useMusicPlayerStore((s) => s.repeatMode);
  const isMobileFullPlayerOpen = useMusicPlayerStore((s) => s.isMobileFullPlayerOpen);
  const togglePlay = useMusicPlayerStore((s) => s.togglePlay);
  const nextTrack = useMusicPlayerStore((s) => s.nextTrack);
  const prevTrack = useMusicPlayerStore((s) => s.prevTrack);
  const seekTo = useMusicPlayerStore((s) => s.seekTo);
  const toggleShuffle = useMusicPlayerStore((s) => s.toggleShuffle);
  const cycleRepeatMode = useMusicPlayerStore((s) => s.cycleRepeatMode);
  const toggleQueueDrawer = useMusicPlayerStore((s) => s.toggleQueueDrawer);
  const toggleLyricsModal = useMusicPlayerStore((s) => s.toggleLyricsModal);
  const toggleMobileFullPlayer = useMusicPlayerStore((s) => s.toggleMobileFullPlayer);

  const {
    isSessionActive,
    partnerName,
    partnerAvatar,
    sendInvite,
  } = useListenTogetherStore();

  const { addToast } = useUIStore();
  const [isFavorite, setIsFavorite] = useState(false);
  const [ambientBg, setAmbientBg] = useState('radial-gradient(circle at center, #121212 0%, #000000 100%)');

  useEffect(() => {
    if (currentTrack) {
      extractDominantColor(currentTrack.coverUrl).then((p) => setAmbientBg(p.ambientGradient));
      musicApi
        .getFavorites()
        .then((favs) => {
          setIsFavorite(favs.some((f) => f.providerSongId === currentTrack.providerSongId));
        })
        .catch(() => {});
    }
  }, [currentTrack]);

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleToggleFav = async () => {
    try {
      const res = await musicApi.toggleFavorite(currentTrack);
      setIsFavorite(res.isFavorite);
      addToast(
        res.isFavorite ? 'Added to Favorites ❤️' : 'Removed from Favorites',
        `"${currentTrack.title}"`,
        'success'
      );
    } catch (_err) {
      addToast('Error', 'Failed to toggle favorite', 'error');
    }
  };

  return (
    <AnimatePresence>
      {isMobileFullPlayerOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className="fixed inset-0 z-50 flex flex-col justify-between px-6 pt-4 pb-8 text-white overflow-y-auto md:hidden bg-zinc-950 select-none"
          style={{ background: ambientBg }}
        >
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => toggleMobileFullPlayer(false)}
              className="p-2 text-slate-300 hover:text-white rounded-full active:scale-95"
            >
              <ChevronDown className="w-7 h-7" />
            </button>

            <div className="text-center">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-300">
                NOW PLAYING
              </span>
            </div>

            <button
              onClick={() => toggleQueueDrawer(true)}
              className="p-2 text-slate-300 hover:text-white rounded-full active:scale-95"
            >
              <MoreVertical className="w-6 h-6" />
            </button>
          </div>

          {/* Listen Together Mobile Pill Indicator */}
          <div className="flex justify-center my-2">
            {isSessionActive ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold shadow-lg">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                {partnerAvatar && (
                  <img src={partnerAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                )}
                <span>Synced with {partnerName || 'Partner'} ❤️</span>
              </div>
            ) : (
              <button
                onClick={sendInvite}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold hover:bg-rose-500/30 transition"
              >
                <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>Listen Together</span>
              </button>
            )}
          </div>

          {/* Centered Circular Album Artwork (Reference UI) */}
          <div className="flex-1 flex items-center justify-center my-4">
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden shadow-2xl border-4 border-white/10 p-1 bg-slate-900"
            >
              <img
                src={currentTrack.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500'}
                alt={currentTrack.title}
                className="w-full h-full object-cover rounded-full"
              />
              <div className="absolute inset-0 rounded-full border border-black/20 pointer-events-none" />
            </motion.div>
          </div>

          {/* Song Metadata (Title Left, Rose Heart Right) */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="min-w-0 flex-1 pr-4">
              <h2 className="text-2xl font-bold text-white truncate tracking-tight">{currentTrack.title}</h2>
              <p className="text-sm font-medium text-slate-400 truncate mt-0.5">{currentTrack.artist}</p>
            </div>

            <button
              onClick={handleToggleFav}
              className="p-2 rounded-full text-slate-400 hover:text-rose-400 transition shrink-0"
            >
              <Heart className={`w-7 h-7 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>

          {/* Progress Slider */}
          <div className="space-y-2 mb-6">
            <input
              type="range"
              min={0}
              max={duration || 30}
              step={0.1}
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || 30)}</span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between px-2 mb-8">
            <button
              onClick={() => toggleShuffle()}
              className={`p-2 rounded-full transition ${isShuffle ? 'text-rose-400' : 'text-slate-400'}`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button onClick={() => prevTrack()} className="p-2 text-white hover:text-slate-300">
              <SkipBack className="w-8 h-8 fill-current" />
            </button>

            <button
              onClick={() => togglePlay()}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-black text-black" />
              ) : (
                <Play className="w-8 h-8 fill-black text-black ml-1" />
              )}
            </button>

            <button onClick={() => nextTrack()} className="p-2 text-white hover:text-slate-300">
              <SkipForward className="w-8 h-8 fill-current" />
            </button>

            <button
              onClick={() => cycleRepeatMode()}
              className={`p-2 rounded-full transition ${repeatMode !== 'none' ? 'text-rose-400' : 'text-slate-400'}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </button>
          </div>

          {/* Lyrics Swipe Up Footer */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                toggleMobileFullPlayer(false);
                toggleLyricsModal(true);
              }}
              className="inline-flex flex-col items-center gap-1 text-xs font-bold text-slate-300 hover:text-white tracking-widest uppercase transition"
            >
              <span>LYRICS</span>
              <ChevronUp className="w-4 h-4 animate-bounce text-slate-400" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
