/**
 * AmbientAtmosphere.tsx
 * 
 * 3D Ambient Visual & Volumetric Atmosphere for Memory Museum:
 * - Floating dust sparkles
 * - Warm gallery lighting fill
 * - 3D Floating Room Title Banners above arch doorways
 */

import React, { useMemo } from 'react';
import { Sparkles, Text } from '@react-three/drei';
import { MuseumLayoutEngine } from './WallLayoutEngine.js';

export const AmbientAtmosphere: React.FC = () => {
  const rooms = useMemo(() => MuseumLayoutEngine.getRooms(), []);

  return (
    <group>
      {/* Floating museum dust particles in main hall */}
      <Sparkles
        count={80}
        scale={[36, 6, 40]}
        position={[0, 2.5, -20]}
        size={2.2}
        speed={0.12}
        opacity={0.35}
        color="#fef08a"
      />

      {/* Floating 3D Room Title Signs above Doorways */}
      {rooms.map((room) => {
        if (room.id === 'entry') return null;

        let signPos: [number, number, number] = [0, 3.4, 0];
        let signRot: [number, number, number] = [0, 0, 0];

        switch (room.id) {
          case 'lobby':
            signPos = [0, 3.4, -2.1];
            signRot = [0, 0, 0];
            break;
          case 'main-hall':
            signPos = [0, 3.5, -12.1];
            signRot = [0, 0, 0];
            break;
          case 'west-wing':
            signPos = [-8.1, 3.5, -21];
            signRot = [0, Math.PI / 2, 0];
            break;
          case 'east-wing':
            signPos = [8.1, 3.5, -21];
            signRot = [0, -Math.PI / 2, 0];
            break;
          case 'north-hall':
            signPos = [0, 3.5, -28.1];
            signRot = [0, 0, 0];
            break;
        }

        return (
          <group key={`sign-${room.id}`} position={signPos} rotation={signRot}>
            {/* 3D Glass plaque background */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[2.8, 0.45]} />
              <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
            </mesh>
            {/* 3D Room Title Text */}
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.16}
              color="#fef3c7"
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.08}
            >
              {room.name.toUpperCase()}
            </Text>
          </group>
        );
      })}
    </group>
  );
};
