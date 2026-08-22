import { useQuery } from '@tanstack/react-query';
import { Calendar, Sparkles } from 'lucide-react';
import React from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { ApiResponse, TimelineEvent } from '../../types/index.js';
import { Card } from '../ui/Card.js';
import { useUIStore } from '../../store/uiStore.js';

export const TodaysMemoryWidget: React.FC = () => {
  const theme = useUIStore((s) => s.theme);

  const { data: todayMemories } = useQuery<TimelineEvent[]>({
    queryKey: ['todayInHistoryWidget'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<TimelineEvent[]>>('/timeline/today-in-history');
      return res.data.data!;
    },
  });

  const memory = todayMemories && todayMemories.length > 0 ? todayMemories[0] : null;

  return (
    <Card
      variant="glass"
      className={`p-3.5 h-auto space-y-2.5 border transition-colors ${
        theme === 'light' ? 'border-blue-500/20' : 'border-rose-500/20'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold flex items-center gap-1.5 ${
          theme === 'light' ? 'text-blue-600 dark:text-heart-glow' : 'text-rose-600 dark:text-heart-glow'
        }`}>
          <Calendar className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-blue-500' : 'text-heart'}`} /> Today In History ❤️
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {memory ? (
        <div className="glass-card p-3 rounded-xl space-y-1 border-slate-200/80 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-base">{memory.emoji}</span>
            <span className="text-[10px] font-mono text-violet-600 dark:text-amrin-glow font-bold">
              {new Date(memory.eventDate).getFullYear()}
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{memory.title}</h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
            {memory.shortDescription || memory.content || 'Recorded in relationship journal.'}
          </p>
        </div>
      ) : (
        <div className="glass-card p-3.5 rounded-xl text-center space-y-1.5 border-dashed border-slate-200 dark:border-white/10">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto border transition ${
            theme === 'light'
              ? 'bg-blue-550/10 border-blue-500/30 text-blue-600'
              : 'bg-heart/10 border-heart/30 text-heart'
          }`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Relationship Milestone Era</h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
            Journey starting March 26, 2026. Memories recorded on this day will appear here.
          </p>
        </div>
      )}
    </Card>
  );
};
