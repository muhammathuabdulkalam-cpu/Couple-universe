import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  ChevronRight,
  CloudSun,
  Heart,
  LayoutGrid,
  Music,
  Plus,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnniversaryCountdownWidget } from '../dashboard/AnniversaryCountdownWidget.js';
import { BirthdayCountdown } from '../dashboard/BirthdayCountdown.js';
import { TodaysMemoryWidget } from '../dashboard/TodaysMemoryWidget.js';
import { MobileAppLauncherModal } from './MobileAppLauncherModal.js';
import { RightSidebarMusicWidget } from './RightSidebarMusicWidget.js';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';

import { useChatStore } from '../../store/chatStore.js';
import { useMusicPlayerStore } from '../../store/musicPlayerStore.js';
import { getNormalizedCoverUrl } from '../../utils/audioDecoder.js';
import { SuperOwnerProfileModal } from '../profile/SuperOwnerProfileModal.js';

interface RightContextPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const RightContextPanel: React.FC<RightContextPanelProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { mobileView } = useChatStore();
  const isInsideChatThread = location.pathname.startsWith('/chat') && mobileView === 'chat';
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const currentTrack = useMusicPlayerStore((s) => s.currentTrack);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const [isSuperOwnerModalOpen, setIsSuperOwnerModalOpen] = useState(false);

  const panelContent = (
    <div className="space-y-4">
      {/* Widget 1: Real-time Shared Music Player (Top Priority) */}
      <RightSidebarMusicWidget />

      {/* Widget 2: Partner Birthday Live Countdown (Compact 100% vertical layout for 300px sidebar) */}
      <BirthdayCountdown variant="compact" />

      {/* Widget 3: Today's Memory & Anniversary */}
      <TodaysMemoryWidget />
      <AnniversaryCountdownWidget />

      {/* Widget 4: Quick Actions */}
      <Card variant="glass" className="p-4 space-y-3 border-white/10">
        <div className="flex items-center justify-between text-xs font-bold text-slate-200">
          <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-afzal" /> Quick Actions</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="glass" size="sm" className="text-xs py-2 justify-start" leftIcon={<Plus className="w-3.5 h-3.5 text-afzal" />}>
            New Memory
          </Button>
          <Button variant="glass" size="sm" className="text-xs py-2 justify-start" leftIcon={<Heart className="w-3.5 h-3.5 text-heart" />}>
            Write Diary
          </Button>
        </div>
      </Card>

      {/* Widget 5: Weather */}
      <Card variant="glass" className="p-4 flex items-center justify-between border-white/10">
        <div className="flex items-center gap-3">
          <CloudSun className="w-8 h-8 text-amber-400" />
          <div>
            <div className="text-xs font-bold text-white">Our Atmosphere</div>
            <div className="text-[11px] text-slate-400">Sunny • 26°C</div>
          </div>
        </div>
        <div className="text-right text-xs font-mono font-bold text-afzal-glow">
          Clear Skies
        </div>
      </Card>

      {/* Widget 6: Notifications */}
      <Card variant="glass" className="p-4 space-y-3 border-white/10">
        <div className="flex items-center justify-between text-xs font-bold text-white">
          <span className="flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-afzal" /> Notifications</span>
          <span className="text-[10px] text-slate-400">0 unread</span>
        </div>
        <p className="text-xs text-slate-400 text-center py-2">No new alerts.</p>
      </Card>
    </div>
  );

  return (
    <>
      {/* Floating Trigger Buttons on Mobile Viewports */}
      {(!isInsideChatThread || isPlaying) && (
        <motion.div
          drag={isInsideChatThread}
          dragMomentum={false}
          className={`fixed right-3 z-40 md:hidden flex flex-col gap-3 items-center select-none ${
            isInsideChatThread ? 'top-16 touch-none' : 'bottom-20'
          }`}
        >
          {/* 1. Mobile Apps Launcher Grid Button (Hidden in Active Chat Thread) */}
          {!isInsideChatThread && (
            <button
              type="button"
              onClick={() => setIsAppLauncherOpen(true)}
              className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-violet-500 via-rose-500 to-amber-400 shadow-xl active:scale-95 transition-transform flex items-center justify-center relative group"
              aria-label="Universe Apps"
              title="Universe Apps"
            >
              <div className="w-full h-full rounded-full bg-obsidian-950 flex items-center justify-center text-amber-300 group-hover:text-white transition-colors">
                <LayoutGrid className="w-5 h-5" />
              </div>
            </button>
          )}

          {/* 2. Activity Context Circular Button with Music Pulse Animation & Cover Art */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className={`w-12 h-12 rounded-full p-[2px] shadow-2xl active:scale-95 transition-all duration-300 relative ${
              isInsideChatThread ? 'cursor-grab active:cursor-grabbing' : ''
            } ${
              isPlaying
                ? 'bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 ring-2 ring-rose-500/60 shadow-rose-500/40 animate-pulse'
                : 'bg-gradient-to-tr from-violet-500 via-rose-500 to-amber-400'
            }`}
            aria-label="Open Activity Bar"
            title={isPlaying ? `Playing: ${currentTrack?.title || 'Shared Melody'}` : 'Open Activity Bar'}
          >
            <div className="w-full h-full rounded-full bg-obsidian-950 flex items-center justify-center relative overflow-hidden">
              {isPlaying && currentTrack ? (
                <img
                  src={getNormalizedCoverUrl(currentTrack.coverUrl)}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    if (!e.currentTarget.src.includes('unsplash.com')) {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400';
                    }
                  }}
                />
              ) : isPlaying ? (
                <>
                  <Music className="w-5 h-5 text-rose-400 animate-bounce" />
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                </>
              ) : (
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              )}
            </div>

            {/* Floating Bouncing Music Badge when playing */}
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 border border-obsidian-950 flex items-center justify-center shadow-md animate-bounce z-10">
                <Music className="w-2.5 h-2.5 text-white" />
              </span>
            )}
          </button>
        </motion.div>
      )}

      {/* Mobile Apps Grid Launcher Modal */}
      <MobileAppLauncherModal
        isOpen={isAppLauncherOpen}
        onClose={() => setIsAppLauncherOpen(false)}
      />

      {/* Mobile Slide-Over Activity & Context Drawer */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-[250] flex justify-end bg-black/80 backdrop-blur-md md:hidden">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-80 max-w-[85vw] h-full bg-obsidian-950 border-l border-white/10 p-4 space-y-4 overflow-y-auto select-none"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Sparkles className="w-4 h-4 text-amrin-glow" /> Activity & Context Bar
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {panelContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sticky Panel */}
      {isOpen ? (
        <motion.aside
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className="hidden xl:flex flex-col w-80 h-[calc(100vh-4rem)] sticky top-16 border-l border-white/10 glass-panel shrink-0 p-4 space-y-4 overflow-y-auto select-none z-30"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Sparkles className="w-4 h-4 text-amrin-glow" /> Activity & Context Bar
            </div>
            <button
              onClick={onToggle}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {panelContent}
        </motion.aside>
      ) : (
        <button
          onClick={onToggle}
          className="fixed right-4 top-20 z-40 p-2.5 rounded-xl glass-card text-slate-400 hover:text-white border border-white/10 hidden xl:flex items-center gap-1 text-xs font-semibold shadow-xl"
        >
          <Sparkles className="w-4 h-4 text-amrin-glow" /> Activity Panel
        </button>
      )}

      {/* Super Owner (CO) Profile Viewer Modal */}
      <SuperOwnerProfileModal
        isOpen={isSuperOwnerModalOpen}
        onClose={() => setIsSuperOwnerModalOpen(false)}
      />
    </>
  );
};
