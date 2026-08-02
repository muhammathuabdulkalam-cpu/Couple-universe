/**
 * MuseumHUD.tsx
 * 
 * 2D Glassmorphism Overlay System for 3D Memory Museum.
 * Includes:
 * - Top control bar with Title, Media Count, Search/Filter badges & Exit button
 * - Mobile-responsive MiniMap overlay (collapsible on mobile)
 * - RoomNavigator segmented pill bar (bottom-center)
 * - Collapsible Controls & Keyboard shortcuts guide
 * - Crosshair (when pointer locked)
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass, MousePointer2, Sparkles, X, Search, Filter, Maximize2, Minimize2, Lock, Unlock } from 'lucide-react';
import { useMediaStore } from '../../store/mediaStore.js';
import { MiniMap } from './MiniMap.js';
import { RoomNavigator } from './RoomNavigator.js';
import { MuseumRoom } from './WallLayoutEngine.js';

interface MuseumHUDProps {
  isPointerLocked: boolean;
  showGuide: boolean;
  onToggleGuide: () => void;
  mediaCount: number;
  cameraPos: [number, number, number];
  cameraYaw: number;
  activeRoomId: string;
  onSelectRoom: (room: MuseumRoom) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  allowPageScroll?: boolean;
  onTogglePageScroll?: () => void;
}

export const MuseumHUD: React.FC<MuseumHUDProps> = ({
  isPointerLocked,
  showGuide,
  onToggleGuide,
  mediaCount,
  cameraPos,
  cameraYaw,
  activeRoomId,
  onSelectRoom,
  isFullscreen = false,
  onToggleFullscreen,
  allowPageScroll = false,
  onTogglePageScroll,
}) => {
  const { setViewMode, searchQuery, setSearchQuery, activeAlbum, filterFavorite } = useMediaStore();

  return (
    <>
      {/* ─── Top Control Bar ────────────────────────────────────────── */}
      <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-20 flex items-start justify-between pointer-events-none gap-2 sm:gap-4">
        {/* Left: Title & Search (Hidden on Mobile) */}
        <div className="hidden sm:flex flex-col gap-1.5 pointer-events-auto max-w-[220px] sm:max-w-xs">
          <div className="bg-obsidian-950/85 backdrop-blur-xl px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl border border-white/15 shadow-2xl flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-afzal/40 via-amrin/40 to-rose-500/40 border border-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] sm:text-xs font-extrabold text-white tracking-wide flex items-center gap-1.5 truncate">
                Museum
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[8px] sm:text-[9px] font-mono shrink-0">
                  3D
                </span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate">
                {mediaCount} artworks
              </div>
            </div>
          </div>

          {/* Quick Search Input */}
          <div className="bg-obsidian-950/85 backdrop-blur-xl px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-white/15 shadow-xl flex items-center gap-2 w-full">
            <Search className="w-3 h-3 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="bg-transparent text-[11px] sm:text-xs text-white placeholder-slate-500 outline-none w-full min-w-0"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white shrink-0">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Indicator */}
          {(activeAlbum || filterFavorite) && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[9px] font-bold w-fit truncate">
              <Filter className="w-2.5 h-2.5 shrink-0" /> {activeAlbum ? activeAlbum.name : 'Favorites'}
            </div>
          )}
        </div>

        {/* Right Top Stack: Controls & MiniMap */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {onToggleFullscreen && (
              <button
                type="button"
                onClick={onToggleFullscreen}
                className="hidden sm:block p-2 rounded-xl bg-obsidian-950/85 border border-white/15 text-white hover:bg-white/10 shadow-xl transition-all"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={onToggleGuide}
              className={`hidden sm:block p-2 rounded-xl border backdrop-blur-xl shadow-xl transition-all ${showGuide
                  ? 'bg-amber-500/30 border-amber-500/50 text-amber-200'
                  : 'bg-obsidian-950/85 border-white/15 text-slate-300 hover:text-white'
                }`}
              title="Controls Guide"
            >
              <Compass className="w-4 h-4" />
            </button>

            {onTogglePageScroll && (
              <button
                type="button"
                onClick={onTogglePageScroll}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border backdrop-blur-xl shadow-xl text-xs font-bold transition-all ${
                  allowPageScroll
                    ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300'
                    : 'bg-obsidian-950/85 border-white/15 text-slate-300 hover:text-white'
                }`}
                title={allowPageScroll ? 'Page Scroll Enabled (Tap to lock)' : 'Museum Mode (Tap to enable page scroll)'}
              >
                {allowPageScroll ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
                <span className="hidden sm:inline">{allowPageScroll ? 'Page Scroll ON' : 'Page Scroll OFF'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-obsidian-950/90 border border-white/20 text-white font-extrabold text-xs shadow-2xl hover:bg-rose-500/20 hover:border-rose-500/40 transition-all flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Exit Museum</span>
            </button>
          </div>

          {/* Desktop MiniMap (Always visible on SM+) */}
          <div className="hidden sm:block">
            <MiniMap
              cameraPos={cameraPos}
              cameraYaw={cameraYaw}
              activeRoomId={activeRoomId}
              onSelectRoom={onSelectRoom}
            />
          </div>
        </div>
      </div>

      {/* ─── Bottom-Center Room Navigator (Hidden on Mobile) ───────────────────────────── */}
      <div className="hidden sm:block absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[92vw]">
        <RoomNavigator activeRoomId={activeRoomId} onSelectRoom={onSelectRoom} />
      </div>

      {/* ─── Center Crosshair (when Pointer Locked) ────────────────── */}
      {isPointerLocked && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-white/70 border border-black/50 shadow-md" />
        </div>
      )}

      {/* ─── Controls & Shortcuts Modal ────────────────────────────── */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-20 right-4 z-40 w-80 bg-obsidian-950/95 border border-white/20 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl text-white pointer-events-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <MousePointer2 className="w-4 h-4" /> 3D Museum Controls
              </h4>
              <button onClick={onToggleGuide} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-[11px] text-slate-300">
              <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                <span>Walk Forward / Back</span>
                <span className="font-mono bg-black/50 px-1.5 py-0.5 rounded text-amber-300">W / S</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                <span>Strafe Left / Right</span>
                <span className="font-mono bg-black/50 px-1.5 py-0.5 rounded text-amber-300">A / D</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                <span>Look Around</span>
                <span className="font-mono bg-black/50 px-1.5 py-0.5 rounded text-amber-300">Mouse Click</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                <span>Inspect Artwork</span>
                <span className="font-mono bg-black/50 px-1.5 py-0.5 rounded text-amber-300">Click Frame</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Bottom-Left Mouse Prompt (Desktop only) ────────────────── */}
      {!isPointerLocked && (
        <div className="absolute bottom-4 left-4 z-10 hidden sm:block pointer-events-none">
          <div className="bg-obsidian-950/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] text-slate-300 font-mono">
            💡 Click anywhere to look around with mouse
          </div>
        </div>
      )}
    </>
  );
};
