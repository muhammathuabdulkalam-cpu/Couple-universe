import { Bell, MessageCircle } from 'lucide-react';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useNotificationStore } from '../../store/notificationStore.js';

export const MobileHeader: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const {
    unreadNotifCount,
    unreadChatCount,
    toggleNotifDrawer,
    initSocketListeners,
  } = useNotificationStore();

  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    const cleanup = initSocketListeners(accessToken);
    return () => cleanup();
  }, [isAuthenticated, accessToken, initSocketListeners]);

  if (!isAuthenticated) return null;

  return (
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
      <div className="flex items-center gap-2">

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
  );
};
