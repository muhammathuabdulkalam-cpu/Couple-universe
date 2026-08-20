import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Grid, Heart, LayoutList, ShieldCheck, Users, X } from 'lucide-react';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { axiosClient } from '../../api/axiosClient.js';
import { ActivityItem, ApiResponse } from '../../types/index.js';
import { FeedCard } from '../social/FeedCard.js';
import { Badge } from '../ui/Badge.js';
import { Skeleton } from '../ui/Skeleton.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SuperOwnerProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'grid'>('feed');
  const [activeUserListModal, setActiveUserListModal] = useState<'followers' | 'following' | null>(null);

  // Fetch Super Owner Profile Details
  const { data: superOwnerData, isLoading: isProfileLoading } = useQuery<any>({
    queryKey: ['superOwnerProfile'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<any>>('/profile/super-owner');
      return res.data.data!;
    },
    enabled: isOpen,
  });

  const superOwnerId = superOwnerData?._id;

  // Fetch Super Owner Posts
  const { data: postsData = [], isLoading: isPostsLoading } = useQuery<ActivityItem[]>({
    queryKey: ['superOwnerPosts', superOwnerId],
    queryFn: async () => {
      if (!superOwnerId) return [];
      const res = await axiosClient.get<ApiResponse<ActivityItem[]>>('/feed');
      const allPosts = res.data.data || [];
      return allPosts.filter((act: any) => {
        const actUserId = String(act.userId?._id || act.userId?.id || act.userId);
        return actUserId === String(superOwnerId);
      });
    },
    enabled: !!superOwnerId && isOpen,
  });

  if (!isOpen) return null;

  const stats = superOwnerData?.stats || {
    postsCount: postsData.length,
    followersCount: 1,
    followingCount: 1,
  };

  const followers = superOwnerData?.followers || [];
  const following = superOwnerData?.following || [];

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-obsidian-950 border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Top Modal Navigation Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-obsidian-950/90 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400 fill-amber-400/20" />
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Company Owner Profile (CO)
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-hide">
            {isProfileLoading ? (
              <Skeleton className="h-40 rounded-3xl" />
            ) : (
              <>
                {/* 1. Super Owner Profile Header (Read-Only) */}
                <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                    {/* Avatar with Gradient Ring */}
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-xl">
                        <div className="w-full h-full rounded-full bg-obsidian-950 flex items-center justify-center font-extrabold text-white text-2xl overflow-hidden">
                          {superOwnerData?.avatar ? (
                            <img
                              src={superOwnerData.avatar}
                              alt={superOwnerData.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            superOwnerData?.name?.[0] || 'A'
                          )}
                        </div>
                      </div>
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-obsidian-950 absolute bottom-1 right-1 shadow-md" />
                    </div>

                    {/* Super Owner Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                            <h3 className="text-xl font-extrabold text-white tracking-tight">
                              {superOwnerData?.name || 'Afzal'}
                            </h3>
                            <Badge variant="amber" size="sm">
                              <ShieldCheck className="w-3 h-3 text-amber-400" /> CO Owner
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{superOwnerData?.email}</p>
                        </div>
                      </div>

                      {/* Stats Bar: Posts, Followers, Following */}
                      <div className="flex items-center justify-center sm:justify-start gap-6 py-2 border-y border-white/10">
                        <div className="text-center sm:text-left">
                          <span className="text-sm font-extrabold text-white font-mono">
                            {stats.postsCount || postsData.length}
                          </span>
                          <span className="block text-[10px] uppercase font-bold text-slate-400">Posts</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveUserListModal('followers')}
                          className="text-center sm:text-left hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          <span className="text-sm font-extrabold text-white font-mono">
                            {stats.followersCount ?? followers.length}
                          </span>
                          <span className="block text-[10px] uppercase font-bold text-slate-400">
                            Followers
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveUserListModal('following')}
                          className="text-center sm:text-left hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          <span className="text-sm font-extrabold text-white font-mono">
                            {stats.followingCount ?? following.length}
                          </span>
                          <span className="block text-[10px] uppercase font-bold text-slate-400">
                            Following
                          </span>
                        </button>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-slate-300 leading-relaxed italic">
                        "{superOwnerData?.bio || 'Founder & Owner of Afrin Verse ❤️'}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Instagram View Mode Switcher: Full Posts Feed vs Grid */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <LayoutList className="w-4 h-4 text-amrin-glow" />
                    <span>Company Owner Posts</span>
                  </div>

                  <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setActiveTab('feed')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === 'feed'
                          ? 'bg-gradient-to-r from-afzal to-amrin text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <LayoutList className="w-3.5 h-3.5" /> Full Posts
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('grid')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === 'grid'
                          ? 'bg-gradient-to-r from-afzal to-amrin text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Grid className="w-3.5 h-3.5" /> Grid
                    </button>
                  </div>
                </div>

                {/* 3. Instagram-Style Full Posts View (with Likes, Comments & Details) */}
                {isPostsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-64 rounded-3xl" />
                    <Skeleton className="h-64 rounded-3xl" />
                  </div>
                ) : postsData.length === 0 ? (
                  <div className="text-center py-12 space-y-2 glass-card rounded-3xl border border-white/5">
                    <Heart className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-300">No posts published yet</p>
                  </div>
                ) : activeTab === 'feed' ? (
                  <div className="space-y-5">
                    {postsData.map((act) => (
                      <FeedCard key={act._id} activity={act} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {postsData.map((act) => {
                      const img =
                        typeof act.imageUrl === 'string' && act.imageUrl
                          ? act.imageUrl
                          : (act.referenceId as any)?.secureUrl ||
                            (act.referenceId as any)?.optimizedUrl ||
                            (act.referenceId as any)?.url;
                      if (!img) return null;

                      return (
                        <div
                          key={act._id}
                          className="aspect-square rounded-2xl bg-obsidian-900 border border-white/10 overflow-hidden shadow-md"
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* Followers / Following List Sub-Modal */}
        <AnimatePresence>
          {activeUserListModal && (
            <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm bg-obsidian-950 border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <Users className="w-4 h-4 text-amrin-glow" />
                    <span>{activeUserListModal === 'followers' ? 'Followers' : 'Following'}</span>
                  </div>
                  <button
                    onClick={() => setActiveUserListModal(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(activeUserListModal === 'followers' ? followers : following).length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-4">No users listed.</p>
                  ) : (
                    (activeUserListModal === 'followers' ? followers : following).map((u: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-afzal via-amrin to-heart p-0.5 overflow-hidden">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <div className="w-full h-full bg-obsidian-900 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                {u.name?.[0] || 'U'}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{u.name}</span>
                            <span className="text-[10px] text-slate-400 block">{u.email}</span>
                          </div>
                        </div>
                        <Badge variant="violet" size="sm">Partner</Badge>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>,
    document.body
  );
};
