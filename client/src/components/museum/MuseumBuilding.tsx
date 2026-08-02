/**
 * MuseumBuilding.tsx
 * 
 * Signature "Afzal ❤️ Amrin Memory Museum" Front Feature Wall Centerpiece.
 * 
 * Features:
 * - Next-Level Typography Mural directly carved into the front wall
 * - Perfectly aligned and lit with dual spotlights
 * - ZERO text bleeding (removed unnecessary rear wall text)
 * - Polished walnut floor, warm white gallery walls & track lighting
 */

import React from 'react';
import * as THREE from 'three';
import { MeshReflectorMaterial, useTexture } from '@react-three/drei';
import bannerImg from '../../assets/banner.png';

const WALL_COLOR = '#f1f5f9';
const WALL_TRIM_COLOR = '#cbd5e1';
const CEILING_COLOR = '#e2e8f0';
const FLOOR_COLOR = '#78350f';
const WALL_THICKNESS = 0.2;
const CEILING_HEIGHT = 4.8;

const Wall: React.FC<{
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
}> = React.memo(({ position, size, rotation = [0, 0, 0] as [number, number, number] }) => (
  <mesh position={position} rotation={rotation}>
    <boxGeometry args={size} />
    <meshStandardMaterial color={WALL_COLOR} roughness={0.75} metalness={0.05} />
  </mesh>
));
Wall.displayName = 'Wall';

const Baseboard: React.FC<{
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
}> = React.memo(({ position, size, rotation = [0, 0, 0] as [number, number, number] }) => (
  <mesh position={position} rotation={rotation}>
    <boxGeometry args={size} />
    <meshStandardMaterial color={WALL_TRIM_COLOR} roughness={0.5} metalness={0.1} />
  </mesh>
));
Baseboard.displayName = 'Baseboard';

const CeilingPanel: React.FC<{
  position: [number, number, number];
  size: [number, number];
}> = React.memo(({ position, size }) => (
  <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
    <planeGeometry args={size} />
    <meshStandardMaterial color={CEILING_COLOR} roughness={0.85} side={2} />
  </mesh>
));
CeilingPanel.displayName = 'CeilingPanel';

const TrackRail: React.FC<{
  position: [number, number, number];
  length: number;
  rotation?: [number, number, number];
}> = React.memo(({ position, length, rotation = [0, 0, 0] as [number, number, number] }) => (
  <mesh position={position} rotation={rotation}>
    <boxGeometry args={[length, 0.04, 0.04]} />
    <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.15} />
  </mesh>
));
TrackRail.displayName = 'TrackRail';

const TrackLightFixture: React.FC<{
  position: [number, number, number];
}> = React.memo(({ position }) => (
  <mesh position={position}>
    <cylinderGeometry args={[0.06, 0.08, 0.15, 8]} />
    <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
  </mesh>
));
TrackLightFixture.displayName = 'TrackLightFixture';

const FeatureBanner: React.FC = () => {
  const texture = useTexture(bannerImg);
  const [dimensions, setDimensions] = React.useState({ width: 8.5, height: 3.0 });
  
  React.useEffect(() => {
    if (texture) {
      // Set high-quality texture filtering
      texture.anisotropy = 8;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.generateMipmaps = true;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;

      // Dynamically calculate aspect ratio to prevent stretching/distortion
      const img = texture.image as any;
      if (img && img.width && img.height) {
        const imgWidth = img.width;
        const imgHeight = img.height;
        const aspect = imgWidth / imgHeight;

        let finalWidth = 8.0;
        let finalHeight = finalWidth / aspect;

        // Constraint max height to 3.2m to fit perfectly on the wall
        if (finalHeight > 3.2) {
          finalHeight = 3.2;
          finalWidth = finalHeight * aspect;
        }

        setDimensions({ width: finalWidth, height: finalHeight });
      }
    }
  }, [texture]);

  const { width, height } = dimensions;

  return (
    <group position={[0, 0, 0.06]}>
      {/* Soft Wall Shadow Plate */}
      <mesh position={[0, 0, -0.03]}>
        <planeGeometry args={[width + 0.3, height + 0.3]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>

      {/* Matte Black Outer Frame */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width + 0.15, height + 0.15, 0.06]} />
        <meshStandardMaterial color="#090d16" roughness={0.35} metalness={0.4} />
      </mesh>

      {/* Brushed Gold Inner Bevel */}
      <mesh position={[0, 0, 0.015]}>
        <boxGeometry args={[width, height, 0.04]} />
        <meshStandardMaterial color="#d97706" roughness={0.25} metalness={0.8} />
      </mesh>

      {/* The Actual Banner Canvas */}
      <mesh position={[0, 0, 0.036]}>
        <planeGeometry args={[width - 0.15, height - 0.15]} />
        <meshStandardMaterial map={texture} roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  );
};

interface MuseumBuildingProps {
  hallDepth?: number;
}

