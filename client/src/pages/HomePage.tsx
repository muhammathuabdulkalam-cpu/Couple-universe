import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import React from 'react';
import { axiosClient } from '../api/axiosClient.js';
import { BirthdayCountdown } from '../components/dashboard/BirthdayCountdown.js';
import { HeaderBanner } from '../components/dashboard/HeaderBanner.js';
import { RecentMemoriesGrid } from '../components/dashboard/RecentMemoriesGrid.js';
import { FeedCard } from '../components/social/FeedCard.js';
import { StoryCarousel } from '../components/social/StoryCarousel.js';
import { Skeleton } from '../components/ui/Skeleton.js';
import { useAuthStore } from '../store/authStore.js';
import { ActivityItem, ApiResponse } from '../types/index.js';

import { useLocation } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const locationState = location.state as { highlightId?: string; openComments?: boolean; openLikes?: boolean } | null;

  // Fetch Social Feed Activities
  const { data: feedData, isLoading: isFeedLoading } = useQuery<ApiResponse<ActivityItem[]>>({
    queryKey: ['feed'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<ActivityItem[]>>('/feed');
      return res.data;
    },
  });

  // Fetch User & Partner Profile to check birthday countdown
  const { data: profileData } = useQuery<any>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<any>>('/profile');
      return res.data.data;
    },
  });

  const isUserAfzal = user?.role === 'SUPER_OWNER' || user?.name?.toLowerCase().includes('afzal');
  const rawBirthday = profileData?.partner?.birthday || (isUserAfzal ? '2026-11-24T00:00:00.000Z' : '2026-10-15T00:00:00.000Z');

  // Calculate days remaining to partner birthday
  const birthDate = new Date(rawBirthday);
  const now = new Date();
  let nextBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (nextBirthday.getTime() < now.getTime()) {
    nextBirthday.setFullYear(now.getFullYear() + 1);
  }
  const daysLeft = Math.floor((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Show featured banner on Dashboard Home Feed ONLY if partner birthday is in <= 10 days
  const showDashboardBirthdayBanner = daysLeft <= 10;

  const rawActivities = feedData?.data || [];

  // Re-order activities so highlighted post from notification is placed at index 0
  const sortedActivities = React.useMemo(() => {
    if (!locationState?.highlightId) return rawActivities;

    const targetId = locationState.highlightId;
    const matchIndex = rawActivities.findIndex(
      (a) =>
        a._id === targetId ||
        a.referenceId === targetId ||
        (typeof a.referenceId === 'object' && (a.referenceId as any)?._id === targetId)
    );

    if (matchIndex > 0) {
      const matched = rawActivities[matchIndex];
      const rest = rawActivities.filter((_, i) => i !== matchIndex);
      return [matched, ...rest];
    }

    return rawActivities;
  }, [rawActivities, locationState?.highlightId]);

  return (
    <div className="space-y-3.5 pb-16 max-w-7xl mx-auto select-none">
      
      {/* 1. Ultra-Compact Top Instagram Stories Row */}
      <div className="glass-panel p-2 rounded-2xl border border-white/10 shadow-md overflow-hidden bg-obsidian-950/80">
        <StoryCarousel />
      </div>

      {/* 2. Compact Single Horizontal Card Banner */}
      <HeaderBanner />

      {/* 3. Featured Partner Birthday Banner (Only when <= 10 days away) */}
      {showDashboardBirthdayBanner && (
        <BirthdayCountdown variant="banner" />
      )}

      {/* 4. Centered Single Column Instagram Feed */}
      <div className="max-w-2xl mx-auto space-y-4 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-extrabold text-white flex items-center gap-1.5 tracking-tight">
            <Sparkles className="w-3.5 h-3.5 text-amrin-glow" /> Couple Feed & Updates
          </h2>
          <span className="text-[10px] text-slate-400 font-medium">Real-time</span>
        </div>

        {/* Feed Cards List */}
        {isFeedLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        ) : sortedActivities.length > 0 ? (
          <div className="space-y-4">
            {sortedActivities.map((act) => {
              const isTarget =
                Boolean(locationState?.highlightId) &&
                (act._id === locationState?.highlightId ||
                  act.referenceId === locationState?.highlightId ||
                  (typeof act.referenceId === 'object' && (act.referenceId as any)?._id === locationState?.highlightId));

              return (
                <FeedCard
                  key={act._id}
                  activity={act}
                  autoOpenComments={isTarget && Boolean(locationState?.openComments)}
                  autoOpenLikes={isTarget && Boolean(locationState?.openLikes)}
                  highlighted={isTarget}
                />
              );
            })}
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-8 text-center space-y-3 border border-white/5">
            <div className="w-12 h-12 rounded-full bg-amrin/20 text-amrin-glow flex items-center justify-center mx-auto text-xl font-bold">
              ❤️
            </div>
            <p className="text-sm font-bold text-white">Your Feed is Ready</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Share photos, videos, and milestones using the + button to see posts here!
            </p>
          </div>
        )}

        {/* Recent Memories Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <RecentMemoriesGrid />
        </motion.div>

      </div>

    </div>
  );
};
