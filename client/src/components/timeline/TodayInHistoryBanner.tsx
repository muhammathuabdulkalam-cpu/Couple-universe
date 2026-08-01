import { motion } from 'framer-motion';
import { ExternalLink, Sparkles } from 'lucide-react';
import React from 'react';
import { useTimelineStore } from '../../store/timelineStore.js';
import { Card } from '../ui/Card.js';

export const TodayInHistoryBanner: React.FC = () => {
  const { todayInHistoryEvents, setSelectedEventDetail, setDetailModalOpen } = useTimelineStore();

  if (!todayInHistoryEvents || todayInHistoryEvents.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8 select-none">
      <Card
        variant="glass"
        className="p-6 border-heart/40 bg-gradient-to-r from-obsidian-900 via-obsidian-850 to-obsidian-900 relative overflow-hidden"
      >
        <div className="flex items-center justify-between gap-4 mb-4 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-heart fill-heart animate-pulse" />
            <h3 className="text-base font-extrabold text-white tracking-tight">This Day In History ❤️</h3>
          </div>
          <span className="text-xs font-mono text-amrin-glow font-bold">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {todayInHistoryEvents.map((evt) => {
            const eventYear = new Date(evt.eventDate).getFullYear();
            const yearsAgo = new Date().getFullYear() - eventYear;
            const coverMedia = evt.coverMediaId || (evt.mediaIds && evt.mediaIds[0]);

            return (
              <div
                key={evt._id}
                onClick={() => {
                  setSelectedEventDetail(evt);
                  setDetailModalOpen(true);
                }}
                className="glass-card rounded-2xl border border-white/10 hover:border-heart/40 transition-all overflow-hidden cursor-pointer flex flex-col justify-between group"
              >
                {coverMedia && (
                  <div className="h-36 w-full bg-obsidian-950 relative overflow-hidden">
                    <img
                      src={coverMedia.optimizedUrl || coverMedia.thumbnailUrl || coverMedia.secureUrl}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-transparent to-transparent" />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full glass-card text-[10px] font-bold text-white border border-white/10">
                      {yearsAgo === 0 ? 'Earlier Today' : `${yearsAgo} Year${yearsAgo > 1 ? 's' : ''} Ago`}
                    </span>
                  </div>
                )}

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amrin-glow">{evt.chapter}</span>
                    <span className="text-lg">{evt.emoji}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white truncate">{evt.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{evt.shortDescription || evt.content || 'Recorded in relationship journal.'}</p>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-afzal-glow font-semibold border-t border-white/5">
                    <span>Open Story Memory</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
};
