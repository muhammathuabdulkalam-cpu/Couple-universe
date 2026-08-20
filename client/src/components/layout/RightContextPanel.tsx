import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  ChevronRight,
  CloudSun,
  Headphones,
  Heart,
  LayoutGrid,
  Plus,
  Sparkles,
  UserCircle2,
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

import { useAuthStore } from '../../store/authStore.js';
import { useChatStore } from '../../store/chatStore.js';
import { useListenTogetherStore } from '../../store/listenTogetherStore.js';
import { SuperOwnerProfileModal } from '../profile/SuperOwnerProfileModal.js';

interface RightContextPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const RightContextPanel: React.FC<RightContextPanelProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { mobileView } = useChatStore();
  const isInsideChatThread = location.pathname.startsWith('/chat') && mobileView === 'chat';

  const { isSessionActive, partnerName, partnerAvatar, setDrawerOpen } = useListenTogetherStore();
  const { user } = useAuthStore();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const [isSuperOwnerModalOpen, setIsSuperOwnerModalOpen] = useState(false);

  const myHasAvatar = Boolean(user?.avatar && !user.avatar.includes('unsplash.com'));
  const pHasAvatar = Boolean(partnerAvatar && !partnerAvatar.includes('unsplash.com'));

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
      {/* Floating Listen Together Circle Button (Outside Chat Only) */}
      {!isInsideChatThread && (isSessionActive || user?.role === 'SUPER_OWNER' || user?.role === 'CO_OWNER') && (
        <div
          className="fixed right-3 bottom-20 z-50 md:hidden flex flex-col gap-3 items-center select-none"
        >
          {/* Mobile Apps Launcher Grid Button (Hidden in Active Chat Thread) */}
          {!isInsideChatThread && (
            <button
              type="button"
              onClick={() => setIsAppLauncherOpen(true)}
              className="w-11 h-11 rounded-full bg-obsidian-950/90 backdrop-blur-xl border border-white/15 shadow-xl active:scale-95 transition-all flex items-center justify-center text-slate-300 hover:text-white hover:border-amrin-glow/50 group"
              aria-label="Universe Apps"
              title="Universe Apps"
            >
              <LayoutGrid className="w-5 h-5 group-hover:text-amrin-glow transition-colors" />
            </button>
          )}

          {/* Listen Together Circle Icon (Draggable Dual-Avatar Circle Button) */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`w-12 h-12 rounded-full backdrop-blur-xl border-2 ring-2 shadow-2xl active:scale-95 transition-all flex items-center justify-center relative group cursor-pointer shrink-0 ${
              isSessionActive
                ? 'bg-gradient-to-tr from-rose-950 via-slate-950 to-purple-950 border-rose-500/80 ring-rose-500/40 shadow-rose-500/40'
                : 'bg-obsidian-950/90 border-white/20 ring-white/10 shadow-black/50'
            }`}
            title={`Listen Together with ${partnerName || 'Partner'} 💖`}
          >
            {/* Combined Overlapping Dual Avatars */}
            <div className="flex items-center justify-center -space-x-2">
              {myHasAvatar ? (
                <img src={user!.avatar!} alt="Me" className="w-5 h-5 rounded-full object-cover border border-white/40 shadow-sm" onError={(e) => { if (!e.currentTarget.src || e.currentTarget.src.includes('unsplash.com')) { e.currentTarget.style.display='none'; } }}/>
              ) : (
                <div className="w-5 h-5 rounded-full bg-slate-700 border border-white/30 flex items-center justify-center">
                  <UserCircle2 className="w-3.5 h-3.5 text-slate-400" />
                </div>
              )}
              {pHasAvatar ? (
                <img src={partnerAvatar!} alt={partnerName || 'Partner'} className="w-5 h-5 rounded-full object-cover border border-white/40 shadow-sm" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-slate-700 border border-white/30 flex items-center justify-center">
                  <UserCircle2 className="w-3.5 h-3.5 text-slate-400" />
                </div>
              )}
            </div>

            {/* Glowing Heartbeat Headphones Badge */}
            <div className="absolute -top-1 -right-1 z-20 w-5 h-5 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-500 border border-white/30 shadow-lg flex items-center justify-center animate-bounce">
              <Headphones className="w-2.5 h-2.5 text-white animate-pulse" />
            </div>
          </button>
        </div>
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
