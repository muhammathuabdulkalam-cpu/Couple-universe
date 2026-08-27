import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Play, RefreshCw, Volume2 } from 'lucide-react';
import { useYouTubeListenStore } from '../../store/youtubeListenStore';
import { CoupleUniverseLoader } from './CoupleUniverseLoader';

interface YouTubePlayerProps {
  className?: string;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ className }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [playerKey, setPlayerKey] = useState(0);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);

  const { roomState, searchResults } = useYouTubeListenStore();

  // When roomState.videoId changes, reload the iframe
  useEffect(() => {
    if (!roomState?.videoId) return;
    if (roomState.videoId !== currentVideoId) {
      console.log('⚡ YouTube Player loading new videoId:', roomState.videoId);
      setCurrentVideoId(roomState.videoId);
      setIsAutoplayBlocked(false);
      setShowEndScreen(false);
      setIsUnavailable(false);
      setPlayerKey((k) => k + 1);
    }
  }, [roomState?.videoId]);

  // Listen for YouTube IFrame API postMessage events
  // YouTube sends error events via postMessage when a video can't be embedded.
  // Error codes: 2 = invalid videoId, 5 = HTML5 error, 100 = not found/private,
  //              101 = embedding disabled, 150 = embedding disabled (obfuscated)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('youtube')) return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        // Video ended → auto-advance to next track
        if (data?.event === 'infoDelivery' && data?.info?.playerState === 0) {
          console.log('⚡ YouTube video ended — auto-playing next track');
          setShowEndScreen(true);
          autoPlayNext();
        }

        // YouTube sends { event: 'onError', info: <errorCode> } for unembeddable videos
        // Also catches { event: 'infoDelivery', info: { error: <code> } }
        const errCode =
          (data?.event === 'onError' ? data?.info : null) ??
          data?.info?.error ??
          null;

        if (errCode != null && [2, 5, 100, 101, 150].includes(Number(errCode))) {
          console.warn('⚠️ YouTube embed error code:', errCode, '— video unavailable for embedding');
          setIsUnavailable(true);
        }
      } catch (_e) {
        // Non-JSON postMessages from YouTube (ok to ignore)
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [searchResults, roomState?.videoId]);

  const autoPlayNext = () => {
    const results = useYouTubeListenStore.getState().searchResults;
    const currentId = useYouTubeListenStore.getState().roomState?.videoId;
    if (!results.length) return;
    const idx = results.findIndex((r) => r.videoId === currentId);
    const next = results[(idx + 1) % results.length];
    if (next) {
      setTimeout(() => {
        useYouTubeListenStore
          .getState()
          .changeVideo(next.videoId, next.title, next.thumbnail, next.channelTitle);
      }, 1500);
    }
  };

  const videoId = currentVideoId || roomState?.videoId || 'kJQP7kiw5Fk';

  // Standard YouTube Embed URL with JS API enabled
  const embedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div
      className={`relative w-full aspect-video rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl ${className || ''}`}
    >
      {/* YouTube Embed IFrame */}
      <iframe
        key={playerKey}
        ref={iframeRef}
        src={embedSrc}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
        onLoad={() => {
          setIsAutoplayBlocked(false);
          setShowEndScreen(false);
        }}
      />

      {/* End-screen overlay: shown when video ends. Blocks the YouTube "More Videos" grid */}
      {showEndScreen && !isUnavailable && (
        <div className="absolute inset-0 z-20 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center">
          <CoupleUniverseLoader message="Loading next song..." size="md" />
        </div>
      )}

      {/* Video Unavailable Overlay — only shown on confirmed YouTube error events */}
      {isUnavailable && (
        <div className="absolute inset-0 z-30 bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 flex flex-col items-center justify-center p-6 text-center gap-4">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-red-500/15 border-2 border-red-500/40 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-black text-white">Playback Not Available Here</h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              This video's owner has disabled playback on external websites. You can watch it
              directly on YouTube instead.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {/* Open on YouTube */}
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs shadow-xl shadow-red-600/30 flex items-center gap-2 transition hover:scale-105 active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              Open on YouTube
            </a>

            {/* Try next song */}
            {searchResults.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsUnavailable(false);
                  autoPlayNext();
                }}
                className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Try Next Song
              </button>
            )}
          </div>
        </div>
      )}

      {/* Autoplay Blocked Overlay */}
      {isAutoplayBlocked && !isUnavailable && (
        <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-400 flex items-center justify-center mb-4 animate-bounce">
            <Volume2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white mb-2">Tap to Start Playback</h3>
          <p className="text-xs text-slate-300 max-w-sm mb-5">
            Your browser requires a user interaction to start autoplay.
          </p>
          <button
            onClick={() => {
              setIsAutoplayBlocked(false);
              setPlayerKey((k) => k + 1);
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-sm shadow-xl shadow-rose-500/30 flex items-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" /> Tap to Play
          </button>
        </div>
      )}
    </div>
  );
};
