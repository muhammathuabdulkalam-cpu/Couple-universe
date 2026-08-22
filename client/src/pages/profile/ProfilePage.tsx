import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Clock, Grid, Image as ImageIcon, Tag } from 'lucide-react';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient.js';
import { LoveCounter } from '../../components/profile/LoveCounter.js';
import { ProfileGrid } from '../../components/profile/ProfileGrid.js';
import { ProfileHeader } from '../../components/profile/ProfileHeader.js';
import { useAuthStore } from '../../store/authStore.js';
import { ApiResponse } from '../../types/index.js';

type TabType = 'posts' | 'stories' | 'memories' | 'tagged';

export const ProfilePage: React.FC = () => {
  const location = useLocation();
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  const searchParams = new URLSearchParams(location.search);
  const rawQueryUserId = searchParams.get('userId') || searchParams.get('id');
  const locationState = location.state as { targetUserId?: string; userId?: string } | null;
  const rawTargetUserId = rawQueryUserId || locationState?.targetUserId || locationState?.userId;

  const currentUserIdStr = String(currentUser?._id || currentUser?.id || '');
  const cleanTargetUserId = (rawTargetUserId && rawTargetUserId !== 'undefined' && rawTargetUserId !== 'null') ? String(rawTargetUserId) : null;
  const isSelfProfile = !cleanTargetUserId || (Boolean(currentUserIdStr) && cleanTargetUserId === currentUserIdStr);
  const effectiveTargetUserId = isSelfProfile ? null : cleanTargetUserId;

  const navigate = useNavigate();

  // Fetch Profile Stats & Details
  const { data: profileData, isLoading, isError, error, refetch } = useQuery<any>({
    queryKey: ['userProfile', effectiveTargetUserId || 'self'],
    queryFn: async () => {
      const endpoint = effectiveTargetUserId ? `/profile/${effectiveTargetUserId}` : '/profile';
      const res = await axiosClient.get<ApiResponse<any>>(endpoint);
      return res.data.data!;
    },
    retry: false,
  });

  if (isError) {
    const statusCode = (error as any)?.statusCode || (error as any)?.response?.status;
    const errMessage = (error as any)?.message || (error as any)?.response?.data?.message || '';

    // If session is unauthenticated / expired (401), redirect to login page instead of showing fake access restriction
    if (statusCode === 401 || errMessage.toLowerCase().includes('unauthorized') || errMessage.toLowerCase().includes('jwt')) {
      useAuthStore.getState().logout();
      navigate('/login', { replace: true });
      return null;
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-4 glass-card rounded-3xl border border-slate-200 dark:border-white/10 max-w-xl mx-auto my-12 text-slate-800 dark:text-white select-none">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500 dark:text-rose-300 text-2xl">
          🔒
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Profile Access Restricted</h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md">{errMessage || 'Access to this profile is restricted.'}</p>
        <button
          type="button"
          onClick={() => {
            window.history.replaceState(null, '', '/profile');
            navigate('/profile', { replace: true, state: null });
            refetch();
          }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-afzal to-amrin font-extrabold text-xs text-white shadow-lg hover:scale-105 transition-transform cursor-pointer"
        >
          View My Profile
        </button>
      </div>
    );
  }

  const stats = profileData?.stats || { postsCount: 0, memoriesCount: 0, eventsCount: 0, followersCount: 1, followingCount: 1 };

  const tabs = [
    { id: 'posts', label: 'POSTS', icon: Grid },
    { id: 'stories', label: 'STORIES', icon: ImageIcon },
    { id: 'memories', label: 'MEMORIES', icon: Clock },
    { id: 'tagged', label: 'TAGGED', icon: Tag },
  ] as const;

  return (
    <div className="space-y-6 pb-20 w-full max-w-full lg:max-w-6xl mx-auto">
      <h1 className="sr-only">Relationship Profile</h1>

      {/* 1. Instagram-Style Profile Header */}
      {isLoading ? (
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4 animate-pulse">
          <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-200 dark:bg-white/10 shrink-0" />
            <div className="flex-1 space-y-3 text-center sm:text-left w-full">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <div className="h-6 w-36 bg-slate-200 dark:bg-white/10 rounded-lg" />
                <div className="h-5 w-20 bg-slate-200 dark:bg-white/10 rounded-full" />
              </div>
              <div className="h-4 w-48 bg-slate-200 dark:bg-white/5 rounded-md mx-auto sm:mx-0" />
              <div className="flex items-center justify-center sm:justify-start gap-4 pt-1">
                <div className="h-8 w-20 bg-slate-200 dark:bg-white/10 rounded-xl" />
                <div className="h-8 w-20 bg-slate-200 dark:bg-white/10 rounded-xl" />
                <div className="h-8 w-20 bg-slate-200 dark:bg-white/10 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ProfileHeader profileUser={profileData} stats={stats} isSelf={isSelfProfile} onRefresh={() => refetch()} />
      )}

      {/* 2. Compact Real-time Love Togetherness Counter (Super Owner & Co-Owner Profiles Only) */}
      {(profileData?.role === 'SUPER_OWNER' || profileData?.role === 'CO_OWNER') && (
        <LoveCounter />
      )}

      {/* 3. Instagram-Style Profile Navigation Tabs */}
      <div className="border border-slate-200 dark:border-white/10 glass-panel rounded-2xl p-1.5 flex items-center justify-around select-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`relative flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2.5 sm:px-4 rounded-xl text-[10px] sm:text-xs font-extrabold tracking-tight transition-all ${
                isActive
                  ? 'text-slate-800 dark:text-white bg-gradient-to-r from-afzal/15 via-amrin/15 to-heart/15 dark:from-afzal/20 dark:to-heart/20 border border-slate-200 dark:border-white/10 shadow-lg'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-amrin dark:text-amrin-glow' : ''}`} />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeProfileTab"
                  className="absolute -bottom-1 left-2 right-2 h-0.5 bg-gradient-to-r from-afzal via-amrin to-heart rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Instagram 3-Column Photo Grid with Single Post Modal on Thumbnail Click */}
      <ProfileGrid activeTab={activeTab} targetUser={profileData} />
    </div>
  );
};
