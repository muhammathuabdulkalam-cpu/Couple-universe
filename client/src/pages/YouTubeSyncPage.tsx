import React, { useEffect } from 'react';
import { socketClient } from '../api/socketClient';
import { ListenTogetherInviteBanner } from '../components/music/ListenTogetherInviteBanner';
import { YouTubeListenTogetherTab } from '../components/music/YouTubeListenTogetherTab';
import { useAuthStore } from '../store/authStore';
import { useListenTogetherStore } from '../store/listenTogetherStore';
import { useYouTubeListenStore } from '../store/youtubeListenStore';

export const YouTubeSyncPage: React.FC = () => {
  const { accessToken } = useAuthStore();
  const { initListenSocket } = useListenTogetherStore();
  const { initYouTubeSocket, setViewMode } = useYouTubeListenStore();

  // Scroll to top on mount, initialize socket, and always start on home view
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const main = document.querySelector('main');
    if (main) {
      main.scrollTop = 0;
      main.scrollTo({ top: 0, behavior: 'instant' });
    }
    // Always show home UI when navigating to this page
    setViewMode('home');
    let socket = socketClient.getSocket();
    if ((!socket || !socket.connected) && accessToken) {
      socket = socketClient.connect(accessToken);
    }
    if (socket) {
      initListenSocket(socket);
      initYouTubeSocket(socket);
    }
  }, [accessToken, initListenSocket, initYouTubeSocket, setViewMode]);

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-white pb-36 w-full max-w-full overflow-x-hidden">
      {/* 1. Incoming Invite Banner */}
      <div className="max-w-7xl mx-auto w-full px-3 md:px-8 pt-2 md:pt-4">
        <ListenTogetherInviteBanner />
      </div>

      {/* 2. Main YouTube Listen Together Tab View */}
      <YouTubeListenTogetherTab />
    </div>
  );
};
