import React from 'react';
import { Sparkles } from '@react-three/drei';
import { AlbumItem, MediaItem } from '../../types/index.js';
import { GalleryRoom } from './GalleryRoom.js';
import { MuseumCameraRig } from './MuseumCameraRig.js';

interface MuseumSceneProps {
  mediaItems: MediaItem[];
  albums: AlbumItem[];
  searchQuery: string;
  activeRoomId: string;
  joystickPos?: { x: number; y: number };
  onNavigateRoom: (roomId: string) => void;
}

export const MuseumScene: React.FC<MuseumSceneProps> = ({
  mediaItems,
  albums,
  searchQuery,
  activeRoomId,
  joystickPos,
  onNavigateRoom,
}) => {
  const activeAlbumObj = albums.find((a) => a._id === activeRoomId);
  const activeRoomTitle = activeRoomId === 'all'
    ? 'Main Couple Gallery'
    : activeAlbumObj?.name || 'Album Exhibition';

  return (
    <>
      {/* 1. Global Lighting */}
      <ambientLight intensity={0.6} color="#fff1f2" />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* 2. Soft Floating Dust Particles for Gallery Atmosphere */}
      <Sparkles count={80} scale={[16, 6, 16]} size={2.5} speed={0.3} opacity={0.5} color="#fb7185" />

      {/* 3. Render Active Gallery Room */}
      <GalleryRoom
        roomIndex={0}
        roomId={activeRoomId}
        roomTitle={activeRoomTitle}
        roomPosition={[0, 0, 0]}
        mediaItems={mediaItems}
        albums={albums}
        searchQuery={searchQuery}
        onNavigateRoom={onNavigateRoom}
      />

      {/* 4. First Person Camera Rig */}
      <MuseumCameraRig joystickPos={joystickPos} />
    </>
  );
};
