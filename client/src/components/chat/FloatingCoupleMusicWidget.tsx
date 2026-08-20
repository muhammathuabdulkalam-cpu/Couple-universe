import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Heart, Music, Disc, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useMusicPlayerStore } from '../../store/musicPlayerStore.js';
import { useListenTogetherStore } from '../../store/listenTogetherStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { Avatar } from '../ui/Avatar.js';

export const FloatingCoupleMusicWidget: React.FC = () => {
  const { currentTrack, isPlaying, isLoading, togglePlay, nextTrack, prevTrack } = useMusicPlayerStore();
  const { isSessionActive, partnerConnected, partnerName, partnerAvatar, toggleDrawer, sendInvite } = useListenTogetherStore();
  const { user } = useAuthStore();

  const [isExpanded, setIsExpanded] = useState(true);

  // Partner info resolution
  const isCoOwner = user?.role === 'CO_OWNER' || user?.name?.toLowerCase().includes('amrin');
  const partnerDisplayName = partnerName || (isCoOwner ? 'Afzal' : 'Amrin');

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.05}
      whileDrag={{ scale: 1.03, cursor: 'grabbing' }}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed bottom-20 right-4 z-50 select-none touch-none cursor-grab"
      style={{ touchAction: 'none' }}
    >
      <div className="relative group">
        {/* Decorative Outer Glow */}
        <div className={`absolute -inset-0.5 rounded-full blur-md opacity-75 transition duration-500 ${
          isSessionActive ? 'bg-gradient-to-r from-rose-500 via-purple-500 to-pink-500 animate-pulse' : 'bg-gradient-to-r from-slate-700 to-slate-800'
        }`} />

        {/* Collapsed Pill / Bubble */}
        {!isExpanded ? (
          <motion.div
            layout
            onClick={() => setIsExpanded(true)}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-full bg-obsidian-950/95 border border-white/20 shadow-2xl backdrop-blur-2xl text-white hover:bg-white/10 transition-colors"
          >
            {/* Couple / Music Avatar Icon */}
            <div className="relative shrink-0 flex items-center -space-x-2">
              <Avatar src={user?.avatar} name={user?.name} size="xs" className="border-2 border-obsidian-950" />
              <Avatar src={partnerAvatar} name={partnerDisplayName} size="xs" className="border-2 border-obsidian-950" />
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <Heart className={`w-3.5 h-3.5 ${isSessionActive ? 'text-rose-400 fill-rose-400 animate-pulse' : 'text-slate-400'}`} />
              {currentTrack ? (
                <span className="text-xs font-bold truncate max-w-[100px] text-white">
                  {currentTrack.title}
                </span>
              ) : (
                <span className="text-xs font-semibold text-slate-300">Listen Together</span>
              )}
            </div>

            {/* Quick Play/Pause on Collapsed Mode */}
            {currentTrack && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="p-1 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition-colors"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>
            )}

            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          </motion.div>
        ) : (
          /* Expanded Floating Control Capsule */
          <motion.div
            layout
            className="relative w-72 sm:w-80 rounded-3xl bg-obsidian-950/95 border border-white/20 p-3.5 shadow-2xl backdrop-blur-2xl text-white space-y-3"
          >
            {/* Header: Couple Status & Drag Handle */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div
                onClick={toggleDrawer}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="relative shrink-0 flex items-center -space-x-2">
                  <Avatar src={user?.avatar} name={user?.name} size="xs" className="border border-obsidian-950" />
                  <Avatar src={partnerAvatar} name={partnerDisplayName} size="xs" className="border border-obsidian-950" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-extrabold text-white truncate max-w-[120px]">
                      {partnerDisplayName}
                    </span>
                    <Heart className={`w-3 h-3 ${isSessionActive ? 'text-rose-500 fill-rose-500 animate-pulse' : 'text-slate-400'}`} />
                  </div>
                  <p className="text-[9px] font-semibold text-slate-400 leading-none">
                    {isSessionActive
                      ? partnerConnected ? 'Connected & Synced 🎵' : 'Waiting for partner...'
                      : 'Listen Together Offline'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!isSessionActive && (
                  <button
                    type="button"
                    onClick={() => sendInvite()}
                    className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-extrabold shadow-md hover:scale-105 transition-transform"
                  >
                    Invite
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Minimize"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Middle: Current Playing Song Info */}
            {currentTrack ? (
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
                <div className="relative shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-white/10">
                  {currentTrack.coverUrl ? (
                    <img
                      src={currentTrack.coverUrl}
                      alt={currentTrack.title}
                      className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-rose-400">
                      <Music className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-extrabold text-white truncate">{currentTrack.title}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{currentTrack.artist}</p>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Disc className="w-4 h-4 text-amrin-glow animate-spin" />
                <span>No track playing. Click play below!</span>
              </div>
            )}

            {/* Bottom Controls: Prev / Play-Pause / Next */}
            <div className="flex items-center justify-center gap-4 pt-1">
              <button
                type="button"
                onClick={() => prevTrack()}
                className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Previous Track"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => togglePlay()}
                disabled={!currentTrack}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-transform ${
                  currentTrack
                    ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:scale-105 active:scale-95 shadow-rose-500/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => nextTrack()}
                className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Next Track"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
