import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Lock, Loader2, Palette, Phone, Video, X } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketClient } from '../../api/socketClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useCallStore } from '../../store/callStore.js';
import { useChatStore } from '../../store/chatStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { useWebRTCContext } from '../../context/WebRTCContext.js';

interface ChatHeaderProps {
  onBackClick?: () => void;
}

const WALLPAPER_PRESETS = [
  { id: 'midnight', label: 'Midnight Vault', gradient: 'bg-obsidian-950 border-white/20' },
  { id: 'aurora', label: 'Aurora Dream', gradient: 'bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 border-purple-500/40' },
  { id: 'stars', label: 'Starry Night', gradient: 'bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 border-sky-500/40' },
  { id: 'doodle', label: 'Dark Doodle', gradient: 'bg-slate-950 border-slate-700' },
  { id: 'rose', label: 'Romantic Rose', gradient: 'bg-gradient-to-br from-rose-950 via-obsidian-950 to-pink-950 border-rose-500/40' },
  { id: 'emerald', label: 'Emerald Night', gradient: 'bg-gradient-to-br from-emerald-950 via-obsidian-950 to-teal-950 border-emerald-500/40' },
];

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onBackClick }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeConversation, onlineUsers, wallpaper, setWallpaper } = useChatStore();
  const { callStatus, callType, initiateCall } = useCallStore();
  const { startCall } = useWebRTCContext();
  const { addToast } = useUIStore();
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);

  if (!activeConversation) return null;

  const currentUserIdStr = (user?._id || user?.id)?.toString();

  const getPId = (p: any): string => {
    if (!p) return '';
    if (typeof p === 'string') return p;
    if (typeof p === 'object') {
      if (p._id) return p._id.toString();
      if (p.id) return p.id.toString();
    }
    return String(p);
  };

  const otherParticipant = activeConversation.participants?.find((p: any) => {
    const pId = getPId(p);
    return pId && pId !== currentUserIdStr;
  });

  let targetIdStr = getPId(otherParticipant);

  // Guarantee target ID never equals caller ID or stays empty
  if (!targetIdStr || targetIdStr === currentUserIdStr) {
    if (user?.role === 'SUPER_OWNER') {
      targetIdStr = '6a6e193c0bfba68352f64b5a'; // Amrin (Co-Owner)
    } else if (user?.role === 'CO_OWNER') {
      targetIdStr = '6a6e18200bfba68352f64b47'; // Afzal (Super Owner)
    }
  }

  const isOnline = targetIdStr ? onlineUsers.has(targetIdStr) : false;

  const partnerName = (otherParticipant && typeof otherParticipant === 'object' && otherParticipant.name)
    ? otherParticipant.name
    : (user?.role === 'SUPER_OWNER' ? 'Amrin' : 'Afzal');
  const partnerRole = (otherParticipant && typeof otherParticipant === 'object' && otherParticipant.role)
    ? otherParticipant.role
    : (user?.role === 'SUPER_OWNER' ? 'CO_OWNER' : 'SUPER_OWNER');

  const isCoOwner = partnerRole === 'CO_OWNER' || partnerName.toLowerCase().includes('amrin');
  const isCallActive = callStatus !== 'idle';

  const handleStartCall = async (type: 'audio' | 'video') => {
    if (!targetIdStr || isCallActive) return;
    const socket = socketClient.getSocket();
    if (!socket || !socket.connected) {
      addToast('Not Connected', 'Please wait for connection to establish.', 'error');
      return;
    }

    try {
      initiateCall(type, {
        userId: targetIdStr,
        name: partnerName,
        avatar: otherParticipant?.avatar,
      }, {
        userId: currentUserIdStr || '',
        name: user?.name || 'Me',
        avatar: user?.avatar,
      });

      // Notify the other user via socket
      socket.emit('call:initiate', {
        targetUserId: targetIdStr,
        callType: type,
        callerName: user?.name || 'Me',
        callerAvatar: user?.avatar,
      });

      // Start WebRTC negotiation (creates offer)
      await startCall(targetIdStr, type);
    } catch (err: any) {
      addToast('Call Failed', err.message || 'Could not start call. Check microphone/camera permissions.', 'error');
    }
  };

  const handleHeaderProfileClick = () => {
    if (targetIdStr) {
      navigate('/profile', { state: { targetUserId: targetIdStr } });
    } else {
      navigate('/profile');
    }
  };

  return (
    <div className="h-14 shrink-0 px-3 sm:px-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between z-30 bg-white/95 dark:bg-obsidian-950/95 backdrop-blur-md select-none relative">
      <div className="flex items-center gap-2.5 min-w-0">
        
        {/* Mobile Back Button (WhatsApp / Instagram style) */}
        {onBackClick && (
          <button
            onClick={onBackClick}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors lg:hidden shrink-0"
            title="Back to Chats"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Profile Avatar & Info (Clickable to Navigate to Profile) */}
        <div
          onClick={handleHeaderProfileClick}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer group hover:opacity-90 transition-opacity"
          title="View Profile"
        >
          <div className="relative shrink-0 w-9 h-9">
            <div className="w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] rounded-full bg-gradient-to-tr from-afzal via-amrin to-heart p-[1.5px] shadow-md border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
              {otherParticipant?.avatar ? (
                <img src={otherParticipant.avatar} alt={partnerName} className="w-full h-full object-cover rounded-full"  onError={(e) => { if (!e.currentTarget.src || e.currentTarget.src.includes('unsplash.com')) { e.currentTarget.style.display='none'; } }}/>
              ) : (
                <span className="text-white font-bold text-xs">{partnerName?.[0] || '❤️'}</span>
              )}
            </div>
            {isOnline && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-obsidian-950 absolute bottom-0 right-0 z-10" />
            )}
          </div>

          {/* Name & Compact Role Badge & Status */}
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate group-hover:text-amrin dark:group-hover:text-amrin-glow transition-colors">{partnerName}</span>
              {isCoOwner && (
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 bg-amrin/20 text-amrin dark:text-amrin-glow border-amrin/40">
                  Princess 👸
                </span>
              )}
              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 flex items-center gap-0.5">
                <Lock className="w-2 h-2" /> Encrypted
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
              {isOnline ? (
                <span className="text-emerald-500 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" /> Active now
                </span>
              ) : (
                <span>Last seen recently</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Call & Customizable Wallpaper Icons */}
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 relative">
        <button
          type="button"
          onClick={() => setShowWallpaperPicker(!showWallpaperPicker)}
          className={`p-2 rounded-full transition-colors ${
            showWallpaperPicker ? 'bg-amrin/20 text-amrin dark:text-amrin-glow' : 'text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
          }`}
          title="Chat Wallpaper & Theme"
        >
          <Palette className="w-4.5 h-4.5" />
        </button>

        <button
          className={`p-2 rounded-full transition-colors ${
            callStatus === 'calling' || callStatus === 'active'
              ? 'text-emerald-500 bg-emerald-500/10'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
          }`}
          title="Audio Call"
          onClick={() => handleStartCall('audio')}
          disabled={isCallActive}
        >
          {callStatus === 'calling' && callType === 'audio' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Phone className="w-4 h-4" />
          )}
        </button>

        <button
          className={`p-2 rounded-full transition-colors ${
            callStatus === 'calling' || callStatus === 'active'
              ? 'text-blue-500 bg-blue-500/10'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
          }`}
          title="Video Call"
          onClick={() => handleStartCall('video')}
          disabled={isCallActive}
        >
          {callStatus === 'calling' && callType === 'video' ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
          ) : (
            <Video className="w-4.5 h-4.5" />
          )}
        </button>

        {/* Wallpaper Picker Popover */}
        <AnimatePresence>
          {showWallpaperPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-12 z-50 w-64 glass-panel bg-white dark:bg-obsidian-950/98 backdrop-blur-2xl p-3 rounded-2xl border border-slate-200 dark:border-white/15 shadow-2xl space-y-2"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amrin dark:text-amrin-glow" /> Chat Wallpaper
                </span>
                <button
                  type="button"
                  onClick={() => setShowWallpaperPicker(false)}
                  className="text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {WALLPAPER_PRESETS.map((preset) => {
                  const isSelected = wallpaper === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setWallpaper(preset.id);
                        setShowWallpaperPicker(false);
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${preset.gradient} ${
                        isSelected ? 'ring-2 ring-amrin border-amrin scale-95 shadow-lg' : 'hover:scale-98 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-white truncate w-full text-center">
                        {preset.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amrin-glow" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
