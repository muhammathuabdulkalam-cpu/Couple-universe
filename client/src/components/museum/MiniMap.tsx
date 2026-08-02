/**
 * MiniMap.tsx
 * 
 * Floating 2D Vector MiniMap Overlay for 3D Memory Museum.
 * Shows:
 * - Room floorplans & boundaries
 * - Current camera X,Z coordinate dot + orientation pointer
 * - Interactive room nodes — click any room to trigger camera smooth walk!
 */

import React, { useMemo } from 'react';
import { Compass, MapPin } from 'lucide-react';
import { MuseumLayoutEngine, MuseumRoom } from './WallLayoutEngine.js';

interface MiniMapProps {
  cameraPos: [number, number, number];
  cameraYaw: number;
  onSelectRoom: (room: MuseumRoom) => void;
  activeRoomId: string;
}

// Convert 3D world coordinates (X: -20..20, Z: -40..5) to 2D SVG canvas (160x220)
function worldToSvg(x: number, z: number): { cx: number; cy: number } {
  // SVG Canvas dimensions: 160 x 220
  // World X range: [-20, 20] -> width 40
  // World Z range: [-40, 5]  -> height 45
  const cx = ((x + 20) / 40) * 160;
  const cy = ((5 - z) / 45) * 220;
  return { cx, cy };
}

export const MiniMap: React.FC<MiniMapProps> = ({
  cameraPos,
  cameraYaw,
  onSelectRoom,
  activeRoomId,
}) => {
  const rooms = useMemo(() => MuseumLayoutEngine.getRooms(), []);

  // Camera dot coordinates
  const { cx: playerX, cy: playerY } = useMemo(
    () => worldToSvg(cameraPos[0], cameraPos[2]),
    [cameraPos]
  );

  // Direction pointer line
  const dirX = playerX - Math.sin(cameraYaw) * 12;
  const dirY = playerY - Math.cos(cameraYaw) * 12;

  return (
    <div className="bg-obsidian-950/85 backdrop-blur-xl border border-white/15 p-3 rounded-2xl shadow-2xl w-44 pointer-events-auto text-white select-none">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
        <span className="text-[10px] font-extrabold tracking-wider uppercase text-amber-400 flex items-center gap-1">
          <Compass className="w-3 h-3" /> Map
        </span>
        <span className="text-[9px] font-mono text-slate-400">3D Nav</span>
      </div>

      {/* SVG Map Canvas */}
      <div className="relative w-full h-[180px] bg-slate-950/70 rounded-xl border border-white/10 overflow-hidden">
        <svg viewBox="0 0 160 220" className="w-full h-full">
          {/* Room Rectangles */}
          {/* Entry */}
          <rect x="52" y="195" width="56" height="20" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          {/* Lobby */}
          <rect x="36" y="150" width="88" height="42" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          {/* Main Hall */}
          <rect x="28" y="78" width="104" height="70" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1" />
          {/* West Wing */}
          <rect x="8" y="100" width="48" height="44" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          {/* East Wing */}
          <rect x="104" y="100" width="48" height="44" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          {/* North Exhibition */}
          <rect x="28" y="30" width="104" height="46" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1" />

          {/* Interactive Room Nodes */}
          {rooms.map((room) => {
            const { cx, cy } = worldToSvg(room.centerPos[0], room.centerPos[2]);
            const isActive = room.id === activeRoomId;

            return (
              <g
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className="cursor-pointer group"
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isActive ? "7" : "5"}
                  className={isActive ? "fill-amber-400 stroke-amber-200 animate-pulse" : "fill-slate-600 hover:fill-amber-400 transition-colors"}
                  strokeWidth="1.5"
                />
                <text
                  x={cx}
                  y={cy + 13}
                  textAnchor="middle"
                  className={`text-[7px] font-extrabold uppercase fill-slate-300 group-hover:fill-white pointer-events-none ${isActive ? 'fill-amber-300' : ''}`}
                >
                  {room.name.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* Camera Direction Cone & Dot */}
          <line
            x1={playerX}
            y1={playerY}
            x2={dirX}
            y2={dirY}
            stroke="#f43f5e"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx={playerX}
            cy={playerY}
            r="4.5"
            fill="#f43f5e"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Footer hint */}
      <div className="mt-1.5 text-[8px] text-center text-slate-400 font-mono flex items-center justify-center gap-1">
        <MapPin className="w-2.5 h-2.5 text-amber-400" /> Tap node to walk
      </div>
    </div>
  );
};
