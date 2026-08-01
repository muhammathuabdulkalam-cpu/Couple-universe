import { useQuery } from '@tanstack/react-query';
import { Sparkles, Users } from 'lucide-react';
import React from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { ActivityItem, ApiResponse } from '../../types/index.js';
import { FeedCard } from '../../components/social/FeedCard.js';
import { StoryCarousel } from '../../components/social/StoryCarousel.js';

export const SocialFeedPage: React.FC = () => {
  const { user } = useAuthStore();

  const { data: feed = [], isLoading } = useQuery<ActivityItem[]>({
    queryKey: ['feed'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<ActivityItem[]>>('/feed');
      return res.data.data ?? [];
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-2xl bg-gradient-to-r from-obsidian-950 via-afzal/10 to-obsidian-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-afzal to-amrin flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">Social Network</h1>
              <p className="text-xs text-slate-400">Afzal & Amrin's Shared Activity & Life Moments</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full text-xs text-slate-300">
            <Users className="w-4 h-4 text-amrin" />
            <span>Private Universe</span>
          </div>
        </div>
      </div>

      {/* Stories Section */}
      <div className="glass-card rounded-3xl p-4 border border-white/10 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">Active Stories</h3>
        <StoryCarousel />
      </div>

      {/* Main Feed Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Main Feed Column */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Activity Feed</h3>

          {isLoading ? (
            <div className="glass-card rounded-3xl p-12 text-center text-slate-400 text-xs">
              Loading social feed...
            </div>
          ) : feed.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center space-y-3 border border-white/10">
              <div className="w-16 h-16 rounded-full bg-amrin/10 border border-amrin/30 flex items-center justify-center text-amrin text-2xl mx-auto">
                ✨
              </div>
              <h4 className="text-base font-bold text-white">No Feed Posts Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create new timeline memories, upload media, or add stories to see them appear here in your social feed!
              </p>
            </div>
          ) : (
            feed.map((activity) => <FeedCard key={activity._id} activity={activity} />)
          )}
        </div>

        {/* Right Sidebar Suggestions Column */}
        <div className="hidden lg:block space-y-6">
          <div className="glass-card rounded-3xl p-5 border border-white/10 shadow-xl sticky top-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-afzal to-amrin p-[2px]">
                <div className="w-full h-full rounded-full bg-obsidian-900 overflow-hidden flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-base">{user?.name?.[0]}</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{user?.name}</h4>
                <p className="text-xs text-slate-400">{user?.role}</p>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-400">Platform Shortcuts</h4>
              <div className="space-y-2 text-xs">
                <a href="/profile" className="flex items-center justify-between p-2 rounded-xl glass-panel hover:bg-white/10 text-slate-200">
                  <span>👤 My Profile</span>
                  <span className="text-[10px] text-slate-500">View</span>
                </a>
                <a href="/timeline" className="flex items-center justify-between p-2 rounded-xl glass-panel hover:bg-white/10 text-slate-200">
                  <span>🕐 Relationship Timeline</span>
                  <span className="text-[10px] text-slate-500">View</span>
                </a>
                <a href="/gallery" className="flex items-center justify-between p-2 rounded-xl glass-panel hover:bg-white/10 text-slate-200">
                  <span>🖼️ Media Vault</span>
                  <span className="text-[10px] text-slate-500">View</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
