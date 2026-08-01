import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Heart,
  LogIn,
  LogOut,
  Moon,
  Search,
  Settings,
  Shield,
  Sun,
  User,
  UserPlus,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { ApiResponse } from '../../types/index.js';
import { NotificationPanel } from '../social/NotificationPanel.js';
import { Badge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useUIStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch unread notification count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['unreadNotifications'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
      return res.data.data!;
    },
    enabled: isAuthenticated,
    refetchInterval: 15_000,
  });

  const unreadCount = unreadData?.count || 0;

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
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-afzal via-amrin to-heart p-0.5 shadow-lg shadow-amrin/20 transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-obsidian-950 rounded-[10px] flex items-center justify-center">
              <Heart className="w-5 h-5 text-heart fill-heart animate-pulse" />
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-white tracking-tight">
                Afrin Universe
              </span>
              <span className="text-heart text-sm">❤️</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">
              Established March 26, 2026
            </p>
          </div>
        </Link>

        {/* Center: Global Search Bar */}
        {isAuthenticated && (
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories, diary, albums, milestones..."
                className="w-full bg-obsidian-950/80 border border-slate-800 rounded-xl py-2 left-10 pl-10 pr-12 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amrin focus:ring-1 focus:ring-amrin transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 border border-slate-700/60 rounded px-1.5 py-0.5">
                ⌘K
              </span>
            </div>
          </div>
        )}

        {/* Right: Actions, Notifications, Theme Toggle & User Menu */}
        <div className="flex items-center gap-3 shrink-0">
          
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              
              {/* Notification Icon & Panel */}
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <>
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-heart rounded-full animate-ping" />
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-heart rounded-full" />
                    </>
                  )}
                </button>
                <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
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
