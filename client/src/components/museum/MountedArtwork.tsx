/**
 * MountedArtwork.tsx
 * 
 * Clean Modern Wall-Mounted Artwork Component.
 * - Pure framed artwork ONLY (zero text plaques or floating labels).
 * - Anisotropic texture filtering for crystal-clear photo rendering from all angles.
 * - Layered depth hierarchy preventing z-fighting & wall clipping.
 * - Smooth frame scale & spotlight hover physics.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Play } from 'lucide-react';
import { MediaItem } from '../../types/index.js';
import { useMediaStore } from '../../store/mediaStore.js';

interface MountedArtworkProps {
  media: MediaItem;
  position: [number, number, number];
  rotation: [number, number, number];
  searchQuery?: string;
  onSelectArtwork?: (media: MediaItem, position: [number, number, number], rotation: [number, number, number]) => void;
}

const MountedArtworkImpl: React.FC<MountedArtworkProps> = ({
  media,
  position,
  rotation,
  searchQuery = '',
  onSelectArtwork,
}) => {
  const { openViewer } = useMediaStore();
  const [hovered, setHovered] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  const groupRef = useRef<THREE.Group>(null);
  const currentScale = useRef(1);
  const currentZOffset = useRef(0);
  const spotlightRef = useRef<THREE.SpotLight>(null);

  // Prioritize high-resolution original image for crystal sharpness
  const textureUrl = media.secureUrl || (media as any).url || media.optimizedUrl || media.thumbnailUrl;

  useEffect(() => {
    let isMounted = true;
    if (!textureUrl) return;

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    loader.load(
      textureUrl,
      (tx) => {
        if (isMounted) {
          tx.colorSpace = THREE.SRGBColorSpace;
          tx.anisotropy = 8;
          tx.minFilter = THREE.LinearMipmapLinearFilter;
          tx.magFilter = THREE.LinearFilter;
          tx.needsUpdate = true;
          setTexture(tx);
        }
      },
      undefined,
      () => {
        if (isMounted && media.thumbnailUrl && media.thumbnailUrl !== textureUrl) {
          loader.load(media.thumbnailUrl, (tx2) => {
            if (isMounted) {
              tx2.colorSpace = THREE.SRGBColorSpace;
              tx2.anisotropy = 4;
              tx2.needsUpdate = true;
              setTexture(tx2);
            }
          });
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [textureUrl, media.thumbnailUrl]);

  useEffect(() => {
    return () => {
      if (texture) {
        texture.dispose();
      }
    };
  }, [texture]);

  const isVideo = Boolean(media.mimeType?.startsWith('video') || (media as any).type === 'video');

  const dims = useMemo(() => {
    let aspect = 1.33;
    if (media.width && media.height && media.height > 0) {
      aspect = media.width / media.height;
    } else if (media.aspectRatio) {
      aspect = media.aspectRatio;
    }

    const baseH = 1.4;
    const w = Math.min(Math.max(baseH * aspect, 0.9), 2.2);
    const h = baseH;

    return {
      canvasW: w,
      canvasH: h,
      matW: w + 0.14,
      matH: h + 0.14,
      frameW: w + 0.24,
      frameH: h + 0.24,
      frameDepth: 0.05,
    };
  }, [media]);

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
    const targetScale = hovered ? 1.04 : 1.0;
    const targetZ = hovered ? 0.04 : 0.0;
    const lerpSpeed = Math.min(delta * 10, 0.3);

    currentScale.current += (targetScale - currentScale.current) * lerpSpeed;
    currentZOffset.current += (targetZ - currentZOffset.current) * lerpSpeed;

    if (groupRef.current) {
      groupRef.current.scale.setScalar(currentScale.current);
    }

    if (spotlightRef.current) {
      const targetIntensity = isMatch ? 3.5 : hovered ? 2.5 : 1.2;
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
        {/* 1. Wall Shadow Plate */}
        <mesh position={[0, 0, -0.005]}>
          <planeGeometry args={[dims.frameW + 0.06, dims.frameH + 0.06]} />
          <meshBasicMaterial color="#000000" transparent opacity={hovered ? 0.4 : 0.2} />
        </mesh>

        {/* 2. Premium Dark Wood Frame */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[dims.frameW, dims.frameH, dims.frameDepth]} />
          <meshStandardMaterial
            color={isMatch ? '#e11d48' : hovered ? '#0284c7' : '#1e1b18'}
            roughness={0.35}
            metalness={0.3}
            emissive={isMatch ? '#f43f5e' : hovered ? '#38bdf8' : '#000000'}
            emissiveIntensity={isMatch ? 0.4 : hovered ? 0.25 : 0}
          />
        </mesh>

        {/* 3. Inner Wood Bevel */}
        <mesh position={[0, 0, 0.012]}>
          <boxGeometry args={[dims.matW + 0.03, dims.matH + 0.03, 0.03]} />
          <meshStandardMaterial color="#382119" roughness={0.5} metalness={0.2} />
        </mesh>

        {/* 4. White Mat Board */}
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[dims.matW, dims.matH]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.9} metalness={0.0} />
        </mesh>

        {/* 5. Photo Canvas */}
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[dims.canvasW, dims.canvasH]} />
          {texture ? (
            <meshBasicMaterial
              map={texture}
              transparent={dimmed}
              opacity={dimmed ? 0.25 : 1.0}
              side={THREE.DoubleSide}
            />
          ) : (
            <meshStandardMaterial
              color="#334155"
              roughness={0.5}
              metalness={0.2}
              side={THREE.DoubleSide}
            />
          )}
        </mesh>

        {/* 6. Glass Sheet */}
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[dims.canvasW, dims.canvasH]} />
          <meshPhysicalMaterial
            transparent
            opacity={0.12}
            roughness={0.1}
            metalness={0.9}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            color="#ffffff"
          />
        </mesh>

        {/* 7. Video Badge */}
        {isVideo && (
          <group position={[0, 0, 0.045]}>
            <Html transform center distanceFactor={3.2}>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-obsidian-950/85 backdrop-blur-md border border-white/30 text-white shadow-xl pointer-events-none select-none">
                <div className="w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center">
                  <Play className="w-2 h-2 fill-white ml-0.5" />
                </div>
                <span className="text-[8px] font-mono font-bold tracking-wider">
                  {media.duration ? `${Math.floor(media.duration / 60)}:${String(Math.floor(media.duration % 60)).padStart(2, '0')}` : 'VIDEO'}
                </span>
              </div>
            </Html>
          </group>
        )}
      </group>

      {/* 8. Focused Artwork Spotlight */}
      <spotLight
        ref={spotlightRef}
        position={[0, 1.2, 0.6]}
        target-position={[0, 0, 0]}
        angle={0.4}
        penumbra={0.7}
        intensity={isMatch ? 3.5 : 1.2}
        color={isMatch ? '#fb7185' : '#fffbeb'}
      />
    </group>
  );
};

export const MountedArtwork = React.memo(MountedArtworkImpl);
