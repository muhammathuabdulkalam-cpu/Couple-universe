import { motion } from 'framer-motion';
import { Calendar, CloudSun, Moon, Sparkles, Sun } from 'lucide-react';
import React from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { Badge } from '../ui/Badge.js';

export const WelcomeHeader: React.FC = () => {
  const { user } = useAuthStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { text: 'Good Morning', icon: <Sun className="w-3.5 h-3.5 text-amber-400" /> };
    } else if (hour >= 12 && hour < 17) {
      return { text: 'Good Afternoon', icon: <CloudSun className="w-3.5 h-3.5 text-afzal" /> };
    } else {
      return { text: 'Good Evening', icon: <Moon className="w-3.5 h-3.5 text-amrin-glow" /> };
    }
  };

  const greeting = getGreeting();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl p-3.5 relative overflow-hidden border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 h-full"
    >
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-gradient-to-tr from-blue-600/10 via-blue-500/10 to-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-3 relative z-10 min-w-0">
        <div className="space-y-1 truncate">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 glass-card px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white/10">
              {greeting.icon} {greeting.text}
            </span>
            <Badge variant="cyan" size="sm" className="text-[10px] py-0 px-2">
              <Sparkles className="w-2.5 h-2.5" /> Life Vault
            </Badge>
          </div>

          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
            Welcome back, <span className="gradient-text-couple">{user?.name || 'Afzal / Amrin'}</span> ❤️
          </h1>

          <p className="text-slate-600 dark:text-slate-400 text-[11px] font-medium truncate">
            Preserving our lifetime journey since <strong className="text-blue-600 dark:text-blue-400">March 26, 2026</strong>.
          </p>
        </div>
      </div>

      {/* Milestone Date Badge */}
      <div className="glass-card px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 flex items-center gap-2 shrink-0 relative z-10 hidden sm:flex">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-600">
          <Calendar className="w-4 h-4" />
        </div>
        <div className="text-left">
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block leading-none">
            Start Date
          </span>
          <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Mar 26, 2026</span>
        </div>
      </div>
    </motion.div>
  );
};
