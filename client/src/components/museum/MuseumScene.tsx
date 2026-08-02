import React, { Suspense } from 'react';
import { MeshReflectorMaterial, Float, Sparkles, Html } from '@react-three/drei';
import { AlbumItem, MediaItem } from '../../types/index.js';
import { MediaFrame3D } from './MediaFrame3D.js';

interface MuseumSceneProps {
  mediaItems: MediaItem[];
  albums: AlbumItem[];
  searchQuery: string;
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onSelectFrame: (media: MediaItem, pos: [number, number, number]) => void;
}

export const MuseumScene: React.FC<MuseumSceneProps> = ({
  mediaItems,
  albums,
  searchQuery,
  activeRoomId,
  onSelectRoom,
  onSelectFrame,
}) => {
  // Group media items into wall slots (4 walls per room quadrant)
  const roomMedia = React.useMemo(() => {
    if (!activeRoomId || activeRoomId === 'all') return mediaItems;
    return mediaItems.filter((m) => {
      const albumMatch = (m as any).albumId === activeRoomId || m.tags?.includes(activeRoomId);
      return albumMatch;
    });
  }, [mediaItems, activeRoomId]);

  // Layout media onto 3D walls around the gallery perimeter
  const framePositions = React.useMemo(() => {
    const items = roomMedia.slice(0, 32); // Max 32 frames per active room view for performance
    const perimeterCount = Math.ceil(items.length / 4);
    const wallSpacing = 3.2;

    return items.map((media, idx) => {
      const wallIndex = Math.floor(idx / Math.max(perimeterCount, 1));
      const positionOnWall = (idx % Math.max(perimeterCount, 1)) - perimeterCount / 2 + 0.5;

      let pos: [number, number, number] = [0, 1.8, 0];
      let rot: [number, number, number] = [0, 0, 0];

      // North Wall
      if (wallIndex === 0) {
        pos = [positionOnWall * wallSpacing, 1.8, -11.8];
        rot = [0, 0, 0];
      }
      // South Wall
      else if (wallIndex === 1) {
        pos = [positionOnWall * wallSpacing, 1.8, 11.8];
        rot = [0, Math.PI, 0];
      }
      // East Wall
      else if (wallIndex === 2) {
        pos = [11.8, 1.8, positionOnWall * wallSpacing];
        rot = [0, -Math.PI / 2, 0];
      }
      // West Wall
      else {
        pos = [-11.8, 1.8, positionOnWall * wallSpacing];
        rot = [0, Math.PI / 2, 0];
      }

      return { media, pos, rot };
    });
  }, [roomMedia]);

  return (
    <>
      {/* 1. Ambient & Key Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1.0} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[0, 8, 0]} intensity={1.5} color="#e0e7ff" />

      {/* 2. Floating Atmospheric Magic Particles */}
      <Sparkles count={120} scale={[25, 8, 25]} size={3} speed={0.4} opacity={0.6} color="#ec4899" />

      {/* 3. Reflective Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={512}
          mirror={0.4}
          mixBlur={0.8}
          mixStrength={1.5}
          roughness={0.4}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0f172a"
          metalness={0.6}
        />
      </mesh>

      {/* 4. Ceiling & Structural Walls */}
      {/* Ceiling */}
      <mesh position={[0, 4.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#020617" roughness={0.9} />
      </mesh>

      {/* Perimeter Walls */}
      {/* North Wall */}
      <mesh position={[0, 2.25, -12]} castShadow receiveShadow>
        <boxGeometry args={[30, 4.5, 0.2]} />
        <meshStandardMaterial color="#0b0f19" roughness={0.8} />
      </mesh>
      {/* South Wall */}
      <mesh position={[0, 2.25, 12]} castShadow receiveShadow>
        <boxGeometry args={[30, 4.5, 0.2]} />
        <meshStandardMaterial color="#0b0f19" roughness={0.8} />
      </mesh>
      {/* East Wall */}
      <mesh position={[12, 2.25, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[30, 4.5, 0.2]} />
        <meshStandardMaterial color="#0b0f19" roughness={0.8} />
      </mesh>
      {/* West Wall */}
      <mesh position={[-12, 2.25, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[30, 4.5, 0.2]} />
        <meshStandardMaterial color="#0b0f19" roughness={0.8} />
      </mesh>

      {/* 5. Exhibition Album Room Doorway Hotspots */}
      <group position={[0, 1.2, 0]}>
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.8} />
          </mesh>
        </Float>
        <Html position={[0, 2.0, 0]} center transform distanceFactor={5}>
          <div className="bg-obsidian-950/95 border border-white/20 text-white p-3 rounded-2xl shadow-2xl backdrop-blur-xl text-center select-none min-w-[200px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amrin-glow block">Museum Exhibition Center</span>
            <span className="text-xs font-extrabold text-white block mt-0.5">
              {activeRoomId && activeRoomId !== 'all'
                ? albums.find((a) => a._id === activeRoomId)?.name || 'Custom Room Exhibition'
                : 'Main Couple Memory Hall'}
            </span>
            <div className="flex flex-wrap gap-1 justify-center mt-2">
              <button
                type="button"
                onClick={() => onSelectRoom('all')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                  activeRoomId === 'all' ? 'bg-amrin text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                All Memories
              </button>
              {albums.map((album) => (
                <button
                  key={album._id}
                  type="button"
                  onClick={() => onSelectRoom(album._id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                    activeRoomId === album._id ? 'bg-amrin text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {album.name}
                </button>
              ))}
            </div>
          </div>
        </Html>
      </group>

      {/* 6. Render Framed Artwork Items on Walls */}
      <Suspense fallback={null}>
        {framePositions.map(({ media, pos, rot }) => (
          <MediaFrame3D
            key={media._id}
            media={media}
            position={pos}
            rotation={rot}
            searchQuery={searchQuery}
            onSelectFrame={onSelectFrame}
          />
        ))}
      </Suspense>
    </>
  );
};
