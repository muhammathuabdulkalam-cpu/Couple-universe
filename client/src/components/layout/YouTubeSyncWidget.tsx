import React from 'react';
import { Play, Youtube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useYouTubeListenStore } from '../../store/youtubeListenStore';
import { useUIStore } from '../../store/uiStore';
import { Card } from '../ui/Card';
import { SafeYouTubeThumbnail } from '../music/SafeYouTubeThumbnail';

export const YouTubeSyncWidget: React.FC = () => {
  const navigate = useNavigate();
  const { toggleActivityDrawer } = useUIStore();
  const roomState = useYouTubeListenStore((s) => s.roomState);

  // Only render if a YouTube video is actively playing
  if (!roomState?.videoId) return null;

  const isPlaying = roomState.isPlaying;

  const handleClick = () => {
    toggleActivityDrawer(false);
    navigate('/youtube-sync');
  };

  return (
    <Card
      variant="glass"
      onClick={handleClick}
      className="p-3.5 space-y-2.5 cursor-pointer transition-all duration-300 group shadow-lg border-rose-500/20 hover:border-rose-500/40"
    >
      {/* Header */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
        <span className="flex items-center gap-1.5">
          <Youtube className="w-3.5 h-3.5 text-rose-500" />
          <span>YouTube Sync</span>
        </span>
        {isPlaying ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1 animate-pulse bg-rose-500/20 text-rose-300 border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            Live
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-400 border border-white/10">
            Paused
          </span>
        )}
      </div>

      {/* Song Row */}
      <div className="flex items-center gap-3">
        {/* Thumbnail */}
        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md border border-rose-500/20 group-hover:scale-105 transition-transform bg-slate-900">
          <SafeYouTubeThumbnail
            videoId={roomState.videoId}
            customUrl={roomState.thumbnail}
            alt={roomState.videoTitle || 'YouTube Video'}
            className="w-full h-full object-cover"
          />
          {/* Play overlay on hover */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
          {/* Animated YouTube logo badge */}
          <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded bg-red-600 flex items-center justify-center shadow">
            <Youtube className="w-2.5 h-2.5 text-white" />
          </div>
        </div>

        {/* Title & Channel */}
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-rose-400 transition-colors leading-tight">
            {roomState.videoTitle || 'YouTube Video'}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {roomState.channelTitle || 'YouTube Channel'}
          </p>

          {/* Animated equalizer bars while playing */}
          {isPlaying && (
            <div className="flex items-end gap-0.5 mt-1 h-2.5">
              <span className="w-0.5 rounded-full animate-[bounce_0.6s_infinite_100ms] h-full bg-rose-400" />
              <span className="w-0.5 rounded-full animate-[bounce_0.6s_infinite_300ms] h-2/3 bg-pink-400" />
              <span className="w-0.5 rounded-full animate-[bounce_0.6s_infinite_200ms] h-full bg-rose-500" />
              <span className="w-0.5 rounded-full animate-[bounce_0.6s_infinite_400ms] h-1/2 bg-pink-500" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
