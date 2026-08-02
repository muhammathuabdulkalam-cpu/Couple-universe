/**
 * MobileJoystick.tsx
 * 
 * Virtual touch joystick for mobile museum navigation.
 * Returns normalized { x, y } vector via onChange callback.
 * Rendered only on touch devices (sm:hidden).
 */
import React, { useState, useRef, useCallback } from 'react';
import { Move } from 'lucide-react';

interface MobileJoystickProps {
  onChange: (vector: { x: number; y: number }) => void;
}

export const MobileJoystick: React.FC<MobileJoystickProps> = ({ onChange }) => {
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement>(null);
  const baseRadius = 44; // half of 88px base diameter

  const handleTouch = useCallback(
    (clientX: number, clientY: number) => {
      if (!baseRef.current) return;
      const rect = baseRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      let dx = clientX - cx;
      let dy = clientY - cy;

      // Clamp to base radius
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > baseRadius) {
        dx = (dx / dist) * baseRadius;
        dy = (dy / dist) * baseRadius;
      }

      setKnobOffset({ x: dx, y: dy });
      onChange({
        x: dx / baseRadius,
        y: dy / baseRadius,
      });
    },
    [onChange]
  );

  const handleEnd = useCallback(() => {
    setKnobOffset({ x: 0, y: 0 });
    onChange({ x: 0, y: 0 });
  }, [onChange]);

  return (
    <div
      ref={baseRef}
      className="w-[88px] h-[88px] rounded-full bg-obsidian-950/70 backdrop-blur-xl border border-white/20 flex items-center justify-center touch-none relative shadow-2xl"
      onTouchMove={(e) => {
        const touch = e.touches[0];
        handleTouch(touch.clientX, touch.clientY);
      }}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
    >
      {/* Direction indicators */}
      <Move className="w-5 h-5 text-white/20 absolute" />
      
      {/* Draggable knob */}
      <div
        className="w-9 h-9 rounded-full bg-gradient-to-br from-amrin to-afzal shadow-lg border border-white/40 absolute transition-none"
        style={{
          transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
        }}
      />
    </div>
  );
};
