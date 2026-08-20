import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Cake,
  Calendar,
  CheckCheck,
  Heart,
  MessageCircle,
  MessageSquare,
  Sparkles,
  Trash2,
  UserPlus,
  X,
  Zap,
} from 'lucide-react';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient.js';
import { socketClient } from '../../api/socketClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useNotificationStore } from '../../store/notificationStore.js';
import { ApiResponse, NotificationItem } from '../../types/index.js';
import { handleNotificationClick } from '../../utils/notificationNavigation.js';

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
}

export const NotificationPanel: React.FC<Props> = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const { isNotifDrawerOpen, setNotifDrawerOpen, fetchUnreadCounts, decrementUnreadNotifCount, setUnreadNotifCount } = useNotificationStore();
  const qc = useQueryClient();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isNotifDrawerOpen;

  const handleClose = () => {
    if (propOnClose) propOnClose();
    setNotifDrawerOpen(false);
  };

  const { data: rawNotifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<NotificationItem[]>>('/notifications');
      return res.data.data ?? [];
    },
    enabled: isOpen,
  });

  const notifications = rawNotifications.filter((n) => n.type !== 'MESSAGE');

  const markReadMutation = useMutation({
    mutationFn: (id: string) => axiosClient.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      fetchUnreadCounts();
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => axiosClient.patch('/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      setUnreadNotifCount(0);
      fetchUnreadCounts();
    },
  });

  const deleteNotifMutation = useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/notifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      fetchUnreadCounts();
    },
  });

  // Real-time socket updates for notification query cache
  useEffect(() => {
    if (!accessToken) return;
    const socket = socketClient.getSocket();
    if (!socket) return;

    const handleNewNotif = () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('notification_created', handleNewNotif);
    socket.on('unread_count_updated', handleNewNotif);

    return () => {
      socket.off('notification_created', handleNewNotif);
      socket.off('unread_count_updated', handleNewNotif);
    };
  }, [accessToken, qc]);

  if (!isOpen) return null;

  const getActionBadgeIcon = (type: string) => {
    switch (type) {
      case 'FOLLOW':
        return <UserPlus className="w-3 h-3 text-emerald-400" />;
      case 'REACTION':
      case 'STORY_REACTION':
      case 'MEMORY_REACTION':
        return <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />;
      case 'COMMENT':
      case 'COMMENT_REPLY':
        return <MessageSquare className="w-3 h-3 text-sky-400" />;
      case 'STORY_REPLY':
      case 'MESSAGE':
        return <MessageCircle className="w-3 h-3 text-amrin-glow" />;
      case 'BIRTHDAY':
        return <Cake className="w-3 h-3 text-amber-400" />;
      case 'ANNIVERSARY':
      case 'CALENDAR_REMINDER':
        return <Calendar className="w-3 h-3 text-purple-400" />;
      default:
        return <Sparkles className="w-3 h-3 text-amber-400" />;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const onItemClick = (n: NotificationItem) => {
    if (!n.isRead) {
      decrementUnreadNotifCount();
    }
    handleNotificationClick(n, navigate, (id) => markReadMutation.mutate(id));
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex justify-center md:justify-end items-end md:items-start p-0 md:p-4 select-none">
          
          {/* Backdrop for mobile and desktop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[201]"
          />

          {/* Notification Container (Drawer on Mobile, Floating Panel on Desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative z-[202] w-full md:w-96 md:mt-12 md:mr-4 max-h-[85vh] md:max-h-[550px] bg-obsidian-950/98 backdrop-blur-2xl border-t md:border border-white/15 rounded-t-3xl md:rounded-3xl p-4 shadow-2xl flex flex-col"
          >
            {/* Top Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-afzal via-amrin to-heart p-0.5 flex items-center justify-center shadow-md">
                  <div className="w-full h-full bg-obsidian-950 rounded-[10px] flex items-center justify-center">
                    <Bell className="w-4 h-4 text-amrin-glow" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-tight">Notifications</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Real-time updates & activity</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {notifications.some((n) => !n.isRead) && (
                  <button
                    type="button"
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-xs text-amrin-glow hover:text-white flex items-center gap-1 font-semibold transition-colors bg-white/5 px-2.5 py-1 rounded-xl border border-white/10"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications Scroll List */}
            <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1 scrollbar-hide my-1">
              {isLoading ? (
                <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <Zap className="w-7 h-7 animate-bounce text-amrin-glow" />
                  <span className="font-semibold">Fetching real-time notifications...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-14 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-amrin/10 border border-amrin/20 text-heart flex items-center justify-center mx-auto text-xl font-bold shadow-inner">
                    ❤️
                  </div>
                  <p className="text-xs font-bold text-white">No notifications yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    When you or your partner interact with posts, stories, or chats, notifications will show up here!
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <motion.div
                    key={n._id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onItemClick(n)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative group ${
                      n.isRead
                        ? 'bg-white/[0.02] border-white/5 opacity-80 hover:opacity-100 hover:bg-white/5'
                        : 'bg-gradient-to-r from-afzal/15 via-amrin/15 to-heart/15 border-amrin/30 shadow-lg shadow-amrin/10'
                    }`}
                  >
                    {/* Sender Avatar & Action Badge Overlay */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-afzal to-amrin p-0.5 overflow-hidden shadow-md">
                        {n.senderId?.avatar ? (
                          <img
                            src={n.senderId.avatar}
                            alt={n.senderId.name}
                            className="w-full h-full object-cover rounded-full"
                           onError={(e) => { if (!e.currentTarget.src || e.currentTarget.src.includes('unsplash.com')) { e.currentTarget.style.display='none'; } }}/>
                        ) : (
                          <div className="w-full h-full bg-obsidian-900 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {(n.senderId?.name || 'A').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {/* Action Icon Badge Overlay */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-obsidian-950 border border-white/20 flex items-center justify-center shadow-md">
                        {getActionBadgeIcon(n.type)}
                      </div>
                    </div>

                    {/* Message Content & Relative Timestamp */}
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-xs text-slate-200 leading-snug font-medium">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 font-semibold block">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>

                    {/* Unread Pink Dot */}
                    {!n.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amrin to-heart shadow-md shadow-heart shrink-0 mt-1" />
                    )}

                    {/* Delete Item Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotifMutation.mutate(n._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-opacity"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
};
