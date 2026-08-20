import React from 'react';
import { motion } from 'framer-motion';
import { Headphones, Heart } from 'lucide-react';
import { useListenTogetherStore } from '../../store/listenTogetherStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { useChatStore } from '../../store/chatStore.js';
import { Avatar } from '../ui/Avatar.js';

export const FloatingCoupleMusicWidget: React.FC = () => {
  const { isSessionActive, partnerName, partnerAvatar, toggleDrawer } = useListenTogetherStore();
  const { user } = useAuthStore();
  const { activeConversation, mobileView } = useChatStore();

  // ONLY render when inside an active chat thread (not on chat list page)
  if (!activeConversation || mobileView !== 'chat') {
    return null;
  }

  const isCoOwner = user?.role === 'CO_OWNER' || user?.name?.toLowerCase().includes('amrin');
  const partnerDisplayName = partnerName || (isCoOwner ? 'Afzal' : 'Amrin');

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
        onClick={() => toggleDrawer()}
        className={`w-12 h-12 rounded-full backdrop-blur-2xl border-2 ring-2 shadow-2xl active:scale-95 transition-all flex items-center justify-center relative group cursor-pointer shrink-0 ${
          isSessionActive
            ? 'bg-gradient-to-tr from-rose-950 via-obsidian-950 to-purple-950 border-rose-500/80 ring-rose-500/40 shadow-rose-500/40'
            : 'bg-obsidian-950/95 border-white/20 ring-white/10 shadow-black/60 hover:border-amrin-glow'
        }`}
        title={`Listen Together with ${partnerDisplayName} 💖 (Click to open sidebar)`}
      >
        {/* Combined Overlapping Dual Avatars */}
        <div className="flex items-center justify-center -space-x-2.5">
          <Avatar src={user?.avatar} name={user?.name} size="xs" className="w-5.5 h-5.5 border border-obsidian-950 shadow-sm" />
          <Avatar src={partnerAvatar} name={partnerDisplayName} size="xs" className="w-5.5 h-5.5 border border-obsidian-950 shadow-sm" />
        </div>

        {/* Glowing Heartbeat Headphones Badge */}
        <div className="absolute -top-1 -right-1 z-20 w-5 h-5 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-500 border border-white/40 shadow-lg flex items-center justify-center">
          {isSessionActive ? (
            <Headphones className="w-2.5 h-2.5 text-white animate-pulse" />
          ) : (
            <Heart className="w-2.5 h-2.5 text-white fill-white" />
          )}
        </div>
      </button>
    </motion.div>
  );
};
