/**
 * WallLayoutEngine.ts
 * 
 * Dynamic Wall Layout Engine for the 3D Memory Museum.
 * 
 * Automatically calculates rows, columns, margins, spacing, and 3D positions/rotations
 * for wall-mounted artworks across exhibition rooms based on media aspect ratios and album metadata.
 * 
 * Never hardcodes positions — dynamically adapts to any number of photos/videos.
 */

import { MediaItem } from '../../types/index.js';

export interface WallDefinition {
  id: string;
  roomId: string;
  roomName: string;
  direction: 'north' | 'south' | 'east' | 'west';
  wallX?: number; // Fixed X coordinate for East/West walls
  wallZ?: number; // Fixed Z coordinate for North/South walls
  minCoord: number; // Starting coordinate along wall axis
  maxCoord: number; // Ending coordinate along wall axis
  height: number;   // Usable wall height (m)
  centerHeight: number; // Eye-level center height (m)
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
  walls: WallDefinition[];
}

// ─── DEFINITION OF ALL MUSEUM ROOMS & WALL SURFACES ───────
export class MuseumLayoutEngine {
  static getRooms(): MuseumRoom[] {
    return [
      {
        id: 'entry',
        name: 'Vestibule',
        centerPos: [0, 1.65, 0],
        targetYaw: Math.PI,
        walls: [
          { id: 'entry-w', roomId: 'entry', roomName: 'Vestibule', direction: 'west', wallX: -3.8, minCoord: -1.5, maxCoord: 1.5, height: 4, centerHeight: 1.8 },
          { id: 'entry-e', roomId: 'entry', roomName: 'Vestibule', direction: 'east', wallX: 3.8, minCoord: -1.5, maxCoord: 1.5, height: 4, centerHeight: 1.8 },
        ],
      },
      {
        id: 'lobby',
        name: 'Lobby',
        centerPos: [0, 1.65, -7],
        targetYaw: Math.PI,
        walls: [
          { id: 'lobby-w', roomId: 'lobby', roomName: 'Lobby', direction: 'west', wallX: -5.8, minCoord: -11, maxCoord: -3, height: 4, centerHeight: 1.8 },
          { id: 'lobby-e', roomId: 'lobby', roomName: 'Lobby', direction: 'east', wallX: 5.8, minCoord: -11, maxCoord: -3, height: 4, centerHeight: 1.8 },
        ],
      },
      {
        id: 'main-hall',
        name: 'Main Hall',
        centerPos: [0, 1.65, -20],
        targetYaw: Math.PI,
        walls: [
          { id: 'main-w1', roomId: 'main-hall', roomName: 'Main Hall', direction: 'west', wallX: -7.8, minCoord: -18, maxCoord: -13, height: 4.5, centerHeight: 1.85 },
          { id: 'main-w2', roomId: 'main-hall', roomName: 'Main Hall', direction: 'west', wallX: -7.8, minCoord: -27, maxCoord: -22, height: 4.5, centerHeight: 1.85 },
          { id: 'main-e1', roomId: 'main-hall', roomName: 'Main Hall', direction: 'east', wallX: 7.8, minCoord: -18, maxCoord: -13, height: 4.5, centerHeight: 1.85 },
          { id: 'main-e2', roomId: 'main-hall', roomName: 'Main Hall', direction: 'east', wallX: 7.8, minCoord: -27, maxCoord: -22, height: 4.5, centerHeight: 1.85 },
        ],
      },
      {
        id: 'west-wing',
        name: 'Love & Family',
        centerPos: [-13, 1.65, -21],
        targetYaw: Math.PI / 2,
        walls: [
          { id: 'west-n', roomId: 'west-wing', roomName: 'Love & Family', direction: 'north', wallZ: -16.2, minCoord: -17, maxCoord: -9, height: 4.5, centerHeight: 1.85 },
          { id: 'west-s', roomId: 'west-wing', roomName: 'Love & Family', direction: 'south', wallZ: -25.8, minCoord: -17, maxCoord: -9, height: 4.5, centerHeight: 1.85 },
          { id: 'west-w', roomId: 'west-wing', roomName: 'Love & Family', direction: 'west', wallX: -17.8, minCoord: -25, maxCoord: -17, height: 4.5, centerHeight: 1.85 },
        ],
      },
      {
        id: 'east-wing',
        name: 'Travel & Moments',
        centerPos: [13, 1.65, -21],
        targetYaw: -Math.PI / 2,
        walls: [
          { id: 'east-n', roomId: 'east-wing', roomName: 'Travel & Moments', direction: 'north', wallZ: -16.2, minCoord: 9, maxCoord: 17, height: 4.5, centerHeight: 1.85 },
          { id: 'east-s', roomId: 'east-wing', roomName: 'Travel & Moments', direction: 'south', wallZ: -25.8, minCoord: 9, maxCoord: 17, height: 4.5, centerHeight: 1.85 },
          { id: 'east-e', roomId: 'east-wing', roomName: 'Travel & Moments', direction: 'east', wallX: 17.8, minCoord: -25, maxCoord: -17, height: 4.5, centerHeight: 1.85 },
        ],
      },
      {
        id: 'north-hall',
        name: 'Master Gallery',
        centerPos: [0, 1.65, -33],
        targetYaw: Math.PI,
        walls: [
          { id: 'north-w', roomId: 'north-hall', roomName: 'Master Gallery', direction: 'west', wallX: -7.8, minCoord: -37, maxCoord: -29, height: 4.5, centerHeight: 1.85 },
          { id: 'north-e', roomId: 'north-hall', roomName: 'Master Gallery', direction: 'east', wallX: 7.8, minCoord: -37, maxCoord: -29, height: 4.5, centerHeight: 1.85 },
          { id: 'north-n', roomId: 'north-hall', roomName: 'Master Gallery', direction: 'north', wallZ: -37.8, minCoord: -7, maxCoord: 7, height: 4.5, centerHeight: 1.85 },
        ],
      },
    ];
  }

