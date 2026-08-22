import { motion } from 'framer-motion';
import { CloudSun, Heart, Moon, Sparkles, Sun } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { Badge } from '../ui/Badge.js';

const START_DATE = '2026-03-26T00:00:00.000Z';

export const HeaderBanner: React.FC = () => {
  const { user } = useAuthStore();
  const theme = useUIStore((s) => s.theme);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { text: 'Good Morning', icon: <Sun className="w-3 h-3 text-amber-400" /> };
    } else if (hour >= 12 && hour < 17) {
      return { text: 'Good Afternoon', icon: <CloudSun className="w-3 h-3 text-afzal" /> };
    } else {
      return { text: 'Good Evening', icon: <Moon className="w-3 h-3 text-amrin-glow" /> };
    }
  };

  const greeting = getGreeting();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-lg bg-white/90 dark:bg-obsidian-950/80 relative overflow-hidden select-none w-full max-w-full"
    >
      <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-gradient-to-tr from-afzal/20 via-amrin/20 to-heart/20 rounded-full blur-2xl pointer-events-none hidden sm:block" />

      <div className="flex flex-col lg:flex-row items-center justify-between gap-2.5 relative z-10">
        
        {/* Left Section: Compact Greeting & Welcome Header */}
        <div className="flex items-center gap-2.5 min-w-0 w-full lg:w-auto">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-afzal via-amrin to-heart p-0.5 shadow-md shrink-0">
            <div className="w-full h-full bg-slate-900 dark:bg-obsidian-950 rounded-[10px] flex items-center justify-center">
              <Heart className="w-4 h-4 text-heart fill-heart animate-pulse" />
            </div>
          </div>

          <div className="space-y-0.5 truncate">
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 glass-card px-2 py-0.5 rounded-full border border-slate-200/80 dark:border-white/10">
                {greeting.icon} {greeting.text}
              </span>
              <Badge variant="violet" size="sm" className="text-[9px] py-0 px-1.5">
                <Sparkles className="w-2.5 h-2.5 text-amrin" /> Vault
              </Badge>
            </div>

            <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight truncate leading-none">
              Welcome back, <span className="gradient-text-couple">{user?.name || 'Afzal & Amrin'}</span> ❤️
            </h1>
          </div>
        </div>

        {/* Center Vertical Divider (Desktop) */}
        <div className="hidden lg:block w-[1px] h-8 bg-slate-200 dark:bg-white/10 shrink-0" />

        {/* Right Section: Compact Togetherness Ticker with Afzal & Amrin */}
        <div className="flex items-center gap-2.5 shrink-0 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-slate-200/60 dark:border-white/5 pt-2 lg:pt-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition ${
              theme === 'light'
                ? 'bg-rose-50 border-rose-200/80 text-rose-600'
                : 'bg-rose-500/10 border border-rose-500/30 text-heart'
            }`}>
              <Heart className={`w-3.5 h-3.5 fill-current animate-pulse`} />
            </div>
            <div className="min-w-0 flex-1 truncate">
              <div className="flex items-center gap-1">
                <span className={`text-[8px] sm:text-[9px] uppercase tracking-wider font-bold truncate ${
                  theme === 'light' ? 'text-rose-600' : 'text-rose-600 dark:text-heart-glow'
                }`}>
                  Afzal & Amrin ✨
                </span>
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    theme === 'light' ? 'bg-rose-500' : 'bg-heart'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                    theme === 'light' ? 'bg-rose-600' : 'bg-heart'
                  }`} />
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                Since Mar 26, 2026 ❤️
              </p>
            </div>
          </div>

          {/* 4 Compact Countdown Stat Pills */}
          <div className="grid grid-cols-4 gap-1 text-center shrink-0">
            <div className="glass-panel px-1.5 sm:px-2 py-0.5 rounded-lg border border-slate-200/80 dark:border-white/10 min-w-[34px]">
              <motion.div key={timeTogether.days} initial={{ scale: 1.05 }} animate={{ scale: 1 }} className={`text-xs font-extrabold font-mono ${
                theme === 'light' ? 'text-rose-600' : 'text-sky-600 dark:text-afzal-glow'
              }`}>
                {timeTogether.days}
              </motion.div>
              <div className="text-[7px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">DAYS</div>
            </div>

            <div className="glass-panel px-1.5 sm:px-2 py-0.5 rounded-lg border border-slate-200/80 dark:border-white/10 min-w-[34px]">
              <motion.div key={timeTogether.hours} initial={{ scale: 1.05 }} animate={{ scale: 1 }} className={`text-xs font-extrabold font-mono ${
                theme === 'light' ? 'text-rose-600' : 'text-violet-600 dark:text-amrin-glow'
              }`}>
                {timeTogether.hours}
              </motion.div>
              <div className="text-[7px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">HRS</div>
            </div>

            <div className="glass-panel px-1.5 sm:px-2 py-0.5 rounded-lg border border-slate-200/80 dark:border-white/10 min-w-[34px]">
              <motion.div key={timeTogether.minutes} initial={{ scale: 1.05 }} animate={{ scale: 1 }} className={`text-xs font-extrabold font-mono ${
                theme === 'light' ? 'text-rose-600' : 'text-rose-600 dark:text-heart-glow'
              }`}>
                {timeTogether.minutes}
              </motion.div>
              <div className="text-[7px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">MINS</div>
            </div>

            <div className={`glass-panel px-1.5 sm:px-2 py-0.5 rounded-lg min-w-[34px] border ${
              theme === 'light' ? 'border-rose-500/20' : 'border-amrin/30'
            }`}>
              <motion.div key={timeTogether.seconds} initial={{ scale: 1.05 }} animate={{ scale: 1 }} className={`text-xs font-extrabold font-mono ${
                theme === 'light' ? 'text-rose-600' : 'text-slate-900 dark:text-white'
              }`}>
                {timeTogether.seconds}
              </motion.div>
              <div className="text-[7px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">SECS</div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
