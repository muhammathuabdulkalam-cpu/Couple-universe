/**
 * MuseumBuilding.tsx
 * 
 * Phase 1: Pure architectural geometry for the Memory Museum.
 * Renders entrance lobby, reception, main hall, hallways, doorways,
 * white walls, wooden reflective floor, ceiling with track lighting.
 * 
 * No media content — architecture only.
 */
import React from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';

// ─── CONSTANTS ─────────────────────────────────────────
const WALL_COLOR = '#f1f5f9';       // Premium off-white (slate-100)
const WALL_TRIM_COLOR = '#cbd5e1';  // Subtle trim accent (slate-300)
const CEILING_COLOR = '#e2e8f0';    // Soft warm ceiling (slate-200)
const FLOOR_COLOR = '#78350f';      // Polished walnut wood
const WALL_THICKNESS = 0.2;
const CEILING_HEIGHT = 4.5;

// ─── Wall Helper Component ─────────────────────────────
const Wall: React.FC<{
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
}> = ({ position, size, rotation = [0, 0, 0] }) => (
  <mesh position={position} rotation={rotation} castShadow receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={WALL_COLOR} roughness={0.75} metalness={0.05} />
  </mesh>
);

// ─── Baseboard / Wall Trim ─────────────────────────────
const Baseboard: React.FC<{
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
}> = ({ position, size, rotation = [0, 0, 0] }) => (
  <mesh position={position} rotation={rotation}>
    <boxGeometry args={size} />
    <meshStandardMaterial color={WALL_TRIM_COLOR} roughness={0.5} metalness={0.1} />
  </mesh>
);

// ─── Ceiling Tile ──────────────────────────────────────
const CeilingPanel: React.FC<{
  position: [number, number, number];
  size: [number, number];
}> = ({ position, size }) => (
  <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
    <planeGeometry args={size} />
    <meshStandardMaterial color={CEILING_COLOR} roughness={0.85} side={2} />
  </mesh>
);

// ─── Track Light Fixture ───────────────────────────────
const TrackLight: React.FC<{
  position: [number, number, number];
  target?: [number, number, number];
  intensity?: number;
}> = ({ position, target = [position[0], 0, position[2]], intensity = 2.0 }) => (
  <group position={position}>
    {/* Physical light fixture housing */}
    <mesh castShadow>
      <cylinderGeometry args={[0.06, 0.08, 0.15, 8]} />
      <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
    </mesh>
    {/* Actual spotlight */}
    <spotLight
      position={[0, -0.1, 0]}
      target-position={target}
      angle={0.55}
      penumbra={0.7}
      intensity={intensity}
      color="#fffbeb"
      castShadow
      shadow-mapSize-width={256}
      shadow-mapSize-height={256}
    />
  </group>
);

// ─── Track Rail (ceiling-mounted metal rail) ───────────
const TrackRail: React.FC<{
  position: [number, number, number];
  length: number;
  rotation?: [number, number, number];
}> = ({ position, length, rotation = [0, 0, 0] }) => (
  <mesh position={position} rotation={rotation}>
    <boxGeometry args={[length, 0.04, 0.04]} />
    <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.15} />
  </mesh>
);

