import React from 'react';
import { Heart, Calendar, Clock, Layers, Image as ImageIcon, BookOpen, Music, Users, Plus, Pencil, Archive } from 'lucide-react';
import { AdminRelationshipItem } from '../../types/admin.types';

interface RelationshipsViewerProps {
  relationships: AdminRelationshipItem[];
  // Phase 2 action props
  onCreateRelationship?: () => void;
  onEditRelationship?: (rel: AdminRelationshipItem) => void;
  onArchiveRelationship?: (id: string) => void;
  onManageMembers?: (rel: AdminRelationshipItem) => void;
}

export const RelationshipsViewer: React.FC<RelationshipsViewerProps> = ({
  relationships,
  onCreateRelationship,
  onEditRelationship,
  onArchiveRelationship,
  onManageMembers,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base text-white flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-400" />
          <span>Platform Relationships Directory ({relationships.length})</span>
        </h3>
        {onCreateRelationship && (
          <button
            onClick={onCreateRelationship}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow"
          >
            <Plus className="w-3.5 h-3.5" /> New Relationship
          </button>
        )}
      </div>

      {relationships.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-900 border border-white/10 rounded-3xl">
          No relationships found. Create your first relationship above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {relationships.map((rel) => (
            <div
              key={rel.id}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl hover:border-rose-500/30 transition group"
            >
              {/* Card Top Banner & Info */}
              <div className="flex items-start gap-4">
                <img
                  src={rel.coverImage}
                  alt={rel.name}
                  className="w-20 h-20 rounded-2xl object-cover border border-rose-500/40 shadow-md shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-black text-lg text-white truncate">{rel.name}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      rel.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                    }`}>
                      {rel.status}
                    </span>
                  </div>
                  <p className="text-xs text-rose-400 font-semibold mt-0.5">{rel.type}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" /> {rel.startDate}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-white">
                      <Clock className="w-3.5 h-3.5 text-rose-400" /> {rel.daysTogether} Days
                    </span>
                  </div>
                </div>
              </div>

              {/* Members Section */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3 h-3 text-purple-400" /> Members ({rel.members.length})
                  </p>
                  {onManageMembers && (
                    <button
                      onClick={() => onManageMembers(rel)}
                      className="text-[10px] text-purple-400 hover:text-purple-300 font-bold transition"
                    >
                      Manage →
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {rel.members.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-white/5">
                      <img
                        src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                        alt={m.name}
                        className="w-6 h-6 rounded-full object-cover border border-white/20"
                      />
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">{m.name}</p>
                        <p className="text-[9px] text-slate-400">{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Activity Stats */}
              <div className="grid grid-cols-4 gap-2 text-center pt-2">
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/5">
                  <p className="text-sm font-black text-white">{rel.stats.totalMemories}</p>
                  <p className="text-[9px] text-slate-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
                    <Layers className="w-3 h-3 text-rose-400" /> Memories
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/5">
                  <p className="text-sm font-black text-white">{rel.stats.totalAlbums}</p>
                  <p className="text-[9px] text-slate-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
                    <ImageIcon className="w-3 h-3 text-purple-400" /> Albums
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/5">
                  <p className="text-sm font-black text-white">{rel.stats.totalStories}</p>
                  <p className="text-[9px] text-slate-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
                    <BookOpen className="w-3 h-3 text-amber-400" /> Stories
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/5">
                  <p className="text-sm font-black text-white">{rel.stats.totalSharedSongs}</p>
                  <p className="text-[9px] text-slate-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
                    <Music className="w-3 h-3 text-emerald-400" /> Songs
                  </p>
                </div>
              </div>

              {/* Phase 2 Action Buttons */}
              {(onEditRelationship || onArchiveRelationship) && (
                <div className="flex items-center gap-2 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition">
                  {onEditRelationship && (
                    <button
                      onClick={() => onEditRelationship(rel)}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold transition"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  {onArchiveRelationship && (
                    <button
                      onClick={() => onArchiveRelationship(rel.id)}
                      className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold transition ml-auto"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      {rel.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
