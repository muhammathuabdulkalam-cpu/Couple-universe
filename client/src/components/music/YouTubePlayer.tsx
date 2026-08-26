import React, { useEffect, useRef, useState } from 'react';
import { Play, Volume2 } from 'lucide-react';
import { useYouTubeListenStore } from '../../store/youtubeListenStore';

interface YouTubePlayerProps {
  className?: string;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ className }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [playerKey, setPlayerKey] = useState(0);
  const [showEndScreen, setShowEndScreen] = useState(false);

  const { roomState, searchResults } = useYouTubeListenStore();

  // When roomState.videoId changes, reload the iframe
  useEffect(() => {
    if (!roomState?.videoId) return;
    if (roomState.videoId !== currentVideoId) {
      console.log('⚡ YouTube Player loading new videoId:', roomState.videoId);
      setCurrentVideoId(roomState.videoId);
      setIsAutoplayBlocked(false);
      setShowEndScreen(false);
      setPlayerKey((k) => k + 1);
    }
  }, [roomState?.videoId]);

  // Listen for YouTube IFrame API postMessage events (video ended, state changes)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('youtube')) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        // YouTube IFrame API uses info.playerState:
        // -1 = unstarted, 0 = ended, 1 = playing, 2 = paused, 3 = buffering, 5 = cued
        if (data?.event === 'infoDelivery' && data?.info?.playerState === 0) {
          // Video ended — auto-play next song from search results
          console.log('⚡ YouTube video ended — auto-playing next track');
          setShowEndScreen(true);
          autoPlayNext();
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
        useYouTubeListenStore.getState().changeVideo(next.videoId, next.title, next.thumbnail, next.channelTitle);
      }, 1500);
    }
  };

  const videoId = currentVideoId || roomState?.videoId || 'kJQP7kiw5Fk';

  // enablejsapi=1 enables postMessage API so we can detect video end
  // rel=0 reduces related videos
  // sandbox on iframe blocks navigation to youtube.com
  const embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&showinfo=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;

  return (
    <div
      className={`relative w-full aspect-video rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl ${className || ''}`}
    >
      {/* YouTube Embed IFrame — sandboxed to block navigation to YouTube.com */}
      <iframe
        key={playerKey}
        ref={iframeRef}
        src={embedSrc}
        title="YouTube video player"
        // sandbox blocks allow-top-navigation & allow-popups so clicking related
        // videos inside the iframe cannot navigate away from our app
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
        onLoad={() => {
          setIsAutoplayBlocked(false);
          setShowEndScreen(false);
        }}
      />

      {/* End-screen overlay: shown when video ends. Blocks the YouTube "More Videos" grid
          from being clicked while we auto-advance to the next track */}
      {showEndScreen && (
        <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-white">Loading next song...</p>
        </div>
      )}

      {/* Autoplay Blocked Overlay */}
      {isAutoplayBlocked && (
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
