import React, { useEffect, useState } from 'react';
import {
  Compass,
  Heart,
  HeartHandshake,
  ListMusic,
  Search,
  UploadCloud,
} from 'lucide-react';
import { socketClient } from '../api/socketClient';
import { DedicationsTab } from '../components/music/DedicationsTab';
import { FavoritesTab } from '../components/music/FavoritesTab';
import { HomeSectionsTab } from '../components/music/HomeSectionsTab';
import { ListenTogetherInviteBanner } from '../components/music/ListenTogetherInviteBanner';
import { MusicSearchTab } from '../components/music/MusicSearchTab';
import { PlaylistsTab } from '../components/music/PlaylistsTab';
import { UploadedSongsTab } from '../components/music/UploadedSongsTab';
import { UploadSongModal } from '../components/music/UploadSongModal';
import { useAuthStore } from '../store/authStore';
import { useListenTogetherStore } from '../store/listenTogetherStore';
import { NormalizedSong } from '../types/music.types';

type TabType = 'home' | 'search' | 'playlists' | 'uploads' | 'dedications' | 'favorites';

export const SharedMusicPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [songToDedicate, setSongToDedicate] = useState<NormalizedSong | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { accessToken } = useAuthStore();
  const { initListenSocket } = useListenTogetherStore();

  // Initialize Listen Together Socket
  useEffect(() => {
    let socket = socketClient.getSocket();
    if ((!socket || !socket.connected) && accessToken) {
      socket = socketClient.connect(accessToken);
    }
    if (socket) {
      initListenSocket(socket);
    }
  }, [accessToken, initListenSocket]);

  const handleOpenDedicateModal = React.useCallback((song: NormalizedSong) => {
    setSongToDedicate(song);
    setActiveTab('dedications');
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-36 space-y-2 md:space-y-4 pt-0 md:pt-2 w-full max-w-full overflow-x-hidden">
      {/* Upload Song Modal */}
      <UploadSongModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* 1. Incoming Invite Banner Notification */}
      <div className="max-w-7xl mx-auto px-3 md:px-8 w-full max-w-full overflow-x-hidden">
        <ListenTogetherInviteBanner />
      </div>

      {/* 2. Navigation Header Tabs & Actions */}
      <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-white/10 px-3 md:px-8 py-2 md:py-3 w-full max-w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5 w-full max-w-full">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold flex items-center gap-1.5 transition shrink-0 ${
                activeTab === 'home'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold flex items-center gap-1.5 transition shrink-0 ${
                activeTab === 'search'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Search</span>
            </button>

            <button
              onClick={() => setActiveTab('playlists')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold flex items-center gap-1.5 transition shrink-0 ${
                activeTab === 'playlists'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Playlists</span>
            </button>

            <button
              onClick={() => setActiveTab('uploads')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold flex items-center gap-1.5 transition shrink-0 ${
                activeTab === 'uploads'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Uploads</span>
            </button>

            <button
              onClick={() => setActiveTab('dedications')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold flex items-center gap-1.5 transition shrink-0 ${
                activeTab === 'dedications'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Dedications</span>
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold flex items-center gap-1.5 transition shrink-0 ${
                activeTab === 'favorites'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Favorites</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Tab Content (Persistent DOM mounting for instant 0ms tab switching) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4">
        <div className={activeTab === 'home' ? 'block' : 'hidden'}>
          <HomeSectionsTab
            onOpenDedicateModal={handleOpenDedicateModal}
            onSelectTab={setActiveTab}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
          />
        </div>

        <div className={activeTab === 'search' ? 'block' : 'hidden'}>
          <MusicSearchTab onOpenDedicateModal={handleOpenDedicateModal} />
        </div>

        <div className={activeTab === 'playlists' ? 'block' : 'hidden'}>
          <PlaylistsTab />
        </div>

        <div className={activeTab === 'uploads' ? 'block' : 'hidden'}>
          <UploadedSongsTab />
        </div>

        <div className={activeTab === 'dedications' ? 'block' : 'hidden'}>
          <DedicationsTab
            initialDedicatedSong={songToDedicate}
            onCloseDedicateModal={() => setSongToDedicate(null)}
          />
        </div>

        <div className={activeTab === 'favorites' ? 'block' : 'hidden'}>
          <FavoritesTab />
        </div>
      </div>
    </div>
  );
};

