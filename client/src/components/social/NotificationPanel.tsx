import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Heart, MessageSquare, Trash2, UserPlus, Zap } from 'lucide-react';
import React, { useEffect } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { socketClient } from '../../api/socketClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { ApiResponse, NotificationItem } from '../../types/index.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const { accessToken } = useAuthStore();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<NotificationItem[]>>('/notifications');
      return res.data.data ?? [];
    },
    enabled: isOpen,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => axiosClient.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => axiosClient.patch('/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const deleteNotifMutation = useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/notifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  // Listen for real-time notification events
  useEffect(() => {
    if (!accessToken) return;
    const socket = socketClient.getSocket();
    if (!socket) return;

    const handleNewNotif = () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unreadNotifications'] });
    };

    socket.on('notification_created', handleNewNotif);

    return () => {
      socket.off('notification_created', handleNewNotif);
    };
  }, [accessToken, qc]);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'FOLLOW':
        return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'REACTION':
      case 'STORY_REACTION':
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'COMMENT':
      case 'COMMENT_REPLY':
        return <MessageSquare className="w-4 h-4 text-sky-400" />;
      default:
        return <Zap className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="absolute right-0 top-12 z-[100] w-80 sm:w-96 glass-card rounded-3xl p-4 border border-white/10 shadow-2xl animate-fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-afzal" />
          <h3 className="text-sm font-bold text-white">Notifications</h3>
        </div>
        <div className="flex items-center gap-2">
          {notifications.some((n) => !n.isRead) && (
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              className="text-[11px] text-afzal hover:text-afzal-glow flex items-center gap-1 font-medium"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
        {isLoading ? (
          <p className="text-center text-xs text-slate-500 py-6">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-6">No notifications yet ✨</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markReadMutation.mutate(n._id)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                n.isRead
                  ? 'glass-panel border-white/5 opacity-80'
                  : 'bg-afzal/10 border-afzal/30 shadow-md'
              }`}
            >
              <div className="p-2 rounded-xl bg-obsidian-900 border border-white/10 shrink-0">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-200 leading-snug">{n.message}</p>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotifMutation.mutate(n._id);
                }}
                className="text-slate-500 hover:text-rose-400 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
