import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Headphones,
  Heart,
  Radio,
  LogOut,
  Compass,
  UserCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useListenTogetherStore } from '../../store/listenTogetherStore.js';
import { useMusicPlayerStore } from '../../store/musicPlayerStore.js';
import { getNormalizedCoverUrl } from '../../utils/audioDecoder.js';

export const ListenTogetherDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    isSessionActive,
    partnerName,
    partnerAvatar,
    isDrawerOpen,
    setDrawerOpen,
    endSession,
  } = useListenTogetherStore();

  const { user } = useAuthStore();
  const currentTrack = useMusicPlayerStore((s) => s.currentTrack);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const currentTime = useMusicPlayerStore((s) => s.currentTime);
  const duration = useMusicPlayerStore((s) => s.duration);

  const togglePlay = useMusicPlayerStore((s) => s.togglePlay);
  const nextTrack = useMusicPlayerStore((s) => s.nextTrack);
  const prevTrack = useMusicPlayerStore((s) => s.prevTrack);
  const seekTo = useMusicPlayerStore((s) => s.seekTo);

  if (!isDrawerOpen) return null;

  const myHasAvatar = Boolean(user?.avatar && !user.avatar.includes('unsplash.com'));
  const pHasAvatar = Boolean(partnerAvatar && !partnerAvatar.includes('unsplash.com'));

  const formatTime = (secs?: number | null) => {
    if (!secs || isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex justify-end bg-black/70 backdrop-blur-sm">
        {/* Backdrop overlay dismiss click */}
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => setDrawerOpen(false)}
        />

        {/* Slide-Over Drawer Container */}
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 350, damping: 32 }}
          className="relative z-10 w-80 sm:w-[380px] max-w-[90vw] h-full bg-slate-950/95 backdrop-blur-2xl border-l border-white/15 p-5 flex flex-col justify-between overflow-y-auto select-none shadow-2xl text-white"
        >
          {/* Header */}
          <div className="space-y-4 border-b border-white/10 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg animate-pulse">
                  <Headphones className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-1.5">
                  Listen Together <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-ping" />
                </h3>
              </div>

              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Couple Sync Connection Status Banner */}
            {isSessionActive ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900/90 to-purple-950/80 border border-rose-500/30 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="flex items-center -space-x-3">
                    {myHasAvatar ? (
                      <img src={user!.avatar!} alt={user?.name || 'Me'} className="w-9 h-9 rounded-full object-cover border-2 border-white/40 shadow-md"  onError={(e) => { if (!e.currentTarget.src || e.currentTarget.src.includes('unsplash.com')) { e.currentTarget.style.display='none'; } }}/>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-700 border-2 border-white/30 flex items-center justify-center">
                        <UserCircle2 className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    {pHasAvatar ? (
                      <img src={partnerAvatar!} alt={partnerName || 'Partner'} className="w-9 h-9 rounded-full object-cover border-2 border-white/40 shadow-md" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-700 border-2 border-white/30 flex items-center justify-center">
                        <UserCircle2 className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-rose-200">Synced Session</h4>
                    <p className="text-[10px] text-slate-300">With {partnerName || 'Partner'} 💖</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                  <Radio className="w-3 h-3 text-rose-400 animate-ping" /> LIVE
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 text-xs text-slate-400 text-center">
                No active Listen Together session.
              </div>
            )}
          </div>

          {/* Center Content: Current Song Info & Controls */}
          <div className="py-6 space-y-5 flex-1 flex flex-col justify-center">
            {currentTrack ? (
              <div className="space-y-4 text-center">
                {/* Artwork */}
                <div className="relative w-36 h-36 mx-auto rounded-2xl overflow-hidden shadow-2xl border-2 border-white/15 group">
                  <img
                    src={getNormalizedCoverUrl(currentTrack.coverUrl)}
                    alt={currentTrack.title}
                    className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Music className="w-8 h-8 text-white/80" />
                  </div>
                </div>

                {/* Track Details */}
                <div>
                  <h4 className="text-sm font-extrabold text-white truncate px-2">
                    {currentTrack.title}
                  </h4>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {currentTrack.artist}
                  </p>

                  {/* Equalizer Bar */}
                  {isPlaying && (
                    <div className="flex items-end justify-center gap-1 mt-2 h-3">
                      <span className="w-1 bg-rose-400 rounded-full animate-[bounce_0.6s_infinite_100ms] h-full" />
                      <span className="w-1 bg-pink-400 rounded-full animate-[bounce_0.6s_infinite_300ms] h-2/3" />
                      <span className="w-1 bg-purple-400 rounded-full animate-[bounce_0.6s_infinite_200ms] h-full" />
                      <span className="w-1 bg-rose-500 rounded-full animate-[bounce_0.6s_infinite_400ms] h-1/2" />
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 px-2 pt-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration || 180)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 180}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => seekTo(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>

                {/* Quick Player Controls */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  <button
                    onClick={() => prevTrack()}
                    className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
                    title="Previous Track"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => togglePlay()}
                    className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/40 hover:scale-105 active:scale-95 transition cursor-pointer"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-white" />
                    ) : (
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() => nextTrack()}
                    className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
                    title="Next Track"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3 py-8">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                  <Music className="w-7 h-7" />
                </div>
                <p className="text-xs text-slate-400">No active track selected</p>
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate('/shared-music');
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition cursor-pointer"
                >
                  Browse Shared Music
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-white/10 pt-4 space-y-2">
            <button
              onClick={() => {
                setDrawerOpen(false);
                navigate('/shared-music');
              }}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Compass className="w-4 h-4 text-rose-400" /> Open Full Shared Music Page
            </button>

            {isSessionActive && (
              <button
                onClick={async () => {
                  await endSession();
                  setDrawerOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> End Listen Together Session
              </button>
            )}
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
};
