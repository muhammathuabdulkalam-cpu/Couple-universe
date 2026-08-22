import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Reply, Send, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { socketClient } from '../../api/socketClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { ApiResponse, CommentItem, CommentTargetType } from '../../types/index.js';
import { useUIStore } from '../../store/uiStore.js';

import { useNavigate } from 'react-router-dom';

interface Props {
  targetType: CommentTargetType;
  targetId: string;
  authorId?: string;
}

export const CommentSection: React.FC<Props> = ({ targetType, targetId, authorId }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const qc = useQueryClient();
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);

  const queryKey = ['comments', targetType, targetId];

  // Real-time socket listener for instant comment updates
  useEffect(() => {
    const socket = socketClient.getSocket();
    if (!socket) return;

    const handleCommentAdded = (data: { targetType: string; targetId: string; comment: any }) => {
      if (data.targetType === targetType && data.targetId === targetId) {
        qc.invalidateQueries({ queryKey });
      }
    };

    socket.on('comment_added', handleCommentAdded);
    return () => {
      socket.off('comment_added', handleCommentAdded);
    };
  }, [targetType, targetId, queryKey, qc]);

  const { data: comments = [], isLoading } = useQuery<CommentItem[]>({
    queryKey,
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<CommentItem[]>>(
        `/comments/${targetType}/${targetId}`
      );
      return res.data.data ?? [];
    },
    enabled: !!targetId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { targetType: string; targetId: string; content: string; parentCommentId?: string; authorId?: string }) =>
      axiosClient.post('/comments', payload),
    onSuccess: () => {
      setContent('');
      setReplyTo(null);
      qc.invalidateQueries({ queryKey });
    },
  });

  const likeMutation = useMutation({
    mutationFn: (commentId: string) => axiosClient.post(`/comments/${commentId}/like`),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => axiosClient.delete(`/comments/${commentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    createMutation.mutate({
      targetType,
      targetId,
      content: content.trim(),
      parentCommentId: replyTo?._id,
      authorId,
    });
  };

  const handleProfileClick = (targetUserObj: any, targetUserIdStr?: string) => {
    if (!targetUserIdStr) return;

    const currentUserIdStr = (user?._id || user?.id)?.toString();
    const isSelf = currentUserIdStr === targetUserIdStr;
    const isCurrentUserOwner = user?.role === 'SUPER_OWNER' || user?.role === 'CO_OWNER';

    if (!isCurrentUserOwner && !isSelf) {
      const parentOwnerId = (user as any)?.parentOwnerId;
      const isTargetParent = (parentOwnerId && targetUserIdStr === parentOwnerId.toString()) || targetUserObj?.role === 'SUPER_OWNER';
      if (!isTargetParent) {
        addToast('Access Restricted', 'Invited users can only view their own profile or their parent owner profile.', 'warning');
        return;
      }
    }

    navigate('/profile', { state: { targetUserId: targetUserIdStr } });
  };

  const renderComment = (comment: CommentItem, isReply = false) => {
    const currentUserIdStr = (user?._id || user?.id)?.toString();
    const commentUserIdStr = ((comment.userId as any)?._id || (comment.userId as any)?.id || comment.userId)?.toString();
    const isOwner = Boolean(currentUserIdStr && commentUserIdStr === currentUserIdStr);
    const isLiked = Boolean(
      currentUserIdStr &&
        comment.likedBy?.some((item: any) => {
          const itemId = typeof item === 'object' ? (item._id || item.id)?.toString() : item?.toString();
          return itemId === currentUserIdStr;
        })
    );

    return (
      <div key={comment._id} className={`flex gap-3 text-xs ${isReply ? 'ml-8 mt-2.5 border-l-2 border-white/10 pl-3' : 'mt-3'}`}>
        <div
          onClick={() => handleProfileClick(comment.userId, commentUserIdStr)}
          className="w-7 h-7 rounded-full bg-afzal/20 border border-white/10 overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {comment.userId.avatar ? (
            <img src={comment.userId.avatar} alt={comment.userId.name} className="w-full h-full object-cover"  onError={(e) => { if (!e.currentTarget.src || e.currentTarget.src.includes('unsplash.com')) { e.currentTarget.style.display='none'; } }}/>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-[10px]">
              {comment.userId.name?.[0]}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="glass-panel px-3 py-2 rounded-2xl border border-white/5">
            <div
              onClick={() => handleProfileClick(comment.userId, commentUserIdStr)}
              className="flex items-center justify-between gap-2 mb-1 cursor-pointer group"
            >
              <span className="font-semibold text-white group-hover:text-amrin-glow transition-colors">{comment.userId.name}</span>
              <span className="text-[10px] text-slate-500">
                {new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <p className="text-slate-300 break-words leading-relaxed">{comment.content}</p>
          </div>

          {/* Comment actions */}
          <div className="flex items-center gap-3 mt-1.5 px-2 text-[11px] text-slate-400">
            <button
              type="button"
              onClick={() => likeMutation.mutate(comment._id)}
              className={`flex items-center gap-1 hover:text-rose-400 transition-colors ${
                isLiked ? 'text-rose-400 font-semibold' : ''
              }`}
            >
              <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
              <span>{comment.likedBy?.length || 0}</span>
            </button>

            {!isReply && (
              <button
                type="button"
                onClick={() => setReplyTo(comment)}
                className="flex items-center gap-1 hover:text-slate-200 transition-colors"
              >
                <Reply className="w-3 h-3" />
                <span>Reply</span>
              </button>
            )}

            {isOwner && (
              <button
                type="button"
                onClick={() => deleteMutation.mutate(comment._id)}
                className="hover:text-rose-400 transition-colors ml-auto"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Nested Replies */}
          {comment.replies && comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Comments List */}
      <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
        {isLoading ? (
          <p className="text-center text-xs text-slate-500 py-4">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-4">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          comments.map((c) => renderComment(c))
        )}
      </div>

      {/* Reply indicator banner */}
      {replyTo && (
        <div className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-xl text-xs text-slate-300">
          <span>
            Replying to <strong className="text-white">{replyTo.userId.name}</strong>
          </span>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="text-slate-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={replyTo ? `Reply to ${replyTo.userId.name}...` : 'Write a comment...'}
          className="flex-1 bg-obsidian-900/80 border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-afzal/50"
        />
        <button
          type="submit"
          disabled={!content.trim() || createMutation.isPending}
          className="w-9 h-9 rounded-full bg-gradient-to-r from-afzal to-amrin flex items-center justify-center text-white disabled:opacity-40 hover:brightness-110 transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
