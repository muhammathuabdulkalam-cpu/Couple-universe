import { AnimatePresence } from 'framer-motion';
import { Bell, ChevronRight, MessageCircle, Search, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useNotificationStore } from '../../store/notificationStore.js';
import { ApiResponse } from '../../types/index.js';
import { Badge } from '../ui/Badge.js';

export const MobileHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const {
    unreadNotifCount,
    unreadChatCount,
    toggleNotifDrawer,
    initSocketListeners,
  } = useNotificationStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Partner & Profile Details for search matching
  const { data: profileData } = useQuery<any>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<any>>('/profile');
      return res.data.data;
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    const cleanup = initSocketListeners(accessToken);
    return () => cleanup();
  }, [isAuthenticated, accessToken, initSocketListeners]);

  if (!isAuthenticated) return null;

  const partner = profileData?.partner || {
    _id: user?.role === 'SUPER_OWNER' ? 'co-owner-id' : 'super-owner-id',
    name: user?.role === 'SUPER_OWNER' ? 'Amrin' : 'Afzal',
    email: user?.role === 'SUPER_OWNER' ? 'amrin@verse.app' : 'afzal@verse.app',
    role: user?.role === 'SUPER_OWNER' ? 'CO_OWNER' : 'SUPER_OWNER',
    avatar: null,
  };

  const candidates = [
    user ? { _id: user._id || user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } : null,
    partner ? { _id: partner._id, name: partner.name, email: partner.email, role: partner.role, avatar: partner.avatar } : null,
  ].filter(Boolean) as any[];

  const trimmed = searchQuery.trim().toLowerCase();
  const searchResults = trimmed
    ? candidates.filter(
        (c) =>
          c.name?.toLowerCase().includes(trimmed) ||
          c.email?.toLowerCase().includes(trimmed) ||
          c.role?.toLowerCase().includes(trimmed) ||
          (trimmed.includes('amrin') && c.name?.toLowerCase().includes('amrin')) ||
          (trimmed.includes('afzal') && c.name?.toLowerCase().includes('afzal'))
      )
    : candidates;

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel bg-obsidian-950/95 backdrop-blur-2xl border-b border-white/10 px-4 py-2.5 flex items-center justify-between md:hidden select-none">

        {/* Left: Brand Logo & Title (Instagram Style) */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-afzal via-amrin to-heart p-0.5 shadow-md shadow-amrin/20 overflow-hidden">
            <img src="/logo.png" alt="Couple Universe Logo" className="w-full h-full object-cover rounded-[10px]" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-display font-extrabold text-base text-white tracking-tight">
              Couple Universe
            </span>
            <span className="text-xs text-heart">❤️</span>
          </div>
        </Link>

        {/* Right: Live Badged Notification Bell & Direct Message Chat Icons */}
        <div className="flex items-center gap-1">

          {/* Profile Search Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
            aria-label="Search Profile"
          >
            <Search className="w-5 h-5 text-amrin-glow" />
          </button>

          {/* Notification Bell Icon */}
          <button
            type="button"
            onClick={toggleNotifDrawer}
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-afzal to-heart text-white text-[10px] font-extrabold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border-2 border-obsidian-950 shadow-lg shadow-heart/40 animate-pulse">
                {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
              </span>
            )}
          </button>

          {/* Direct Chat Icon */}
          <Link
            to="/chat"
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
            aria-label="Direct Messages"
          >
            <MessageCircle className="w-5 h-5 text-slate-300 group-hover:text-amrin-glow" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-amrin via-amrin-glow to-heart text-white text-[10px] font-extrabold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border-2 border-obsidian-950 shadow-lg shadow-amrin/40 animate-pulse">
                {unreadChatCount > 99 ? '99+' : unreadChatCount}
              </span>
            )}
          </Link>

        </div>

      </header>

      {/* Mobile Search Modal Drawer */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl p-4 flex flex-col space-y-4 md:hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Search className="w-4 h-4 text-amrin-glow" />
                <span>Search Profile</span>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search profile by name (e.g. Amrin, Afzal)..."
                className="w-full bg-obsidian-950 border border-slate-800 rounded-2xl py-3 left-10 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amrin"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 px-1">
                Matching Profiles
              </div>

              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No profile matching "{searchQuery}"
                </div>
              ) : (
                searchResults.map((matchedUser) => {
                  const isAmrin = matchedUser.name?.toLowerCase().includes('amrin') || matchedUser.role === 'CO_OWNER';

                  return (
                    <div
                      key={matchedUser._id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate('/profile', { state: { targetUserId: matchedUser._id } });
                      }}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 active:bg-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-afzal via-amrin to-heart p-[1.5px] overflow-hidden shrink-0 shadow-md">
                          {matchedUser.avatar ? (
                            <img src={matchedUser.avatar} alt={matchedUser.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <div className="w-full h-full bg-obsidian-900 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {matchedUser.name?.[0] || '❤️'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-white">{matchedUser.name}</span>
                            <Badge variant={isAmrin ? 'cyan' : 'green'} size="sm">
                              {isAmrin ? 'Princess 👸' : 'Owner'}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{matchedUser.email}</span>
                          <span className="text-[10px] text-amrin-glow font-semibold block mt-0.5">
                            Tap to view full profile, followers, posts & stories →
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
