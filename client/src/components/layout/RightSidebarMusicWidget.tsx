import React, { useEffect, useState } from 'react';
import { Pause, Play, Music, Disc, SkipBack, SkipForward, Headphones, UserCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useListenTogetherStore } from '../../store/listenTogetherStore.js';
import { useMusicPlayerStore } from '../../store/musicPlayerStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { getNormalizedCoverUrl } from '../../utils/audioDecoder.js';
import { musicApi } from '../../api/musicApi.js';
import { Card } from '../ui/Card.js';
import { Badge } from '../ui/Badge.js';
import { NormalizedSong } from '../../types/music.types.js';

export const RightSidebarMusicWidget: React.FC = () => {
  const navigate = useNavigate();
  const { toggleActivityDrawer, theme } = useUIStore();
  const currentTrack = useMusicPlayerStore((s) => s.currentTrack);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const currentTime = useMusicPlayerStore((s) => s.currentTime);
  const duration = useMusicPlayerStore((s) => s.duration);

  const { isSessionActive, partnerName, partnerAvatar } = useListenTogetherStore();
  const { user } = useAuthStore();

  // Theme-aware accent colors
  const accent = theme === 'light'
    ? { bg: 'bg-blue-600', bgHover: 'hover:bg-blue-700', shadow: 'shadow-blue-500/40', text: 'text-blue-500', textDark: 'text-blue-300', badgeBg: 'bg-blue-500/20', badgeBorder: 'border-blue-500/30', dot: 'bg-blue-500', bar1: 'bg-blue-400', bar2: 'bg-sky-400', bar3: 'bg-indigo-400', bar4: 'bg-blue-500', accent: 'accent-blue-500', cardBorder: 'border-blue-500/20 hover:border-blue-500/40', sessionBg: 'bg-gradient-to-r from-blue-950/60 via-slate-950/80 to-indigo-950/60 border-blue-500/40', sessionText: 'text-blue-300', sessionBadge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', browseBtn: 'text-blue-500' }
    : { bg: 'bg-gradient-to-tr from-rose-600 to-amrin', bgHover: 'hover:brightness-110', shadow: 'shadow-amrin/40', text: 'text-amrin', textDark: 'text-amrin-glow', badgeBg: 'bg-amrin/20', badgeBorder: 'border-amrin/30', dot: 'bg-amrin', bar1: 'bg-rose-400', bar2: 'bg-pink-400', bar3: 'bg-amrin', bar4: 'bg-rose-500', accent: 'accent-rose-500', cardBorder: 'border-amrin/20 hover:border-amrin/40', sessionBg: 'bg-gradient-to-r from-rose-950/60 via-slate-950/80 to-pink-950/60 border-amrin/40', sessionText: 'text-amrin-glow', sessionBadge: 'bg-amrin/20 text-amrin-glow border-amrin/30', browseBtn: 'text-amrin dark:text-amrin-glow' };

  const myHasAvatar = Boolean(user?.avatar && !user.avatar.includes('unsplash.com'));
  const pHasAvatar = Boolean(partnerAvatar && !partnerAvatar.includes('unsplash.com'));

  const togglePlay = useMusicPlayerStore((s) => s.togglePlay);
  const playTrack = useMusicPlayerStore((s) => s.playTrack);
  const nextTrack = useMusicPlayerStore((s) => s.nextTrack);
  const prevTrack = useMusicPlayerStore((s) => s.prevTrack);
  const seekTo = useMusicPlayerStore((s) => s.seekTo);

  const [fallbackSong, setFallbackSong] = useState<NormalizedSong | null>(null);

  // Pre-fetch first uploaded song if no song is active yet
  useEffect(() => {
    if (!currentTrack) {
      musicApi
        .getUploadedSongs(1, 1)
        .then((res) => {
          if (res?.songs?.length > 0) {
            setFallbackSong(res.songs[0]);
          }
        })
        .catch(() => {});
    }
  }, [currentTrack]);

  const displaySong = currentTrack || fallbackSong;

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentTrack) {
      togglePlay();
    } else if (fallbackSong) {
      playTrack(fallbackSong, [fallbackSong]);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    prevTrack();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    nextTrack();
  };

  const handleCardClick = () => {
    toggleActivityDrawer(false);
    navigate('/shared-music');
  };

  const formatTime = (secs?: number | null) => {
    if (!secs || isNaN(secs) || !isFinite(secs) || secs < 0) {
      return '0:00';
    }
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Card
      variant="glass"
      onClick={handleCardClick}
      className={`p-3.5 space-y-3 cursor-pointer transition-all duration-300 group shadow-lg ${accent.cardBorder}`}
    >
      {/* Listen Together Active Session Banner */}
      {isSessionActive && (
        <div className={`p-2 rounded-xl border flex items-center justify-between gap-2 shadow-inner ${accent.sessionBg}`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center -space-x-2 shrink-0">
                {myHasAvatar ? (
                  <img src={user!.avatar!} alt="Me" className="w-5 h-5 rounded-full border border-white/40 object-cover"  onError={(e) => { if (!e.currentTarget.src || e.currentTarget.src.includes('unsplash.com')) { e.currentTarget.style.display='none'; } }}/>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-700 border border-white/30 flex items-center justify-center">
                    <UserCircle2 className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                )}
                {pHasAvatar ? (
                  <img src={partnerAvatar!} alt={partnerName || 'Partner'} className="w-5 h-5 rounded-full border border-white/40 object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-700 border border-white/30 flex items-center justify-center">
                    <UserCircle2 className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                )}
              </div>
            <div className="min-w-0">
              <span className={`text-[11px] font-extrabold truncate block ${accent.sessionText}`}>Listening Together 💖</span>
              <span className="text-[9px] text-slate-300 truncate block">Synced with {partnerName || 'Partner'}</span>
            </div>
          </div>
          <span className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 animate-pulse ${accent.sessionBadge}`}>
            <Headphones className="w-2.5 h-2.5" /> SYNCED
          </span>
        </div>
      )}

      {/* Widget Header */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
        <span className="flex items-center gap-1.5">
          <Music className={`w-3.5 h-3.5 ${isPlaying ? `${accent.text} animate-bounce` : 'text-slate-500 dark:text-slate-400'}`} />
          <span>Shared Melody</span>
        </span>
        {isPlaying ? (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1 animate-pulse ${accent.badgeBg} ${accent.textDark} ${accent.badgeBorder}`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-ping ${accent.dot}`} />
            Playing
          </span>
        ) : (
          <Badge variant="gray" size="sm">
            {currentTrack ? 'Paused' : 'Ready'}
          </Badge>
        )}
      </div>

      {/* Song Details & Controls Row */}
      {displaySong ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            {/* Cover Artwork */}
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md border border-slate-200/80 dark:border-white/10 group-hover:scale-105 transition-transform">
              <img
                src={getNormalizedCoverUrl(displaySong.coverUrl)}
                alt={displaySong.title}
                className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
                onError={(e) => {
                  const t = e.currentTarget;
                  t.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Disc className="w-5 h-5 text-white/80" />
              </div>
            </div>

            {/* Song Title & Artist */}
            <div className="min-w-0 flex-1">
              <h4 className={`text-xs font-bold text-slate-900 dark:text-white truncate transition-colors group-hover:${accent.text}`}>
                {displaySong.title}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                {displaySong.artist}
              </p>

              {/* Live Waveform Equalizer Bars */}
              {isPlaying && (
                <div className="flex items-end gap-0.5 mt-1 h-2.5">
                  <span className={`w-0.5 rounded-full animate-[bounce_0.6s_infinite_100ms] h-full ${accent.bar1}`} />
                  <span className={`w-0.5 rounded-full animate-[bounce_0.6s_infinite_300ms] h-2/3 ${accent.bar2}`} />
                  <span className={`w-0.5 rounded-full animate-[bounce_0.6s_infinite_200ms] h-full ${accent.bar3}`} />
                  <span className={`w-0.5 rounded-full animate-[bounce_0.6s_infinite_400ms] h-1/2 ${accent.bar4}`} />
                </div>
              )}
            </div>

            {/* Quick Action Player Controls (Prev, Play/Pause, Next) */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition"
                title="Previous Track"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handlePlayToggle}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg hover:scale-110 active:scale-95 transition-all ${accent.bg} ${accent.shadow}`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-white" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition"
                title="Next Track"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Time & Seek Bar Progress Slider */}
          {currentTrack && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="space-y-1 pt-1 border-t border-slate-100 dark:border-white/5"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
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
                className={`w-full h-1 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer ${theme === 'dark' ? 'accent-rose-500' : 'accent-blue-500'}`}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>No active song</span>
          <button
            onClick={() => {
              toggleActivityDrawer(false);
              navigate('/shared-music');
            }}
            className={`font-bold hover:underline ${accent.browseBtn}`}
          >
            Browse Music
          </button>
        </div>
      )}
    </Card>
  );
};
