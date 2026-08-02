import React from 'react';
import { Sparkles } from '@react-three/drei';

export const AmbientAtmosphere: React.FC = React.memo(() => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <group>
      {/* Floating museum dust particles */}
      <Sparkles
        count={isMobile ? 25 : 60}
        scale={[36, 6, 40]}
        position={[0, 2.5, -20]}
        size={2.0}
        speed={0.1}
        opacity={0.3}
        color="#fef08a"
      />
    </group>
  );
});

AmbientAtmosphere.displayName = 'AmbientAtmosphere';
