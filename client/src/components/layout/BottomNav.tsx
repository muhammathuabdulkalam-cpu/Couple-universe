import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronRight,
  Heart,
  Home,
  Image,
  Menu,
  MessageSquare,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAVIGATION_CONFIG } from '../../config/navigation.config.js';
import { useAuthStore } from '../../store/authStore.js';
import { useChatStore } from '../../store/chatStore.js';
import { useNotificationStore } from '../../store/notificationStore.js';
import { CreatePostModal } from '../social/CreatePostModal.js';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { mobileView } = useChatStore();
  const { unreadChatCount } = useNotificationStore();
  const userRole = user?.role || 'INVITED_USER';

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Automatically close mobile drawer menu whenever current route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Hide Bottom Navigation ONLY when inside an active open chat thread on mobile
  if (location.pathname.startsWith('/chat') && mobileView === 'chat') {
    return null;
  }

  const enabledFeatures = user?.enabledFeatures || [];
  const allowedNavItems = NAVIGATION_CONFIG.filter((item) => {
    if (!item.allowedRoles.includes(userRole)) return false;
    if (['SUPER_OWNER', 'CO_OWNER'].includes(userRole)) return true;
    if (item.featureKey && !enabledFeatures.includes(item.featureKey)) return false;
    return true;
  });

  const items = [
    { label: 'Home', path: '/dashboard', icon: Home, isAction: false },
    { label: 'Gallery', path: '/gallery', icon: Image, isAction: false },
    { label: 'Create', path: '#create', icon: Plus, isAction: true },
    { label: 'Chat', path: '/chat', icon: MessageSquare, isAction: false },
    { label: 'Menu', path: '#menu', icon: Menu, isAction: false, isMenuToggle: true },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-obsidian-950/95 backdrop-blur-2xl border-t border-white/10 px-2 py-2 pb-safe select-none">
        <div className="flex items-center justify-around max-w-md mx-auto relative">
          {items.map((item, idx) => {
            const Icon = item.icon;

            if (item.isAction) {
              return (
                <button
                  key={idx}
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex flex-col items-center justify-center p-1 group"
                  aria-label="Create Post"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-afzal via-amrin to-heart p-0.5 shadow-lg shadow-amrin/30 group-active:scale-95 transition-transform flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-obsidian-950 flex items-center justify-center text-white">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              );
            }

            if (item.isMenuToggle) {
              return (
                <button
                  key={idx}
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="relative flex items-center justify-center p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <Icon className="w-6 h-6" />
                </button>
              );
            }

            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path + idx}
                to={item.path}
                className="relative flex items-center justify-center p-2 transition-colors"
              >
                <motion.div
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="relative"
                >
                  <Icon
                    className={`w-6 h-6 transition-colors ${
                      isActive ? 'text-amrin-glow fill-amrin/20' : 'text-slate-400 hover:text-white'
                    }`}
                  />
                  {item.path === '/chat' && unreadChatCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 px-1 py-0.2 min-w-[17px] h-[17px] text-[9px] font-black text-white bg-gradient-to-r from-afzal via-amrin to-heart rounded-full flex items-center justify-center shadow-lg shadow-heart/50 shrink-0 animate-pulse border border-obsidian-950">
                      {unreadChatCount > 99 ? '99+' : unreadChatCount}
                    </span>
                  )}
                </motion.div>

                {isActive && (
                  <motion.div
                    layoutId="activeBottomNavDot"
                    className="absolute -top-2 w-1.5 h-1.5 rounded-full bg-amrin-glow shadow-lg shadow-amrin"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Side Drawer Menu for accessing Chat and ALL Application Features */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-[200] flex justify-end bg-black/80 backdrop-blur-md md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-4/5 max-w-xs h-full bg-obsidian-950 border-l border-white/10 p-5 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Sparkles className="w-4 h-4 text-amrin-glow" />
                    <span>Couple Universe Menu</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500 px-2 mb-2">
                    All Application Features
                  </div>

                  {allowedNavItems.map((nav) => {
                    const NavIcon = nav.icon;
                    const isNavActive = location.pathname === nav.path;
                    const isChatNav = nav.path === '/chat';

                    return (
                      <Link
                        key={nav.key}
                        to={nav.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-semibold transition-all ${
                          isNavActive
                            ? 'bg-gradient-to-r from-afzal/20 via-amrin/20 to-heart/20 text-white border border-white/10 shadow-lg'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <NavIcon className={`w-4 h-4 ${isNavActive ? 'text-amrin-glow' : 'text-slate-400'}`} />
                          <span>{nav.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isChatNav && unreadChatCount > 0 && (
                            <span className="bg-gradient-to-r from-amrin to-heart text-white text-[10px] font-extrabold rounded-full px-2 py-0.5 shadow-md">
                              {unreadChatCount > 99 ? '99+' : unreadChatCount}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 text-center">
                <div className="flex items-center justify-center gap-1 text-xs font-bold text-slate-400">
                  <Heart className="w-3.5 h-3.5 text-heart fill-heart" />
                  <span>Afzal & Amrin Verse</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Universal Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
};
