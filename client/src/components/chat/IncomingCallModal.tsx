import { AnimatePresence, motion } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { socketClient } from '../../api/socketClient';
import { useCallStore } from '../../store/callStore';
import { useWebRTCContext } from '../../context/WebRTCContext';

interface IncomingCallModalProps {
  offerRef: React.MutableRefObject<RTCSessionDescriptionInit | null>;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ offerRef }) => {
  const { callStatus, callType, remoteUser, endCall } = useCallStore();
  const { answerCall } = useWebRTCContext();
  const [ringCount, setRingCount] = useState(0);
  const autoRejectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isRinging = callStatus === 'ringing';

  // Auto-dismiss after 30 seconds
  useEffect(() => {
    if (isRinging) {
      autoRejectTimer.current = setTimeout(() => {
        handleReject();
      }, 30_000);
    }
    return () => {
      if (autoRejectTimer.current) clearTimeout(autoRejectTimer.current);
    };
  }, [isRinging]);

  // Animate ring pulse counter
  useEffect(() => {
    if (!isRinging) return;
    const interval = setInterval(() => setRingCount((c) => c + 1), 1000);
    return () => clearInterval(interval);
  }, [isRinging]);

  // Synthesize authentic phone dual-tone ringtone (440Hz + 480Hz) when ringing
  useEffect(() => {
    if (!isRinging) return;

    let audioCtx: AudioContext | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();

        const playRingTone = () => {
          if (!audioCtx || audioCtx.state === 'closed') return;
          if (audioCtx.state === 'suspended') {
            audioCtx.resume();
          }

          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(440, audioCtx.currentTime); // Standard ringtone tone A4
          osc2.frequency.setValueAtTime(480, audioCtx.currentTime); // Tone mix

          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.8);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(audioCtx.destination);

          osc1.start(audioCtx.currentTime);
          osc2.start(audioCtx.currentTime);
          osc1.stop(audioCtx.currentTime + 1.8);
          osc2.stop(audioCtx.currentTime + 1.8);
        };

        playRingTone();
        timer = setInterval(playRingTone, 3000);
      }
    } catch (err) {
      console.warn('AudioContext ringtone notice:', err);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    };
  }, [isRinging]);

  const handleAccept = async () => {
    if (!remoteUser || !callType) return;
    useCallStore.getState().setActive();
    const socket = socketClient.getSocket();
    socket?.emit('call:accept', { callerId: remoteUser.userId });

    if (offerRef.current) {
      await answerCall(remoteUser.userId, offerRef.current, callType);
    }
  };

  const handleReject = () => {
    if (!remoteUser) return;
    const socket = socketClient.getSocket();
    socket?.emit('call:log_history', {
      targetUserId: remoteUser.userId,
      callType: callType || 'audio',
      status: 'DECLINED',
    });
    socket?.emit('call:reject', { callerId: remoteUser.userId });
    endCall();
  };

  return (
    <AnimatePresence>
      {isRinging && remoteUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.85, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative w-80 rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-black border border-white/10 shadow-2xl text-white p-8 flex flex-col items-center gap-5"
          >
            {/* Blurred glow BG */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[80px] bg-blue-500/20 pointer-events-none" />

            {/* Call type badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold uppercase tracking-widest text-slate-300">
              {callType === 'video' ? (
                <Video className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
              )}
              Incoming {callType === 'video' ? 'Video' : 'Audio'} Call
            </div>

            {/* Pulsing Avatar Ring */}
            <div className="relative flex items-center justify-center">
              {/* Animated concentric rings */}
              {[1, 2, 3].map((ring) => (
                <motion.div
                  key={ring}
                  className="absolute rounded-full border border-white/20"
                  animate={{
                    scale: [1, 1 + ring * 0.35],
                    opacity: [0.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: ring * 0.4,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                  style={{ width: 80, height: 80 }}
                />
              ))}

              <div className="w-20 h-20 rounded-full ring-2 ring-white/30 overflow-hidden shadow-xl">
                {remoteUser.avatar ? (
                  <img src={remoteUser.avatar} alt={remoteUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-rose-600 to-amrin flex items-center justify-center text-white text-2xl font-bold">
                    {remoteUser.name?.[0] || '?'}
                  </div>
                )}
              </div>
            </div>

            {/* Caller info */}
            <div className="text-center space-y-1">
              <h3 className="text-xl font-extrabold tracking-tight">{remoteUser.name}</h3>
              <p className="text-sm text-slate-400 font-medium">
                {callType === 'video' ? '📹 Wants to video call you' : '📞 Wants to audio call you'}
              </p>
            </div>

            {/* Accept / Reject buttons */}
            <div className="flex items-center gap-8 pt-2">
              {/* Reject */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={handleReject}
                  className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center shadow-xl shadow-rose-600/30 active:scale-95 transition-all"
                  title="Decline"
                >
                  <PhoneOff className="w-7 h-7 text-white" />
                </button>
                <span className="text-xs text-slate-400 font-semibold">Decline</span>
              </div>

              {/* Accept */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={handleAccept}
                  className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 active:scale-95 transition-all"
                  title="Accept"
                >
                  {callType === 'video' ? (
                    <Video className="w-7 h-7 text-white" />
                  ) : (
                    <Phone className="w-7 h-7 text-white" />
                  )}
                </button>
                <span className="text-xs text-slate-400 font-semibold">Accept</span>
              </div>
            </div>

            {/* Auto-reject countdown hint */}
            <p className="text-[10px] text-slate-600 font-mono">
              Auto-decline in {Math.max(0, 30 - ringCount)}s
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