// ─── Doorway Arch ──────────────────────────────────────
const DoorwayArch: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
}> = ({ position, rotation = [0, 0, 0], width = 2.4, height = 3.2 }) => {
  const frameThickness = 0.08;
  const frameDepth = WALL_THICKNESS + 0.04;
  
  return (
    <group position={position} rotation={rotation}>
      {/* Left door jamb */}
      <mesh position={[-width / 2 - frameThickness / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Right door jamb */}
      <mesh position={[width / 2 + frameThickness / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Top lintel */}
      <mesh position={[0, height + frameThickness / 2, 0]} castShadow>
        <boxGeometry args={[width + frameThickness * 2, frameThickness, frameDepth]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.25} />
      </mesh>
    </group>
  );
};

// ─── Column / Pilaster ─────────────────────────────────
const Column: React.FC<{
  position: [number, number, number];
  height?: number;
}> = ({ position, height = CEILING_HEIGHT }) => (
  <group position={position}>
    {/* Column shaft */}
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.35, height, 0.35]} />
      <meshStandardMaterial color={WALL_COLOR} roughness={0.6} metalness={0.05} />
    </mesh>
    {/* Column base */}
    <mesh position={[0, 0.1, 0]}>
      <boxGeometry args={[0.5, 0.2, 0.5]} />
      <meshStandardMaterial color={WALL_TRIM_COLOR} roughness={0.4} metalness={0.1} />
    </mesh>
    {/* Column capital */}
    <mesh position={[0, height - 0.1, 0]}>
      <boxGeometry args={[0.5, 0.2, 0.5]} />
      <meshStandardMaterial color={WALL_TRIM_COLOR} roughness={0.4} metalness={0.1} />
    </mesh>
  </group>
);


