import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';

interface MuseumControlsProps {
  mobileMoveVector?: { x: number; y: number };
}

export const MuseumControls: React.FC<MuseumControlsProps> = ({ mobileMoveVector }) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    const moveSpeed = 6 * delta;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0; // Lock movement along the ground plane
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // 1. WASD Keyboard Movement
    if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) {
      camera.position.addScaledVector(forward, moveSpeed);
    }
    if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) {
      camera.position.addScaledVector(forward, -moveSpeed);
    }
    if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) {
      camera.position.addScaledVector(right, -moveSpeed);
    }
    if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) {
      camera.position.addScaledVector(right, moveSpeed);
    }

    // 2. Touch Joystick Mobile Movement
    if (mobileMoveVector && (mobileMoveVector.x !== 0 || mobileMoveVector.y !== 0)) {
      camera.position.addScaledVector(right, mobileMoveVector.x * moveSpeed * 0.8);
      camera.position.addScaledVector(forward, -mobileMoveVector.y * moveSpeed * 0.8);
    }

    // 3. Keep camera within museum boundary limits (collision bounds)
    camera.position.x = Math.max(-18, Math.min(18, camera.position.x));
    camera.position.z = Math.max(-18, Math.min(18, camera.position.z));
    camera.position.y = 1.6; // Constant eye level height

    if (controlsRef.current) {
      controlsRef.current.target.set(
        camera.position.x + forward.x,
        camera.position.y,
        camera.position.z + forward.z
      );
    }
  });

  return (
    // @ts-ignore
    <primitive
      object={
        new OrbitControlsImpl(camera, gl.domElement)
      }
      ref={controlsRef}
      enableZoom={true}
      enablePan={false}
      maxPolarAngle={Math.PI / 2 + 0.05} // Prevent camera going below reflective floor
      minPolarAngle={Math.PI / 3}
      maxDistance={25}
      minDistance={0.5}
      rotateSpeed={0.6}
    />
  );
};
