import React from 'react';
import { Heart, Calendar, Clock, Eye, Layers, Image as ImageIcon, BookOpen, Music, CheckCircle2 } from 'lucide-react';
import { PrimaryCoupleData } from '../../types/admin.types';
import { useAdminAuthStore } from '../../store/adminAuthStore';

interface PrimaryCoupleOverviewProps {
  data: PrimaryCoupleData;
}

export const PrimaryCoupleOverview: React.FC<PrimaryCoupleOverviewProps> = ({ data }) => {
  const { setSelectedUserIdForDrawer } = useAdminAuthStore();

  const partner1 = data.partners[0];
  const partner2 = data.partners[1];

  return (
    <div className="relative overflow-hidden bg-[#16161E] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
      {/* Background Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={data.photo}
                alt="Primary Couple"
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-indigo-500/50 shadow-lg shadow-indigo-950/50"
              />
              <div className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 rounded-full text-white shadow-md">
                <Heart className="w-3.5 h-3.5 fill-current" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">{data.coupleName}</h2>
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-extrabold tracking-wider uppercase">
                  Primary Couple
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>{data.relationshipType}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Platform Owners
                </span>
              </p>
            </div>
          </div>

          {/* Quick View Button */}
          {partner1?.id && (
            <button
              onClick={() => setSelectedUserIdForDrawer(partner1.id)}
              className="px-4 py-2.5 rounded-full bg-white hover:bg-slate-200 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 transition w-fit"
            >
              <Eye className="w-4 h-4 text-slate-950" />
              <span>Quick View Owners</span>
            </button>
          )}
        </div>

        {/* Partners & Online Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Partner 1 Info */}
          {partner1 && (
            <div
              onClick={() => setSelectedUserIdForDrawer(partner1.id)}
              className="p-4 rounded-2xl bg-[#1E1E28] border border-white/5 hover:border-indigo-500/40 transition cursor-pointer flex items-center gap-3.5"
            >
              <img
                src={partner1.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                alt={partner1.name}
                className="w-12 h-12 rounded-xl object-cover border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white truncate">{partner1.name}</p>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      partner1.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                </div>
                <p className="text-[10px] text-slate-400 truncate">{partner1.email}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[9px] font-extrabold">
                  {partner1.role}
                </span>
              </div>
            </div>
          )}

          {/* Partner 2 Info */}
          {partner2 && (
            <div
              onClick={() => setSelectedUserIdForDrawer(partner2.id)}
              className="p-4 rounded-2xl bg-[#1E1E28] border border-white/5 hover:border-indigo-500/40 transition cursor-pointer flex items-center gap-3.5"
            >
              <img
                src={partner2.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'}
                alt={partner2.name}
                className="w-12 h-12 rounded-xl object-cover border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white truncate">{partner2.name}</p>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      partner2.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                </div>
                <p className="text-[10px] text-slate-400 truncate">{partner2.email}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[9px] font-extrabold">
                  {partner2.role}
                </span>
              </div>
            </div>
          )}

          {/* Relationship Metrics */}
          <div className="p-4 rounded-2xl bg-[#1E1E28] border border-white/5 flex items-center justify-around">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-indigo-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-lg font-black text-white">{data.daysTogether}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400">Days Together</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-indigo-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold text-white">{data.startDate}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400">Anniversary</p>
            </div>
          </div>
        </div>

        {/* Primary Couple Shared Activity Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-[#1E1E28] border border-white/5 flex items-center gap-3">
            <Layers className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-base font-black text-white">{data.stats.totalMemories}</p>
              <p className="text-[10px] text-slate-400 font-bold">Total Memories</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1E1E28] border border-white/5 flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-base font-black text-white">{data.stats.totalAlbums}</p>
              <p className="text-[10px] text-slate-400 font-bold">Total Albums</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1E1E28] border border-white/5 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-base font-black text-white">{data.stats.totalStories}</p>
              <p className="text-[10px] text-slate-400 font-bold">Total Stories</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1E1E28] border border-white/5 flex items-center gap-3">
            <Music className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-base font-black text-white">{data.stats.totalSharedSongs}</p>
              <p className="text-[10px] text-slate-400 font-bold">Shared Songs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
