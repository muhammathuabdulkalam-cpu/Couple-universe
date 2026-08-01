import { Quote, Sparkles } from 'lucide-react';
import React from 'react';
import { Card } from '../ui/Card.js';

export const QuoteOfDayCard: React.FC = () => {
  return (
    <Card variant="glass" className="p-6 h-full flex flex-col justify-between border-amrin/20">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-amrin-glow flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Quote of the Day
        </span>
        <Quote className="w-5 h-5 text-amrin/40" />
      </div>

      <blockquote className="text-sm font-medium text-slate-200 italic leading-relaxed my-2">
        "Love is not about how many days, months, or years you have been together. Love is about how much you love each other every single day."
      </blockquote>

      <div className="text-right text-[11px] font-semibold text-slate-400 mt-4">
        — Afzal & Amrin ❤️
      </div>
    </Card>
  );
};
