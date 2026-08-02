/**
 * WallLayoutEngine.ts
 * 
 * Dynamic Wall Layout Engine for "Afzal ❤️ Amrin" Memory Museum.
 * Features:
 * - Default spawn location: "Love Gallery (Center)" facing feature wall at z=4.5
 * - Navigation sequence: Love Gallery (Center) -> Love Gallery (End) -> Travel Gallery -> Family Gallery -> Master Gallery
 * - Dynamic hall depth scaling matched to media count
 */

import { MediaItem } from '../../types/index.js';

export interface WallDefinition {
  id: string;
  roomId: string;
  roomName: string;
  direction: 'north' | 'south' | 'east' | 'west';
  wallX?: number;
  wallZ?: number;
  startCoord: number;
  endCoord: number;
  centerHeight: number;
}

export interface PlacedArtwork {
  media: MediaItem;
  position: [number, number, number];
  rotation: [number, number, number];
  roomId: string;
  roomName: string;
  wallId: string;
}

export interface MuseumRoom {
  id: string;
  name: string;
  centerPos: [number, number, number];
  targetYaw: number;
}

export class MuseumLayoutEngine {
  static getHallDepth(mediaCount: number): number {
    const validCount = Math.max(1, mediaCount);
    const itemsPerSide = Math.ceil(validCount / 2);
    const footprint = 1.6;
    const computedSpan = itemsPerSide * footprint;
    return Math.max(22, Math.min(computedSpan + 6, 60));
  }

  static getRooms(mediaCount: number = 18): MuseumRoom[] {
    const depth = this.getHallDepth(mediaCount);
    const endZ = -depth + 4;

    return [
      { id: 'hall-2', name: 'Love Gallery (Center)', centerPos: [0, 1.65, -2.5], targetYaw: Math.PI },
      { id: 'hall-3', name: 'Love Gallery (End)', centerPos: [0, 1.65, endZ * 0.4], targetYaw: Math.PI },
      { id: 'travel-gallery', name: 'Travel Gallery', centerPos: [0, 1.65, endZ * 0.65], targetYaw: Math.PI },
      { id: 'family-gallery', name: 'Family Gallery', centerPos: [0, 1.65, endZ * 0.85], targetYaw: Math.PI },
      { id: 'master-gallery', name: 'Master Gallery', centerPos: [0, 1.65, endZ], targetYaw: Math.PI },
    ];
  }

  static getCleanWalls(): WallDefinition[] {
    return [
      { id: 'grand-w', roomId: 'hall-2', roomName: 'Love Gallery', direction: 'west', wallX: -7.8, startCoord: 3.5, endCoord: -46.0, centerHeight: 1.85 },
      { id: 'grand-e', roomId: 'hall-2', roomName: 'Love Gallery', direction: 'east', wallX: 7.8, startCoord: 3.5, endCoord: -46.0, centerHeight: 1.85 },
      { id: 'grand-n', roomId: 'master-gallery', roomName: 'Master Gallery', direction: 'north', wallZ: -49.3, startCoord: -6.5, endCoord: 6.5, centerHeight: 1.85 },
    ];
  }

  static computeLayout(mediaItems: MediaItem[]): { placements: PlacedArtwork[]; hallDepth: number } {
    if (!mediaItems || mediaItems.length === 0) return { placements: [], hallDepth: 22 };

    const validItems = mediaItems.filter((item) => Boolean(item.secureUrl || (item as any).url || item.thumbnailUrl || item.optimizedUrl));
    if (validItems.length === 0) return { placements: [], hallDepth: 22 };

    const hallDepth = this.getHallDepth(validItems.length);
    const startZ = 2.0;
    const endZ = -hallDepth + 4.5;
    const WALL_OFFSET = 0.06;

    const itemsPerSide = Math.max(1, Math.ceil(validItems.length / 2));
    const targetSpan = Math.min(itemsPerSide * 2.2, 45);
    const footprint = Math.max(1.3, Math.min(2.4, targetSpan / itemsPerSide));

    const placements: PlacedArtwork[] = [];

    const leftSlots: { pos: [number, number, number]; rot: [number, number, number] }[] = [];
    const rightSlots: { pos: [number, number, number]; rot: [number, number, number] }[] = [];
    const rearSlots: { pos: [number, number, number]; rot: [number, number, number] }[] = [];

    for (let z = startZ; z >= startZ - targetSpan; z -= footprint) {
      leftSlots.push({
        pos: [-7.8 + WALL_OFFSET, 1.85, z],
        rot: [0, Math.PI / 2, 0],
      });
      rightSlots.push({
        pos: [7.8 - WALL_OFFSET, 1.85, z],
        rot: [0, -Math.PI / 2, 0],
      });
    }

    for (let x = -5.0; x <= 5.0; x += 1.8) {
      rearSlots.push({
        pos: [x, 1.85, endZ - 0.5 + WALL_OFFSET],
        rot: [0, 0, 0],
      });
    }

    let leftIdx = 0;
    let rightIdx = 0;
    let rearIdx = 0;

    for (let i = 0; i < validItems.length; i++) {
      const media = validItems[i];
      let slot: { pos: [number, number, number]; rot: [number, number, number] } | null = null;
      let roomId = 'hall-2';

      if (i % 2 === 0 && leftIdx < leftSlots.length) {
        slot = leftSlots[leftIdx++];
      } else if (rightIdx < rightSlots.length) {
        slot = rightSlots[rightIdx++];
      } else if (leftIdx < leftSlots.length) {
        slot = leftSlots[leftIdx++];
      } else if (rearIdx < rearSlots.length) {
        slot = rearSlots[rearIdx++];
        roomId = 'master-gallery';
      }

      if (!slot) break;

      if (slot.pos[2] < endZ + 4) {
        roomId = 'master-gallery';
      } else if (slot.pos[2] < endZ * 0.6) {
        roomId = 'family-gallery';
      } else if (slot.pos[2] < endZ * 0.35) {
        roomId = 'travel-gallery';
      } else if (slot.pos[2] < -10) {
        roomId = 'hall-3';
      }

      placements.push({
        media,
        position: slot.pos,
        rotation: slot.rot,
        roomId,
        roomName: 'Love Gallery',
        wallId: slot.pos[0] < 0 ? 'grand-w' : slot.pos[0] > 0 ? 'grand-e' : 'grand-n',
      });
    }

    return { placements, hallDepth };
  }
}
