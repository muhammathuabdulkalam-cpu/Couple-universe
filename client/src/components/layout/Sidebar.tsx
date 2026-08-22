import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Image as ImageIcon,
  Plus,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAVIGATION_CONFIG, NavItem } from '../../config/navigation.config.js';
import { useAuthStore } from '../../store/authStore.js';
import { useNotificationStore } from '../../store/notificationStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { MediaPicker } from '../media/MediaPicker.js';
import { CreatePostModal } from '../social/CreatePostModal.js';
import { StoryCreator } from '../social/StoryCreator.js';
import { Badge } from '../ui/Badge.js';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isExpanded, onToggle }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { unreadChatCount } = useNotificationStore();
  const { theme } = useUIStore();
  const userRole = user?.role || 'INVITED_USER';

  const createBtnClass = theme === 'light'
    ? 'bg-gradient-to-r from-rose-600 to-rose-500 shadow-rose-500/20'
    : 'bg-gradient-to-r from-rose-600 to-amrin shadow-amrin/20';

  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const enabledFeatures = user?.enabledFeatures || [];
  const allowedNavItems = NAVIGATION_CONFIG.filter((item) => {
    if (!item.allowedRoles.includes(userRole)) return false;
    if (['SUPER_OWNER', 'CO_OWNER'].includes(userRole)) return true;
    if (item.featureKey && !enabledFeatures.includes(item.featureKey)) return false;
    return true;
  });

  const sections: Array<{ id: NavItem['section']; label: string }> = [
    { id: 'main', label: 'Main' },
    { id: 'memories', label: 'Memories & Vault' },
    { id: 'life', label: 'Life & Social' },
    { id: 'admin', label: 'Administration' },
  ];

  // Only show admin section to SUPER_OWNER/CO_OWNER
  const visibleSections = sections.filter((sec) => {
    if (sec.id === 'admin') return userRole === 'SUPER_OWNER' || userRole === 'CO_OWNER';
    return true;
  });

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: isExpanded ? 256 : 72 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex flex-col h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-200 dark:border-white/10 glass-panel shrink-0 select-none z-30 overflow-hidden"
      >
        {/* Sidebar Top Toggle Header */}
        <div className="p-3 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-xs font-semibold text-slate-400 px-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amrin-glow" />
              <span>Navigation</span>
            </motion.div>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors mx-auto md:mx-0"
            aria-label="Toggle Sidebar"
          >
            {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* PROMINENT SIDEBAR + CREATE BUTTON */}
        <div className="p-3 border-b border-slate-100 dark:border-white/5 relative">
          {isExpanded ? (
            <button
              onClick={() => setShowCreateDropdown(!showCreateDropdown)}
              className={`w-full py-2.5 px-3 rounded-2xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all ${createBtnClass}`}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create</span>
            </button>
          ) : (
            <button
              onClick={() => setShowCreateDropdown(!showCreateDropdown)}
              className={`w-10 h-10 mx-auto rounded-2xl text-white font-bold text-xs shadow-lg flex items-center justify-center hover:brightness-110 active:scale-95 transition-all ${createBtnClass}`}
              title="Create Content"
            >
               <Plus className="w-5 h-5 stroke-[3]" />
            </button>
          )}

          {/* CREATE DROPDOWN POPOVER */}
          <AnimatePresence>
            {showCreateDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute left-3 right-3 top-14 z-50 glass-panel rounded-2xl p-1.5 border border-slate-200 dark:border-white/10 shadow-2xl space-y-1 bg-white/95 dark:bg-obsidian-950/95 backdrop-blur-2xl"
              >
                <button
                  onClick={() => {
                    setShowCreateDropdown(false);
                    setShowPostModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-amrin" />
                  <span>Create Post</span>
                </button>

                <button
                  onClick={() => {
                    setShowCreateDropdown(false);
                    setShowStoryCreator(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  <span>Create Story</span>
                </button>

                <button
                  onClick={() => {
                    setShowCreateDropdown(false);
                    setShowMediaPicker(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-afzal" />
                  <span>Upload Media</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Links Scroll Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-6">
          {visibleSections.map((sec) => {
            const secItems = allowedNavItems.filter((item) => item.section === sec.id);
            if (secItems.length === 0) return null;

            return (
              <div key={sec.id} className="space-y-1">
                {isExpanded && (
                  <div className="px-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                    {sec.label}
                  </div>
                )}
                {secItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link key={item.key} to={item.path}>
                      <motion.div
                        whileHover={{ x: 3 }}
                        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-rose-50 text-rose-600 font-bold dark:bg-transparent dark:bg-gradient-to-r dark:from-afzal/20 dark:to-amrin/20 dark:text-white dark:border dark:border-amrin/30 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-slate-200 hover:bg-rose-50/50 dark:hover:bg-white/5'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-rose-600 dark:text-amrin-glow' : ''}`} />

                        {isExpanded && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="truncate flex-1"
                          >
                            {item.label}
                          </motion.span>
                        )}

                        {isExpanded && item.path === '/chat' && unreadChatCount > 0 && (
                          <span className="ml-auto bg-gradient-to-r from-amrin to-heart text-white text-[10px] font-extrabold rounded-full px-2 py-0.5 shadow-md">
                            {unreadChatCount}
                          </span>
                        )}

                        {isExpanded && item.badge && item.path !== '/chat' && (
                          <Badge variant="violet" size="sm" className="ml-auto text-[9px] px-1.5 py-0">
                            {item.badge}
                          </Badge>
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        {isExpanded && (
          <div className="p-4 border-t border-slate-100 dark:border-white/5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Heart className="w-3 h-3 text-heart fill-heart" />
              <span>Afzal & Amrin</span>
            </div>
          </div>
        )}
      </motion.aside>

      {/* Global Modals launched from Sidebar */}
      <CreatePostModal isOpen={showPostModal} onClose={() => setShowPostModal(false)} />
      <StoryCreator isOpen={showStoryCreator} onClose={() => setShowStoryCreator(false)} />
      {showMediaPicker && (
        <MediaPicker
          title="Upload to Media Vault"
          onSelectMedia={() => setShowMediaPicker(false)}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </>
  );
};
