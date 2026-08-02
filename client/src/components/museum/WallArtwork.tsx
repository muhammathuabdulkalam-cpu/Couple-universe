/**
 * WallArtwork.tsx
 * 
 * A single framed artwork mounted on a museum wall.
 * Preserves native aspect ratio (landscape / portrait / square).
 * Uses Cloudinary thumbnail textures for GPU efficiency.
 * Opens existing MediaViewerModal on click.
 */
import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import { useTexture, Html } from '@react-three/drei';
import { Play } from 'lucide-react';
import { MediaItem } from '../../types/index.js';
import { useMediaStore } from '../../store/mediaStore.js';

interface WallArtworkProps {
  media: MediaItem;
  position: [number, number, number];
  rotation: [number, number, number];
  searchQuery?: string;
}

export const WallArtwork: React.FC<WallArtworkProps> = ({
  media,
  position,
  rotation,
  searchQuery = '',
}) => {
  const { openViewer } = useMediaStore();
  const [hovered, setHovered] = useState(false);

  const textureUrl = media.thumbnailUrl || media.optimizedUrl || media.secureUrl;

  const texture = useTexture(textureUrl, (tx) => {
    if (tx instanceof THREE.Texture) {
      tx.colorSpace = THREE.SRGBColorSpace;
      tx.needsUpdate = true;
    }
  });

  const isVideo = media.mimeType?.startsWith('video');

  // Dynamic aspect-ratio-preserving frame dimensions
  const dims = useMemo(() => {
    let aspect = 1;
    if (media.width && media.height && media.height > 0) {
      aspect = media.width / media.height;
    } else if (media.aspectRatio) {
      aspect = media.aspectRatio;
    }

    const baseH = 1.4;
    const w = Math.min(Math.max(baseH * aspect, 0.9), 2.6);
    return {
      canvasW: w,
      canvasH: baseH,
      frameW: w + 0.16,
      frameH: baseH + 0.16,
      matW: w + 0.06,
      matH: baseH + 0.06,
    };
  }, [media]);

  // Search highlight
  const isMatch = useMemo(() => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return Boolean(
      media.title?.toLowerCase().includes(q) ||
      media.caption?.toLowerCase().includes(q) ||
      media.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [searchQuery, media]);

  const isSearchActive = Boolean(searchQuery.trim());
  const dimmed = isSearchActive && !isMatch;

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={(e) => { e.stopPropagation(); openViewer(media); }}
    >
      {/* 1. Frame — dark wood bevel */}
      <mesh position={[0, 0, hovered ? 0.06 : 0]}>
        <boxGeometry args={[dims.frameW, dims.frameH, 0.05]} />
        <meshStandardMaterial
          color={isMatch ? '#e11d48' : hovered ? '#0ea5e9' : '#1c1917'}
          roughness={0.35}
          metalness={0.6}
          emissive={isMatch ? '#e11d48' : hovered ? '#0ea5e9' : '#000000'}
          emissiveIntensity={isMatch ? 0.5 : hovered ? 0.3 : 0}
        />
      </mesh>

      {/* 2. White mat board */}
      <mesh position={[0, 0, hovered ? 0.085 : 0.025]}>
        <planeGeometry args={[dims.matW, dims.matH]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>

      {/* 3. Photo canvas */}
      <mesh position={[0, 0, hovered ? 0.09 : 0.03]}>
        <planeGeometry args={[dims.canvasW, dims.canvasH]} />
        <meshBasicMaterial
          map={texture}
          transparent={dimmed}
          opacity={dimmed ? 0.2 : 1.0}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* 4. Video play badge */}
      {isVideo && (
        <group position={[0, 0, hovered ? 0.1 : 0.04]}>
          <Html transform center distanceFactor={3.5}>
            <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xl">
              <Play className="w-4 h-4 fill-white ml-0.5" />
            </div>
          </Html>
        </group>
      )}

      {/* 5. Title plaque on hover */}
      {(hovered || isMatch) && (
        <group position={[0, -dims.frameH / 2 - 0.2, 0.05]}>
          <Html transform center distanceFactor={3.5}>
            <div className="bg-obsidian-950/90 text-white px-3 py-1.5 rounded-xl border border-white/20 shadow-2xl backdrop-blur-md text-center max-w-[200px] pointer-events-none select-none">
              <div className="text-[10px] font-extrabold truncate">{media.title || 'Memory'}</div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                {media.createdBy?.name || 'Partner'}
              </div>
            </div>
          </Html>
        </group>
      )}

      {/* 6. Dedicated spot light for this artwork */}
      <spotLight
        position={[0, 1.5, 0.8]}
        angle={0.5}
        penumbra={0.6}
        intensity={isMatch ? 4 : hovered ? 2.5 : 1.2}
        color={isMatch ? '#fb7185' : '#fffbeb'}
      />
    </group>
  );
};
