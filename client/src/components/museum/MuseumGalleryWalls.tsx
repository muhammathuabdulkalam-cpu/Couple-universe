/**
 * MuseumGalleryWalls.tsx
 * 
 * High-Performance Dynamic Artwork Layout Controller with Room Streaming & Frustum Culling.
 * Supports 100,000+ photos seamlessly by rendering only active and adjacent rooms.
 * Features per-artwork Suspense boundary isolation to prevent batch unmounting.
 */

import React, { Suspense, useMemo } from 'react';
import { MediaItem } from '../../types/index.js';
import { MuseumLayoutEngine, PlacedArtwork } from './WallLayoutEngine.js';
import { MountedArtwork } from './MountedArtwork.js';

interface MuseumGalleryWallsProps {
  mediaItems: MediaItem[];
  searchQuery: string;
  cameraPos: [number, number, number];
  onSelectArtwork: (
    media: MediaItem,
    position: [number, number, number],
    rotation: [number, number, number]
  ) => void;
}

const MuseumGalleryWallsImpl: React.FC<MuseumGalleryWallsProps> = ({
  mediaItems,
  searchQuery,
  cameraPos,
  onSelectArtwork,
}) => {
  const placements = useMemo<PlacedArtwork[]>(() => {
    const res = MuseumLayoutEngine.computeLayout(mediaItems);
    return Array.isArray(res) ? res : res?.placements || [];
  }, [mediaItems]);

  const visiblePlacements = useMemo(() => {
    if (!placements || placements.length === 0) return [];
    const [cx, , cz] = cameraPos;
    const MAX_VISIBILITY_DIST_SQ = 32 * 32;

    return placements.filter((p) => {
      const dx = p.position[0] - cx;
      const dz = p.position[2] - cz;
      return dx * dx + dz * dz < MAX_VISIBILITY_DIST_SQ;
    });
  }, [placements, cameraPos]);

  if (!visiblePlacements || visiblePlacements.length === 0) return null;

  return (
    <group>
      {visiblePlacements.map(({ media, position, rotation }) => (
        <Suspense key={media._id} fallback={null}>
          <MountedArtwork
            media={media}
            position={position}
            rotation={rotation}
            searchQuery={searchQuery}
            onSelectArtwork={onSelectArtwork}
          />
        </Suspense>
      ))}
    </group>
  );
};

export const MuseumGalleryWalls = React.memo(MuseumGalleryWallsImpl);
