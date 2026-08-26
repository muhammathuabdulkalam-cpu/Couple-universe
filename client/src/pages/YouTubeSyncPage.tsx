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
  const { initYouTubeSocket } = useYouTubeListenStore();

  // Initialize Socket.IO connection and listen together stores
  useEffect(() => {
    let socket = socketClient.getSocket();
    if ((!socket || !socket.connected) && accessToken) {
      socket = socketClient.connect(accessToken);
    }
    if (socket) {
      initListenSocket(socket);
      initYouTubeSocket(socket);
    }
  }, [accessToken, initListenSocket, initYouTubeSocket]);

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-white pb-36 space-y-4 pt-2 md:pt-4 w-full max-w-full overflow-x-hidden px-3 md:px-8">
      {/* 1. Incoming Invite Banner */}
      <div className="max-w-7xl mx-auto w-full">
        <ListenTogetherInviteBanner />
      </div>

      {/* 2. Main YouTube Listen Together Tab View */}
      <YouTubeListenTogetherTab />
    </div>
  );
};
