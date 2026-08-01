import { useQuery } from '@tanstack/react-query';
import { Calendar, Sparkles } from 'lucide-react';
import React from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { ApiResponse, TimelineEvent } from '../../types/index.js';
import { Card } from '../ui/Card.js';

export const TodaysMemoryWidget: React.FC = () => {
  const { data: todayMemories } = useQuery<TimelineEvent[]>({
    queryKey: ['todayInHistoryWidget'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<TimelineEvent[]>>('/timeline/today-in-history');
      return res.data.data!;
    },
  });

  const memory = todayMemories && todayMemories.length > 0 ? todayMemories[0] : null;

  return (
    <Card variant="glass" className="p-3.5 h-auto space-y-2.5 border-heart/20">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-heart-glow flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-heart" /> Today In History ❤️
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {memory ? (
        <div className="glass-card p-3 rounded-xl space-y-1 border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-base">{memory.emoji}</span>
            <span className="text-[10px] font-mono text-amrin-glow font-bold">
              {new Date(memory.eventDate).getFullYear()}
            </span>
          </div>
          <h4 className="text-xs font-bold text-white truncate">{memory.title}</h4>
          <p className="text-[11px] text-slate-400 line-clamp-2">
            {memory.shortDescription || memory.content || 'Recorded in relationship journal.'}
          </p>
        </div>
      ) : (
        <div className="glass-card p-3.5 rounded-xl text-center space-y-1.5 border-dashed border-white/10">
          <div className="w-8 h-8 rounded-xl bg-heart/10 border border-heart/30 flex items-center justify-center text-heart mx-auto">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white">Relationship Milestone Era</h4>
          <p className="text-[11px] text-slate-400 leading-tight">
            Journey starting March 26, 2026. Memories recorded on this day will appear here.
          </p>
        </div>
      )}
    </Card>
  );
};
