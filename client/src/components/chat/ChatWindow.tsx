import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Shield } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useChatStore } from '../../store/chatStore.js';
import { ApiResponse, MessageItem } from '../../types/index.js';
import { Badge } from '../ui/Badge.js';
import { Card } from '../ui/Card.js';
import { MessageBubble } from './MessageBubble.js';
import { MessageComposer } from './MessageComposer.js';
import { TypingIndicator } from './TypingIndicator.js';

export const ChatWindow: React.FC = () => {
  const { user } = useAuthStore();
  const {
    activeConversation,
    messages,
    setMessages,
    typingUsers,
    onlineUsers,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationId = activeConversation?._id;

  // Fetch Messages for Active Conversation
  const { data: messageData, isLoading } = useQuery<MessageItem[]>({
    queryKey: ['chatMessages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const res = await axiosClient.get<ApiResponse<MessageItem[]>>(`/chat/messages/${conversationId}`);
      return res.data.data!;
    },
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (conversationId && messageData) {
      setMessages(conversationId, messageData);
    }
  }, [conversationId, messageData, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, conversationId]);

  if (!activeConversation) {
    return (
      <Card variant="glass" className="p-12 h-full flex flex-col items-center justify-center text-center space-y-4 border-white/10">
        <MessageSquare className="w-12 h-12 text-amrin/40" />
        <h3 className="text-lg font-bold text-white">No Conversation Selected</h3>
        <p className="text-xs text-slate-400">Select a conversation from the sidebar or start a Relationship Room chat.</p>
      </Card>
    );
  }

  const otherParticipant = activeConversation.participants?.find((p) => p._id !== user?.id && p.id !== user?.id);
  const isOnline = otherParticipant ? onlineUsers[otherParticipant._id] : false;
  const currentMessages = conversationId ? messages[conversationId] || [] : [];
  const currentTyping = conversationId ? typingUsers[conversationId] || [] : [];

  return (
    <Card variant="glass" className="h-full flex flex-col p-0 overflow-hidden border-white/10 shadow-2xl">
      
      {/* Header */}
      <div className="p-4 glass-panel border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-afzal to-amrin flex items-center justify-center text-white font-bold text-sm shadow">
            {activeConversation.type === 'RELATIONSHIP' ? '❤️' : otherParticipant?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white">
                {activeConversation.type === 'RELATIONSHIP' ? 'Afzal & Amrin Relationship Room' : otherParticipant?.name}
              </h3>
              <Badge variant="violet" size="sm">
                {activeConversation.type}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="cyan" size="sm" className="hidden sm:flex items-center gap-1">
            <Shield className="w-3 h-3" /> End-to-End Encrypted
          </Badge>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-xs text-slate-400">Loading conversation history...</div>
        ) : currentMessages.length > 0 ? (
          currentMessages.map((m) => <MessageBubble key={m._id} message={m} />)
        ) : (
          <div className="text-center py-16 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amrin/10 border border-amrin/30 flex items-center justify-center text-amrin mx-auto text-xl">
              ❤️
            </div>
            <h4 className="text-sm font-bold text-white">Private Relationship Chat Room</h4>
            <p className="text-xs text-slate-400">Send your first message or voice note to begin chatting.</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Real-time Typing Indicator */}
      <TypingIndicator userNames={currentTyping} />

      {/* Message Composer */}
      <MessageComposer />

    </Card>
  );
};
