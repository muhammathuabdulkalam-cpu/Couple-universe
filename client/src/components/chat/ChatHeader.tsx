import { ArrowLeft, Phone, Video } from 'lucide-react';
import React from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { useChatStore } from '../../store/chatStore.js';

interface ChatHeaderProps {
  onBackClick?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onBackClick }) => {
  const { user } = useAuthStore();
  const { activeConversation, onlineUsers } = useChatStore();

  if (!activeConversation) return null;

  // Identify partner participant
  const otherParticipant = activeConversation.participants?.find(
    (p) => p._id !== user?.id && p.id !== user?.id && p._id !== user?._id
  );
  const isOnline = otherParticipant ? onlineUsers[otherParticipant._id] : false;

  const partnerName = otherParticipant?.name || (user?.role === 'SUPER_OWNER' ? 'Amrin' : 'Afzal');
  const partnerRole = otherParticipant?.role || (user?.role === 'SUPER_OWNER' ? 'CO_OWNER' : 'SUPER_OWNER');

  const isCoOwner = partnerRole === 'CO_OWNER' || partnerName.toLowerCase().includes('amrin');

  return (
    <div className="h-14 shrink-0 px-3 sm:px-4 border-b border-white/10 flex items-center justify-between z-30 bg-obsidian-950/95 backdrop-blur-md select-none">
      <div className="flex items-center gap-2.5 min-w-0">
        
        {/* Mobile Back Button (WhatsApp / Instagram style) */}
        {onBackClick && (
          <button
            onClick={onBackClick}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors lg:hidden shrink-0"
            title="Back to Chats"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Profile Avatar (Strict 36px x 36px sizing) */}
        <div className="relative shrink-0 w-9 h-9">
          <div className="w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] rounded-full bg-gradient-to-tr from-afzal via-amrin to-heart p-[1.5px] shadow-md border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
            {otherParticipant?.avatar ? (
              <img src={otherParticipant.avatar} alt={partnerName} className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-white font-bold text-xs">{partnerName?.[0] || '❤️'}</span>
            )}
          </div>
          {isOnline && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-obsidian-950 absolute bottom-0 right-0 z-10" />
          )}
        </div>

        {/* Name & Compact Role Badge & Status */}
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-xs sm:text-sm font-extrabold text-white truncate">{partnerName}</span>
            {isCoOwner && (
              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 bg-amrin/20 text-amrin-glow border-amrin/40">
                Princess 👸
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
            {isOnline ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active now
              </span>
            ) : (
              <span>Last seen recently</span>
            )}
          </p>
        </div>
      </div>

      {/* Call / Option Icons */}
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        <button
          className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Audio Call"
        >
          <Phone className="w-4 h-4" />
        </button>

        <button
          className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Video Call"
        >
          <Video className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
};
