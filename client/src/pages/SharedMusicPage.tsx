import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Heart,
  HeartHandshake,
  ListMusic,
  Search,
  Upload,
  UploadCloud,
} from 'lucide-react';
import { socketClient } from '../api/socketClient';
import { DedicationsTab } from '../components/music/DedicationsTab';
import { FavoritesTab } from '../components/music/FavoritesTab';
import { HomeSectionsTab } from '../components/music/HomeSectionsTab';
import { ListenTogetherBadge } from '../components/music/ListenTogetherBadge';
import { ListenTogetherInviteBanner } from '../components/music/ListenTogetherInviteBanner';
import { MusicSearchTab } from '../components/music/MusicSearchTab';
import { PlaylistsTab } from '../components/music/PlaylistsTab';
import { UploadedSongsTab } from '../components/music/UploadedSongsTab';
import { UploadSongModal } from '../components/music/UploadSongModal';
import { useAuthStore } from '../store/authStore';
import { useListenTogetherStore } from '../store/listenTogetherStore';
import { NormalizedSong } from '../types/music.types';

type TabType = 'home' | 'search' | 'playlists' | 'uploaded' | 'dedications' | 'favorites';

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

  const handleOpenDedicateModal = (song: NormalizedSong) => {
    setSongToDedicate(song);
    setActiveTab('dedications');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-36 space-y-4">
      {/* 1. Incoming Invite Banner Notification */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4">
        <ListenTogetherInviteBanner />
      </div>

      {/* 2. Navigation Header Tabs & Actions */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold flex items-center gap-2 transition shrink-0 ${
                activeTab === 'home'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold flex items-center gap-2 transition shrink-0 ${
                activeTab === 'search'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>

            <button
              onClick={() => setActiveTab('playlists')}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold flex items-center gap-2 transition shrink-0 ${
                activeTab === 'playlists'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <ListMusic className="w-4 h-4" />
              <span>Playlists</span>
            </button>

            <button
              onClick={() => setActiveTab('uploaded')}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold flex items-center gap-2 transition shrink-0 ${
                activeTab === 'uploaded'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span>Uploaded Songs</span>
            </button>

            <button
              onClick={() => setActiveTab('dedications')}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold flex items-center gap-2 transition shrink-0 ${
                activeTab === 'dedications'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Dedications</span>
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold flex items-center gap-2 transition shrink-0 ${
                activeTab === 'favorites'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Favorites</span>
            </button>
          </div>

          {/* Right Action Toolbar: Listen Together Badge & Upload Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0"
              title="Upload MP3 / M4A / AAC / WAV / FLAC"
            >
              <Upload className="w-3.5 h-3.5 text-rose-400" />
              <span>Upload Song</span>
            </button>

            <ListenTogetherBadge />
          </div>
        </div>
      </div>

      {/* 3. Main Tab Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'home' && <HomeSectionsTab onOpenDedicateModal={handleOpenDedicateModal} />}
          {activeTab === 'search' && <MusicSearchTab onOpenDedicateModal={handleOpenDedicateModal} />}
          {activeTab === 'playlists' && <PlaylistsTab />}
          {activeTab === 'uploaded' && <UploadedSongsTab />}
          {activeTab === 'dedications' && (
            <DedicationsTab
              initialDedicatedSong={songToDedicate}
              onCloseDedicateModal={() => setSongToDedicate(null)}
            />
          )}
          {activeTab === 'favorites' && <FavoritesTab />}
        </motion.div>
      </div>

      {/* Upload Song Modal */}
      <UploadSongModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
};
