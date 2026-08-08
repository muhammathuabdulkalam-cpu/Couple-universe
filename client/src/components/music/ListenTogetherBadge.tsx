import React from 'react';
import { Heart, Power, Radio } from 'lucide-react';
import { useListenTogetherStore } from '../../store/listenTogetherStore';

export const ListenTogetherBadge: React.FC = React.memo(() => {
  const isSessionActive = useListenTogetherStore((s) => s.isSessionActive);
  const partnerConnected = useListenTogetherStore((s) => s.partnerConnected);
  const partnerName = useListenTogetherStore((s) => s.partnerName);
  const partnerAvatar = useListenTogetherStore((s) => s.partnerAvatar);
  const sendInvite = useListenTogetherStore((s) => s.sendInvite);
  const endSession = useListenTogetherStore((s) => s.endSession);

  if (!isSessionActive) {
    return (
      <button
        onClick={sendInvite}
        className="h-9 sm:h-10 px-4 sm:px-5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95 transition shrink-0"
      >
        <Radio className="w-4 h-4 animate-pulse" />
        <span>Listen Together</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-slate-900/90 border border-rose-500/40 rounded-2xl px-4 py-2 text-white backdrop-blur-xl shadow-xl">
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-600 p-[1.5px] overflow-hidden">
            {partnerAvatar ? (
              <img src={partnerAvatar} alt={partnerName || 'Partner'} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-xs font-bold">
                {partnerName ? partnerName.charAt(0) : 'P'}
              </div>
            )}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
              partnerConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
        </div>

        <div className="text-left">
          <div className="flex items-center gap-1 text-xs font-extrabold text-white">
            <span>Listening Together</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
          </div>
          <p className="text-[10px] text-rose-300 font-semibold truncate max-w-[120px]">
            {partnerConnected ? `Synced with ${partnerName || 'Partner'}` : 'Waiting for connection...'}
          </p>
        </div>
      </div>

      <button
        onClick={endSession}
        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
        title="End Session"
      >
        <Power className="w-4 h-4" />
      </button>
    </div>
  );
});
