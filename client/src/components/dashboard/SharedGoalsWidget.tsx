import { CheckSquare, Target } from 'lucide-react';
import React from 'react';
import { Card } from '../ui/Card.js';

export const SharedGoalsWidget: React.FC = () => {
  const goals = [
    { title: 'Launch Couple Universe Platform', completed: true },
    { title: 'First International Trip Together', completed: false },
    { title: 'Shared Lifetime Memory Vault', completed: true },
    { title: 'Marriage & Family Chapter', completed: false },
  ];

  return (
    <Card variant="glass" className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" /> Shared Life Goals
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">2 / 4 Completed</span>
      </div>

      <div className="space-y-2">
        {goals.map((g, idx) => (
          <div key={idx} className="glass-card p-3 rounded-xl flex items-center justify-between text-xs border border-slate-200 dark:border-white/5">
            <span className={g.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-white font-medium'}>
              {g.title}
            </span>
            <CheckSquare className={`w-4 h-4 ${g.completed ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`} />
          </div>
        ))}
      </div>
    </Card>
  );
};
