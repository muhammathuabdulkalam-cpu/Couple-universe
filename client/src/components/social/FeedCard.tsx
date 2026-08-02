import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, MessageCircle, MoreVertical, Send, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { ActivityItem, ApiResponse, ReactionEmoji, ReactionItem } from '../../types/index.js';
import { CommentSection } from './CommentSection.js';
import { ReactionPicker } from './ReactionPicker.js';
import { ReportModal } from './ReportModal.js';

interface Props {
  activity: ActivityItem;
  autoOpenComments?: boolean;
  autoOpenLikes?: boolean;
  highlighted?: boolean;
  variant?: 'default' | 'modal';
}

export const FeedCard: React.FC<Props> = ({ activity, autoOpenComments = false, autoOpenLikes = false, highlighted = false, variant = 'default' }) => {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(autoOpenComments);
  const [showPicker, setShowPicker] = useState(autoOpenLikes);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showBigHeart, setShowBigHeart] = useState(false);

  React.useEffect(() => {
    if (autoOpenComments) setShowComments(true);
    if (autoOpenLikes) setShowPicker(true);
  }, [autoOpenComments, autoOpenLikes]);

  const targetId = activity.referenceId || activity._id;
  const targetType = (activity.refModel === 'TimelineEvent' ? 'MEMORY' : activity.refModel === 'Story' ? 'STORY' : 'ACTIVITY') as 'MEMORY' | 'STORY' | 'ACTIVITY';

  // Fetch reactions
  const { data: reactionsData } = useQuery<{ reactions: ReactionItem[]; summary: Record<string, number>; total: number }>({
    queryKey: ['reactions', targetType, targetId],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<{ reactions: ReactionItem[]; summary: Record<string, number>; total: number }>>(
        `/reactions/${targetType}/${targetId}`
      );
      return res.data.data!;
    },
    enabled: !!targetId,
  });

  // Fetch my reaction
  const { data: myReaction } = useQuery<ReactionItem | null>({
    queryKey: ['myReaction', targetType, targetId],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<ReactionItem>>(`/reactions/${targetType}/${targetId}/mine`);
      return res.data.data ?? null;
    },
    enabled: !!targetId,
  });

  const reactMutation = useMutation({
    mutationFn: (emoji: ReactionEmoji) =>
      axiosClient.post(`/reactions/${targetType}/${targetId}`, {
        emoji,
        authorId: activity.userId._id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reactions', targetType, targetId] });
      qc.invalidateQueries({ queryKey: ['myReaction', targetType, targetId] });
    },
  });

  const handleReact = (emoji: ReactionEmoji) => {
    reactMutation.mutate(emoji);
    setShowPicker(false);
  };

  const handleDoubleTap = () => {
    setShowBigHeart(true);
    reactMutation.mutate('❤️');
    setTimeout(() => setShowBigHeart(false), 900);
  };

  const handleDeletePost = async () => {
    try {
      await axiosClient.delete(`/feed/${activity._id}`);
      addToast('Post Deleted', 'Social feed post deleted successfully.', 'info');
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['sharedGalleryPosts'] });
      qc.invalidateQueries({ queryKey: ['sharedGalleryMedia'] });
      setShowMenu(false);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to delete post', 'error');
    }
  };

  const formattedDate = new Date(activity.createdAt).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  const isMyPost = activity.userId._id === user?._id || activity.userId._id === user?.id;
  const canDelete = isMyPost || user?.role === 'SUPER_OWNER' || user?.role === 'CO_OWNER';

  const totalLikes = reactionsData?.total || 0;
  const recentReactor = reactionsData?.reactions?.[0]?.userId?.name;
  
  let likesDisplay = 'Be the first to like';
  if (totalLikes === 1) {
    likesDisplay = `Liked by ${recentReactor || 'someone'}`;
  } else if (totalLikes > 1) {
    likesDisplay = recentReactor
      ? `Liked by ${recentReactor} and ${totalLikes - 1} others`
      : `${totalLikes} likes`;
  }

  return (
    <div
      className={`transition-all select-none w-full max-w-full ${
        variant === 'modal'
          ? 'bg-transparent text-white'
          : 'glass-card rounded-3xl border shadow-xl mb-5 overflow-hidden border-white/10 hover:border-white/20'
      } ${highlighted ? 'border-amrin shadow-2xl ring-2 ring-amrin/50' : ''}`}
    >
      {/* 1. Instagram Post Header */}
      <div className="p-3.5 flex items-center justify-between border-b border-white/5 bg-obsidian-950/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-afzal via-amrin to-heart p-[2px] shadow-md shrink-0">
            <div className="w-full h-full rounded-full bg-obsidian-950 overflow-hidden flex items-center justify-center">
              {activity.userId.avatar ? (
                <img src={activity.userId.avatar} alt={activity.userId.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">{activity.userId.name?.[0]}</span>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white leading-snug">{activity.userId.name}</h4>
            <p className="text-[10px] text-slate-400 font-mono">{activity.description?.startsWith('📍') ? activity.description : formattedDate}</p>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/5"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 z-30 w-36 glass-panel rounded-2xl p-1.5 border border-white/10 shadow-2xl space-y-1 bg-obsidian-950/95 backdrop-blur-2xl">
              {canDelete && (
                <button
                  type="button"
                  onClick={handleDeletePost}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Post
                </button>
              )}
              {!isMyPost && (
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors"
                >
                  Report Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Media Image / Video with Double Tap Heart */}
      {activity.imageUrl && (
        <div
          onDoubleClick={handleDoubleTap}
          className="relative w-full aspect-[4/3] max-h-[480px] bg-black overflow-hidden flex items-center justify-center cursor-pointer"
        >
          <img src={activity.imageUrl} alt={activity.title || 'Post media'} className="w-full h-full object-cover" />

          {/* Animated Big Heart on Double Tap */}
          <AnimatePresence>
            {showBigHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.4, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
              >
                <Heart className="w-24 h-24 text-heart fill-heart filter drop-shadow-2xl animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 3. Instagram Action Buttons Row */}
      <div className="px-4 py-2.5 flex items-center justify-between border-t border-white/5 relative">
        <div className="flex items-center gap-4">
          {/* Heart / Like Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => handleReact('❤️')}
              className="text-slate-300 hover:text-heart transition-colors p-1"
            >
              <Heart
                className={`w-6 h-6 transition-transform active:scale-125 ${
                  myReaction ? 'text-heart fill-heart' : 'text-slate-300'
                }`}
              />
            </button>

            {showPicker && (
              <div className="absolute bottom-10 left-0 z-30">
                <ReactionPicker onSelect={handleReact} onClose={() => setShowPicker(false)} />
              </div>
            )}
          </div>

          {/* Comment Toggle */}
          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            className="text-slate-300 hover:text-white transition-colors p-1"
          >
            <MessageCircle className="w-6 h-6" />
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: activity.title || 'Afrin Verse Post', url: window.location.href });
              }
            }}
            className="text-slate-300 hover:text-white transition-colors p-1"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 4. Instagram Likes Summary & Caption Section */}
      <div className="px-4 pb-3 space-y-1 text-xs">
        {/* Instagram Style Likes Line */}
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          className="text-xs font-bold text-white hover:underline block text-left"
        >
          {likesDisplay}
        </button>

        {/* Post Author & Description */}
        <div className="text-white leading-relaxed pt-0.5">
          <span className="font-bold mr-2">{activity.userId.name}</span>
          <span className="text-slate-200">{activity.title || activity.description}</span>
        </div>

        {activity.description && activity.title && (
          <p className="text-slate-400 text-[11px] leading-relaxed pt-0.5">{activity.description}</p>
        )}

        {/* View Comments Link */}
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="text-slate-400 hover:text-slate-200 text-[11px] pt-1 block"
        >
          {showComments ? 'Hide comments' : 'View all comments'}
        </button>
      </div>

      {/* Expandable Comment Section */}
      {showComments && (
        <div className="p-4 border-t border-white/5 bg-obsidian-950/60">
          <CommentSection targetType={targetType} targetId={targetId} authorId={activity.userId._id} />
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        targetType={targetType === 'ACTIVITY' ? 'MEMORY' : targetType}
        targetId={targetId}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
};
