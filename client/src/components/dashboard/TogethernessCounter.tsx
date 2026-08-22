import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card.js';

const START_DATE = '2026-03-26T00:00:00.000Z';

export const TogethernessCounter: React.FC = () => {
  const [timeTogether, setTimeTogether] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(START_DATE).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeTogether({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card variant="glass" className="border-heart/30 bg-gradient-to-r from-slate-100/90 via-white to-slate-100/90 dark:from-obsidian-900 dark:via-obsidian-850 dark:to-obsidian-900 relative overflow-hidden p-3.5 flex items-center justify-between gap-3 h-full">
      
      {/* Title & Pulsing Heart Icon */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-heart/10 border border-heart/30 flex items-center justify-center shrink-0">
          <Heart className="w-5 h-5 text-heart fill-heart animate-pulse" />
        </div>
        <div className="truncate">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-widest font-bold text-heart dark:text-heart-glow">
              Togetherness Ticker
            </span>
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-heart opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-heart" />
            </span>
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">Afzal & Amrin • Days of Togetherness</h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Counting since March 26, 2026</p>
        </div>
      </div>

      {/* 4 Compact Stat Pills */}
      <div className="grid grid-cols-4 gap-1.5 text-center shrink-0">
        <div className="glass-panel px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/5">
          <motion.div key={timeTogether.days} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400 font-mono">
            {timeTogether.days}
          </motion.div>
          <div className="text-[8px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Days</div>
        </div>

        <div className="glass-panel px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/5">
          <motion.div key={timeTogether.hours} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400 font-mono">
            {timeTogether.hours}
          </motion.div>
          <div className="text-[8px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Hrs</div>
        </div>

        <div className="glass-panel px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/5">
          <motion.div key={timeTogether.minutes} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400 font-mono">
            {timeTogether.minutes}
          </motion.div>
          <div className="text-[8px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Mins</div>
        </div>

        <div className="glass-panel px-2.5 py-1 rounded-xl border border-blue-500/20 dark:border-blue-500/30">
          <motion.div key={timeTogether.seconds} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400 font-mono animate-pulse">
            {timeTogether.seconds}
          </motion.div>
          <div className="text-[8px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Secs</div>
        </div>
      </div>

    </Card>
  );
};
