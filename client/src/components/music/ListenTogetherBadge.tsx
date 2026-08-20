import React, { useEffect } from 'react';
import { Heart, Loader2, Power, Radio, X } from 'lucide-react';
import { fetchPartnerProfile, useListenTogetherStore } from '../../store/listenTogetherStore';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../ui/Avatar';

export const ListenTogetherBadge: React.FC = React.memo(() => {
  const user = useAuthStore((s) => s.user);
  const isSessionActive = useListenTogetherStore((s) => s.isSessionActive);
  const isInviting = useListenTogetherStore((s) => s.isInviting);
  const activeSession = useListenTogetherStore((s) => s.activeSession);
  const partnerConnected = useListenTogetherStore((s) => s.partnerConnected);
  const partnerName = useListenTogetherStore((s) => s.partnerName);
  const partnerAvatar = useListenTogetherStore((s) => s.partnerAvatar);
  const setDrawerOpen = useListenTogetherStore((s) => s.setDrawerOpen);
  const endSession = useListenTogetherStore((s) => s.endSession);
  const clearInvite = useListenTogetherStore((s) => s.clearInvite);

  useEffect(() => {
    if (user) {
      if (!partnerName || partnerName === 'Partner' || !partnerAvatar) {
        fetchPartnerProfile();
      }
    }
  }, [isSessionActive, partnerName, partnerAvatar, user]);

  if (!user) {
    return null;
  }

  // State 1: Active Listen Together Session
  if (isSessionActive) {
    return (
      <div
        onClick={() => setDrawerOpen(true)}
        className="flex items-center gap-1.5 sm:gap-3 bg-slate-900/90 border border-rose-500/40 rounded-full sm:rounded-2xl px-2.5 sm:px-4 py-1 sm:py-2 text-white backdrop-blur-xl shadow-xl shrink-0 cursor-pointer hover:border-rose-400 transition"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="relative shrink-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-600 p-[1.5px] overflow-hidden">
              <Avatar src={partnerAvatar} name={partnerName || 'Partner'} size="sm" className="w-full h-full" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-3 sm:h-3 rounded-full border-2 border-slate-900 ${
                partnerConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
          </div>

          <div className="text-left min-w-0">
            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-extrabold text-white">
              <span className="hidden sm:inline">Listening Together</span>
              <span className="sm:hidden text-slate-100">Listening</span>
              <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
            </div>
            <p className="text-[9px] sm:text-[10px] text-rose-300 font-semibold truncate max-w-[85px] sm:max-w-[120px]">
              {partnerConnected ? `Synced with ${partnerName || 'Partner'}` : 'Connecting...'}
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            endSession();
          }}
          className="p-1 sm:p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition shrink-0 ml-0.5 sm:ml-0 cursor-pointer"
          title="End Session"
        >
          <Power className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    );
  }

  // State 2: Sending Invite or Invitation Pending
  const isPendingInvite = !isSessionActive && (isInviting || (activeSession && activeSession.status === 'INVITED'));
  if (isPendingInvite) {
    return (
      <div
        onClick={() => setDrawerOpen(true)}
        className="flex items-center gap-2 bg-purple-950/80 border border-purple-500/40 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-white backdrop-blur-xl shadow-lg shrink-0 cursor-pointer hover:border-purple-400 transition"
      >
        <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin shrink-0" />
        <span className="text-xs font-bold text-purple-200 truncate">
          {isInviting ? 'Sending Invite...' : `Inviting ${partnerName || 'Partner'}...`}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            clearInvite();
          }}
          className="p-0.5 hover:bg-white/10 rounded-full text-purple-300 hover:text-white transition ml-1 cursor-pointer"
          title="Cancel Invitation"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // State 3: Inactive - Prominent Trigger Button (Opens Target Drawer)
  return (
    <button
      onClick={() => setDrawerOpen(true)}
      className="h-8 sm:h-10 px-3.5 sm:px-5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-purple-500/25 hover:scale-105 active:scale-95 transition shrink-0 border border-white/10 cursor-pointer"
      title="Open Listen Together to select recipient and send invite"
    >
      <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200 animate-pulse stroke-[2.5]" />
      <span>Listen Together</span>
    </button>
  );
});
