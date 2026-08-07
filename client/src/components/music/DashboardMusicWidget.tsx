import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Disc, HeartHandshake, Music, Pause, Play } from 'lucide-react';
import { musicApi } from '../../api/musicApi';
import { useMusicPlayerStore } from '../../store/musicPlayerStore';
import { DashboardMusicSummary } from '../../types/music.types';

export const DashboardMusicWidget: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardMusicSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentTrack = useMusicPlayerStore((s) => s.currentTrack);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const playTrack = useMusicPlayerStore((s) => s.playTrack);
  const togglePlay = useMusicPlayerStore((s) => s.togglePlay);

  useEffect(() => {
    setIsLoading(true);
    musicApi
      .getDashboardSummary()
      .then(setSummary)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const trackToDisplay = currentTrack || summary?.recentPlayed;

  return (
    <div className="relative overflow-hidden bg-slate-900/60 hover:bg-slate-900/80 border border-white/10 hover:border-rose-500/30 rounded-3xl p-6 text-white backdrop-blur-xl shadow-xl transition-all duration-300 group">
      {/* Background Decorative Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all pointer-events-none" />

      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white">Shared Music</h3>
            <p className="text-[11px] text-slate-400">Our Universe Jukebox</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/shared-music')}
          className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
        >
          <span>Open Music</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Track Display */}
      {isLoading ? (
        <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-3.5 border border-white/5 animate-pulse">
          <div className="w-14 h-14 rounded-xl bg-white/10 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/10 rounded w-1/3" />
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
        </div>
      ) : trackToDisplay ? (
        <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-3.5 border border-white/5">
          <div className="relative shrink-0">
            <img
              src={trackToDisplay.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
              alt={trackToDisplay.title}
              className={`w-14 h-14 rounded-xl object-cover shadow-md transition-transform duration-700 ${
                isPlaying ? 'animate-spin-slow ring-2 ring-rose-500/50' : ''
              }`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Disc className={`w-6 h-6 text-white/40 ${isPlaying ? 'animate-spin' : ''}`} />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
              {currentTrack ? 'Now Playing' : 'Recently Played'}
            </span>
            <h4 className="font-bold text-sm text-white truncate mt-0.5">{trackToDisplay.title}</h4>
            <p className="text-xs text-slate-400 truncate">{trackToDisplay.artist}</p>
          </div>

          <button
            onClick={() => (currentTrack ? togglePlay() : playTrack(trackToDisplay))}
            className="w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 transition hover:scale-105 active:scale-95 shrink-0"
          >
            {isPlaying && currentTrack?.providerSongId === trackToDisplay.providerSongId ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>
      ) : (
        <div className="text-center py-6 text-slate-400">
          <p className="text-xs">No active track played yet</p>
          <button
            onClick={() => navigate('/shared-music')}
            className="mt-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold hover:bg-rose-500 hover:text-white transition"
          >
            Explore Music
          </button>
        </div>
      )}

      {/* Footer stats callout */}
      {summary?.latestDedication && (
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-rose-300 font-semibold truncate">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Latest: {summary.latestDedication.songId?.title}</span>
          </span>
          <span className="text-[11px] text-slate-500 shrink-0">{summary.favoritesCount} Favorites</span>
        </div>
      )}
    </div>
  );
});
