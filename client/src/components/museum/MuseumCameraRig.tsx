import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';

interface MuseumCameraRigProps {
  joystickPos?: { x: number; y: number };
  targetPosition?: [number, number, number] | null;
}

export const MuseumCameraRig: React.FC<MuseumCameraRigProps> = ({ joystickPos, targetPosition }) => {
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

  // Teleport interpolation when targetPosition changes (room navigation)
  useEffect(() => {
    if (targetPosition) {
      camera.position.set(targetPosition[0], 1.6, targetPosition[2] + 4);
      if (controlsRef.current) {
        controlsRef.current.target.set(targetPosition[0], 1.6, targetPosition[2]);
      }
    }
  }, [targetPosition, camera]);

  useFrame((_, delta) => {
    const isSprint = keysPressed.current['ShiftLeft'] || keysPressed.current['ShiftRight'];
    const speedMultiplier = isSprint ? 1.8 : 1.0;
    const moveSpeed = 6.5 * delta * speedMultiplier;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // 1. WASD & Arrow Key Movement
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

    // 2. Touch Joystick Input
    if (joystickPos && (joystickPos.x !== 0 || joystickPos.y !== 0)) {
      camera.position.addScaledVector(right, joystickPos.x * moveSpeed * 0.8);
      camera.position.addScaledVector(forward, -joystickPos.y * moveSpeed * 0.8);
    }

    // 3. Wall Collision Bounds (Stay within room walls)
    camera.position.x = Math.max(-7.2, Math.min(7.2, camera.position.x));
    camera.position.z = Math.max(-7.2, Math.min(7.2, camera.position.z));
    camera.position.y = 1.6; // Keep eye level constant at 1.6m

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
      object={new OrbitControlsImpl(camera, gl.domElement)}
      ref={controlsRef}
      enableZoom={true}
      enablePan={false}
      maxPolarAngle={Math.PI / 2 + 0.05}
      minPolarAngle={Math.PI / 3}
      maxDistance={12}
      minDistance={0.5}
      rotateSpeed={0.6}
    />
  );
};