// ═══════════════════════════════════════════════════════
// MAIN MUSEUM BUILDING COMPONENT
// ═══════════════════════════════════════════════════════
export const MuseumBuilding: React.FC = () => {
  /*
   * Floor Plan Layout (top-down view, Z goes deeper into museum):
   * 
   *                    z=-38 ─────────────────── z=-38
   *                    │    NORTH EXHIBITION     │
   *                    │    ROOM (16 x 10)       │
   *                    z=-28 ─── doorway ─────── z=-28
   *                              │
   *  x=-16 ────── x=-8 ──── x=0 ──── x=8 ────── x=16
   *  │  WEST       │                  │   EAST     │
   *  │  ROOM       │                  │   ROOM     │
   *  │ (8 x 10)    │   MAIN HALL      │  (8 x 10)  │
   *  │             │   (16 x 16)      │            │
   *  x=-16 ─── x=-8  doorway    x=8 ─── x=16
   *                   │
   *              z=-12 ──── doorway ──── z=-12
   *                   │  LOBBY (12x10)  │
   *              z=-2 ──── doorway ──── z=-2
   *                   │  ENTRY (8x4)   │
   *              z=2  ─────────────── z=2
   */

  return (
    <group>
      {/* ════════════════════════════════════════════ */}
      {/* 1. POLISHED WOODEN REFLECTIVE FLOOR         */}
      {/* ════════════════════════════════════════════ */}
      <mesh position={[0, 0, -18]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[400, 200]}
          resolution={512}
          mirror={0.35}
          mixBlur={0.6}
          mixStrength={1.0}
          roughness={0.45}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color={FLOOR_COLOR}
          metalness={0.15}
        />
      </mesh>

      {/* ════════════════════════════════════════════ */}
      {/* 2. ENTRY VESTIBULE (z=2 to z=-2)            */}
      {/* ════════════════════════════════════════════ */}
      {/* Back wall (south, entry face) */}
      <Wall position={[0, CEILING_HEIGHT / 2, 2]} size={[8, CEILING_HEIGHT, WALL_THICKNESS]} />
      {/* Left wall */}
      <Wall position={[-4, CEILING_HEIGHT / 2, 0]} size={[WALL_THICKNESS, CEILING_HEIGHT, 4]} />
      {/* Right wall */}
      <Wall position={[4, CEILING_HEIGHT / 2, 0]} size={[WALL_THICKNESS, CEILING_HEIGHT, 4]} />
      {/* Ceiling */}
      <CeilingPanel position={[0, CEILING_HEIGHT, 0]} size={[8, 4]} />
      {/* Entry doorway arch on south wall */}
      <DoorwayArch position={[0, 0, 2]} width={2.0} height={3.0} />
      {/* Baseboards */}
      <Baseboard position={[-3.9, 0.06, 0]} size={[0.06, 0.12, 4]} />
      <Baseboard position={[3.9, 0.06, 0]} size={[0.06, 0.12, 4]} />

      {/* North wall of entry with doorway opening to lobby */}
      {/* Left portion of north entry wall */}
      <Wall position={[-2.7, CEILING_HEIGHT / 2, -2]} size={[2.6, CEILING_HEIGHT, WALL_THICKNESS]} />
      {/* Right portion of north entry wall */}
      <Wall position={[2.7, CEILING_HEIGHT / 2, -2]} size={[2.6, CEILING_HEIGHT, WALL_THICKNESS]} />
      {/* Above doorway */}
      <Wall position={[0, 3.8, -2]} size={[2.8, 1.4, WALL_THICKNESS]} />
      <DoorwayArch position={[0, 0, -2]} width={2.4} height={3.1} />

      {/* Track lighting - entry */}
      <TrackRail position={[0, CEILING_HEIGHT - 0.1, 0]} length={6} />
      <TrackLight position={[0, CEILING_HEIGHT - 0.15, 0]} intensity={1.5} />


      {/* ════════════════════════════════════════════ */}
      {/* 3. LOBBY / RECEPTION (z=-2 to z=-12)        */}
      {/*    Width: 12m (x=-6 to x=6)                 */}
      {/* ════════════════════════════════════════════ */}
      {/* Left wall */}
      <Wall position={[-6, CEILING_HEIGHT / 2, -7]} size={[WALL_THICKNESS, CEILING_HEIGHT, 10]} />
      {/* Right wall */}
      <Wall position={[6, CEILING_HEIGHT / 2, -7]} size={[WALL_THICKNESS, CEILING_HEIGHT, 10]} />
      {/* Ceiling */}
      <CeilingPanel position={[0, CEILING_HEIGHT, -7]} size={[12, 10]} />
      {/* Baseboards along lobby walls */}
      <Baseboard position={[-5.9, 0.06, -7]} size={[0.06, 0.12, 10]} />
      <Baseboard position={[5.9, 0.06, -7]} size={[0.06, 0.12, 10]} />

      {/* Lobby south wall (connects entry → lobby, wider opening) */}
      {/* Left portion */}
      <Wall position={[-4.7, CEILING_HEIGHT / 2, -2]} size={[2.4, CEILING_HEIGHT, WALL_THICKNESS]} />
      {/* Right portion */}
      <Wall position={[4.7, CEILING_HEIGHT / 2, -2]} size={[2.4, CEILING_HEIGHT, WALL_THICKNESS]} />

      {/* Lobby north wall (connects lobby → main hall) */}
      {/* Left portion */}
      <Wall position={[-4.5, CEILING_HEIGHT / 2, -12]} size={[3, CEILING_HEIGHT, WALL_THICKNESS]} />
      {/* Right portion */}
      <Wall position={[4.5, CEILING_HEIGHT / 2, -12]} size={[3, CEILING_HEIGHT, WALL_THICKNESS]} />
      {/* Above doorway */}
      <Wall position={[0, 3.8, -12]} size={[6, 1.4, WALL_THICKNESS]} />
      <DoorwayArch position={[0, 0, -12]} width={3.0} height={3.2} />

      {/* Reception desk (decorative) */}
      <mesh position={[0, 0.5, -4]} castShadow receiveShadow>
        <boxGeometry args={[3.5, 1.0, 0.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.02, -4]}>
        <boxGeometry args={[3.6, 0.04, 0.9]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.4} />
      </mesh>

      {/* Columns flanking lobby-to-hall doorway */}
      <Column position={[-3.2, 0, -12]} />
      <Column position={[3.2, 0, -12]} />

      {/* Track lighting - lobby */}
      <TrackRail position={[0, CEILING_HEIGHT - 0.1, -5]} length={10} />
      <TrackRail position={[0, CEILING_HEIGHT - 0.1, -9]} length={10} />
      <TrackLight position={[-3, CEILING_HEIGHT - 0.15, -5]} intensity={1.8} />
      <TrackLight position={[3, CEILING_HEIGHT - 0.15, -5]} intensity={1.8} />
      <TrackLight position={[0, CEILING_HEIGHT - 0.15, -9]} intensity={2.0} />


      {/* ════════════════════════════════════════════ */}
      {/* 4. MAIN CENTRAL HALL (z=-12 to z=-28)       */}
      {/*    Width: 16m (x=-8 to x=8)                 */}
      {/*    Height: 5m (taller grand hall)            */}
      {/* ════════════════════════════════════════════ */}
      {/* Left wall (north portion, no doorway) */}
      <Wall position={[-8, 2.5, -16]} size={[WALL_THICKNESS, 5, 8]} />
      {/* Left wall (south portion, doorway to west room) */}
      {/* Below doorway */}
      <Wall position={[-8, 2.5, -24]} size={[WALL_THICKNESS, 5, 8]} />

      {/* Right wall (north portion) */}
      <Wall position={[8, 2.5, -16]} size={[WALL_THICKNESS, 5, 8]} />
      {/* Right wall (south portion, doorway to east room) */}
      <Wall position={[8, 2.5, -24]} size={[WALL_THICKNESS, 5, 8]} />

      {/* North wall of main hall */}
      {/* Left portion */}
      <Wall position={[-4.5, 2.5, -28]} size={[7, 5, WALL_THICKNESS]} />
      {/* Right portion */}
      <Wall position={[4.5, 2.5, -28]} size={[7, 5, WALL_THICKNESS]} />
      {/* Above doorway */}
      <Wall position={[0, 4.1, -28]} size={[3, 1.8, WALL_THICKNESS]} />
      <DoorwayArch position={[0, 0, -28]} width={2.8} height={3.2} />

      {/* South wall of main hall (wider opening from lobby) */}
      {/* These are the lobby-side connections, already placed above */}

      {/* Ceiling for main hall (higher) */}
      <CeilingPanel position={[0, 5, -20]} size={[16, 16]} />

      {/* Baseboards */}
      <Baseboard position={[-7.9, 0.06, -20]} size={[0.06, 0.12, 16]} />
      <Baseboard position={[7.9, 0.06, -20]} size={[0.06, 0.12, 16]} />

      {/* Grand columns in main hall */}
      <Column position={[-5, 0, -16]} height={5} />
      <Column position={[5, 0, -16]} height={5} />
      <Column position={[-5, 0, -24]} height={5} />
      <Column position={[5, 0, -24]} height={5} />

      {/* Track lighting - main hall (multiple rails) */}
      <TrackRail position={[-3, 4.85, -15]} length={12} rotation={[0, Math.PI / 2, 0]} />
      <TrackRail position={[3, 4.85, -15]} length={12} rotation={[0, Math.PI / 2, 0]} />
      <TrackRail position={[-3, 4.85, -20]} length={12} rotation={[0, Math.PI / 2, 0]} />
      <TrackRail position={[3, 4.85, -20]} length={12} rotation={[0, Math.PI / 2, 0]} />
      <TrackRail position={[-3, 4.85, -25]} length={12} rotation={[0, Math.PI / 2, 0]} />
      <TrackRail position={[3, 4.85, -25]} length={12} rotation={[0, Math.PI / 2, 0]} />

      <TrackLight position={[-3, 4.8, -15]} intensity={2.2} />
      <TrackLight position={[3, 4.8, -15]} intensity={2.2} />
      <TrackLight position={[-3, 4.8, -20]} intensity={2.5} />
      <TrackLight position={[3, 4.8, -20]} intensity={2.5} />
      <TrackLight position={[0, 4.8, -20]} intensity={2.5} />
      <TrackLight position={[-3, 4.8, -25]} intensity={2.2} />
      <TrackLight position={[3, 4.8, -25]} intensity={2.2} />


      {/* ════════════════════════════════════════════ */}
      {/* 5. NORTH EXHIBITION ROOM (z=-28 to z=-38)   */}
      {/*    Width: 16m (x=-8 to x=8)                 */}
      {/* ════════════════════════════════════════════ */}
      <Wall position={[-8, 2.5, -33]} size={[WALL_THICKNESS, 5, 10]} />
      <Wall position={[8, 2.5, -33]} size={[WALL_THICKNESS, 5, 10]} />
      <Wall position={[0, 2.5, -38]} size={[16, 5, WALL_THICKNESS]} />
      <CeilingPanel position={[0, 5, -33]} size={[16, 10]} />
      <Baseboard position={[-7.9, 0.06, -33]} size={[0.06, 0.12, 10]} />
      <Baseboard position={[7.9, 0.06, -33]} size={[0.06, 0.12, 10]} />
      <TrackRail position={[0, 4.85, -31]} length={14} />
      <TrackRail position={[0, 4.85, -35]} length={14} />
      <TrackLight position={[-4, 4.8, -31]} intensity={2.0} />
      <TrackLight position={[4, 4.8, -31]} intensity={2.0} />
      <TrackLight position={[-4, 4.8, -35]} intensity={2.0} />
      <TrackLight position={[4, 4.8, -35]} intensity={2.0} />


      {/* ════════════════════════════════════════════ */}
      {/* 6. WEST EXHIBITION WING (x=-8 to x=-18)     */}
      {/*    z=-16 to z=-26                            */}
      {/* ════════════════════════════════════════════ */}
      {/* North wall */}
      <Wall position={[-13, 2.5, -16]} size={[10, 5, WALL_THICKNESS]} />
      {/* South wall */}
      <Wall position={[-13, 2.5, -26]} size={[10, 5, WALL_THICKNESS]} />
      {/* West wall (far end) */}
      <Wall position={[-18, 2.5, -21]} size={[WALL_THICKNESS, 5, 10]} />
      <CeilingPanel position={[-13, 5, -21]} size={[10, 10]} />
      <Baseboard position={[-17.9, 0.06, -21]} size={[0.06, 0.12, 10]} />
      <TrackRail position={[-13, 4.85, -19]} length={8} />
      <TrackRail position={[-13, 4.85, -23]} length={8} />
      <TrackLight position={[-11, 4.8, -19]} intensity={2.0} />
      <TrackLight position={[-15, 4.8, -19]} intensity={2.0} />
      <TrackLight position={[-11, 4.8, -23]} intensity={2.0} />
      <TrackLight position={[-15, 4.8, -23]} intensity={2.0} />


      {/* ════════════════════════════════════════════ */}
      {/* 7. EAST EXHIBITION WING (x=8 to x=18)       */}
      {/*    z=-16 to z=-26                            */}
      {/* ════════════════════════════════════════════ */}
      {/* North wall */}
      <Wall position={[13, 2.5, -16]} size={[10, 5, WALL_THICKNESS]} />
      {/* South wall */}
      <Wall position={[13, 2.5, -26]} size={[10, 5, WALL_THICKNESS]} />
      {/* East wall (far end) */}
      <Wall position={[18, 2.5, -21]} size={[WALL_THICKNESS, 5, 10]} />
      <CeilingPanel position={[13, 5, -21]} size={[10, 10]} />
      <Baseboard position={[17.9, 0.06, -21]} size={[0.06, 0.12, 10]} />
      <TrackRail position={[13, 4.85, -19]} length={8} />
      <TrackRail position={[13, 4.85, -23]} length={8} />
      <TrackLight position={[11, 4.8, -19]} intensity={2.0} />
      <TrackLight position={[15, 4.8, -19]} intensity={2.0} />
      <TrackLight position={[11, 4.8, -23]} intensity={2.0} />
      <TrackLight position={[15, 4.8, -23]} intensity={2.0} />
    </group>
  );
};