const MuseumBuildingImpl: React.FC<MuseumBuildingProps> = ({ hallDepth = 22 }) => {
  const floorCenterZ = -hallDepth / 2 + 2;
  const northWallZ = -hallDepth + 3.8;
  const southWallZ = 4.5;

  return (
    <group>
      {/* 1. Polished Wood Floor */}
      <mesh position={[0, 0, floorCenterZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, hallDepth + 4]} />
        <MeshReflectorMaterial
          blur={[100, 30]}
          resolution={128}
          mirror={0.18}
          mixBlur={0.6}
          mixStrength={0.5}
          roughness={0.5}
          depthScale={0.5}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color={FLOOR_COLOR}
          metalness={0.1}
        />
      </mesh>

      {/* 2. Main Gallery Perimeter Walls */}
      {/* West Wall (x = -8) */}
      <Wall position={[-8, CEILING_HEIGHT / 2, floorCenterZ]} size={[WALL_THICKNESS, CEILING_HEIGHT, hallDepth + 4]} />
      <Baseboard position={[-7.9, 0.06, floorCenterZ]} size={[0.06, 0.12, hallDepth + 4]} />

      {/* East Wall (x = +8) */}
      <Wall position={[8, CEILING_HEIGHT / 2, floorCenterZ]} size={[WALL_THICKNESS, CEILING_HEIGHT, hallDepth + 4]} />
      <Baseboard position={[7.9, 0.06, floorCenterZ]} size={[0.06, 0.12, hallDepth + 4]} />

      {/* North End Wall */}
      <Wall position={[0, CEILING_HEIGHT / 2, northWallZ]} size={[16, CEILING_HEIGHT, WALL_THICKNESS]} />
      <Baseboard position={[0, 0.06, northWallZ + 0.1]} size={[16, 0.12, 0.06]} />

      {/* South Entrance Wall (Front Feature Wall) */}
      <Wall position={[0, CEILING_HEIGHT / 2, southWallZ]} size={[16, CEILING_HEIGHT, WALL_THICKNESS]} />
      <Baseboard position={[0, 0.06, southWallZ - 0.1]} size={[16, 0.12, 0.06]} />

      {/* 3. SIGNATURE FRONT FEATURE ARTWORK CENTERPIECE (South Wall) */}
      <group position={[0, 2.4, southWallZ - 0.08]} rotation={[0, Math.PI, 0]}>
        <React.Suspense fallback={null}>
          <FeatureBanner />
        </React.Suspense>
      </group>

      {/* DEDICATED DUAL SPOTLIGHTS FOR FEATURE ARTWORK */}
      <spotLight
        position={[-3.0, 4.4, southWallZ - 2.5]}
        target-position={[-3.0, 2.4, southWallZ]}
        angle={0.6}
        penumbra={0.7}
        intensity={2.8}
        color="#fffbeb"
      />
      <spotLight
        position={[3.0, 4.4, southWallZ - 2.5]}
        target-position={[3.0, 2.4, southWallZ]}
        angle={0.6}
        penumbra={0.7}
        intensity={2.8}
        color="#fffbeb"
      />

      {/* 4. Ceiling Panels & Track Lighting */}
      <CeilingPanel position={[0, CEILING_HEIGHT, floorCenterZ]} size={[16, hallDepth + 4]} />
      <TrackRail position={[-5, CEILING_HEIGHT - 0.1, floorCenterZ]} length={hallDepth} rotation={[0, Math.PI / 2, 0]} />
      <TrackRail position={[5, CEILING_HEIGHT - 0.1, floorCenterZ]} length={hallDepth} rotation={[0, Math.PI / 2, 0]} />

      <TrackLightFixture position={[-5, CEILING_HEIGHT - 0.15, 0]} />
      <TrackLightFixture position={[-5, CEILING_HEIGHT - 0.15, -hallDepth / 2]} />
      <TrackLightFixture position={[-5, CEILING_HEIGHT - 0.15, -hallDepth + 5]} />

      <TrackLightFixture position={[5, CEILING_HEIGHT - 0.15, 0]} />
      <TrackLightFixture position={[5, CEILING_HEIGHT - 0.15, -hallDepth / 2]} />
      <TrackLightFixture position={[5, CEILING_HEIGHT - 0.15, -hallDepth + 5]} />

      {/* Warm Ambient Gallery Spotlights */}
      <spotLight position={[0, CEILING_HEIGHT - 0.2, 0]} target-position={[0, 0, 0]} angle={0.8} penumbra={0.8} intensity={1.6} color="#fffbeb" />
      <spotLight position={[0, CEILING_HEIGHT - 0.2, -hallDepth / 2]} target-position={[0, 0, -hallDepth / 2]} angle={0.8} penumbra={0.8} intensity={1.8} color="#fff7ed" />
    </group>
  );
};

export const MuseumBuilding = React.memo(MuseumBuildingImpl);
