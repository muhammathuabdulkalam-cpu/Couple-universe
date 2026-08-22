import { Heart } from 'lucide-react';
import React from 'react';
import { Card } from '../ui/Card.js';
import { useUIStore } from '../../store/uiStore.js';

export const AnniversaryCountdownWidget: React.FC = () => {
  const theme = useUIStore((s) => s.theme);

  return (
    <Card
      variant="glass"
      className={`p-3.5 h-auto space-y-2 border transition-colors ${
        theme === 'light' ? 'border-blue-500/20' : 'border-rose-500/20'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold flex items-center gap-1.5 ${
          theme === 'light' ? 'text-blue-600 dark:text-heart-glow' : 'text-rose-600 dark:text-heart-glow'
        }`}>
          <Heart className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-blue-600 fill-blue-600/30' : 'fill-heart'}`} /> Anniversary Milestone
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">March 26</span>
      </div>

      <div className="text-center space-y-1 py-1">
        <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">1st Anniversary</div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
          Counting down to our first official year together on March 26, 2027.
        </p>
      </div>
    </Card>
  );
};
