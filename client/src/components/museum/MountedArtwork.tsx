/**
 * MountedArtwork.tsx
 * 
 * Premium Wall-Mounted Artwork for 3D Memory Museum.
 * Features:
 * - Premium oak wood frame with dark bevel
 * - Crisp white museum mat board
 * - Realistic glass reflection layer
 * - Museum plaque with title, capture date, album, location & favorite heart
 * - Aspect ratio preservation (portrait, landscape, square)
 * - Cloudinary thumbnailUrl texture (lightweight)
 * - Video play badge & duration overlay
 * - Smooth hover physics (scale, Z-translation off wall, spotlight intensity)
 * - Search/Filter highlighting & dimming
 * - Camera fly-to on click before opening existing MediaViewerModal
 */

import React, { useState, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useTexture, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Play, Heart, MapPin, Calendar, Film } from 'lucide-react';
import { MediaItem } from '../../types/index.js';
import { useMediaStore } from '../../store/mediaStore.js';

interface MountedArtworkProps {
  media: MediaItem;
  position: [number, number, number];
  rotation: [number, number, number];
  searchQuery?: string;
  onSelectArtwork?: (media: MediaItem, position: [number, number, number], rotation: [number, number, number]) => void;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Memory';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Memory';
  }
}

export const MountedArtwork: React.FC<MountedArtworkProps> = ({
  media,
  position,
  rotation,
  searchQuery = '',
  onSelectArtwork,
}) => {
  const { openViewer } = useMediaStore();
  const [hovered, setHovered] = useState(false);

  const groupRef = useRef<THREE.Group>(null);
  const currentScale = useRef(1);
  const currentZOffset = useRef(0);
  const spotlightRef = useRef<THREE.SpotLight>(null);

  // Texture URL selection — strictly use lightweight thumbnails inside 3D canvas
  const textureUrl = media.thumbnailUrl || media.optimizedUrl || media.secureUrl;

  const texture = useTexture(textureUrl, (tx) => {
    if (tx instanceof THREE.Texture) {
      tx.colorSpace = THREE.SRGBColorSpace;
      tx.needsUpdate = true;
    }
  });

  const isVideo = Boolean(media.mimeType?.startsWith('video') || (media as any).type === 'video');

  // Dynamic aspect ratio calculation to prevent any image cropping
  const dims = useMemo(() => {
    let aspect = 1;
    if (media.width && media.height && media.height > 0) {
      aspect = media.width / media.height;
    } else if (media.aspectRatio) {
      aspect = media.aspectRatio;
    }

    const baseH = 1.35;
    const w = Math.min(Math.max(baseH * aspect, 0.85), 2.5);
    const h = baseH;

    return {
      canvasW: w,
      canvasH: h,
      matW: w + 0.16,
      matH: h + 0.16,
      frameW: w + 0.28,
      frameH: h + 0.28,
      frameDepth: 0.06,
    };
  }, [media]);

  const formattedDate = useMemo(() => formatDate(media.memoryDate || media.takenAt), [media]);

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

  useFrame((_, delta) => {
    const targetScale = hovered ? 1.03 : 1.0;
    const targetZ = hovered ? 0.06 : 0.0;
    const lerpSpeed = Math.min(delta * 10, 0.3);

    currentScale.current += (targetScale - currentScale.current) * lerpSpeed;
    currentZOffset.current += (targetZ - currentZOffset.current) * lerpSpeed;

    if (groupRef.current) {
      groupRef.current.scale.setScalar(currentScale.current);
    }

    if (spotlightRef.current) {
      const targetIntensity = isMatch ? 4.5 : hovered ? 3.0 : 1.4;
      spotlightRef.current.intensity += (targetIntensity - spotlightRef.current.intensity) * lerpSpeed;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onSelectArtwork) {
      onSelectArtwork(media, position, rotation);
    } else {
      openViewer(media);
    }
  };

  const locationName = typeof media.location === 'string' ? media.location : media.location?.name;

  return (
    <group position={position} rotation={rotation}>
      <group
        ref={groupRef}
        position={[0, 0, currentZOffset.current]}
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
        {/* 1. Wall Shadow */}
        <mesh position={[0, -0.05, -0.01]}>
          <planeGeometry args={[dims.frameW + 0.1, dims.frameH + 0.3]} />
          <meshBasicMaterial color="#000000" transparent opacity={hovered ? 0.45 : 0.25} />
        </mesh>

        {/* 2. Oak Outer Frame */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[dims.frameW, dims.frameH, dims.frameDepth]} />
          <meshStandardMaterial
            color={isMatch ? '#e11d48' : hovered ? '#0284c7' : '#271c19'}
            roughness={0.4}
            metalness={0.3}
            emissive={isMatch ? '#f43f5e' : hovered ? '#38bdf8' : '#000000'}
            emissiveIntensity={isMatch ? 0.4 : hovered ? 0.25 : 0}
          />
        </mesh>

        {/* 3. Beveled Inner Wood Trim */}
        <mesh position={[0, 0, 0.015]}>
          <boxGeometry args={[dims.matW + 0.04, dims.matH + 0.04, 0.04]} />
          <meshStandardMaterial color="#451a03" roughness={0.6} metalness={0.2} />
        </mesh>

        {/* 4. White Museum Mat Board */}
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[dims.matW, dims.matH]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.92} metalness={0.0} />
        </mesh>

        {/* 5. Photo Canvas */}
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[dims.canvasW, dims.canvasH]} />
          <meshBasicMaterial
            map={texture}
            transparent={dimmed}
            opacity={dimmed ? 0.25 : 1.0}
            side={THREE.FrontSide}
          />
        </mesh>

        {/* 6. Protective Glass Sheet */}
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[dims.canvasW, dims.canvasH]} />
          <meshPhysicalMaterial
            transparent
            opacity={0.15}
            roughness={0.1}
            metalness={0.9}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            color="#ffffff"
          />
        </mesh>

        {/* 7. Video Badge Overlay */}
        {isVideo && (
          <group position={[0, 0, 0.05]}>
            <Html transform center distanceFactor={3.2}>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-obsidian-950/80 backdrop-blur-md border border-white/30 text-white shadow-xl pointer-events-none select-none">
                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                  <Play className="w-3 h-3 fill-white ml-0.5" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider">
                  {media.duration ? `${Math.floor(media.duration / 60)}:${String(Math.floor(media.duration % 60)).padStart(2, '0')}` : 'VIDEO'}
                </span>
              </div>
            </Html>
          </group>
        )}

        {/* 8. Museum Plaque Below Frame */}
        <group position={[0, -dims.frameH / 2 - 0.16, 0.02]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[Math.max(dims.frameW * 0.75, 1.0), 0.18, 0.01]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
          </mesh>

          <Html transform center distanceFactor={3.6} position={[0, 0, 0.01]}>
            <div className="w-[220px] bg-slate-900/90 text-white px-3 py-1.5 rounded-lg border border-amber-500/30 shadow-2xl backdrop-blur-md flex items-center justify-between pointer-events-none select-none">
              <div className="min-w-0 flex-1 pr-2">
                <div className="text-[11px] font-extrabold truncate text-amber-100 tracking-tight">
                  {media.title || 'Untitled Memory'}
                </div>
                <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono mt-0.5">
                  <span className="flex items-center gap-0.5">
                    <Calendar className="w-2.5 h-2.5 text-amber-400/80" />
                    {formattedDate}
                  </span>
                  {locationName && (
                    <span className="flex items-center gap-0.5 truncate max-w-[80px]">
                      <MapPin className="w-2.5 h-2.5 text-rose-400" />
                      {locationName}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {media.isFavorite && (
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
                )}
                {isVideo && (
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
            </div>
          </Html>
        </group>
      </group>

      {/* 9. Artwork Spotlight */}
      <spotLight
        ref={spotlightRef}
        position={[0, 1.4, 0.7]}
        target-position={[0, 0, 0]}
        angle={0.45}
        penumbra={0.65}
        intensity={isMatch ? 4.5 : 1.4}
        color={isMatch ? '#fb7185' : '#fffbeb'}
      />
    </group>
  );
};
