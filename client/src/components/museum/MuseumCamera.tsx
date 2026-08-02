/**
 * MuseumCamera.tsx
 * 
 * First-person & Automated Fly-to Camera Controller for Memory Museum.
 * Features:
 * - Smooth WASD / Arrow walking + Shift sprint
 * - Inertia & acceleration/deceleration physics
 * - Smooth wall sliding & room boundary collision enforcement
 * - Dynamic head bobbing
 * - Automated Camera Fly-To (smooth walk to artwork or selected room)
 * - Mouse look + Mobile touch rotation support
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const WALKABLE_ZONES = [
  { minX: -3.8, maxX: 3.8, minZ: -1.8, maxZ: 1.8 },
  { minX: -5.8, maxX: 5.8, minZ: -11.8, maxZ: -2.2 },
  { minX: -7.8, maxX: 7.8, minZ: -27.8, maxZ: -12.2 },
  { minX: -7.8, maxX: 7.8, minZ: -37.8, maxZ: -28.2 },
  { minX: -17.8, maxX: -8.2, minZ: -25.8, maxZ: -16.2 },
  { minX: 8.2, maxX: 17.8, minZ: -25.8, maxZ: -16.2 },
];

function isInsideMuseum(x: number, z: number): boolean {
  return WALKABLE_ZONES.some(
    (zone) => x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ
  );
}

const EYE_HEIGHT = 1.65;
const WALK_SPEED = 4.5;
const SPRINT_MULTIPLIER = 1.8;
const BOB_SPEED = 8;
const BOB_AMPLITUDE = 0.03;
const MOUSE_SENSITIVITY = 0.002;

export interface CameraTarget {
  pos: [number, number, number];
  yaw: number;
  pitch?: number;
  onComplete?: () => void;
}

interface MuseumCameraProps {
  joystickInput: { x: number; y: number };
  isPointerLocked: boolean;
  onPointerLockChange: (locked: boolean) => void;
  target: CameraTarget | null;
  onTargetComplete: () => void;
  onCameraUpdate?: (pos: [number, number, number], yaw: number) => void;
}

export const MuseumCamera: React.FC<MuseumCameraProps> = ({
  joystickInput,
  isPointerLocked: _isPointerLocked,
  onPointerLockChange,
  target,
  onTargetComplete,
  onCameraUpdate,
}) => {
  const { camera, gl } = useThree();

  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(Math.PI); // facing into museum (-z)
  const pitch = useRef(0);
  const bobPhase = useRef(0);

  // Velocity vectors for inertia & smooth acceleration
  const velocity = useRef({ x: 0, z: 0 });

  // Camera Fly-to transition state
  const isFlyingTo = useRef(false);
  const flyTarget = useRef<CameraTarget | null>(null);

  // Sync external target
  useEffect(() => {
    if (target) {
      flyTarget.current = target;
      isFlyingTo.current = true;
    }
  }, [target]);

  // Keyboard events
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;

      // Disable fly-to if user manually presses WASD
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        isFlyingTo.current = false;
      }
    };
    const onUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  const requestPointerLock = useCallback(() => {
    gl.domElement.requestPointerLock?.();
  }, [gl]);

  // Pointer lock mouse look
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;
      yaw.current -= e.movementX * MOUSE_SENSITIVITY;
      pitch.current -= e.movementY * MOUSE_SENSITIVITY;
      pitch.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 4, pitch.current));
      isFlyingTo.current = false; // Manual mouse move interrupts fly-to
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

  // Per-frame physics & camera transform tick
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // ─── Automated Fly-To Camera Transition ────────────────
    if (isFlyingTo.current && flyTarget.current) {
      const lerpSpeed = Math.min(dt * 3.5, 0.1);

      const targetX = flyTarget.current.pos[0];
      const targetZ = flyTarget.current.pos[2];
      const targetYawVal = flyTarget.current.yaw;
      const targetPitchVal = flyTarget.current.pitch || 0;

      camera.position.x += (targetX - camera.position.x) * lerpSpeed;
      camera.position.z += (targetZ - camera.position.z) * lerpSpeed;
      camera.position.y += (EYE_HEIGHT - camera.position.y) * lerpSpeed;

      yaw.current += (targetYawVal - yaw.current) * lerpSpeed;
      pitch.current += (targetPitchVal - pitch.current) * lerpSpeed;

      const dist = Math.hypot(camera.position.x - targetX, camera.position.z - targetZ);

      if (dist < 0.15 && Math.abs(yaw.current - targetYawVal) < 0.05) {
        isFlyingTo.current = false;
        const cb = flyTarget.current.onComplete;
        flyTarget.current = null;
        onTargetComplete();
        if (cb) cb();
      }
    } else {
      // ─── Manual First-Person Walking Physics ───────────────
      const isSprint = keys.current['ShiftLeft'] || keys.current['ShiftRight'];
      const maxSpeed = WALK_SPEED * (isSprint ? SPRINT_MULTIPLIER : 1.0);

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

      let accelX = 0;
      let accelZ = 0;

      if (keys.current['KeyW'] || keys.current['ArrowUp']) {
        accelX += forward.x;
        accelZ += forward.z;
      }
      if (keys.current['KeyS'] || keys.current['ArrowDown']) {
        accelX -= forward.x;
        accelZ -= forward.z;
      }
      if (keys.current['KeyA'] || keys.current['ArrowLeft']) {
        accelX -= right.x;
        accelZ -= right.z;
      }
      if (keys.current['KeyD'] || keys.current['ArrowRight']) {
        accelX += right.x;
        accelZ += right.z;
      }

      if (joystickInput.x !== 0 || joystickInput.y !== 0) {
        accelX += right.x * joystickInput.x * 0.9;
        accelZ += right.z * joystickInput.x * 0.9;
        accelX += forward.x * (-joystickInput.y) * 0.9;
        accelZ += forward.z * (-joystickInput.y) * 0.9;
      }

      // Inertia & velocity dampening
      const friction = 12.0;
      const accelRate = 25.0;

      velocity.current.x += (accelX * maxSpeed * accelRate - velocity.current.x * friction) * dt;
      velocity.current.z += (accelZ * maxSpeed * accelRate - velocity.current.z * friction) * dt;

      const dx = velocity.current.x * dt;
      const dz = velocity.current.z * dt;

      const moving = Math.hypot(dx, dz) > 0.001;

      const newX = camera.position.x + dx;
      const newZ = camera.position.z + dz;

      // Wall collision & smooth wall sliding
      if (isInsideMuseum(newX, camera.position.z)) {
        camera.position.x = newX;
      } else {
        velocity.current.x = 0;
      }

      if (isInsideMuseum(camera.position.x, newZ)) {
        camera.position.z = newZ;
      } else {
        velocity.current.z = 0;
      }

      // Dynamic head bobbing
      if (moving) {
        bobPhase.current += BOB_SPEED * dt;
        camera.position.y = EYE_HEIGHT + Math.sin(bobPhase.current) * BOB_AMPLITUDE;
      } else {
        camera.position.y += (EYE_HEIGHT - camera.position.y) * 0.1;
        bobPhase.current = 0;
      }
    }

    // Apply look target matrix
    const lookTarget = new THREE.Vector3(
      camera.position.x - Math.sin(yaw.current) * Math.cos(pitch.current),
      camera.position.y + Math.sin(pitch.current),
      camera.position.z - Math.cos(yaw.current) * Math.cos(pitch.current)
    );
    camera.lookAt(lookTarget);

    // Notify parent HUD of camera updates (for MiniMap & Room Navigator active state)
    if (onCameraUpdate) {
      onCameraUpdate([camera.position.x, camera.position.y, camera.position.z], yaw.current);
    }
  });

  useEffect(() => {
    camera.position.set(0, EYE_HEIGHT, 0.5);
    yaw.current = Math.PI;
    camera.near = 0.1;
    camera.far = 100;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }, [camera]);

  return null;
};
