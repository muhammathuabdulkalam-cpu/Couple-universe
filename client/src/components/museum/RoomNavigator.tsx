/**
 * RoomNavigator.tsx
 * 
 * Floating Segmented Room Navigation Control for 3D Memory Museum.
 * Smoothly teleports/walks camera to room entrance when clicked.
 */

import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { MuseumLayoutEngine, MuseumRoom } from './WallLayoutEngine.js';

interface RoomNavigatorProps {
  activeRoomId: string;
  onSelectRoom: (room: MuseumRoom) => void;
}

export const RoomNavigator: React.FC<RoomNavigatorProps> = ({
  activeRoomId,
  onSelectRoom,
}) => {
  const rooms = useMemo(() => MuseumLayoutEngine.getRooms(), []);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[95vw] overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-obsidian-950/85 backdrop-blur-xl border border-white/15 shadow-2xl">
        <div className="px-2.5 py-1 text-[10px] font-extrabold text-amber-400 uppercase tracking-widest hidden sm:flex items-center gap-1 shrink-0 border-r border-white/10 pr-3">
          <Sparkles className="w-3 h-3" /> Galleries
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {rooms.map((room) => {
            const isActive = room.id === activeRoomId;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => onSelectRoom(room)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-amber-400 animate-ping' : 'bg-slate-500'}`} />
                {room.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
