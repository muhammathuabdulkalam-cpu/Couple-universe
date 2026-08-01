import { useQuery } from '@tanstack/react-query';
import { Heart, MessageSquare, Search } from 'lucide-react';
import React, { useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useChatStore } from '../../store/chatStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { ApiResponse, ConversationItem } from '../../types/index.js';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';

interface ConversationListProps {
  onSelectConversation?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({ onSelectConversation }) => {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const {
    conversations,
    setConversations,
    activeConversation,
    setActiveConversation,
    onlineUsers,
  } = useChatStore();

  const [search, setSearch] = useState('');

  // Fetch Conversations via React Query
  const { data: convData, refetch } = useQuery<ConversationItem[]>({
    queryKey: ['userConversations'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<ConversationItem[]>>('/chat/conversations');
      return res.data.data!;
    },
  });

  React.useEffect(() => {
    if (convData) {
      setConversations(convData);
      if (!activeConversation && convData.length > 0) {
        setActiveConversation(convData[0]);
      }
    }
  }, [convData, setConversations, activeConversation, setActiveConversation]);

  const handleStartRelationshipChat = async () => {
    try {
      const res = await axiosClient.post<ApiResponse<ConversationItem>>('/chat/conversations', {
        type: 'RELATIONSHIP',
      });
      refetch();
      if (res.data.data) {
        setActiveConversation(res.data.data);
        if (onSelectConversation) onSelectConversation();
      }
      addToast('Relationship Room Ready', 'Joined Afzal & Amrin chat room.', 'success');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to open relationship chat', 'error');
    }
  };

  const filteredConversations = (conversations || []).filter((c) => {
    if (c.type === 'RELATIONSHIP') return true;
    const otherParticipant = c.participants?.find((p) => p._id !== user?.id && p.id !== user?.id);
    return otherParticipant?.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Card variant="glass" className="p-4 h-full flex flex-col space-y-4 border-none select-none rounded-none">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-amrin" />
          <h3 className="text-base font-bold text-white tracking-tight">Chats</h3>
        </div>
        <Button
          variant="glass"
          size="sm"
          onClick={handleStartRelationshipChat}
          leftIcon={<Heart className="w-3.5 h-3.5 text-heart fill-heart" />}
        >
          Relationship Room
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search chats..."
          className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amrin"
        />
      </div>

      {/* Conversation Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((c) => {
            const isActive = activeConversation?._id === c._id;
            const otherParticipant = c.participants?.find((p) => p._id !== user?.id && p.id !== user?.id);
            const isOnline = otherParticipant ? onlineUsers[otherParticipant._id] : false;

            const partnerName = otherParticipant?.name || (user?.role === 'SUPER_OWNER' ? 'Amrin' : 'Afzal');
            const partnerRole = otherParticipant?.role || (user?.role === 'SUPER_OWNER' ? 'CO_OWNER' : 'SUPER_OWNER');

            const isCoOwner = partnerRole === 'CO_OWNER' || partnerName.toLowerCase().includes('amrin');

            return (
              <div
                key={c._id}
                onClick={() => {
                  setActiveConversation(c);
                  if (onSelectConversation) onSelectConversation();
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-gradient-to-r from-afzal/20 to-amrin/20 border-amrin/40 shadow-lg'
                    : 'glass-card border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-afzal to-amrin flex items-center justify-center font-bold text-white text-sm shadow overflow-hidden">
                      {otherParticipant?.avatar ? (
                        <img src={otherParticipant.avatar} alt={partnerName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{partnerName?.[0] || '❤️'}</span>
                      )}
                    </div>
                    {isOnline && (
                      <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-obsidian-950 absolute -bottom-0.5 -right-0.5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <span>{partnerName}</span>
                        {isCoOwner && (
                          <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full border bg-amrin/20 text-amrin-glow border-amrin/40">
                            Princess 👸
                          </span>
                        )}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {c.lastMessageId?.content || 'No messages yet'}
                    </p>
                  </div>
                </div>

                {c.lastMessageId && (
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {new Date(c.lastMessageId.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">
            No active chats. Click above to open Relationship Room.
          </div>
        )}
      </div>

    </Card>
  );
};
