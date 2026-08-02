/**
 * MuseumCamera.tsx
 * 
 * Phase 1: First-person camera controller.
 * WASD/Arrow walking, mouse-look, shift sprint, camera bob,
 * wall collision detection, boundary enforcement.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Museum boundary definitions (match MuseumBuilding layout) ──
// Each zone is { minX, maxX, minZ, maxZ }
const WALKABLE_ZONES = [
  // Entry vestibule
  { minX: -3.8, maxX: 3.8, minZ: -1.8, maxZ: 1.8 },
  // Lobby
  { minX: -5.8, maxX: 5.8, minZ: -11.8, maxZ: -2.2 },
  // Main Hall
  { minX: -7.8, maxX: 7.8, minZ: -27.8, maxZ: -12.2 },
  // North Exhibition Room
  { minX: -7.8, maxX: 7.8, minZ: -37.8, maxZ: -28.2 },
  // West Exhibition Wing
  { minX: -17.8, maxX: -8.2, minZ: -25.8, maxZ: -16.2 },
  // East Exhibition Wing
  { minX: 8.2, maxX: 17.8, minZ: -25.8, maxZ: -16.2 },
];

function isInsideMuseum(x: number, z: number): boolean {
  return WALKABLE_ZONES.some(
    (zone) => x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ
  );
}

const EYE_HEIGHT = 1.65;
const WALK_SPEED = 4.5;
const SPRINT_MULTIPLIER = 1.9;
const BOB_SPEED = 8;
const BOB_AMPLITUDE = 0.035;
const MOUSE_SENSITIVITY = 0.002;

interface MuseumCameraProps {
  joystickInput: { x: number; y: number };
  isPointerLocked: boolean;
  onPointerLockChange: (locked: boolean) => void;
}

export const MuseumCamera: React.FC<MuseumCameraProps> = ({
  joystickInput,
  isPointerLocked: _isPointerLocked,
  onPointerLockChange,
}) => {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(-Math.PI / 2);
  const pitch = useRef(0);
  const bobPhase = useRef(0);
  const isMoving = useRef(false);

  // ─── Keyboard events ─────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const onUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // ─── Pointer lock for mouse look ─────────────────
  const requestPointerLock = useCallback(() => {
    gl.domElement.requestPointerLock?.();
  }, [gl]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;
      yaw.current -= e.movementX * MOUSE_SENSITIVITY;
      pitch.current -= e.movementY * MOUSE_SENSITIVITY;
      pitch.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 4, pitch.current));
    };

    const onLockChange = () => {
      onPointerLockChange(!!document.pointerLockElement);
    };

    const onClick = () => {
      if (!document.pointerLockElement) {
        requestPointerLock();
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onLockChange);
    gl.domElement.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onLockChange);
      gl.domElement.removeEventListener('click', onClick);
    };
  }, [gl, requestPointerLock, onPointerLockChange]);

  // ─── Per-frame camera update ─────────────────────
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05); // Cap delta to prevent huge jumps

    const isSprint = keys.current['ShiftLeft'] || keys.current['ShiftRight'];
    const speed = WALK_SPEED * (isSprint ? SPRINT_MULTIPLIER : 1.0) * dt;

    // Camera direction vectors (horizontal plane only)
    const forward = new THREE.Vector3(
      -Math.sin(yaw.current),
      0,
      -Math.cos(yaw.current)
    ).normalize();

    const right = new THREE.Vector3(
      Math.cos(yaw.current),
      0,
      -Math.sin(yaw.current)
    ).normalize();

    // Calculate movement delta
    let moveX = 0;
    let moveZ = 0;

    // Keyboard input
    if (keys.current['KeyW'] || keys.current['ArrowUp']) {
      moveX += forward.x * speed;
      moveZ += forward.z * speed;
    }
    if (keys.current['KeyS'] || keys.current['ArrowDown']) {
      moveX -= forward.x * speed;
      moveZ -= forward.z * speed;
    }
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) {
      moveX -= right.x * speed;
      moveZ -= right.z * speed;
    }
    if (keys.current['KeyD'] || keys.current['ArrowRight']) {
      moveX += right.x * speed;
      moveZ += right.z * speed;
    }

    // Mobile joystick input
    if (joystickInput.x !== 0 || joystickInput.y !== 0) {
      moveX += right.x * joystickInput.x * speed * 0.9;
      moveZ += right.z * joystickInput.x * speed * 0.9;
      moveX += forward.x * (-joystickInput.y) * speed * 0.9;
      moveZ += forward.z * (-joystickInput.y) * speed * 0.9;
    }

    const moving = Math.abs(moveX) > 0.001 || Math.abs(moveZ) > 0.001;
    isMoving.current = moving;

    // Collision detection: try new position, only apply if inside museum
    const newX = camera.position.x + moveX;
    const newZ = camera.position.z + moveZ;

    // Separate X and Z collision for wall-sliding behavior
    if (isInsideMuseum(newX, camera.position.z)) {
      camera.position.x = newX;
    }
    if (isInsideMuseum(camera.position.x, newZ)) {
      camera.position.z = newZ;
    }

    // Camera bob while walking
    if (moving) {
      bobPhase.current += BOB_SPEED * dt;
      camera.position.y = EYE_HEIGHT + Math.sin(bobPhase.current) * BOB_AMPLITUDE;
    } else {
      // Smoothly return to eye height when stationary
      camera.position.y += (EYE_HEIGHT - camera.position.y) * 0.1;
      bobPhase.current = 0;
    }

    // Apply camera rotation from yaw/pitch
    const lookTarget = new THREE.Vector3(
      camera.position.x - Math.sin(yaw.current) * Math.cos(pitch.current),
      camera.position.y + Math.sin(pitch.current),
      camera.position.z - Math.cos(yaw.current) * Math.cos(pitch.current)
    );
    camera.lookAt(lookTarget);
  });

  // Set initial camera position (standing in the entry)
  useEffect(() => {
    camera.position.set(0, EYE_HEIGHT, 0.5);
    yaw.current = Math.PI; // Face into the museum
    camera.near = 0.1;
    camera.far = 100;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }, [camera]);

  return null; // Pure logic component, no visual output
};
