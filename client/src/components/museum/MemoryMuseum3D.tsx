import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass, Info, MapPin, Sparkles, X } from 'lucide-react';
import { AlbumItem, MediaItem } from '../../types/index.js';
import { useMediaStore } from '../../store/mediaStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { MuseumScene } from './MuseumScene.js';

interface MemoryMuseum3DProps {
  mediaItems: MediaItem[];
  albums: AlbumItem[];
}

export const MemoryMuseum3D: React.FC<MemoryMuseum3DProps> = ({ mediaItems, albums }) => {
  const { setViewMode, searchQuery } = useMediaStore();
  const { addToast } = useUIStore();

  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string>('all');
  const [showControlsGuide, setShowControlsGuide] = useState(true);
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // WebGL Availability Guard
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        setHasWebGL(true);
      } else {
        setHasWebGL(false);
      }
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  // WebGL Fallback Notification
  useEffect(() => {
    if (hasWebGL === false) {
      addToast(
        'WebGL Unsupported',
        'Your browser or GPU does not support 3D rendering. Falling back to Grid View.',
        'info'
      );
      setViewMode('grid');
    }
  }, [hasWebGL]);

  if (hasWebGL === null) {
    return (
      <div className="w-full h-[600px] rounded-3xl glass-card border border-white/10 flex items-center justify-center text-white">
        <div className="flex items-center gap-3 text-sm font-extrabold animate-pulse">
          <Sparkles className="w-5 h-5 text-amrin" /> Initializing 3D Art Gallery...
        </div>
      </div>
    );
  }

  if (hasWebGL === false) return null;

  return (
    <div className="relative w-full h-[78vh] min-h-[580px] max-h-[880px] rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-obsidian-950 select-none">
      
      {/* 1. React Three Fiber Canvas */}
      <Canvas
        shadows
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        camera={{ position: [0, 1.6, 5], fov: 60 }}
        className="w-full h-full"
      >
        <MuseumScene
          mediaItems={mediaItems}
          albums={albums}
          searchQuery={searchQuery}
          activeRoomId={activeRoomId}
          joystickPos={joystickPos}
          onNavigateRoom={(roomId) => setActiveRoomId(roomId)}
        />
      </Canvas>

      {/* 2. Apple-Style Glassmorphism Top Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Left: Gallery Title & Active Room Badge */}
        <div className="flex items-center gap-2 pointer-events-auto bg-obsidian-950/85 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
          <Sparkles className="w-4 h-4 text-amrin-glow" />
          <div>
            <div className="text-xs font-extrabold text-white tracking-wide">3D Memory Museum</div>
            <div className="text-[10px] text-slate-400 font-mono">
              {activeRoomId === 'all'
                ? 'Main Gallery Room'
                : albums.find((a) => a._id === activeRoomId)?.name || 'Album Room'}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowControlsGuide((v) => !v)}
            className="p-2.5 rounded-xl bg-obsidian-950/85 backdrop-blur-xl border border-white/10 text-slate-300 hover:text-white transition-colors"
            title="Controls & Guide"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-obsidian-950/85 backdrop-blur-xl border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" /> Exit 3D View
          </button>
        </div>
      </div>

      {/* 3. Bottom Mini-Map & Room Selector Overlay */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-auto hidden sm:flex items-center gap-2 bg-obsidian-950/90 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
        <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-amrin-glow" /> Rooms:
        </div>
        <button
          type="button"
          onClick={() => setActiveRoomId('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeRoomId === 'all'
              ? 'bg-gradient-to-r from-afzal to-amrin text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Main Room
        </button>
        {albums.map((alb) => (
          <button
            key={alb._id}
            type="button"
            onClick={() => setActiveRoomId(alb._id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeRoomId === alb._id
                ? 'bg-gradient-to-r from-afzal to-amrin text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {alb.name}
          </button>
        ))}
      </div>

      {/* 4. Controls & Navigation Guide Modal Overlay */}
      <AnimatePresence>
        {showControlsGuide && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-4 z-20 max-w-xs bg-obsidian-950/90 backdrop-blur-xl border border-white/15 p-4 rounded-2xl text-white shadow-2xl space-y-2 pointer-events-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amrin">
                <Compass className="w-4 h-4" /> Navigation & Controls
              </div>
              <button onClick={() => setShowControlsGuide(false)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[11px] text-slate-300 space-y-1.5 font-mono">
              <p>• <strong className="text-white">WASD / Arrow Keys</strong> : Walk in room</p>
              <p>• <strong className="text-white">Shift Key</strong> : Sprint speed</p>
              <p>• <strong className="text-white">Mouse Drag</strong> : Look 360°</p>
              <p>• <strong className="text-white">Click Artwork</strong> : Open Lightbox Viewer</p>
              <p>• <strong className="text-white">Mobile</strong> : Touch Joystick (Bottom Left)</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Mobile Virtual Touch Joystick */}
      <div className="sm:hidden absolute bottom-6 left-6 z-20 pointer-events-auto">
        <div
          className="w-24 h-24 rounded-full bg-obsidian-950/85 backdrop-blur-xl border border-white/20 flex items-center justify-center touch-none relative shadow-2xl"
          onTouchMove={(e) => {
            const touch = e.touches[0];
            const rect = e.currentTarget.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const dx = (touch.clientX - centerX) / (rect.width / 2);
            const dy = (touch.clientY - centerY) / (rect.height / 2);
            setJoystickPos({ x: Math.max(-1, Math.min(1, dx)), y: Math.max(-1, Math.min(1, dy)) });
          }}
          onTouchEnd={() => setJoystickPos({ x: 0, y: 0 })}
        >
          <div className="w-8 h-8 rounded-full bg-amrin/80 shadow-lg border border-white/40" />
        </div>
      </div>
    </div>
  );
};
