import { useQuery } from '@tanstack/react-query';
import { Calendar, FolderHeart, Plus } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient.js';
import { useTimelineStore } from '../../store/timelineStore.js';
import { ApiResponse, TimelineEvent } from '../../types/index.js';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';

export const RecentMemoriesGrid: React.FC = () => {
  const { setEditingEvent, setCreateModalOpen, setSelectedEventDetail, setDetailModalOpen } =
    useTimelineStore();

  const { data: recentEvents } = useQuery<TimelineEvent[]>({
    queryKey: ['recentTimelineEvents'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<TimelineEvent[]>>('/timeline', {
        params: { limit: 3 },
      });
      return res.data.data!;
    },
  });

  return (
    <Card variant="solid" className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Recent Memories Vault</h3>
          <p className="text-xs text-slate-400">Captured moments from our journey</p>
        </div>
        <Button
          variant="glass"
          size="sm"
          onClick={() => {
            setEditingEvent(null);
            setCreateModalOpen(true);
          }}
          leftIcon={<Plus className="w-3.5 h-3.5 text-afzal" />}
        >
          Add Memory
        </Button>
      </div>

      {recentEvents && recentEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {recentEvents.map((evt) => {
            const coverMedia = evt.coverMediaId || (evt.mediaIds && evt.mediaIds[0]);

            return (
              <div
                key={evt._id}
                onClick={() => {
                  setSelectedEventDetail(evt);
                  setDetailModalOpen(true);
                }}
                className="glass-card p-4 rounded-2xl space-y-3 border-white/10 hover:border-amrin/30 transition-all cursor-pointer group"
              >
                <div className="h-28 bg-obsidian-950/80 rounded-xl flex items-center justify-center text-slate-500 border border-white/5 overflow-hidden relative">
                  {coverMedia ? (
                    <img
                      src={coverMedia.optimizedUrl || coverMedia.thumbnailUrl || coverMedia.secureUrl}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <FolderHeart className="w-8 h-8 text-amrin/40" />
                  )}
                  <span className="absolute top-2 right-2 text-base">{evt.emoji}</span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white truncate">{evt.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-afzal" />
                    {new Date(evt.eventDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-slate-400">
          No memories recorded yet. Record your first memory event in{' '}
          <Link to="/timeline" className="text-amrin-glow underline font-semibold">
            Timeline Journal
          </Link>
          .
        </div>
      )}
    </Card>
  );
};
