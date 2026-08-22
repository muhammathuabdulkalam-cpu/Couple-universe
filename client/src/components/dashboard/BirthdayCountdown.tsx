import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { ApiResponse } from '../../types/index.js';

import { Avatar } from '../ui/Avatar.js';

interface BirthdayCountdownProps {
  variant?: 'compact' | 'banner';
}

export const BirthdayCountdown: React.FC<BirthdayCountdownProps> = ({ variant = 'compact' }) => {
  const { user } = useAuthStore();
  const theme = useUIStore((s) => s.theme);

  // Fetch Profile details (includes partner information & birthday)
  const { data: profileData } = useQuery<any>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<any>>('/profile');
      return res.data.data;
    },
  });

  const partner = profileData?.partner;

  const isUserAfzal = user?.role === 'SUPER_OWNER' || user?.name?.toLowerCase().includes('afzal');
  const isUserAmrin = user?.role === 'CO_OWNER' || user?.name?.toLowerCase().includes('amrin');

  // Activity Bar (compact variant) MUST ONLY show the partner if they are the other owner.
  // If the user is not SUPER_OWNER or CO_OWNER, hide from the activity bar entirely.
  if (variant === 'compact') {
    if (!isUserAfzal && !isUserAmrin) {
      return null;
    }
  }

  // Determine target info
  let targetName = 'Partner';
  let targetRole = 'Partner';
  let targetAvatar = '';
  let targetBirthday = '';

  if (isUserAfzal) {
    // Afzal sees Amrin's birthday only
    const isPartnerAmrin = partner?.role === 'CO_OWNER' || partner?.name?.toLowerCase().includes('amrin');
    targetName = isPartnerAmrin ? partner.name : 'Amrin';
    targetRole = 'My Princess 👸';
    targetAvatar = isPartnerAmrin ? partner.avatar : 'https://res.cloudinary.com/ps3wxidk/image/upload/v1787072949/afrin-universe/profiles/profile_avatar_cfnbor.jpg';
    targetBirthday = (isPartnerAmrin && partner.birthday) ? partner.birthday : '2007-10-16T00:00:00.000Z';
  } else if (isUserAmrin) {
    // Amrin sees Afzal's birthday only
    const isPartnerAfzal = partner?.role === 'SUPER_OWNER' || partner?.name?.toLowerCase().includes('afzal');
    targetName = isPartnerAfzal ? partner.name : 'Afzal';
    targetRole = 'My Prince 👑';
    targetAvatar = isPartnerAfzal ? partner.avatar : 'https://res.cloudinary.com/ps3wxidk/image/upload/v1787199988/afrin-universe/profiles/profile_avatar_zhdf7f.jpg';
    targetBirthday = (isPartnerAfzal && partner.birthday) ? partner.birthday : '2002-07-02T00:00:00.000Z';
  } else {
    // Other users see whatever partner they have
    if (variant === 'compact') {
      return null;
    }
    targetName = partner?.name || 'Partner';
    targetRole = 'Partner';
    targetAvatar = partner?.avatar || '';
    targetBirthday = partner?.birthday || '2002-07-02T00:00:00.000Z';
  }

  // Dismiss Banner state (Home Page only)
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`hide_birthday_${targetName}`) === 'true';
    }
    return false;
  });

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!targetBirthday) return;
    const calculateCountdown = () => {
      const birthDate = new Date(targetBirthday);
      const now = new Date();

      // Determine next upcoming birthday year
      let nextBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      if (nextBirthday.getTime() < now.getTime()) {
        nextBirthday.setFullYear(now.getFullYear() + 1);
      }

      const diff = Math.max(0, nextBirthday.getTime() - now.getTime());

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetBirthday]);

  if (isDismissed) {
    return null;
  }

  // Dynamic Wording
  const getHeadingText = () => {
    if (timeLeft.days === 0) return `🎉 Happy Birthday ${targetName}! ❤️`;
    if (timeLeft.days <= 7) return `🎂 ${targetName}'s Special Day is Coming Soon!`;
    return `❤️ Your Love's Birthday is in ${timeLeft.days} Days`;
  };

  // 1. Compact Sidebar / Activity Bar Mode
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-3.5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl bg-white/90 dark:bg-gradient-to-b dark:from-obsidian-950 dark:via-obsidian-900 dark:to-obsidian-950 space-y-3 select-none overflow-hidden"
      >
        {/* Top Header Row */}
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl p-0.5 shadow-md shrink-0 transition-all ${
            theme === 'light'
              ? 'bg-gradient-to-tr from-blue-600 via-sky-400 to-indigo-500'
              : 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600'
          }`}>
            <div className="w-full h-full bg-slate-900 dark:bg-obsidian-950 rounded-[10px] flex items-center justify-center overflow-hidden">
              <Avatar src={targetAvatar} name={targetName} size="sm" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Birthday
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-violet-100 dark:bg-amrin/20 text-violet-800 dark:text-amrin-glow border border-violet-300 dark:border-amrin/30">
                {targetRole}
              </span>
            </div>
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
              {getHeadingText()}
            </h4>
          </div>
        </div>

        {/* 4 Stat Pills Grid */}
        <div className="grid grid-cols-4 gap-1.5 text-center pt-1 border-t border-slate-200/60 dark:border-white/5">
          <div className="glass-card py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10">
            <div className={`text-xs font-extrabold font-mono ${theme === 'light' ? 'text-blue-600' : 'text-amber-600 dark:text-amber-400'}`}>{timeLeft.days}</div>
            <div className="text-[7px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">DAYS</div>
          </div>

          <div className="glass-card py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10">
            <div className={`text-xs font-extrabold font-mono ${theme === 'light' ? 'text-blue-600' : 'text-rose-600 dark:text-rose-400'}`}>{timeLeft.hours}</div>
            <div className="text-[7px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">HRS</div>
          </div>

          <div className="glass-card py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10">
            <div className={`text-xs font-extrabold font-mono ${theme === 'light' ? 'text-blue-600' : 'text-purple-600 dark:text-purple-400'}`}>{timeLeft.minutes}</div>
            <div className="text-[7px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">MINS</div>
          </div>

          <div className={`glass-card py-1.5 rounded-xl border ${theme === 'light' ? 'border-blue-500/20' : 'border-amrin/30'}`}>
            <div className={`text-xs font-extrabold font-mono ${theme === 'light' ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>{timeLeft.seconds}</div>
            <div className="text-[7px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">SECS</div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 2. Wide Featured Banner Mode (with close/dismiss button on Home page)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-4 rounded-3xl border border-amber-500/30 shadow-2xl bg-white/90 dark:bg-gradient-to-r dark:from-obsidian-950 dark:via-obsidian-900 dark:to-obsidian-950 relative overflow-hidden select-none"
    >
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Dismiss Button */}
      <button
        onClick={() => {
          localStorage.setItem(`hide_birthday_${targetName}`, 'true');
          setIsDismissed(true);
        }}
        className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition z-20"
        title="Dismiss Countdown"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        
        {/* Left: Partner Avatar & Greeting */}
        <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
          <div className={`w-12 h-12 rounded-2xl p-0.5 shrink-0 transition-all ${
            theme === 'light'
              ? 'bg-gradient-to-tr from-blue-600 via-sky-400 to-indigo-500 shadow-lg shadow-blue-500/25'
              : 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-lg shadow-rose-500/20'
          }`}>
            <div className="w-full h-full bg-slate-900 dark:bg-obsidian-950 rounded-[14px] flex items-center justify-center overflow-hidden">
              <Avatar src={targetAvatar} name={targetName} size="md" />
            </div>
          </div>

          <div className="space-y-0.5 truncate">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Upcoming Partner Birthday
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-100 dark:bg-amrin/20 text-violet-800 dark:text-amrin-glow border border-violet-300 dark:border-amrin/30">
                {targetRole}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
              {getHeadingText()}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
              Celebrating <strong className="text-slate-900 dark:text-white">{targetName}'s</strong> special milestone birthday
            </p>
          </div>
        </div>

        {/* Right: Live Countdown Stat Pills */}
        <div className="flex items-center gap-2 text-center shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-200/60 dark:border-white/5 pt-3 md:pt-0">
          <div className={`glass-panel px-3.5 py-1.5 rounded-xl border ${theme === 'light' ? 'border-blue-500/20 bg-blue-50/50' : 'border-amber-500/30 bg-amber-500/10'}`}>
            <div className={`text-sm sm:text-base font-extrabold font-mono ${theme === 'light' ? 'text-blue-600' : 'text-amber-600 dark:text-amber-400'}`}>{timeLeft.days}</div>
            <div className="text-[8px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">DAYS</div>
          </div>

          <div className="glass-panel px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10">
            <div className={`text-sm sm:text-base font-extrabold font-mono ${theme === 'light' ? 'text-blue-600' : 'text-rose-600 dark:text-rose-400'}`}>{timeLeft.hours}</div>
            <div className="text-[8px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">HRS</div>
          </div>

          <div className="glass-panel px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10">
            <div className={`text-sm sm:text-base font-extrabold font-mono ${theme === 'light' ? 'text-blue-600' : 'text-purple-600 dark:text-purple-400'}`}>{timeLeft.minutes}</div>
            <div className="text-[8px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">MINS</div>
          </div>

          <div className={`glass-panel px-3.5 py-1.5 rounded-xl border ${theme === 'light' ? 'border-blue-500/20' : 'border-amrin/30'}`}>
            <div className={`text-sm sm:text-base font-extrabold font-mono ${theme === 'light' ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>{timeLeft.seconds}</div>
            <div className="text-[8px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">SECS</div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
