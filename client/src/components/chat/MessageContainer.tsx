import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { socketClient } from '../../api/socketClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useChatStore } from '../../store/chatStore.js';
import { useNotificationStore } from '../../store/notificationStore.js';
import { ApiResponse, MessageItem } from '../../types/index.js';
import { MessageBubble } from './MessageBubble.js';

export const MessageContainer: React.FC = () => {
  const { user } = useAuthStore();
  const { activeConversation, messages, setMessages, mobileView } = useChatStore();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationId = activeConversation?._id;
  const currentUserId = user?._id || user?.id;

  // Fetch Conversation Messages via React Query with 3s background auto-sync
  const { data: fetchedMessages, isLoading } = useQuery<MessageItem[]>({
    queryKey: ['chatMessages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const res = await axiosClient.get<ApiResponse<MessageItem[]>>(`/chat/messages/${conversationId}`);
      return res.data.data!;
    },
    enabled: !!conversationId,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });

  // Safely merge fetched messages into Zustand store without wiping out real-time messages
  useEffect(() => {
    if (!conversationId || !fetchedMessages) return;

    const existingInStore = useChatStore.getState().messages[conversationId] || [];
    const messageMap = new Map<string, MessageItem>();

    // 1. Add API-fetched messages
    fetchedMessages.forEach((m) => {
      if (m._id) messageMap.set(m._id.toString(), m);
    });

    // 2. Preserve real-time messages added via socket/composer that aren't in fetchedMessages yet
    existingInStore.forEach((m) => {
      if (m._id && !messageMap.has(m._id.toString())) {
        messageMap.set(m._id.toString(), m);
      }
    });

    // 3. Sort chronologically by creation timestamp
    const mergedMessages = Array.from(messageMap.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    setMessages(conversationId, mergedMessages);
  }, [conversationId, fetchedMessages, setMessages]);

  const currentMessages = conversationId ? messages[conversationId] || [] : [];
  const markedAsReadRef = useRef<Set<string>>(new Set());

  // Auto mark unread messages as read upon viewing inside the open chat window
  useEffect(() => {
    if (!conversationId || !currentUserId || currentMessages.length === 0) return;

    const isMobile = window.innerWidth < 1024;
    if (isMobile && mobileView !== 'chat') return;

    const unreadMessages = currentMessages.filter((m) => {
      if (markedAsReadRef.current.has(m._id)) return false;

      const sId = typeof m.sender === 'object' ? (m.sender._id || m.sender.id) : m.sender;
      const isSelf = Boolean(sId && sId.toString() === currentUserId.toString());
      const isReadByMe = Boolean(
        m.readBy?.some((r) => {
          const rId = typeof r.userId === 'object' ? ((r.userId as any)._id || (r.userId as any).id) : r.userId;
          return rId && rId.toString() === currentUserId.toString();
        })
      );
      return !isSelf && !isReadByMe;
    });

    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map((m) => m._id);
      unreadIds.forEach((id) => markedAsReadRef.current.add(id));

      const socket = socketClient.getSocket();
      if (socket && socket.connected) {
        socket.emit('mark_read', { conversationId, messageIds: unreadIds });
      }

      unreadIds.forEach((id) => {
        axiosClient.patch(`/chat/messages/${id}/read`).catch(() => {});
      });

      const updatedMessages = currentMessages.map((m) => {
        if (unreadIds.includes(m._id)) {
          const existingReadBy = m.readBy || [];
          return {
            ...m,
            readBy: [...existingReadBy, { userId: currentUserId, readAt: new Date().toISOString() }],
          };
        }
        return m;
      });

      setMessages(conversationId, updatedMessages);
      useNotificationStore.getState().fetchUnreadCounts();
    }
  }, [conversationId, currentMessages, currentUserId, setMessages, mobileView]);

  // Join Socket Room & listen for reconnect events
  useEffect(() => {
    if (!conversationId) return;

    const joinRoom = () => {
      const socket = socketClient.getSocket();
      if (socket && socket.connected) {
        socket.emit('join_conversation', conversationId);
      }
    };

    joinRoom();

    const socket = socketClient.getSocket();
    if (socket) {
      socket.on('connect', joinRoom);
    }

    return () => {
      if (socket) {
        socket.off('connect', joinRoom);
        if (socket.connected) {
          socket.emit('leave_conversation', conversationId);
        }
      }
    };
  }, [conversationId]);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, []);

  // Pre-paint layout effect to guarantee 100% bottom positioning when entering chat or receiving messages
  useLayoutEffect(() => {
    if (!conversationId || currentMessages.length === 0) return;

    scrollToBottom();

    const t1 = setTimeout(scrollToBottom, 40);
    const t2 = setTimeout(scrollToBottom, 180);
    const t3 = setTimeout(scrollToBottom, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [conversationId, currentMessages.length, mobileView, scrollToBottom]);

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group messages by date string
  const groupedMessages = currentMessages.reduce((acc: Record<string, MessageItem[]>, msg) => {
    const label = formatDateLabel(msg.createdAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(msg);
    return acc;
  }, {});

  const { wallpaper } = useChatStore();

  const getWallpaperClass = (preset: string) => {
    switch (preset) {
      case 'aurora':
        return 'bg-gradient-to-br from-indigo-950/80 via-purple-950/80 to-pink-950/80';
      case 'stars':
        return 'bg-gradient-to-b from-slate-950 via-blue-950/90 to-slate-950 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]';
      case 'doodle':
        return 'bg-slate-950 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]';
      case 'rose':
        return 'bg-gradient-to-br from-rose-950/80 via-obsidian-950 to-pink-950/80';
      case 'emerald':
        return 'bg-gradient-to-br from-emerald-950/80 via-obsidian-950 to-teal-950/80';
      case 'midnight':
      default:
        return 'bg-obsidian-950/60';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex-1 min-h-0 overflow-y-auto overscroll-none p-3 sm:p-4 transition-all duration-300 ${getWallpaperClass(wallpaper)}`}
    >
      <div className="flex flex-col space-y-4 min-h-full">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-amrin border-t-transparent animate-spin" />
            <p className="text-xs text-slate-400 font-mono">Loading messages...</p>
          </div>
        ) : currentMessages.length > 0 ? (
          Object.keys(groupedMessages).map((dateLabel) => (
            <div key={dateLabel} className="space-y-3">
              
              {/* Date Separator Pill */}
              <div className="flex items-center justify-center my-3">
                <span className="glass-panel px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider text-slate-400 border border-white/5 shadow-sm">
                  {dateLabel}
                </span>
              </div>

              {/* Messages in Date Group */}
              {groupedMessages[dateLabel].map((msg) => (
                <MessageBubble key={msg._id} message={msg} />
              ))}

            </div>
          ))
        ) : (
          <div className="text-center py-20 space-y-3">
            <div className="w-16 h-16 rounded-full bg-amrin/10 border border-amrin/30 flex items-center justify-center text-amrin mx-auto text-2xl">
              ❤️
            </div>
            <h4 className="text-base font-bold text-white">Afzal & Amrin Private Room</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Messages are end-to-end encrypted. Type a message or record a voice note to start chatting.
            </p>
          </div>
        )}
        <div ref={messagesEndRef} className="h-px w-full shrink-0" />
      </div>
    </div>
  );
};
