import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Heart,
  Image,
  LayoutGrid,
  MessageSquare,
  Music,
  Shield,
  Sparkles,
  User,
  X,
  Youtube,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface MobileAppLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileAppLauncherModal: React.FC<MobileAppLauncherModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  if (!isOpen) return null;

  const apps = [
    {
      id: 'youtube-sync',
      name: 'YouTube Sync',
      subtitle: 'Watch & Listen Live',
      path: '/youtube-sync',
      icon: Youtube,
      gradient: 'from-red-600 via-rose-500 to-pink-600',
      badge: '🎬 Live',
    },
    {
      id: 'music',
      name: 'Shared Music',
      subtitle: 'Jukebox & Player',
      path: '/shared-music',
      icon: Music,
      gradient: 'from-rose-500 via-pink-500 to-purple-600',
      badge: '🎵 Audio',
    },
    {
      id: 'gallery',
      name: '3D Gallery',
      subtitle: 'Photos & Albums',
      path: '/gallery',
      icon: Image,
      gradient: 'from-violet-600 via-indigo-500 to-cyan-400',
      badge: '🖼️ Vault',
    },
    {
      id: 'chat',
      name: 'Private Chat',
      subtitle: 'Real-time Messaging',
      path: '/chat',
      icon: MessageSquare,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      badge: '💬 Chat',
    },
    {
      id: 'timeline',
      name: 'Our Timeline',
      subtitle: 'Lifetime Journey',
      path: '/timeline',
      icon: Clock,
      gradient: 'from-amber-500 via-orange-500 to-rose-500',
      badge: '📖 Story',
    },
    {
      id: 'calendar',
      name: 'Love Calendar',
      subtitle: 'Anniversary & Events',
      path: '/calendar',
      icon: Calendar,
      gradient: 'from-purple-600 via-pink-500 to-rose-400',
      badge: '📅 Events',
    },
    {
      id: 'stories',
      name: '24h Stories',
      subtitle: 'Daily Memories',
      path: '/stories',
      icon: Sparkles,
      gradient: 'from-pink-500 via-rose-500 to-amber-400',
      badge: '✨ Moments',
    },
    {
      id: 'profile',
      name: 'My Profile',
      subtitle: 'Settings & Account',
      path: '/profile',
      icon: User,
      gradient: 'from-blue-600 via-indigo-600 to-violet-500',
      badge: '👤 Me',
    },
  ];

  if (['SUPER_OWNER', 'CO_OWNER', 'ADMIN'].includes(user?.role || '')) {
    apps.push({
      id: 'admin',
      name: 'Admin Portal',
      subtitle: 'System Health',
      path: '/admin/dashboard',
      icon: Shield,
      gradient: 'from-slate-700 via-zinc-800 to-neutral-900 border border-white/20',
      badge: '⚡ Master',
    });
  }

  const handleLaunch = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl md:hidden"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-white/95 dark:bg-obsidian-950/95 border border-slate-200 dark:border-white/15 rounded-3xl p-5 space-y-5 shadow-2xl relative overflow-hidden select-none"
        >
          {/* Subtle Background Glow Spheres */}
          <div className="pointer-events-none absolute -top-20 -left-20 w-40 h-40 bg-afzal/20 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 w-40 h-40 bg-amrin/20 rounded-full blur-3xl" />

          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3.5 relative">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-afzal to-amrin flex items-center justify-center text-white shadow-md">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Universe Apps
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Tap to launch feature
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* iOS Style Apps Grid (3 Columns) */}
          <div className="grid grid-cols-3 gap-3.5 py-1">
            {apps.map((app) => {
              const Icon = app.icon;
              const isActive = location.pathname === app.path;

              return (
                <motion.button
                  key={app.id}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleLaunch(app.path)}
                  className="flex flex-col items-center text-center group cursor-pointer"
                >
                  {/* Icon Box */}
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${app.gradient} p-0.5 shadow-xl flex items-center justify-center relative transition-transform group-active:scale-95 ${
                      isActive ? 'ring-2 ring-amrin ring-offset-2 ring-offset-white dark:ring-offset-obsidian-950 shadow-rose-500/50' : ''
                    }`}
                  >
                    <div className="w-full h-full rounded-[14px] bg-white/90 dark:bg-obsidian-950/80 backdrop-blur-md flex items-center justify-center text-slate-900 dark:text-white group-hover:bg-white/70 dark:group-hover:bg-obsidian-950/40 transition-colors">
                      <Icon className={`w-7 h-7 text-slate-900 dark:text-white ${isActive ? 'animate-pulse' : ''}`} />
                    </div>

                    {/* Active Route Indicator Dot */}
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-obsidian-950 shadow-md animate-ping" />
                    )}
                  </div>

                  {/* App Name */}
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white mt-1.5 truncate w-full group-hover:text-amrin transition-colors">
                    {app.name}
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium truncate w-full">
                    {app.subtitle}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Footer Branding */}
          <div className="border-t border-slate-200 dark:border-white/10 pt-3 text-center flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <Heart className="w-3.5 h-3.5 text-heart fill-heart" />
            <span>Afzal & Amrin Verse</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
