import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Cake, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { ApiResponse } from '../../types/index.js';

interface BirthdayCountdownProps {
  variant?: 'compact' | 'banner';
}

export const BirthdayCountdown: React.FC<BirthdayCountdownProps> = ({ variant = 'compact' }) => {
  const { user } = useAuthStore();

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

  // Partner Info
  const partnerName = partner?.name || (isUserAfzal ? 'Amrin' : 'Afzal');
  const partnerRole = isUserAfzal ? 'My Princess 👸' : 'My Prince 👑';
  const partnerAvatar = partner?.avatar;

  // Default Birthday Dates: Amrin (Nov 24), Afzal (Oct 15) if not set in DB
  const rawBirthday = partner?.birthday || (isUserAfzal ? '2026-11-24T00:00:00.000Z' : '2026-10-15T00:00:00.000Z');

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateCountdown = () => {
      const birthDate = new Date(rawBirthday);
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
  }, [rawBirthday]);

  // Dynamic Wording
  const getHeadingText = () => {
    if (timeLeft.days === 0) return `🎉 Happy Birthday ${partnerName}! ❤️`;
    if (timeLeft.days <= 7) return `🎂 ${partnerName}'s Special Day is Coming Soon!`;
    return `❤️ Your Love's Birthday is in ${timeLeft.days} Days`;
  };

  // 1. Compact Sidebar / Activity Bar Mode (100% vertical column layout for 300px container)
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-3.5 rounded-3xl border border-white/10 shadow-xl bg-gradient-to-b from-obsidian-950 via-obsidian-900 to-obsidian-950 space-y-3 select-none overflow-hidden"
      >
        {/* Top Header Row */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-md shrink-0">
            <div className="w-full h-full bg-obsidian-950 rounded-[10px] flex items-center justify-center overflow-hidden">
              {partnerAvatar ? (
                <img src={partnerAvatar} alt={partnerName} className="w-full h-full object-cover" />
              ) : (
                <Cake className="w-4 h-4 text-amber-400" />
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Birthday
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-amrin/20 text-amrin-glow border border-amrin/30">
                {partnerRole}
              </span>
            </div>
            <h4 className="text-xs font-extrabold text-white truncate mt-0.5">
              {getHeadingText()}
            </h4>
          </div>
        </div>

        {/* 4 Stat Pills Grid (2x2 or 4-col inside sidebar) */}
        <div className="grid grid-cols-4 gap-1.5 text-center pt-1 border-t border-white/5">
          <div className="glass-card py-1.5 rounded-xl border border-white/10">
            <div className="text-xs font-extrabold text-amber-400 font-mono">{timeLeft.days}</div>
            <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">DAYS</div>
          </div>

          <div className="glass-card py-1.5 rounded-xl border border-white/10">
            <div className="text-xs font-extrabold text-rose-400 font-mono">{timeLeft.hours}</div>
            <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">HRS</div>
          </div>

          <div className="glass-card py-1.5 rounded-xl border border-white/10">
            <div className="text-xs font-extrabold text-purple-400 font-mono">{timeLeft.minutes}</div>
            <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">MINS</div>
          </div>

          <div className="glass-card py-1.5 rounded-xl border border-amrin/30">
            <div className="text-xs font-extrabold text-white font-mono">{timeLeft.seconds}</div>
            <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">SECS</div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 2. Wide Featured Banner Mode (for Home Dashboard when days <= 10)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-4 rounded-3xl border border-amber-500/30 shadow-2xl bg-gradient-to-r from-obsidian-950 via-obsidian-900 to-obsidian-950 relative overflow-hidden select-none"
    >
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        
        {/* Left: Partner Avatar & Greeting */}
        <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-lg shadow-rose-500/20 shrink-0">
            <div className="w-full h-full bg-obsidian-950 rounded-[14px] flex items-center justify-center overflow-hidden">
              {partnerAvatar ? (
                <img src={partnerAvatar} alt={partnerName} className="w-full h-full object-cover" />
              ) : (
                <Cake className="w-6 h-6 text-amber-400 animate-bounce" />
              )}
            </div>
          </div>

          <div className="space-y-0.5 truncate">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Upcoming Partner Birthday
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amrin/20 text-amrin-glow border border-amrin/30">
                {partnerRole}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate">
              {getHeadingText()}
            </h3>

            <p className="text-xs text-slate-400 truncate">
              Celebrating <strong className="text-white">{partnerName}'s</strong> special milestone birthday
            </p>
          </div>
        </div>

        {/* Right: Live Countdown Stat Pills */}
        <div className="flex items-center gap-2 text-center shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
          <div className="glass-panel px-3.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10">
            <div className="text-sm sm:text-base font-extrabold text-amber-400 font-mono">{timeLeft.days}</div>
            <div className="text-[8px] font-bold text-slate-300 uppercase tracking-wider">DAYS</div>
          </div>

          <div className="glass-panel px-3.5 py-1.5 rounded-xl border border-white/10">
            <div className="text-sm sm:text-base font-extrabold text-rose-400 font-mono">{timeLeft.hours}</div>
            <div className="text-[8px] font-bold text-slate-300 uppercase tracking-wider">HRS</div>
          </div>

          <div className="glass-panel px-3.5 py-1.5 rounded-xl border border-white/10">
            <div className="text-sm sm:text-base font-extrabold text-purple-400 font-mono">{timeLeft.minutes}</div>
            <div className="text-[8px] font-bold text-slate-300 uppercase tracking-wider">MINS</div>
          </div>

          <div className="glass-panel px-3.5 py-1.5 rounded-xl border border-amrin/30">
            <div className="text-sm sm:text-base font-extrabold text-white font-mono">{timeLeft.seconds}</div>
            <div className="text-[8px] font-bold text-slate-300 uppercase tracking-wider">SECS</div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
