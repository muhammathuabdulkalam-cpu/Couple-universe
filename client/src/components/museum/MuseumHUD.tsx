/**
 * MuseumHUD.tsx
 * 
 * 2D Glassmorphism Overlay System for 3D Memory Museum.
 * Includes:
 * - Top control bar with Title, Media Count, Search/Filter badges & Exit button
 * - MiniMap overlay (top-right)
 * - RoomNavigator segmented pill bar (bottom-center)
 * - Collapsible Controls & Keyboard shortcuts guide
 * - Crosshair (when pointer locked)
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass, MousePointer2, Sparkles, X, Search, Filter } from 'lucide-react';
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
}) => {
  const { setViewMode, searchQuery, setSearchQuery, activeAlbum, filterFavorite } = useMediaStore();

  return (
    <>
      {/* ─── Top Control Bar ────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-start justify-between pointer-events-none gap-4">
        {/* Left: Title & Gallery Status */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="bg-obsidian-950/85 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/15 shadow-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-afzal/40 via-amrin/40 to-rose-500/40 border border-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-white tracking-wide flex items-center gap-2">
                Memory Museum
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono">
                  3D MODE
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {mediaCount} artworks • Afrin Universe
              </div>
            </div>
          </div>

          {/* Quick Search Input */}
          <div className="bg-obsidian-950/85 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/15 shadow-xl flex items-center gap-2 w-64">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artworks..."
              className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Indicator (if filter applied) */}
          {(activeAlbum || filterFavorite) && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold w-fit">
              <Filter className="w-3 h-3" /> Filter: {activeAlbum ? activeAlbum.name : 'Favorites'}
            </div>
          )}
        </div>

        {/* Right Top Stack: Controls & MiniMap */}
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleGuide}
              className="p-2.5 rounded-xl bg-obsidian-950/85 backdrop-blur-xl border border-white/15 text-slate-300 hover:text-white transition-colors shadow-xl"
              title="Toggle Navigation Guide"
            >
              <Compass className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-obsidian-950/85 backdrop-blur-xl border border-white/15 text-xs font-bold text-slate-300 hover:text-white hover:bg-rose-500/20 transition-colors shadow-xl"
            >
              <X className="w-4 h-4" /> Exit Museum
            </button>
          </div>

          {/* Floating MiniMap */}
          <MiniMap
            cameraPos={cameraPos}
            cameraYaw={cameraYaw}
            onSelectRoom={onSelectRoom}
            activeRoomId={activeRoomId}
          />
        </div>
      </div>

      {/* ─── Bottom Segmented Room Navigator ───────────────────────── */}
      <RoomNavigator
        activeRoomId={activeRoomId}
        onSelectRoom={onSelectRoom}
      />

      {/* ─── Controls Guide Overlay ─────────────────────────────────── */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-28 left-4 z-20 w-64 bg-obsidian-950/95 backdrop-blur-xl border border-white/15 p-4 rounded-2xl text-white shadow-2xl pointer-events-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                <Compass className="w-3.5 h-3.5" /> Controls Guide
              </span>
              <button onClick={onToggleGuide} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="hidden sm:block space-y-2 text-[11px] text-slate-300">
              <div className="flex items-center justify-between">
                <span>Walk Forward/Back</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono font-bold text-white">W / S</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Strafe Left/Right</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono font-bold text-white">A / D</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Sprint</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono font-bold text-white">Shift</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Look Around</span>
                <span className="text-[10px] font-mono text-amber-300">Click & Drag</span>
              </div>
              <div className="flex items-center justify-between">
                <span>View Photo / Video</span>
                <span className="text-[10px] font-mono text-amber-300">Click Artwork</span>
              </div>
            </div>

            <div className="sm:hidden space-y-2 text-[11px] text-slate-300">
              <p>• <strong className="text-white">Left Joystick</strong>: Walk around</p>
              <p>• <strong className="text-white">Right Drag</strong>: Look around</p>
              <p>• <strong className="text-white">Tap Artwork</strong>: Inspect & view photo</p>
              <p>• <strong className="text-white">Tap Room Pill</strong>: Walk to room</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Crosshair (desktop pointer lock) ───────────────────────── */}
      {isPointerLocked && (
        <div className="absolute inset-0 z-10 hidden sm:flex items-center justify-center pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-white/80 ring-4 ring-white/20" />
        </div>
      )}

      {/* ─── Pointer Lock Hint ──────────────────────────────────────── */}
      {!isPointerLocked && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-obsidian-950/80 backdrop-blur-md border border-white/10 text-xs font-bold text-slate-300 pointer-events-none shadow-lg">
          <MousePointer2 className="w-3.5 h-3.5 text-amber-400" />
          Click canvas to look around with mouse
        </div>
      )}
    </>
  );
};
