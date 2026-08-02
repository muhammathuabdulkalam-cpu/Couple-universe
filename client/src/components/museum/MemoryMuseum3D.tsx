/**
 * MemoryMuseum3D.tsx
 * 
 * Phase 1: Main museum container.
 * Assembles Canvas, Building, Camera, Lighting, HUD, Mobile controls.
 * WebGL guard with graceful fallback to Grid view.
 */
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Sparkles as SparklesIcon } from 'lucide-react';
import { AlbumItem, MediaItem } from '../../types/index.js';
import { useMediaStore } from '../../store/mediaStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { MuseumBuilding } from './MuseumBuilding.js';
import { MuseumCamera } from './MuseumCamera.js';
import { MuseumHUD } from './MuseumHUD.js';
import { MobileJoystick } from './MobileJoystick.js';

interface MemoryMuseum3DProps {
  mediaItems: MediaItem[];
  albums: AlbumItem[];
}

// ─── WebGL detection ───────────────────────────────────
function checkWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

export const MemoryMuseum3D: React.FC<MemoryMuseum3DProps> = ({ mediaItems, albums: _albums }) => {
  const { setViewMode } = useMediaStore();
  const { addToast } = useUIStore();

  const [webglReady, setWebglReady] = useState<boolean | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });

  // ─── WebGL check on mount ────────────────────────
  useEffect(() => {
    const supported = checkWebGL();
    setWebglReady(supported);

    if (!supported) {
      addToast(
        'WebGL Not Available',
        'Your browser does not support 3D rendering. Switching to Grid View.',
        'info'
      );
      setViewMode('grid');
    }
  }, []);

  // ─── Auto-hide guide after 8 seconds ─────────────
  useEffect(() => {
    if (showGuide) {
      const timer = setTimeout(() => setShowGuide(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showGuide]);

  // ─── Mobile swipe look handler (right half of screen) ──
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [_mobileYaw, setMobileYaw] = useState(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    // Only use right half of screen for look
    if (touch.clientX > window.innerWidth * 0.4) {
      setTouchStart({ x: touch.clientX, y: touch.clientY });
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart) return;
      const touch = e.touches[0];
      const dx = touch.clientX - touchStart.x;
      setMobileYaw((prev) => prev - dx * 0.003);
      setTouchStart({ x: touch.clientX, y: touch.clientY });
    },
    [touchStart]
  );

  const handleTouchEnd = useCallback(() => {
    setTouchStart(null);
  }, []);

  // ─── Loading state ───────────────────────────────
  if (webglReady === null) {
    return (
      <div className="w-full h-[75vh] min-h-[550px] rounded-3xl glass-card border border-white/10 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-extrabold text-white animate-pulse">
          <SparklesIcon className="w-5 h-5 text-amrin" /> Building Memory Museum...
        </div>
      </div>
    );
  }

  if (!webglReady) return null;

  return (
    <div
      className="relative w-full h-[78vh] min-h-[580px] max-h-[900px] rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-[#0f172a] select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ─── R3F Canvas ─────────────────────────── */}
      <Canvas
        shadows="soft"
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        camera={{
          fov: 65,
          near: 0.1,
          far: 100,
          position: [0, 1.65, 0.5],
        }}
        className="w-full h-full"
      >
        {/* Global lighting */}
        <ambientLight intensity={0.45} color="#fef3c7" />
        <directionalLight
          position={[5, 12, -10]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-25}
          shadow-camera-right={25}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
        />
        {/* Warm tint fill */}
        <hemisphereLight
          intensity={0.3}
          color="#fff7ed"
          groundColor="#78350f"
        />

        {/* Floating dust particles */}
        <Sparkles
          count={60}
          scale={[40, 5, 40]}
          position={[0, 2.5, -18]}
          size={2}
          speed={0.15}
          opacity={0.4}
          color="#fbbf24"
        />

        {/* Museum architecture */}
        <Suspense fallback={null}>
          <MuseumBuilding />
        </Suspense>

        {/* Camera controller */}
        <MuseumCamera
          joystickInput={joystickInput}
          isPointerLocked={isPointerLocked}
          onPointerLockChange={setIsPointerLocked}
        />
      </Canvas>

      {/* ─── 2D HUD Overlay ─────────────────────── */}
      <MuseumHUD
        isPointerLocked={isPointerLocked}
        showGuide={showGuide}
        onToggleGuide={() => setShowGuide((v) => !v)}
        mediaCount={mediaItems.length}
      />

      {/* ─── Mobile Joystick (touch devices only) ── */}
      <div className="sm:hidden absolute bottom-6 left-6 z-20 pointer-events-auto">
        <MobileJoystick onChange={setJoystickInput} />
      </div>
    </div>
  );
};
