import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  ChevronRight,
  CloudSun,
  Heart,
  MessageSquare,
  Music,
  Play,
  Plus,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnniversaryCountdownWidget } from '../dashboard/AnniversaryCountdownWidget.js';
import { BirthdayCountdown } from '../dashboard/BirthdayCountdown.js';
import { TodaysMemoryWidget } from '../dashboard/TodaysMemoryWidget.js';
import { Badge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';

interface RightContextPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const RightContextPanel: React.FC<RightContextPanelProps> = ({ isOpen, onToggle }) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const panelContent = (
    <div className="space-y-4">
      {/* Widget 1: Partner Birthday Live Countdown (Compact 100% vertical layout for 300px sidebar) */}
      <BirthdayCountdown variant="compact" />

      {/* Widget 2: Today's Memory & Anniversary */}
      <TodaysMemoryWidget />
      <AnniversaryCountdownWidget />

      {/* Widget 3: Quick Actions */}
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

      {/* Widget 4: Shared Music Player */}
      <Card variant="glass" className="p-4 space-y-3 border-amrin/20">
        <div className="flex items-center justify-between text-xs font-bold text-white">
          <span className="flex items-center gap-1.5"><Music className="w-3.5 h-3.5 text-amrin-glow" /> Shared Melody</span>
          <Badge variant="violet" size="sm">Active</Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-afzal to-amrin flex items-center justify-center text-white shrink-0">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-white truncate">Perfect Together</h4>
            <p className="text-[11px] text-slate-400 truncate">Afzal & Amrin Playlist</p>
          </div>
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
      {/* Gradient-Border Circular Floating Trigger Buttons on Mobile Viewports */}
      <div className="fixed right-3 bottom-20 z-40 md:hidden flex flex-col gap-3 items-center select-none">
        
        {/* 1. Quick Chat Circular Button with Couple Gradient Border */}
        <Link
          to="/chat"
          className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-afzal via-amrin to-heart shadow-2xl active:scale-95 transition-transform"
          aria-label="Open Quick Chat"
          title="Open Quick Chat"
        >
          <div className="w-full h-full rounded-full bg-obsidian-950 flex items-center justify-center text-amrin-glow">
            <MessageSquare className="w-5 h-5 fill-amrin/20" />
          </div>
        </Link>

        {/* 2. Activity Context Circular Button with Radiant Gradient Border */}
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-violet-500 via-rose-500 to-amber-400 shadow-2xl active:scale-95 transition-transform"
          aria-label="Open Activity Bar"
          title="Open Activity Bar"
        >
          <div className="w-full h-full rounded-full bg-obsidian-950 flex items-center justify-center text-amber-300">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
        </button>

      </div>

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
    </>
  );
};
