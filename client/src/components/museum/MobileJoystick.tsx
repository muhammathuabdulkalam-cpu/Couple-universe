/**
 * MobileJoystick.tsx
 * 
 * High-Performance Virtual Touch Pointer Joystick for 3D Museum Navigation.
 * Uses Pointer Events with setPointerCapture and direct DOM/Ref mutations.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { Move } from 'lucide-react';

interface MobileJoystickProps {
  vectorRef: React.MutableRefObject<{ x: number; y: number }>;
}

const MobileJoystickImpl: React.FC<MobileJoystickProps> = ({ vectorRef }) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const BASE_RADIUS = 44;

  const updateKnobAndVector = useCallback((clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let dx = clientX - cx;
    let dy = clientY - cy;

    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > BASE_RADIUS) {
      dx = (dx / dist) * BASE_RADIUS;
      dy = (dy / dist) * BASE_RADIUS;
    }

    if (knobRef.current) {
      knobRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0px)`;
    }

    vectorRef.current.x = dx / BASE_RADIUS;
    vectorRef.current.y = dy / BASE_RADIUS;
  }, [vectorRef]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateKnobAndVector(e.clientX, e.clientY);
  }, [updateKnobAndVector]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updateKnobAndVector(e.clientX, e.clientY);
  }, [updateKnobAndVector]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

    if (knobRef.current) {
      knobRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
    }

    vectorRef.current.x = 0;
    vectorRef.current.y = 0;
  }, [vectorRef]);

  useEffect(() => {
    return () => {
      vectorRef.current.x = 0;
      vectorRef.current.y = 0;
    };
  }, [vectorRef]);

  return (
    <div
      ref={baseRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="w-[88px] h-[88px] rounded-full bg-obsidian-950/80 backdrop-blur-xl border border-white/20 flex items-center justify-center touch-none relative shadow-2xl select-none cursor-pointer"
    >
      <Move className="w-5 h-5 text-white/20 absolute pointer-events-none" />
      <div
        ref={knobRef}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-amrin to-afzal shadow-lg border border-white/40 absolute pointer-events-none will-change-transform"
        style={{ transform: 'translate3d(0px, 0px, 0px)' }}
      />
    </div>
  );
};

export const MobileJoystick = React.memo(MobileJoystickImpl);