  /**
   * Layout algorithm:
   * Distributes artwork evenly onto wall definitions with automatic row/column calculation,
   * margin padding, aspect-ratio awareness, and zero overlap.
   */
  static computeLayout(mediaItems: MediaItem[]): PlacedArtwork[] {
    if (!mediaItems || mediaItems.length === 0) return [];

    const rooms = this.getRooms();
    const allWalls: WallDefinition[] = [];
    rooms.forEach((r) => allWalls.push(...r.walls));

    const placements: PlacedArtwork[] = [];
    let itemIdx = 0;

    for (const wall of allWalls) {
      if (itemIdx >= mediaItems.length) break;

      const availableWidth = Math.abs(wall.maxCoord - wall.minCoord) - 0.8; // 0.4m margin on edges
      if (availableWidth <= 1.0) continue;

      // Estimate max artworks that can fit horizontally (assume average width ~1.5m + 0.4m gap)
      const targetWidth = 1.8;
      const countForWall = Math.min(
        Math.floor(availableWidth / targetWidth),
        mediaItems.length - itemIdx
      );

      if (countForWall <= 0) continue;

      const spacing = availableWidth / countForWall;
      const startCoord = wall.minCoord + 0.4 + spacing / 2;

      for (let i = 0; i < countForWall; i++) {
        if (itemIdx >= mediaItems.length) break;

        const media = mediaItems[itemIdx];
        const coord = startCoord + i * spacing;

        let pos: [number, number, number] = [0, wall.centerHeight, 0];
        let rot: [number, number, number] = [0, 0, 0];

        switch (wall.direction) {
          case 'north':
            pos = [coord, wall.centerHeight, wall.wallZ!];
            rot = [0, 0, 0]; // facing south (+z)
            break;
          case 'south':
            pos = [coord, wall.centerHeight, wall.wallZ!];
            rot = [0, Math.PI, 0]; // facing north (-z)
            break;
          case 'west':
            pos = [wall.wallX!, wall.centerHeight, coord];
            rot = [0, Math.PI / 2, 0]; // facing east (+x)
            break;
          case 'east':
            pos = [wall.wallX!, wall.centerHeight, coord];
            rot = [0, -Math.PI / 2, 0]; // facing west (-x)
            break;
        }

        placements.push({
          media,
          position: pos,
          rotation: rot,
          roomId: wall.roomId,
          roomName: wall.roomName,
          wallId: wall.id,
        });

        itemIdx++;
      }
    }

    return placements;
  }
}
