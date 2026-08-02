import React, { Suspense, useMemo } from 'react';
import { MeshReflectorMaterial, Html } from '@react-three/drei';
import { AlbumItem, MediaItem } from '../../types/index.js';
import { MountedMediaFrame } from './MountedMediaFrame.js';

interface GalleryRoomProps {
  roomIndex: number;
  roomId: string;
  roomTitle: string;
  roomPosition: [number, number, number];
  mediaItems: MediaItem[];
  albums: AlbumItem[];
  searchQuery: string;
  onNavigateRoom: (targetRoomId: string) => void;
}

export const GalleryRoom: React.FC<GalleryRoomProps> = ({
  roomId,
  roomTitle,
  roomPosition,
  mediaItems,
  albums,
  searchQuery,
  onNavigateRoom,
}) => {
  // Filter media belonging to this room / album
  const roomMedia = useMemo(() => {
    if (roomId === 'all') return mediaItems.slice(0, 24);
    if (roomId === 'favorites') return mediaItems.filter((m) => m.isFavorite);
    if (roomId === 'videos') return mediaItems.filter((m) => m.mimeType?.startsWith('video'));
    
    return mediaItems.filter((m) => {
      const isAlbumMatch = (m as any).albumId === roomId || m.album?._id === roomId;
      const isTagMatch = m.tags?.includes(roomId);
      return isAlbumMatch || isTagMatch;
    });
  }, [mediaItems, roomId]);

  // Calculate 3D wall coordinates for each media item around room perimeter
  const wallFrames = useMemo(() => {
    const items = roomMedia.slice(0, 24); // Up to 24 media items per room
    const itemsPerWall = Math.ceil(items.length / 4);
    const spacing = 3.2;

    return items.map((media, idx) => {
      const wallIndex = Math.floor(idx / Math.max(itemsPerWall, 1));
      const posOnWall = (idx % Math.max(itemsPerWall, 1)) - itemsPerWall / 2 + 0.5;

      let pos: [number, number, number] = [0, 1.8, 0];
      let rot: [number, number, number] = [0, 0, 0];

      // North Wall (Z = -7.9m)
      if (wallIndex === 0) {
        pos = [posOnWall * spacing, 1.8, -7.9];
        rot = [0, 0, 0];
      }
      // South Wall (Z = +7.9m)
      else if (wallIndex === 1) {
        pos = [posOnWall * spacing, 1.8, 7.9];
        rot = [0, Math.PI, 0];
      }
      // East Wall (X = +7.9m)
      else if (wallIndex === 2) {
        pos = [7.9, 1.8, posOnWall * spacing];
        rot = [0, -Math.PI / 2, 0];
      }
      // West Wall (X = -7.9m)
      else {
        pos = [-7.9, 1.8, posOnWall * spacing];
        rot = [0, Math.PI / 2, 0];
      }

      return { media, pos, rot };
    });
  }, [roomMedia]);

  return (
    <group position={roomPosition}>
      {/* 1. Warm Polished Wooden Plank Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <MeshReflectorMaterial
          blur={[400, 150]}
          resolution={512}
          mirror={0.3}
          mixBlur={0.7}
          mixStrength={1.2}
          roughness={0.5}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#78350f" // Warm walnut / wood tone
          metalness={0.2}
        />
      </mesh>

      {/* 2. High Architectural Ceiling */}
      <mesh position={[0, 4.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>

      {/* 3. Recessed Track Ceiling Spotlights */}
      <group position={[0, 4.2, 0]}>
        <pointLight intensity={1.8} distance={15} color="#fffbeb" />
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[12, 0.1, 0.1]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
      </group>

      {/* 4. White Gallery Perimeter Walls (Apple / Art Museum aesthetic) */}
      {/* North Wall */}
      <mesh position={[0, 2.25, -8]} castShadow receiveShadow>
        <boxGeometry args={[16, 4.5, 0.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </mesh>
      {/* South Wall */}
      <mesh position={[0, 2.25, 8]} castShadow receiveShadow>
        <boxGeometry args={[16, 4.5, 0.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </mesh>
      {/* East Wall */}
      <mesh position={[8, 2.25, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[16, 4.5, 0.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </mesh>
      {/* West Wall */}
      <mesh position={[-8, 2.25, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[16, 4.5, 0.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </mesh>

      {/* 5. Entrance Signage & Navigation Portal above North Doorway */}
      <group position={[0, 3.6, -7.8]}>
        <Html transform center distanceFactor={4}>
          <div className="bg-obsidian-950/95 border border-white/20 text-white px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl text-center select-none min-w-[220px]">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-amrin-glow">
              EXHIBITION ROOM
            </div>
            <div className="text-sm font-extrabold text-white mt-0.5">{roomTitle}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center justify-center gap-2">
              <span>{roomMedia.length} Artworks</span>
            </div>

            {/* Quick Room Switcher Tabs */}
            <div className="flex flex-wrap gap-1 justify-center mt-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => onNavigateRoom('all')}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                  roomId === 'all' ? 'bg-amrin text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                All
              </button>
              {albums.map((alb) => (
                <button
                  key={alb._id}
                  type="button"
                  onClick={() => onNavigateRoom(alb._id)}
                  className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                    roomId === alb._id ? 'bg-amrin text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {alb.name}
                </button>
              ))}
            </div>
          </div>
        </Html>
      </group>

      {/* 6. Mounted Framed Artworks */}
      <Suspense fallback={null}>
        {wallFrames.map(({ media, pos, rot }) => (
          <MountedMediaFrame
            key={media._id}
            media={media}
            position={pos}
            rotation={rot}
            searchQuery={searchQuery}
          />
        ))}
      </Suspense>
    </group>
  );
};
