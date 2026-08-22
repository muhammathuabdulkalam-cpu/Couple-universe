import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, X, UserCircle2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient.js';
import { ApiResponse, ReactionItem } from '../../types/index.js';

interface LikedByModalProps {
  targetType: 'MEMORY' | 'STORY' | 'ACTIVITY';
  targetId: string;
  isOpen: boolean;
  onClose: () => void;
}

import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';

export const LikedByModal: React.FC<LikedByModalProps> = ({
  targetType,
  targetId,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { addToast } = useUIStore();
  const [selectedEmoji, setSelectedEmoji] = useState<string>('ALL');

  const { data: reactionsData, isLoading } = useQuery<{
    reactions: ReactionItem[];
    summary: Record<string, number>;
    total: number;
  }>({
    queryKey: ['reactionsListModal', targetType, targetId],
    queryFn: async () => {
      const res = await axiosClient.get<
        ApiResponse<{ reactions: ReactionItem[]; summary: Record<string, number>; total: number }>
      >(`/reactions/${targetType}/${targetId}`);
      return res.data.data!;
    },
    enabled: isOpen && !!targetId,
  });

  if (!isOpen) return null;

  const reactions = reactionsData?.reactions || [];
  const summary = reactionsData?.summary || {};
  const total = reactionsData?.total || 0;

  const filteredReactions =
    selectedEmoji === 'ALL'
      ? reactions
      : reactions.filter((r) => r.emoji === selectedEmoji);

  const emojiTabs = ['ALL', ...Object.keys(summary)];

  const handleUserProfileClick = (uObj: any, uId: string) => {
    onClose();
    if (!uId) return;

    const currentUserIdStr = (currentUser?._id || currentUser?.id)?.toString();
    const isSelf = currentUserIdStr === uId.toString();
    const isCurrentUserOwner = currentUser?.role === 'SUPER_OWNER' || currentUser?.role === 'CO_OWNER';
    const isTargetUserOwner = uObj?.role === 'SUPER_OWNER' || uObj?.role === 'CO_OWNER' ||
      (uObj?.name && (uObj.name.toLowerCase().includes('afzal') || uObj.name.toLowerCase().includes('amrin')));

    if (!isCurrentUserOwner && !isSelf) {
      if (!isTargetUserOwner) {
        addToast('Access Restricted', 'Invited users can only view their own profile or parent owner profile.', 'warning');
        return;
      }
    }

    navigate('/profile', { state: { targetUserId: uId } });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
        {/* Backdrop click dismiss */}
        <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative z-10 w-full max-w-md bg-slate-950/95 border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 text-white overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Heart className="w-4 h-4 text-white fill-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  Likes & Reactions <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h3>
                <p className="text-[10px] text-slate-400">
                  {total} {total === 1 ? 'person' : 'people'} reacted to this post
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Emoji Filter Tabs */}
          {emojiTabs.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {emojiTabs.map((tab) => {
                const count = tab === 'ALL' ? total : summary[tab] || 0;
                const isActive = selectedEmoji === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelectedEmoji(tab)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-rose-500/20 text-rose-200 border-rose-500/50 shadow-md'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{tab === 'ALL' ? 'All' : tab}</span>
                    <span className="text-[10px] opacity-80 bg-white/10 px-1.5 py-0.2 rounded-full font-mono">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* User List */}
          <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1 text-white">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading reactions...
              </div>
            ) : filteredReactions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No likes recorded yet.
              </div>
            ) : (
              filteredReactions.map((item) => {
                const uObj = typeof item.userId === 'object' && item.userId ? (item.userId as any) : null;
                const uId = uObj?._id || uObj?.id || (typeof item.userId === 'string' ? item.userId : '');
                const name = uObj?.name || 'Someone';
                const avatar = uObj?.avatar && !uObj.avatar.includes('unsplash.com') ? uObj.avatar : null;

                return (
                  <div
                    key={item._id}
                    onClick={() => handleUserProfileClick(uObj, uId)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-rose-500/40 hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 p-[1.5px] overflow-hidden shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={name}
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {name[0] || <UserCircle2 className="w-5 h-5 text-slate-400" />}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-white truncate group-hover:text-rose-300 transition-colors">
                          {name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                      <span className="text-base">{item.emoji || '❤️'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
