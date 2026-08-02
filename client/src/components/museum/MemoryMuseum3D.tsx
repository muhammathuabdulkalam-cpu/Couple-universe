/**
 * MemoryMuseum3D.tsx
 * 
 * Main Entry Container for 3D Memory Museum (Gallery View Mode X).
 * Reuses existing Media Engine, Zustand stores, React Query cache, and MediaViewerModal.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useMediaStore } from '../../store/mediaStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { MediaItem, AlbumItem } from '../../types/index.js';
import { MuseumBuilding } from './MuseumBuilding.js';
import { MuseumCamera, CameraTarget } from './MuseumCamera.js';
import { MuseumHUD } from './MuseumHUD.js';
import { MobileJoystick } from './MobileJoystick.js';
import { MuseumGalleryWalls } from './MuseumGalleryWalls.js';
import { AmbientAtmosphere } from './AmbientAtmosphere.js';
import { MuseumRoom } from './WallLayoutEngine.js';

interface MemoryMuseum3DProps {
  mediaItems: MediaItem[];
  albums: AlbumItem[];
}

export const MemoryMuseum3D: React.FC<MemoryMuseum3DProps> = ({ mediaItems }) => {
  const { setViewMode, searchQuery, openViewer } = useMediaStore();
  const { addToast } = useUIStore();

  const [webglReady, setWebglReady] = useState<boolean | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });

  // Camera & Navigation state
  const [cameraPos, setCameraPos] = useState<[number, number, number]>([0, 1.65, 0.5]);
  const [cameraYaw, setCameraYaw] = useState<number>(Math.PI);
  const [cameraTarget, setCameraTarget] = useState<CameraTarget | null>(null);

  const activeRoomId = useMemo(() => {
    const [x, , z] = cameraPos;
    if (z > -2) return 'entry';
    if (z > -12) return 'lobby';
    if (x < -8) return 'west-wing';
    if (x > 8) return 'east-wing';
    if (z < -28) return 'north-hall';
    return 'main-hall';
  }, [cameraPos]);

  // Test WebGL availability on mount
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      setWebglReady(Boolean(gl));
    } catch {
      setWebglReady(false);
    }
  }, []);

  // WebGL Fallback if device lacks hardware acceleration
  if (webglReady === false) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-obsidian-950/80 rounded-3xl border border-white/10 p-8 text-center text-white">
        <h3 className="text-xl font-bold text-amber-400 mb-2">WebGL 3D Not Supported</h3>
        <p className="text-sm text-slate-300 mb-6 max-w-md">
          Your browser or device GPU does not support 3D WebGL rendering.
        </p>
        <button
          type="button"
          onClick={() => setViewMode('grid')}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-afzal to-amrin text-white font-bold shadow-lg"
        >
          Switch to 2D Grid Gallery
        </button>
      </div>
    );
  }

  // Camera update callback from MuseumCamera
  const handleCameraUpdate = useCallback((pos: [number, number, number], yaw: number) => {
    setCameraPos(pos);
    setCameraYaw(yaw);
  }, []);

  // Room selection handler from MiniMap or RoomNavigator
  const handleSelectRoom = useCallback((room: MuseumRoom) => {
    setCameraTarget({
      pos: room.centerPos,
      yaw: room.targetYaw,
      onComplete: () => {
        addToast(room.name, 'Entered gallery room', 'info');
      },
    });
  }, [addToast]);

  // Artwork selection handler (smooth fly-to before opening MediaViewerModal)
  const handleSelectArtwork = useCallback((
    media: MediaItem,
    pos: [number, number, number],
    rot: [number, number, number]
  ) => {
    // Calculate target position in front of artwork (0.85m off artwork face)
    const yaw = rot[1];
    const standDistance = 0.85;
    const targetX = pos[0] + Math.sin(yaw) * standDistance;
    const targetZ = pos[2] + Math.cos(yaw) * standDistance;

    setCameraTarget({
      pos: [targetX, 1.65, targetZ],
      yaw: yaw + Math.PI, // face artwork directly
      onComplete: () => {
        openViewer(media); // Open existing MediaViewerModal
      },
    });
  }, [openViewer]);

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] rounded-3xl overflow-hidden bg-obsidian-950 border border-white/10 shadow-2xl select-none">
      {/* ─── 3D Canvas Container ────────────────────── */}
      <Canvas
        shadows
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          failIfMajorPerformanceCaveat: false,
        }}
        camera={{
          fov: 65,
          near: 0.1,
          far: 100,
          position: [0, 1.65, 0.5],
        }}
        className="w-full h-full"
      >
        {/* Global ambient & directional lighting */}
        <ambientLight intensity={0.55} color="#fef3c7" />
        <directionalLight position={[5, 12, -10]} intensity={0.9} color="#ffffff" />
        <hemisphereLight intensity={0.3} color="#fff7ed" groundColor="#78350f" />

        {/* Ambient Atmosphere (volumetric dust & 3D doorway signs) */}
        <AmbientAtmosphere />

        {/* Museum architecture */}
        <MuseumBuilding />

        {/* Dynamic Wall-Mounted Artworks */}
        <MuseumGalleryWalls
          mediaItems={mediaItems}
          searchQuery={searchQuery}
          onSelectArtwork={handleSelectArtwork}
        />

        {/* First-person & Fly-To Camera controller */}
        <MuseumCamera
          joystickInput={joystickInput}
          isPointerLocked={isPointerLocked}
          onPointerLockChange={setIsPointerLocked}
          target={cameraTarget}
          onTargetComplete={() => setCameraTarget(null)}
          onCameraUpdate={handleCameraUpdate}
        />
      </Canvas>

      {/* ─── 2D HUD Overlays ────────────────────── */}
      <MuseumHUD
        isPointerLocked={isPointerLocked}
        showGuide={showGuide}
        onToggleGuide={() => setShowGuide((prev) => !prev)}
        mediaCount={mediaItems.length}
        cameraPos={cameraPos}
        cameraYaw={cameraYaw}
        activeRoomId={activeRoomId}
        onSelectRoom={handleSelectRoom}
      />

      {/* Mobile Touch Joystick */}
      <div className="absolute bottom-6 left-6 z-30 sm:hidden">
        <MobileJoystick onChange={(vec) => setJoystickInput(vec)} />
      </div>
    </div>
  );
};
