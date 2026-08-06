import React from 'react';
import { Heart, Music, Check, X, Clock } from 'lucide-react';
import { useListenTogetherStore } from '../../store/listenTogetherStore';

export const ListenTogetherInviteBanner: React.FC = () => {
  const { incomingInvite, inviteCountdown, acceptInvite, declineInvite } =
    useListenTogetherStore();

  if (!incomingInvite) return null;

  const minutes = Math.floor(inviteCountdown / 60);
  const seconds = inviteCountdown % 60;
  const timeStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white p-4 rounded-2xl shadow-2xl border border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-bounce-short">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
          <Music className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base">
              🎵 {incomingInvite.hostName} wants to listen together
            </span>
            <Heart className="w-4 h-4 fill-white text-white animate-ping" />
          </div>
          <p className="text-xs text-rose-100 flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Invitation expires in {timeStr}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => acceptInvite(incomingInvite.sessionId)}
          className="px-5 py-2.5 rounded-xl bg-white text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 shadow-lg transition active:scale-95"
        >
          <Check className="w-4 h-4" /> Accept
        </button>
        <button
          onClick={() => declineInvite(incomingInvite.sessionId)}
          className="px-4 py-2.5 rounded-xl bg-black/20 hover:bg-black/30 text-white font-semibold text-xs flex items-center gap-1 transition"
        >
          <X className="w-4 h-4" /> Decline
        </button>
      </div>
    </div>
  );
};
