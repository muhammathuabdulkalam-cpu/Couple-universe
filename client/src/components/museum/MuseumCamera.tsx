/**
 * MuseumCamera.tsx
 * 
 * First-Person Camera Controller for Grand Exhibition Hall.
 * 
 * Features:
 * - Continuous 60 FPS movement down the entire 50-meter Grand Gallery Hall (z = 4.5 to -48.5)
 * - Swept 0.55m wall clearance bounds resolving X/Z independently
 * - Consistent 1.65m standing eye level
 * - Smooth lerp movement physics with zero camera vibration
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Grand Gallery Walkable Bounds (x: -7.4 to 7.4, z: -48.5 to 4.5) ──────
const WALKABLE_ZONES = [
  { minX: -7.4, maxX: 7.4, minZ: -48.5, maxZ: 4.5 },
];

function isInsideWalkableZone(x: number, z: number): boolean {
  for (let i = 0; i < WALKABLE_ZONES.length; i++) {
    const zone = WALKABLE_ZONES[i];
    if (x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ) {
      return true;
    }
  }
  return false;
}

const EYE_HEIGHT = 1.65;
const WALK_SPEED = 4.2;
const SPRINT_MULTIPLIER = 1.8;
const BOB_SPEED = 8;
const BOB_AMPLITUDE = 0.02;
const MOUSE_SENSITIVITY = 0.002;

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();

export interface CameraTarget {
  pos: [number, number, number];
  yaw: number;
  pitch?: number;
  onComplete?: () => void;
}

interface MuseumCameraProps {
  joystickVectorRef: React.MutableRefObject<{ x: number; y: number }>;
  isPointerLocked: boolean;
  onPointerLockChange: (locked: boolean) => void;
  target: CameraTarget | null;
  onTargetComplete: () => void;
  onCameraUpdate?: (pos: [number, number, number], yaw: number) => void;
  initialPosition?: [number, number, number];
  initialYaw?: number;
}

const MuseumCameraImpl: React.FC<MuseumCameraProps> = ({
  joystickVectorRef,
  isPointerLocked: _isPointerLocked,
  onPointerLockChange,
  target,
  onTargetComplete,
  onCameraUpdate,
  initialPosition,
  initialYaw,
}) => {
  const { camera, gl } = useThree();

  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(Math.PI);
  const pitch = useRef(0);
  const bobPhase = useRef(0);
  const velocity = useRef({ x: 0, z: 0 });

  const isFlyingTo = useRef(false);
  const flyTarget = useRef<CameraTarget | null>(null);

  const lastHudUpdate = useRef(0);

  useEffect(() => {
    if (target) {
      flyTarget.current = target;
      isFlyingTo.current = true;
    }
  }, [target]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        isFlyingTo.current = false;
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
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

  // ─── Touch Drag, Mouse Drag & Wheel Camera Rotation Controller (360° Yaw/Pitch) ─────
  useEffect(() => {
    let isDragging = false;
    let previousTouchX = 0;
    let previousTouchY = 0;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest?.('.joystick-container') || target?.closest?.('button')) return;

      isDragging = true;
      previousTouchX = e.clientX;
      previousTouchY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      // Desktop Pointer Lock camera movement
      if (document.pointerLockElement) {
        yaw.current -= e.movementX * MOUSE_SENSITIVITY;
        pitch.current -= e.movementY * MOUSE_SENSITIVITY;
        pitch.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 4, pitch.current));
        isFlyingTo.current = false;
        return;
      }

      // Mobile Touch / Mouse Drag camera rotation
      if (!isDragging) return;

      const deltaX = e.clientX - previousTouchX;
      const deltaY = e.clientY - previousTouchY;

      previousTouchX = e.clientX;
      previousTouchY = e.clientY;

      const TOUCH_SENSITIVITY = 0.004;
      yaw.current -= deltaX * TOUCH_SENSITIVITY;
      pitch.current -= deltaY * TOUCH_SENSITIVITY;
      pitch.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 4, pitch.current));
      isFlyingTo.current = false;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      const delta = e.deltaX || e.deltaY;
      if (Math.abs(delta) > 0) {
        yaw.current -= delta * 0.002;
        isFlyingTo.current = false;
      }
    };

    const onLockChange = () => {
      onPointerLockChange(!!document.pointerLockElement);
    };

    const onClick = () => {
      if (!document.pointerLockElement) {
        requestPointerLock();
      }
    };

    const dom = gl.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: true });

    document.addEventListener('pointerlockchange', onLockChange);
    dom.addEventListener('click', onClick);

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      dom.removeEventListener('wheel', onWheel);

      document.removeEventListener('pointerlockchange', onLockChange);
      dom.removeEventListener('click', onClick);
    };
  }, [gl, requestPointerLock, onPointerLockChange]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);

    if (isFlyingTo.current && flyTarget.current) {
      const lerpSpeed = Math.min(dt * 3.8, 0.12);

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

      if (dist < 0.12 && Math.abs(yaw.current - targetYawVal) < 0.04) {
        isFlyingTo.current = false;
        const cb = flyTarget.current.onComplete;
        flyTarget.current = null;
        onTargetComplete();
        if (cb) cb();
      }
    } else {
      const isSprint = keys.current['ShiftLeft'] || keys.current['ShiftRight'];
      const maxSpeed = WALK_SPEED * (isSprint ? SPRINT_MULTIPLIER : 1.0);

      _forward.set(-Math.sin(yaw.current), 0, -Math.cos(yaw.current)).normalize();
      _right.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current)).normalize();

      let accelX = 0;
      let accelZ = 0;

      if (keys.current['KeyW'] || keys.current['ArrowUp']) {
        accelX += _forward.x;
        accelZ += _forward.z;
      }
      if (keys.current['KeyS'] || keys.current['ArrowDown']) {
        accelX -= _forward.x;
        accelZ -= _forward.z;
      }
      if (keys.current['KeyA'] || keys.current['ArrowLeft']) {
        accelX -= _right.x;
        accelZ -= _right.z;
      }
      if (keys.current['KeyD'] || keys.current['ArrowRight']) {
        accelX += _right.x;
        accelZ += _right.z;
      }

      const jx = joystickVectorRef.current.x;
      const jy = joystickVectorRef.current.y;
      if (jx !== 0 || jy !== 0) {
        accelX += _right.x * jx * 0.95;
        accelZ += _right.z * jx * 0.95;
        accelX += _forward.x * (-jy) * 0.95;
        accelZ += _forward.z * (-jy) * 0.95;
      }

      const friction = 16.0;
      const accelRate = 30.0;

      velocity.current.x += (accelX * maxSpeed * accelRate - velocity.current.x * friction) * dt;
      velocity.current.z += (accelZ * maxSpeed * accelRate - velocity.current.z * friction) * dt;

      const dx = velocity.current.x * dt;
      const dz = velocity.current.z * dt;

      const moving = Math.hypot(dx, dz) > 0.001;

      const newX = camera.position.x + dx;
      const newZ = camera.position.z + dz;

      // Wall collision & smooth corner wall sliding
      if (isInsideWalkableZone(newX, camera.position.z)) {
        camera.position.x = newX;
      } else {
        velocity.current.x = 0;
      }

      if (isInsideWalkableZone(camera.position.x, newZ)) {
        camera.position.z = newZ;
      } else {
        velocity.current.z = 0;
      }

      if (moving) {
        bobPhase.current += BOB_SPEED * dt;
        camera.position.y = EYE_HEIGHT + Math.sin(bobPhase.current) * BOB_AMPLITUDE;
      } else {
        camera.position.y += (EYE_HEIGHT - camera.position.y) * 0.1;
        bobPhase.current = 0;
      }
    }

    _lookTarget.set(
      camera.position.x - Math.sin(yaw.current) * Math.cos(pitch.current),
      camera.position.y + Math.sin(pitch.current),
      camera.position.z - Math.cos(yaw.current) * Math.cos(pitch.current)
    );
    camera.lookAt(_lookTarget);

    const now = state.clock.getElapsedTime();
    if (now - lastHudUpdate.current > 0.066) {
      lastHudUpdate.current = now;
      if (onCameraUpdate) {
        onCameraUpdate([camera.position.x, camera.position.y, camera.position.z], yaw.current);
      }
    }
  });

  useEffect(() => {
    if (initialPosition) {
      camera.position.set(initialPosition[0], initialPosition[1], initialPosition[2]);
    } else {
      camera.position.set(0, EYE_HEIGHT, -2.5);
    }
    
    if (initialYaw !== undefined) {
      yaw.current = initialYaw;
    } else {
      yaw.current = Math.PI;
    }

    camera.near = 0.1;
    camera.far = 100;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  return null;
};

export const MuseumCamera = React.memo(MuseumCameraImpl);
