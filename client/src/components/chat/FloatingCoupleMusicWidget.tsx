import React from 'react';
import { motion } from 'framer-motion';
import { Headphones, Music, Sparkles } from 'lucide-react';
import { useListenTogetherStore } from '../../store/listenTogetherStore.js';
import { useMusicPlayerStore } from '../../store/musicPlayerStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { useChatStore } from '../../store/chatStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { Avatar } from '../ui/Avatar.js';
import { getNormalizedCoverUrl } from '../../utils/audioDecoder.js';

export const FloatingCoupleMusicWidget: React.FC = () => {
  const { isSessionActive, partnerName, partnerAvatar, toggleDrawer } = useListenTogetherStore();
  const { isPlaying, currentTrack } = useMusicPlayerStore();
  const { user } = useAuthStore();
  const { activeConversation, mobileView } = useChatStore();
  const { toggleActivityDrawer } = useUIStore();

  // ONLY render inside an active chat thread (not on chat list page)
  if (!activeConversation || mobileView !== 'chat') {
    return null;
  }

  const isCoOwner = user?.role === 'CO_OWNER' || user?.name?.toLowerCase().includes('amrin');
  const partnerDisplayName = partnerName || (isCoOwner ? 'Afzal' : 'Amrin');
  const myHasAvatar = Boolean(user?.avatar && !user.avatar.includes('unsplash.com'));
  const pHasAvatar = Boolean(partnerAvatar && !partnerAvatar.includes('unsplash.com'));

  const handleClick = () => {
    if (isSessionActive) {
      toggleDrawer(); // Opens Listen Together sidebar
    } else {
      toggleActivityDrawer(true); // Opens Activity sidebar
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.05}
      whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed bottom-24 right-4 z-50 select-none touch-none cursor-grab"
      style={{ touchAction: 'none' }}
    >
      <button
        type="button"
        onClick={handleClick}
        className={`w-12 h-12 rounded-full backdrop-blur-2xl border-2 ring-2 shadow-2xl active:scale-95 transition-all flex items-center justify-center relative group cursor-pointer shrink-0 overflow-visible ${
          isSessionActive
            ? 'bg-gradient-to-tr from-rose-950 via-obsidian-950 to-purple-950 border-rose-500/80 ring-rose-500/40 shadow-rose-500/40'
            : isPlaying
            ? 'bg-obsidian-950/95 border-amrin-glow ring-amrin-glow/50 shadow-amrin-glow/30'
            : 'bg-obsidian-950/95 border-white/20 ring-white/10 shadow-black/60 hover:border-amber-400'
        }`}
        title={
          isSessionActive
            ? `Listen Together Connected with ${partnerDisplayName} 💖`
            : isPlaying
            ? `Playing: ${currentTrack?.title || 'Shared Music'} 🎵`
            : 'Open Music & Listen Together'
        }
      >
        {isSessionActive ? (
          /* State 1: Listen Together Connected -> Show Dual Avatar Couple Icon */
          <>
            <div className="flex items-center justify-center -space-x-2.5">
              {myHasAvatar ? (
                <img src={user!.avatar!} alt="Me" className="w-5.5 h-5.5 rounded-full object-cover border border-white/40 shadow-sm" onError={(e) => { if (!e.currentTarget.src || e.currentTarget.src.includes('unsplash.com')) { e.currentTarget.style.display='none'; } }}/>
              ) : (
                <Avatar src={user?.avatar} name={user?.name} size="xs" className="w-5.5 h-5.5 border border-obsidian-950 shadow-sm" />
              )}
              {pHasAvatar ? (
                <img src={partnerAvatar!} alt={partnerDisplayName} className="w-5.5 h-5.5 rounded-full object-cover border border-white/40 shadow-sm" />
              ) : (
                <Avatar src={partnerAvatar} name={partnerDisplayName} size="xs" className="w-5.5 h-5.5 border border-obsidian-950 shadow-sm" />
              )}
            </div>

            {/* Glowing Heartbeat Headphones Badge */}
            <div className="absolute -top-1 -right-1 z-20 w-5 h-5 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-500 border border-white/40 shadow-lg flex items-center justify-center animate-bounce">
              <Headphones className="w-2.5 h-2.5 text-white animate-pulse" />
            </div>
          </>
        ) : isPlaying && currentTrack ? (
          /* State 2: Playing Music Solo -> Show Song Cover / Music Icon with Note Badge */
          <>
            <img
              src={getNormalizedCoverUrl(currentTrack.coverUrl)}
              alt={currentTrack.title}
              className="w-full h-full object-cover rounded-full select-none"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="absolute -top-1 -right-1 z-20 w-5 h-5 rounded-full bg-gradient-to-tr from-afzal via-rose-500 to-amrin border-2 border-obsidian-950 shadow-lg flex items-center justify-center animate-bounce">
              <Music className="w-2.5 h-2.5 text-white animate-pulse" />
            </div>
          </>
        ) : (
          /* State 3: Listen Together Disconnected & Idle -> Show Activity Sparkles ✨ Icon */
          <div className="flex items-center justify-center text-amber-300">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
        )}
      </button>
    </motion.div>
  );
};
