import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Headphones,
  Heart,
  Radio,
  LogOut,
  Compass,
  UserCircle2,
  UploadCloud,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { musicApi } from '../../api/musicApi.js';
import { useAuthStore } from '../../store/authStore.js';
import { useListenTogetherStore } from '../../store/listenTogetherStore.js';
import { useMusicPlayerStore } from '../../store/musicPlayerStore.js';
import { getNormalizedCoverUrl } from '../../utils/audioDecoder.js';
import { UploadedSongsTab } from './UploadedSongsTab.js';
import { MusicSearchTab } from './MusicSearchTab.js';

export const ListenTogetherDrawer: React.FC = () => {
  const navigate = useNavigate();
  const [browseTab, setBrowseTab] = useState<'uploads' | 'search'>('uploads');
  const [targets, setTargets] = useState<Array<{ id: string; name: string; avatar: string; role: string; email?: string }>>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);

  const {
    isSessionActive,
    partnerName,
    partnerAvatar,
    isDrawerOpen,
    setDrawerOpen,
    endSession,
    isInviting,
    sendInvite,
  } = useListenTogetherStore();

  const { user } = useAuthStore();
  const currentTrack = useMusicPlayerStore((s) => s.currentTrack);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const currentTime = useMusicPlayerStore((s) => s.currentTime);
  const duration = useMusicPlayerStore((s) => s.duration);

  const togglePlay = useMusicPlayerStore((s) => s.togglePlay);
  const nextTrack = useMusicPlayerStore((s) => s.nextTrack);
  const prevTrack = useMusicPlayerStore((s) => s.prevTrack);
  const seekTo = useMusicPlayerStore((s) => s.seekTo);

  React.useEffect(() => {
    if (isDrawerOpen && !isSessionActive) {
      setLoadingTargets(true);
      musicApi
        .getListenTargets()
        .then((res) => setTargets(res))
        .catch(() => {})
        .finally(() => setLoadingTargets(false));
    }
  }, [isDrawerOpen, isSessionActive]);

  if (!isDrawerOpen) return null;

  const myHasAvatar = Boolean(user?.avatar && !user.avatar.includes('unsplash.com'));
  const pHasAvatar = Boolean(partnerAvatar && !partnerAvatar.includes('unsplash.com'));

  const formatTime = (secs?: number | null) => {
    if (!secs || isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex justify-end bg-black/70 backdrop-blur-sm">
        {/* Backdrop overlay dismiss click */}
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => setDrawerOpen(false)}
        />

        {/* Slide-Over Drawer Container */}
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 350, damping: 32 }}
          className="relative z-10 w-80 sm:w-[420px] max-w-[92vw] h-full bg-slate-950/98 backdrop-blur-2xl border-l border-white/15 p-4 sm:p-5 flex flex-col overflow-y-auto select-none shadow-2xl text-white space-y-4"
        >
          {/* Header */}
          <div className="space-y-3 border-b border-white/10 pb-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg animate-pulse">
                  <Headphones className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-1.5">
                  Listen Together <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-ping" />
                </h3>
              </div>

              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Couple / User Sync Connection Status & Target Selector Banner */}
            {isSessionActive ? (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900/90 to-purple-950/80 border border-rose-500/30 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center -space-x-2.5">
                    {myHasAvatar ? (
                      <img src={user!.avatar!} alt={user?.name || 'Me'} className="w-8 h-8 rounded-full object-cover border-2 border-white/40 shadow-md" onError={(e) => { if (!e.currentTarget.src || e.currentTarget.src.includes('unsplash.com')) { e.currentTarget.style.display='none'; } }}/>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-white/30 flex items-center justify-center">
                        <UserCircle2 className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    {pHasAvatar ? (
                      <img src={partnerAvatar!} alt={partnerName || 'Partner'} className="w-8 h-8 rounded-full object-cover border-2 border-white/40 shadow-md" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-white/30 flex items-center justify-center">
                        <UserCircle2 className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-rose-200">Synced Session</h4>
                    <p className="text-[10px] text-slate-300">With {partnerName || 'Partner'} 💖</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                  <Radio className="w-3 h-3 text-rose-400 animate-ping" /> LIVE
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-rose-400" />
                    <span>Send Listen Invitation</span>
                  </span>
                  {user?.role === 'INVITED_USER' && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Parent Owner Only
                    </span>
                  )}
                </div>

                {loadingTargets ? (
                  <p className="text-[10px] text-slate-400 text-center py-2">Loading available targets...</p>
                ) : targets.length === 0 ? (
                  <div className="text-center py-2 space-y-1">
                    <p className="text-xs text-slate-400">No active partner available.</p>
                    <button
                      type="button"
                      disabled={isInviting}
                      onClick={() => sendInvite()}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      {isInviting ? 'Sending Invite...' : 'Send Listen Invite'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {targets.map((t) => {
                      const hasAvatar = Boolean(t.avatar && !t.avatar.includes('unsplash.com'));
                      return (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {hasAvatar ? (
                              <img src={t.avatar} alt={t.name} className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0" onError={(e) => { e.currentTarget.style.display='none'; }}/>
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-700 border border-white/20 flex items-center justify-center shrink-0">
                                <UserCircle2 className="w-3.5 h-3.5 text-slate-300" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-white truncate">{t.name}</h5>
                              <p className="text-[9px] text-slate-400 font-mono uppercase">{t.role === 'SUPER_OWNER' ? 'Super Owner' : t.role === 'CO_OWNER' ? 'Co Owner' : 'Invited User'}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isInviting}
                            onClick={() => sendInvite(t.id)}
                            className="px-3 py-1 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-[10px] shadow-md transition active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                          >
                            {isInviting ? 'Inviting...' : 'Send Request 🎵'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Now Playing Player Card */}
          {currentTrack && (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3 shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={getNormalizedCoverUrl(currentTrack.coverUrl)}
                  alt={currentTrack.title}
                  className={`w-12 h-12 rounded-xl object-cover shadow-lg ${isPlaying ? 'animate-spin-slow' : ''}`}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-extrabold text-white truncate">{currentTrack.title}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{currentTrack.artist}</p>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration || 180)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration || 180}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              {/* Player Controls */}
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => prevTrack()} className="p-1 text-slate-300 hover:text-white">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => togglePlay()}
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <button onClick={() => nextTrack()} className="p-1 text-slate-300 hover:text-white">
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Browse Songs Section - 2 Tabs: Uploads & Search */}
          <div className="flex-1 flex flex-col min-h-0 space-y-3 pt-1">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-rose-400" /> Browse Songs
              </span>

              {/* 2 Tab Buttons: Uploads & Search ONLY */}
              <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-full border border-white/10">
                <button
                  type="button"
                  onClick={() => setBrowseTab('uploads')}
                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                    browseTab === 'uploads'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UploadCloud className="w-3 h-3" /> Uploads
                </button>

                <button
                  type="button"
                  onClick={() => setBrowseTab('search')}
                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                    browseTab === 'search'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Search className="w-3 h-3" /> Search
                </button>
              </div>
            </div>

            {/* Scrollable Tab Content Container */}
            <div className="flex-1 overflow-y-auto pr-1 text-white">
              {browseTab === 'uploads' ? (
                <UploadedSongsTab />
              ) : (
                <MusicSearchTab />
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-white/10 pt-3 space-y-2 shrink-0">
            <button
              onClick={() => {
                setDrawerOpen(false);
                navigate('/youtube-sync');
              }}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <Radio className="w-3.5 h-3.5 text-white animate-pulse" /> Launch YouTube Sync 🎬
            </button>

            <button
              onClick={() => {
                setDrawerOpen(false);
                navigate('/shared-music');
              }}
              className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-rose-400" /> Full Shared Music Page
            </button>

            {isSessionActive && (
              <button
                onClick={async () => {
                  await endSession();
                  setDrawerOpen(false);
                }}
                className="w-full py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> End Listen Together Session
              </button>
            )}
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
};

