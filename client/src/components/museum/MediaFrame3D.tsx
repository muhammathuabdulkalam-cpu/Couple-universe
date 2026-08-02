import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import { useTexture, Html } from '@react-three/drei';
import { Play } from 'lucide-react';
import { MediaItem } from '../../types/index.js';
import { useMediaStore } from '../../store/mediaStore.js';

interface MediaFrame3DProps {
  media: MediaItem;
  position: [number, number, number];
  rotation: [number, number, number];
  searchQuery?: string;
  onSelectFrame?: (media: MediaItem, pos: [number, number, number]) => void;
}

export const MediaFrame3D: React.FC<MediaFrame3DProps> = ({
  media,
  position,
  rotation,
  searchQuery = '',
  onSelectFrame,
}) => {
  const { openViewer } = useMediaStore();
  const [hovered, setHovered] = useState(false);

  // Use Cloudinary thumbnail / optimized image for 3D textures
  const textureUrl = media.thumbnailUrl || media.optimizedUrl || media.secureUrl;
  
  // Safe texture loading with suspense or fallback
  const texture = useTexture(textureUrl, (tx) => {
    if (tx instanceof THREE.Texture) {
      tx.colorSpace = THREE.SRGBColorSpace;
      tx.needsUpdate = true;
    }
  });

  const isVideo = media.mimeType?.startsWith('video') || media.tags?.includes('video');

  // Calculate dynamic 3D aspect ratio matching original media dims without cropping
  const { width, height } = useMemo(() => {
    let aspect = 1;
    if (media.width && media.height && media.height > 0) {
      aspect = media.width / media.height;
    } else if (media.aspectRatio) {
      aspect = media.aspectRatio;
    }

    const baseHeight = 1.8;
    const computedWidth = Math.min(Math.max(baseHeight * aspect, 1.2), 3.2);
    return { width: computedWidth, height: baseHeight };
  }, [media]);

  // Search Match Highlighting
  const isSearchMatch = useMemo(() => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    const titleMatch = media.title?.toLowerCase().includes(q);
    const captionMatch = media.caption?.toLowerCase().includes(q);
    const tagMatch = media.tags?.some((t) => t.toLowerCase().includes(q));
    const ownerMatch = (media.createdBy?.name || (media.owner as any)?.name)?.toLowerCase().includes(q);
    return Boolean(titleMatch || captionMatch || tagMatch || ownerMatch);
  }, [searchQuery, media]);

  const isSearchActive = Boolean(searchQuery.trim());
  const opacity = isSearchActive ? (isSearchMatch ? 1.0 : 0.25) : 1.0;

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onSelectFrame) {
      onSelectFrame(media, position);
    }
    openViewer(media);
  };

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onClick={handleClick}
    >
      {/* Outer Metal / Wood Frame Border */}
      <mesh position={[0, 0, -0.04]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.16, height + 0.16, 0.08]} />
        <meshStandardMaterial
          color={isSearchMatch ? '#f43f5e' : hovered ? '#38bdf8' : '#1e293b'}
          metalness={0.8}
          roughness={0.2}
          emissive={isSearchMatch ? '#f43f5e' : hovered ? '#38bdf8' : '#000000'}
          emissiveIntensity={isSearchMatch ? 0.6 : hovered ? 0.4 : 0}
        />
      </mesh>

      {/* Inner Canvas Print Plane */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={texture}
          transparent={opacity < 1}
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Video Indicator Overlay */}
      {isVideo && (
        <group position={[0, 0, 0.03]}>
          <Html transform center distanceFactor={4}>
            <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xl">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </Html>
        </group>
      )}

      {/* Title & Author Info Tag on Hover or Search Highlight */}
      {(hovered || isSearchMatch) && (
        <group position={[0, -height / 2 - 0.25, 0.05]}>
          <Html transform center distanceFactor={4}>
            <div className="bg-obsidian-950/90 text-white px-3 py-1.5 rounded-xl border border-white/20 shadow-2xl backdrop-blur-md text-center max-w-[200px] pointer-events-none select-none">
              <div className="text-xs font-extrabold truncate">{media.title || 'Untitled Memory'}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {media.createdBy?.name || 'Partner'} • {new Date(media.memoryDate || media.createdAt).toLocaleDateString()}
              </div>
            </div>
          </Html>
        </group>
      )}

      {/* Dedicated Wall Spotlight over this artwork */}
      <spotLight
        position={[0, 1.8, 1.2]}
        target-position={[0, 0, 0]}
        angle={0.6}
        penumbra={0.5}
        intensity={isSearchMatch ? 4.0 : hovered ? 2.5 : 1.2}
        color={isSearchMatch ? '#fb7185' : '#ffffff'}
        castShadow={false}
      />
    </group>
  );
};
