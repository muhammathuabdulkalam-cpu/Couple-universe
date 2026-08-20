import React from 'react';
import { motion } from 'framer-motion';
import { Headphones, Music } from 'lucide-react';
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
      className="fixed bottom-20 right-3 z-50 select-none touch-none cursor-grab"
      style={{ touchAction: 'none' }}
    >
      <button
        type="button"
        onClick={handleClick}
        className={`w-9 h-9 rounded-full backdrop-blur-2xl border ring-1 shadow-xl active:scale-95 transition-all flex items-center justify-center relative group cursor-pointer shrink-0 overflow-visible ${
          isSessionActive
            ? 'bg-gradient-to-tr from-rose-950 via-obsidian-950 to-purple-950 border-rose-500/80 ring-rose-500/40 shadow-rose-500/30'
            : isPlaying
            ? 'bg-obsidian-950/95 border-amrin-glow ring-amrin-glow/50 shadow-amrin-glow/30'
            : 'bg-obsidian-950/95 border-white/20 ring-white/10 shadow-black/60 hover:border-amrin-glow'
        }`}
        title={
          isSessionActive
            ? `Listen Together Connected with ${partnerDisplayName} 💖`
            : isPlaying
            ? `Playing: ${currentTrack?.title || 'Shared Music'} 🎵`
            : 'Open Activity & Music'
        }
      >
        {isSessionActive ? (
          /* State 1: Listen Together Connected -> Compact Dual Avatar Couple Icon */
          <>
            <div className="flex items-center justify-center -space-x-1.5">
              {myHasAvatar ? (
                <img src={user!.avatar!} alt="Me" className="w-4 h-4 rounded-full object-cover border border-white/40 shadow-sm" onError={(e) => { if (!e.currentTarget.src || e.currentTarget.src.includes('unsplash.com')) { e.currentTarget.style.display='none'; } }}/>
              ) : (
                <Avatar src={user?.avatar} name={user?.name} size="xs" className="w-4 h-4 border border-obsidian-950 shadow-sm" />
              )}
              {pHasAvatar ? (
                <img src={partnerAvatar!} alt={partnerDisplayName} className="w-4 h-4 rounded-full object-cover border border-white/40 shadow-sm" />
              ) : (
                <Avatar src={partnerAvatar} name={partnerDisplayName} size="xs" className="w-4 h-4 border border-obsidian-950 shadow-sm" />
              )}
            </div>

            {/* Compact Glowing Heartbeat Headphones Badge */}
            <div className="absolute -top-1 -right-1 z-20 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-500 border border-white/40 shadow-md flex items-center justify-center animate-bounce">
              <Headphones className="w-2 h-2 text-white animate-pulse" />
            </div>
          </>
        ) : isPlaying && currentTrack ? (
          /* State 2: Playing Music Solo -> Compact Song Cover / Music Icon */
          <>
            <img
              src={getNormalizedCoverUrl(currentTrack.coverUrl)}
              alt={currentTrack.title}
              className="w-full h-full object-cover rounded-full select-none"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="absolute -top-1 -right-1 z-20 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-afzal via-rose-500 to-amrin border border-obsidian-950 shadow-md flex items-center justify-center animate-bounce">
              <Music className="w-2 h-2 text-white animate-pulse" />
            </div>
          </>
        ) : (
          /* State 3: Listen Together Disconnected & Idle -> Compact Music Icon */
          <div className="flex items-center justify-center text-amrin-glow">
            <Music className="w-4 h-4 text-amrin-glow animate-pulse" />
          </div>
        )}
      </button>
    </motion.div>
  );
};
