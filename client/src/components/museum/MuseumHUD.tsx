/**
 * MuseumHUD.tsx
 * 
 * 2D glassmorphism overlay for the 3D museum.
 * Includes: top control bar, navigation guide, crosshair,
 * pointer-lock prompt, and exit button.
 */
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass, MousePointer2, Sparkles, X } from 'lucide-react';
import { useMediaStore } from '../../store/mediaStore.js';

interface MuseumHUDProps {
  isPointerLocked: boolean;
  showGuide: boolean;
  onToggleGuide: () => void;
  mediaCount: number;
}

export const MuseumHUD: React.FC<MuseumHUDProps> = ({
  isPointerLocked,
  showGuide,
  onToggleGuide,
  mediaCount,
}) => {
  const { setViewMode } = useMediaStore();

  return (
    <>
      {/* ─── Top Bar ─────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Left: Museum title */}
        <div className="pointer-events-auto bg-obsidian-950/85 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-afzal/30 via-amrin/30 to-heart/30 border border-white/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amrin-glow" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-white tracking-wide">Memory Museum</div>
            <div className="text-[10px] text-slate-400 font-mono">
              {mediaCount} artworks • Afrin Universe
            </div>
          </div>
        </div>

        {/* Right: Controls toggle & exit */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onToggleGuide}
            className="p-2.5 rounded-xl bg-obsidian-950/85 backdrop-blur-xl border border-white/10 text-slate-300 hover:text-white transition-colors"
            title="Toggle Controls Guide"
          >
            <Compass className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-obsidian-950/85 backdrop-blur-xl border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" /> Exit Museum
          </button>
        </div>
      </div>

      {/* ─── Controls Guide (collapsible) ────────── */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-16 left-4 z-20 w-64 bg-obsidian-950/92 backdrop-blur-xl border border-white/15 p-4 rounded-2xl text-white shadow-2xl pointer-events-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <span className="text-xs font-extrabold text-amrin flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" /> Navigation
              </span>
              <button onClick={onToggleGuide} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Desktop controls */}
            <div className="hidden sm:block space-y-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono font-bold text-white">W A S D</kbd>
                <span>Walk</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono font-bold text-white">Mouse</kbd>
                <span>Look around (click to lock)</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono font-bold text-white">Shift</kbd>
                <span>Sprint</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono font-bold text-white">Esc</kbd>
                <span>Release mouse</span>
              </div>
            </div>

            {/* Mobile controls */}
            <div className="sm:hidden space-y-2 text-[11px] text-slate-300">
              <p>• <strong className="text-white">Left Joystick</strong>: Walk</p>
              <p>• <strong className="text-white">Right Side Swipe</strong>: Look around</p>
              <p>• <strong className="text-white">Tap Artwork</strong>: View photo</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Crosshair (desktop only, when pointer locked) ─── */}
      {isPointerLocked && (
        <div className="absolute inset-0 z-10 hidden sm:flex items-center justify-center pointer-events-none">
          <div className="w-1 h-1 rounded-full bg-white/60 ring-2 ring-white/20" />
        </div>
      )}

      {/* ─── Pointer Lock Prompt (desktop, when not locked) ─── */}
      {!isPointerLocked && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-obsidian-950/85 backdrop-blur-xl border border-white/15 text-xs font-bold text-slate-300 pointer-events-none animate-pulse shadow-xl">
          <MousePointer2 className="w-4 h-4 text-amrin" />
          Click anywhere to enable mouse look
        </div>
      )}
    </>
  );
};
