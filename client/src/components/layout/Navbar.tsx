import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  ChevronRight,
  LogIn,
  LogOut,
  MessageCircle,
  Moon,
  Search,
  Settings,
  Shield,
  Sun,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useNotificationStore } from '../../store/notificationStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { ApiResponse } from '../../types/index.js';
import { Badge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useUIStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadNotifCount, unreadChatCount, toggleNotifDrawer } = useNotificationStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 glass-panel shrink-0 select-none hidden md:block">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Tagline */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3 group shrink-0">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-afzal via-amrin to-heart p-0.5 shadow-lg shadow-amrin/20 transition-transform group-hover:scale-105 overflow-hidden">
            <img src="/logo.png" alt="Couple Universe Logo" className="w-full h-full object-cover rounded-[10px]" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-white tracking-tight">
                Couple Universe
              </span>
              <span className="text-heart text-sm">❤️</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">
              Established March 26, 2026
            </p>
          </div>
        </Link>

        {/* Center: Global Search Bar */}
        {isAuthenticated && (() => {
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
            : [];

          return (
            <div className="flex-1 max-w-md hidden md:block relative">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search profile by name (e.g. Amrin, Afzal)..."
                  className="w-full bg-obsidian-950/80 border border-slate-800 rounded-xl py-2 left-10 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amrin focus:ring-1 focus:ring-amrin transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Live Search User Profile Dropdown */}
              <AnimatePresence>
                {searchQuery.trim().length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    className="absolute top-12 left-0 right-0 z-50 glass-panel rounded-2xl p-2.5 border border-white/15 shadow-2xl space-y-2 bg-obsidian-950/98 backdrop-blur-2xl"
                  >
                    <div className="text-[10px] uppercase font-bold text-slate-400 px-2">
                      User Profile Search Results
                    </div>

                    {searchResults.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No user found matching "{searchQuery}"
                      </div>
                    ) : (
                      searchResults.map((matchedUser) => {
                        const isAmrin = matchedUser.name?.toLowerCase().includes('amrin') || matchedUser.role === 'CO_OWNER';

                        return (
                          <div
                            key={matchedUser._id}
                            onClick={() => {
                              navigate('/profile', { state: { targetUserId: matchedUser._id } });
                              setSearchQuery('');
                            }}
                            className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-afzal via-amrin to-heart p-[1.5px] overflow-hidden shrink-0 shadow-md">
                                {matchedUser.avatar ? (
                                  <img src={matchedUser.avatar} alt={matchedUser.name} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  <div className="w-full h-full bg-obsidian-900 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                    {matchedUser.name?.[0] || '❤️'}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-extrabold text-white group-hover:text-amrin-glow transition-colors truncate">
                                    {matchedUser.name}
                                  </span>
                                  <Badge variant={isAmrin ? 'cyan' : 'green'} size="sm">
                                    {isAmrin ? 'Princess 👸' : 'Owner'}
                                  </Badge>
                                </div>
                                <span className="text-[10px] text-slate-400 block truncate">{matchedUser.email}</span>
                                <span className="text-[10px] text-amrin-glow font-semibold block mt-0.5">
                                  Tap to view full profile, followers, posts & stories →
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
                          </div>
                        );
                      })
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })()}

        {/* Right: Actions, Notifications, Theme Toggle & User Menu */}
        <div className="flex items-center gap-3 shrink-0">
          
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              
              {/* Notification Icon & Panel */}
              <div className="relative">
                <button
                  onClick={() => toggleNotifDrawer()}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-afzal to-heart text-white text-[10px] font-extrabold rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center border-2 border-obsidian-950 shadow-lg shadow-heart animate-pulse">
                      {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Direct Messages Chat Icon */}
              <div className="relative">
                <Link
                  to="/chat"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors relative block"
                  aria-label="Direct Messages"
                >
                  <MessageCircle className="w-4 h-4 text-slate-300 hover:text-amrin-glow" />
                  {unreadChatCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-amrin via-amrin-glow to-heart text-white text-[10px] font-extrabold rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center border-2 border-obsidian-950 shadow-lg shadow-amrin/40 animate-pulse">
                      {unreadChatCount > 99 ? '99+' : unreadChatCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Theme Toggle */}
              <Button
                variant="glass"
                size="sm"
                onClick={toggleTheme}
                className="p-2 rounded-xl"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-amrin" />}
              </Button>

              {/* User Avatar & Dropdown Trigger */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2.5 p-1 rounded-xl glass-card border border-white/10 hover:border-amrin/40 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-afzal to-amrin flex items-center justify-center text-white font-bold text-xs shadow-md overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="hidden lg:block text-left text-xs pr-1">
                    <div className="font-semibold text-white leading-tight">{user.name}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{user.role}</div>
                  </div>
                </button>

                {/* Profile Dropdown Menu */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel border border-white/10 shadow-2xl p-2 z-50 space-y-1 bg-obsidian-950/95 backdrop-blur-2xl"
                    >
                      <div className="px-3 py-2 border-b border-white/5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-afzal to-amrin p-[2px] shrink-0">
                          <div className="w-full h-full rounded-full bg-obsidian-950 overflow-hidden flex items-center justify-center">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold text-sm">{user.name.charAt(0)}</span>
                            )}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{user.name}</div>
                          <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                          <Badge variant={user.role === 'SUPER_OWNER' ? 'green' : user.role === 'CO_OWNER' ? 'violet' : 'cyan'} className="mt-1">
                            {user.role}
                          </Badge>
                        </div>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <User className="w-4 h-4 text-afzal" /> Profile
                      </Link>

                      <Link
                        to="/session-manager"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-amrin-glow" /> Sessions & Security
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" /> Settings
                      </Link>

                      {user.role === 'SUPER_OWNER' && (
                        <Link
                          to="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-emerald-400 hover:bg-emerald-950/30 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-emerald-400" /> Admin Hub
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition-colors border-t border-white/5 mt-1"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="cyan" size="sm" leftIcon={<LogIn className="w-4 h-4" />}>
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="violet" size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
                  Register
                </Button>
              </Link>
              <Button
                variant="glass"
                size="sm"
                onClick={toggleTheme}
                className="p-2 rounded-xl"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-amrin" />}
              </Button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
