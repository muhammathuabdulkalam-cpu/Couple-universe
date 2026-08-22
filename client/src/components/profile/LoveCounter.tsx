import { Heart, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { Card } from '../ui/Card.js';

interface TogetherTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const LoveCounter: React.FC = () => {
  const { user } = useAuthStore();
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

  const theme = useUIStore((s) => s.theme);

  if (user?.role === 'INVITED_USER') {
    return null;
  }

  return (
    <Card
      variant="glass"
      className={`p-3 sm:p-6 border text-center space-y-2 sm:space-y-4 shadow-2xl relative overflow-hidden select-none ${
        theme === 'light'
          ? 'border-blue-500/20 bg-gradient-to-r from-slate-50 via-blue-500/5 to-slate-50'
          : 'border-heart/30 dark:border-heart/40 bg-gradient-to-r from-slate-50 via-heart/5 to-slate-50 dark:from-obsidian-900 dark:via-heart/10 dark:to-obsidian-900'
      }`}
    >
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        <Heart className={`w-3.5 h-3.5 sm:w-5 sm:h-5 fill-current animate-pulse ${
          theme === 'light' ? 'text-blue-500' : 'text-heart'
        }`} />
        <h3 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Afzal & Amrin Love Counter ❤️</h3>
        <Sparkles className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
          theme === 'light' ? 'text-blue-500' : 'text-amrin dark:text-amrin-glow'
        }`} />
      </div>

      <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 font-semibold">Togetherness starting March 26, 2026</p>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-3 max-w-lg mx-auto pt-1 sm:pt-2">
        <div className="glass-card p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/10 text-center space-y-0.5">
          <span className="text-base sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono gradient-text-couple">
            {timeTogether.days}
          </span>
          <span className="block text-[8px] sm:text-[10px] font-bold uppercase text-slate-550 dark:text-slate-400">Days</span>
        </div>

        <div className="glass-card p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/10 text-center space-y-0.5">
          <span className="text-base sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {timeTogether.hours}
          </span>
          <span className="block text-[8px] sm:text-[10px] font-bold uppercase text-slate-550 dark:text-slate-400">Hours</span>
        </div>

        <div className="glass-card p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/10 text-center space-y-0.5">
          <span className="text-base sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {timeTogether.minutes}
          </span>
          <span className="block text-[8px] sm:text-[10px] font-bold uppercase text-slate-550 dark:text-slate-400">Mins</span>
        </div>

        <div className={`glass-card p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border text-center space-y-0.5 ${
          theme === 'light' ? 'border-blue-500/20' : 'border-heart/20 dark:border-heart/30'
        }`}>
          <span className={`text-base sm:text-3xl font-extrabold font-mono animate-pulse ${
            theme === 'light' ? 'text-blue-600' : 'text-heart dark:text-heart-glow'
          }`}>
            {timeTogether.seconds}
          </span>
          <span className={`block text-[8px] sm:text-[10px] font-bold uppercase ${
            theme === 'light' ? 'text-blue-600' : 'text-heart dark:text-heart-glow'
          }`}>Secs</span>
        </div>
      </div>
    </Card>
  );
};
