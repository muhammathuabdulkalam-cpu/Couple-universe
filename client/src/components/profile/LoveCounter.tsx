import { Heart, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card.js';

interface TogetherTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const LoveCounter: React.FC = () => {
  const [timeTogether, setTimeTogether] = useState<TogetherTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const startDate = new Date('2026-03-26T00:00:00.000Z');

  useEffect(() => {
    const updateCounter = () => {
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - startDate.getTime());

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeTogether({ days, hours, minutes, seconds });
    };

    updateCounter();
    const interval = setInterval(updateCounter, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card
      variant="glass"
      className="p-3 sm:p-6 border-heart/40 bg-gradient-to-r from-obsidian-900 via-heart/10 to-obsidian-900 text-center space-y-2 sm:space-y-4 shadow-2xl relative overflow-hidden select-none"
    >
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        <Heart className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-heart fill-heart animate-pulse" />
        <h3 className="text-xs sm:text-base font-extrabold text-white tracking-tight">Afzal & Amrin Love Counter ❤️</h3>
        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amrin-glow" />
      </div>

      <p className="text-[10px] sm:text-xs text-slate-400">Togetherness starting March 26, 2026</p>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-3 max-w-lg mx-auto pt-1 sm:pt-2">
        <div className="glass-card p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border-white/10 text-center space-y-0.5">
          <span className="text-base sm:text-3xl font-extrabold text-white font-mono gradient-text-couple">
            {timeTogether.days}
          </span>
          <span className="block text-[8px] sm:text-[10px] font-bold uppercase text-slate-400">Days</span>
        </div>

        <div className="glass-card p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border-white/10 text-center space-y-0.5">
          <span className="text-base sm:text-3xl font-extrabold text-white font-mono">
            {timeTogether.hours}
          </span>
          <span className="block text-[8px] sm:text-[10px] font-bold uppercase text-slate-400">Hours</span>
        </div>

        <div className="glass-card p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border-white/10 text-center space-y-0.5">
          <span className="text-base sm:text-3xl font-extrabold text-white font-mono">
            {timeTogether.minutes}
          </span>
          <span className="block text-[8px] sm:text-[10px] font-bold uppercase text-slate-400">Mins</span>
        </div>

        <div className="glass-card p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border-white/10 text-center space-y-0.5 border-heart/30">
          <span className="text-base sm:text-3xl font-extrabold text-heart-glow font-mono animate-pulse">
            {timeTogether.seconds}
          </span>
          <span className="block text-[8px] sm:text-[10px] font-bold uppercase text-heart-glow">Secs</span>
        </div>
      </div>
    </Card>
  );
};
