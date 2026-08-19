import React, { useEffect, useState } from 'react';
import { Pause, Play, Music, Disc, SkipBack, SkipForward } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMusicPlayerStore } from '../../store/musicPlayerStore';
import { getNormalizedCoverUrl } from '../../utils/audioDecoder';
import { musicApi } from '../../api/musicApi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { NormalizedSong } from '../../types/music.types';

export const RightSidebarMusicWidget: React.FC = () => {
  const navigate = useNavigate();
  const currentTrack = useMusicPlayerStore((s) => s.currentTrack);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const currentTime = useMusicPlayerStore((s) => s.currentTime);
  const duration = useMusicPlayerStore((s) => s.duration);

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
      className="p-3.5 space-y-3 border-rose-500/20 hover:border-rose-500/40 cursor-pointer transition-all duration-300 group shadow-lg"
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between text-xs font-bold text-white">
        <span className="flex items-center gap-1.5">
          <Music className={`w-3.5 h-3.5 ${isPlaying ? 'text-rose-400 animate-bounce' : 'text-slate-400'}`} />
          <span>Shared Melody</span>
        </span>
        {isPlaying ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
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
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md border border-white/10 group-hover:scale-105 transition-transform">
              <img
                src={getNormalizedCoverUrl(displaySong.coverUrl)}
                alt={displaySong.title}
                className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
                onError={(e) => {
                  if (!e.currentTarget.src.includes('unsplash.com')) {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400';
                  }
                }}
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Disc className="w-5 h-5 text-white/80" />
              </div>
            </div>

            {/* Song Title & Artist */}
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate group-hover:text-rose-300 transition-colors">
                {displaySong.title}
              </h4>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {displaySong.artist}
              </p>

              {/* Live Waveform Equalizer Bars */}
              {isPlaying && (
                <div className="flex items-end gap-0.5 mt-1 h-2.5">
                  <span className="w-0.5 bg-rose-400 rounded-full animate-[bounce_0.6s_infinite_100ms] h-full" />
                  <span className="w-0.5 bg-pink-400 rounded-full animate-[bounce_0.6s_infinite_300ms] h-2/3" />
                  <span className="w-0.5 bg-purple-400 rounded-full animate-[bounce_0.6s_infinite_200ms] h-full" />
                  <span className="w-0.5 bg-rose-500 rounded-full animate-[bounce_0.6s_infinite_400ms] h-1/2" />
                </div>
              )}
            </div>

            {/* Quick Action Player Controls (Prev, Play/Pause, Next) */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
                title="Previous Track"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handlePlayToggle}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg hover:scale-110 active:scale-95 transition-all ${
                  isPlaying
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/40'
                    : 'bg-gradient-to-tr from-rose-500 to-pink-600 shadow-pink-500/30'
                }`}
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
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
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
              className="space-y-1 pt-1 border-t border-white/5"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
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
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>No active song</span>
          <button
            onClick={() => navigate('/shared-music')}
            className="text-rose-400 font-bold hover:underline"
          >
            Browse Music
          </button>
        </div>
      )}
    </Card>
  );
};
