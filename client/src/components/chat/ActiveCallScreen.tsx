import { AnimatePresence, motion } from 'framer-motion';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Minimize2,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useCallStore } from '../../store/callStore';
import { useWebRTCContext } from '../../context/WebRTCContext';

interface ActiveCallScreenProps {
  targetUserId: string;
}

export const ActiveCallScreen: React.FC<ActiveCallScreenProps> = ({ targetUserId }) => {
  const {
    callStatus,
    callType,
    remoteUser,
    isMuted,
    isCameraOff,
    isSpeakerOff,
    callDuration,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
    remoteStreamActive,
  } = useCallStore();

  const { localVideoRef, remoteVideoRef, localStream, remoteStream, hangUp } = useWebRTCContext();

  const [isMinimized, setIsMinimized] = useState(false);

  // Attach local and remote streams whenever video element refs or stream states update
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, localVideoRef]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, remoteStreamActive, remoteVideoRef]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isActive = callStatus === 'active';
  const isCalling = callStatus === 'calling';

  if (callStatus !== 'active' && callStatus !== 'calling') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed z-[190] ${
          isMinimized
            ? 'bottom-20 right-4 w-64 rounded-2xl shadow-2xl overflow-hidden border border-white/20'
            : 'inset-0 bg-black'
        }`}
      >
        {/* ─── VIDEO CALL ─────────────────────────────────────────────────── */}
        {callType === 'video' ? (
          <div className="relative w-full h-full bg-black">
            {/* Remote video — full screen */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${!remoteStreamActive ? 'hidden' : 'block'}`}
            />

            {/* Fallback avatar overlay when remote stream is not yet active or connecting */}
            {!remoteStreamActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-900 via-slate-900 to-black">
                <div className="relative flex items-center justify-center">
                  {[1, 2, 3].map((ring) => (
                    <motion.div
                      key={ring}
                      className="absolute rounded-full border border-blue-500/30"
                      animate={{ scale: [1, 1 + ring * 0.4], opacity: [0.5, 0] }}
                      transition={{ duration: 2, delay: ring * 0.4, repeat: Infinity, ease: 'easeOut' }}
                      style={{ width: 100, height: 100 }}
                    />
                  ))}
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-600 to-amrin flex items-center justify-center text-white text-4xl font-bold shadow-2xl overflow-hidden ring-4 ring-white/20">
                    {remoteUser?.avatar ? (
                      <img src={remoteUser.avatar} alt={remoteUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{remoteUser?.name?.[0] || '?'}</span>
                    )}
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-white font-extrabold text-xl">{remoteUser?.name}</p>
                  <p className="text-blue-400 text-sm font-medium animate-pulse flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    {isCalling ? 'Ringing partner...' : 'Connecting video feed...'}
                  </p>
                </div>
              </div>
            )}

            {/* Local video — small PiP corner */}
            <div className="absolute top-4 right-4 w-28 h-40 rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl bg-slate-900">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover scale-x-[-1] ${isCameraOff ? 'hidden' : 'block'}`}
              />
              {isCameraOff && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-1 text-slate-400">
                  <CameraOff className="w-6 h-6" />
                  <span className="text-[10px] font-bold">Cam Off</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ─── AUDIO CALL ─────────────────────────────────────────────── */
          <div className="relative w-full h-full bg-gradient-to-b from-slate-900 via-slate-900 to-black flex flex-col items-center justify-center gap-6">
            {/* Pulsing concentric avatar rings */}
            <div className="relative flex items-center justify-center">
              {[1, 2, 3].map((ring) => (
                <motion.div
                  key={ring}
                  className="absolute rounded-full border border-amrin/30"
                  animate={{ scale: [1, 1 + ring * 0.4], opacity: [0.4, 0] }}
                  transition={{ duration: 2.5, delay: ring * 0.5, repeat: Infinity, ease: 'easeOut' }}
                  style={{ width: 100, height: 100 }}
                />
              ))}
              <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-amrin/40 shadow-2xl">
                {remoteUser?.avatar ? (
                  <img src={remoteUser.avatar} alt={remoteUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-rose-600 to-amrin flex items-center justify-center text-white text-3xl font-bold">
                    {remoteUser?.name?.[0] || '?'}
                  </div>
                )}
              </div>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-2xl font-extrabold text-white">{remoteUser?.name}</h2>
              <p className="text-slate-300 text-sm font-mono flex items-center justify-center gap-1.5">
                {isCalling ? (
                  <span className="text-emerald-400 font-bold animate-pulse">📞 Calling...</span>
                ) : isActive ? (
                  <span className="text-emerald-400 font-extrabold">🟢 {formatDuration(callDuration)}</span>
                ) : (
                  'Connecting...'
                )}
              </p>
            </div>
          </div>
        )}

        {/* ─── OVERLAY HEADER (non-minimized) ────────────────────────────── */}
        {!isMinimized && (
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 via-black/30 to-transparent">
            <div className="text-white space-y-0.5">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {callType === 'video' ? '📹 Video Call' : '📞 Audio Call'}
              </p>
              {isActive && (
                <p className="text-sm font-mono font-black text-emerald-400">{formatDuration(callDuration)}</p>
              )}
              {isCalling && (
                <p className="text-xs text-slate-300 font-semibold animate-pulse">Calling {remoteUser?.name}...</p>
              )}
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ─── CONTROL BAR ─────────────────────────────────────────────── */}
        <div
          className={`absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 p-6 ${
            !isMinimized ? 'bg-gradient-to-t from-black/90 via-black/50 to-transparent' : 'bg-slate-900/95 p-3 gap-2'
          }`}
        >
          {/* Mute */}
          <button
            onClick={toggleMute}
            className={`${isMinimized ? 'w-9 h-9' : 'w-14 h-14'} rounded-full flex items-center justify-center transition-all shadow-lg ${
              isMuted ? 'bg-rose-600 text-white' : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera (video only) */}
          {callType === 'video' && !isMinimized && (
            <button
              onClick={toggleCamera}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isCameraOff ? 'bg-rose-600 text-white' : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
              }`}
              title={isCameraOff ? 'Turn on Camera' : 'Turn off Camera'}
            >
              {isCameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </button>
          )}

          {/* End Call */}
          <button
            onClick={() => hangUp(targetUserId)}
            className={`${isMinimized ? 'w-10 h-10' : 'w-16 h-16'} rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-white shadow-xl shadow-rose-600/40 active:scale-95 transition-all`}
            title="End Call"
          >
            <PhoneOff className={isMinimized ? 'w-4 h-4' : 'w-7 h-7'} />
          </button>

          {/* Speaker */}
          {!isMinimized && (
            <button
              onClick={toggleSpeaker}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isSpeakerOff ? 'bg-rose-600 text-white' : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
              }`}
              title={isSpeakerOff ? 'Speaker On' : 'Speaker Off'}
            >
              {isSpeakerOff ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}

          {/* Expand (when minimized) */}
          {isMinimized && (
            <button
              onClick={() => setIsMinimized(false)}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
              title="Expand"
            >
              <Phone className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
