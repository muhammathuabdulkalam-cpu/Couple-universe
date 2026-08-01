import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { socketClient } from '../../api/socketClient.js';
import { useChatStore } from '../../store/chatStore.js';
import { ApiResponse, MessageItem } from '../../types/index.js';
import { MessageBubble } from './MessageBubble.js';

export const MessageContainer: React.FC = () => {
  const { activeConversation, messages, setMessages } = useChatStore();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationId = activeConversation?._id;

  // Fetch Conversation Messages via React Query
  const { data: fetchedMessages, isLoading } = useQuery<MessageItem[]>({
    queryKey: ['chatMessages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const res = await axiosClient.get<ApiResponse<MessageItem[]>>(`/chat/messages/${conversationId}`);
      return res.data.data!;
    },
    enabled: !!conversationId,
  });

  // Populate Zustand store
  useEffect(() => {
    if (conversationId && fetchedMessages) {
      setMessages(conversationId, fetchedMessages);
    }
  }, [conversationId, fetchedMessages, setMessages]);

  // Join Socket Room
  useEffect(() => {
    if (!conversationId) return;

    const socket = socketClient.getSocket();
    if (socket && socket.connected) {
      socket.emit('join_conversation', conversationId);
    }

    return () => {
      if (socket && socket.connected) {
        socket.emit('leave_conversation', conversationId);
      }
    };
  }, [conversationId]);

  const currentMessages = conversationId ? messages[conversationId] || [] : [];

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  // Pre-paint layout effect to guarantee 0-delay bottom positioning
  useLayoutEffect(() => {
    if (!conversationId || currentMessages.length === 0) return;

    scrollToBottom();

    // Secondary checks for dynamic images rendering
    const t1 = setTimeout(scrollToBottom, 20);
    const t2 = setTimeout(scrollToBottom, 100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [currentMessages.length, conversationId]);

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

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        if (el) el.scrollTop = el.scrollHeight;
      }}
      className="flex-1 min-h-0 overflow-y-auto overscroll-none p-3 sm:p-4 bg-obsidian-950/40"
    >
      <div className="flex flex-col justify-end min-h-full space-y-4">
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
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
