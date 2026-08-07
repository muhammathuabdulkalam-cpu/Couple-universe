import { create } from 'zustand';
import { axiosClient } from '../api/axiosClient.js';
import { socketClient } from '../api/socketClient.js';
import { ApiResponse } from '../types/index.js';
import { useChatStore } from './chatStore.js';

interface NotificationState {
  unreadNotifCount: number;
  unreadChatCount: number;
  isNotifDrawerOpen: boolean;
  isInitialized: boolean;

  setUnreadNotifCount: (count: number) => void;
  setUnreadChatCount: (count: number) => void;
  decrementUnreadNotifCount: () => void;
  setNotifDrawerOpen: (isOpen: boolean) => void;
  toggleNotifDrawer: () => void;

  fetchUnreadCounts: () => Promise<void>;
  initSocketListeners: (token?: string) => () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadNotifCount: 0,
  unreadChatCount: 0,
  isNotifDrawerOpen: false,
  isInitialized: false,

  setUnreadNotifCount: (count) => set({ unreadNotifCount: Math.max(0, count) }),
  setUnreadChatCount: (count) => set({ unreadChatCount: Math.max(0, count) }),
  decrementUnreadNotifCount: () =>
    set((state) => ({ unreadNotifCount: Math.max(0, state.unreadNotifCount - 1) })),
  setNotifDrawerOpen: (isNotifDrawerOpen) => set({ isNotifDrawerOpen }),
  toggleNotifDrawer: () => set((state) => ({ isNotifDrawerOpen: !state.isNotifDrawerOpen })),

  fetchUnreadCounts: async () => {
    try {
      const [notifRes, chatRes] = await Promise.all([
        axiosClient.get<ApiResponse<{ count: number; unreadNotifications?: number }>>('/notifications/unread-count').catch(() => null),
        axiosClient.get<ApiResponse<{ count: number }>>('/chat/unread-count').catch(() => null),
      ]);

      if (notifRes?.data?.data) {
        const data = notifRes.data.data;
        set({ unreadNotifCount: data.count ?? data.unreadNotifications ?? 0 });
      }

      if (chatRes?.data?.data) {
        set({ unreadChatCount: chatRes.data.data.count ?? 0 });
      }
    } catch (_err) { }
  },

  initSocketListeners: (token?: string) => {
    let socket = socketClient.getSocket();

    if ((!socket || !socket.connected) && token) {
      socket = socketClient.connect(token);
    }

    if (get().isInitialized && socket?.connected) return () => { };
    set({ isInitialized: true });

    // Initial fetch
    get().fetchUnreadCounts();

    if (!socket) return () => {};

    // Listen for new notifications
    const handleNewNotif = () => {
      set((state) => ({ unreadNotifCount: state.unreadNotifCount + 1 }));
      get().fetchUnreadCounts();
    };

    // Listen for unread count updates from backend
    const handleUnreadUpdate = (data: { count: number; type?: 'NOTIFICATIONS' | 'CHAT' }) => {
      if (data.type === 'CHAT') {
        set({ unreadChatCount: data.count });
      } else {
        set({ unreadNotifCount: data.count });
      }
      get().fetchUnreadCounts();
    };

    // Listen for incoming chat messages
    const handleReceiveMessage = (message: any) => {
      set((state) => ({ unreadChatCount: state.unreadChatCount + 1 }));
      get().fetchUnreadCounts();

      if (message && message.conversationId) {
        const convId = typeof message.conversationId === 'object'
          ? (message.conversationId?._id || message.conversationId?.id || message.conversationId?.toString())
          : message.conversationId;

        if (convId) {
          useChatStore.getState().addMessage(convId.toString(), message);
        }

        // Dispatch instant event for top notification banner
        try {
          window.dispatchEvent(new CustomEvent('in_app_chat_message', { detail: message }));
        } catch (e) { }
      }
    };

    // Listen for chat message read receipts
    const handleMessageRead = () => {
      get().fetchUnreadCounts();
    };

    socket.on('notification_created', handleNewNotif);
    socket.on('unread_count_updated', handleUnreadUpdate);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_read', handleMessageRead);

    return () => {
      socket.off('notification_created', handleNewNotif);
      socket.off('unread_count_updated', handleUnreadUpdate);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_read', handleMessageRead);
      set({ isInitialized: false });
    };
  },
}));
