import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import { useTexture, Html } from '@react-three/drei';
import { Play, Clock } from 'lucide-react';
import { MediaItem } from '../../types/index.js';
import { useMediaStore } from '../../store/mediaStore.js';

interface MountedMediaFrameProps {
  media: MediaItem;
  position: [number, number, number];
  rotation: [number, number, number];
  searchQuery?: string;
  onFrameClick?: (media: MediaItem, pos: [number, number, number]) => void;
}

export const MountedMediaFrame: React.FC<MountedMediaFrameProps> = ({
  media,
  position,
  rotation,
  searchQuery = '',
  onFrameClick,
}) => {
  const { openViewer } = useMediaStore();
  const [hovered, setHovered] = useState(false);

  // Cloudinary optimized image texture
  const textureUrl = media.thumbnailUrl || media.optimizedUrl || media.secureUrl;
  
  const texture = useTexture(textureUrl, (tx) => {
    if (tx instanceof THREE.Texture) {
      tx.colorSpace = THREE.SRGBColorSpace;
      tx.needsUpdate = true;
    }
  });

  const isVideo = media.mimeType?.startsWith('video') || media.tags?.includes('video');

  // Dynamic aspect ratio calculation preserving native proportions without cropping
  const { frameWidth, frameHeight, matWidth, matHeight } = useMemo(() => {
    let aspect = 1;
    if (media.width && media.height && media.height > 0) {
      aspect = media.width / media.height;
    } else if (media.aspectRatio) {
      aspect = media.aspectRatio;
    }

    const baseH = 1.6;
    const computedW = Math.min(Math.max(baseH * aspect, 1.1), 3.0);
    
    // Matting board is 0.15m wider than the canvas
    return {
      frameWidth: computedW + 0.24,
      frameHeight: baseH + 0.24,
      matWidth: computedW + 0.08,
      matHeight: baseH + 0.08,
    };
  }, [media]);

  // Search match evaluation
  const isSearchMatch = useMemo(() => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return Boolean(
      media.title?.toLowerCase().includes(q) ||
      media.caption?.toLowerCase().includes(q) ||
      media.tags?.some((t) => t.toLowerCase().includes(q)) ||
      (media.createdBy?.name || (media.owner as any)?.name)?.toLowerCase().includes(q)
    );
  }, [searchQuery, media]);

  const isSearchActive = Boolean(searchQuery.trim());
  const opacity = isSearchActive ? (isSearchMatch ? 1.0 : 0.2) : 1.0;

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onFrameClick) {
      onFrameClick(media, position);
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
      {/* 1. Outer Frame Molding (Realistic dark oak / obsidian bevel) */}
      <mesh position={[0, 0, hovered ? 0.08 : 0.02]} castShadow receiveShadow>
        <boxGeometry args={[frameWidth, frameHeight, 0.06]} />
        <meshStandardMaterial
          color={isSearchMatch ? '#e11d48' : hovered ? '#0284c7' : '#1e293b'}
          roughness={0.3}
          metalness={0.7}
          emissive={isSearchMatch ? '#e11d48' : hovered ? '#0284c7' : '#000000'}
          emissiveIntensity={isSearchMatch ? 0.6 : hovered ? 0.3 : 0}
        />
      </mesh>

      {/* 2. Inner White Matting Board (Passe-partout) */}
      <mesh position={[0, 0, hovered ? 0.10 : 0.04]}>
        <planeGeometry args={[matWidth, matHeight]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>

      {/* 3. Photo Canvas Plane */}
      <mesh position={[0, 0, hovered ? 0.11 : 0.05]}>
        <planeGeometry args={[matWidth - 0.08, matHeight - 0.08]} />
        <meshBasicMaterial
          map={texture}
          transparent={opacity < 1}
          opacity={opacity}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* 4. Video Duration & Play Badge Overlay */}
      {isVideo && (
        <group position={[0, 0, hovered ? 0.12 : 0.06]}>
          <Html transform center distanceFactor={3.8}>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/30 text-white shadow-xl">
              <Play className="w-3.5 h-3.5 fill-white" />
              {media.duration && (
                <span className="text-[10px] font-mono font-bold flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {Math.round(media.duration)}s
                </span>
              )}
            </div>
          </Html>
        </group>
      )}

      {/* 5. Hover Artwork Plaque / Title Tag */}
      {(hovered || isSearchMatch) && (
        <group position={[0, -frameHeight / 2 - 0.22, 0.1]}>
          <Html transform center distanceFactor={4}>
            <div className="bg-obsidian-950/95 border border-white/20 text-white px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-xl text-center max-w-[220px] pointer-events-none select-none">
              <div className="text-xs font-extrabold text-white truncate">{media.title || 'Untitled Memory'}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {media.createdBy?.name || 'Partner'} • {new Date(media.memoryDate || media.createdAt).toLocaleDateString()}
              </div>
            </div>
          </Html>
        </group>
      )}

      {/* 6. Individual Overhead Spotlight pointing down at the frame */}
      <spotLight
        position={[0, 1.6, 1.2]}
        target-position={[0, 0, 0]}
        angle={0.5}
        penumbra={0.6}
        intensity={isSearchMatch ? 4.5 : hovered ? 3.0 : 1.5}
        color={isSearchMatch ? '#fb7185' : '#fffbeb'}
        castShadow
      />
    </group>
  );
};
