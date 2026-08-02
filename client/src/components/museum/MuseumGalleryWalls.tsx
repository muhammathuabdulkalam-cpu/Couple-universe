/**
 * MuseumGalleryWalls.tsx
 * 
 * Main Artwork Layout Controller for Memory Museum.
 * Uses WallLayoutEngine to dynamically place existing media items onto museum walls.
 * Renders MountedArtwork components and handles artwork click fly-to sequences.
 */

import React, { Suspense, useMemo } from 'react';
import { MediaItem } from '../../types/index.js';
import { MuseumLayoutEngine, PlacedArtwork } from './WallLayoutEngine.js';
import { MountedArtwork } from './MountedArtwork.js';

interface MuseumGalleryWallsProps {
  mediaItems: MediaItem[];
  searchQuery: string;
  onSelectArtwork: (
    media: MediaItem,
    position: [number, number, number],
    rotation: [number, number, number]
  ) => void;
}

export const MuseumGalleryWalls: React.FC<MuseumGalleryWallsProps> = ({
  mediaItems,
  searchQuery,
  onSelectArtwork,
}) => {
  const placements = useMemo<PlacedArtwork[]>(() => {
    return MuseumLayoutEngine.computeLayout(mediaItems);
  }, [mediaItems]);

  if (!placements || placements.length === 0) return null;

  return (
    <Suspense fallback={null}>
      {placements.map(({ media, position, rotation }) => (
        <MountedArtwork
          key={media._id}
          media={media}
          position={position}
          rotation={rotation}
          searchQuery={searchQuery}
          onSelectArtwork={onSelectArtwork}
        />
      ))}
    </Suspense>
  );
};
