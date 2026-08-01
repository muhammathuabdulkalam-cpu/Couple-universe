import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserCheck, UserPlus } from 'lucide-react';
import React from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { ApiResponse } from '../../types/index.js';

interface Props {
  targetUserId: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const FollowButton: React.FC<Props> = ({ targetUserId, className = '', size = 'md' }) => {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const isSelf = user?._id === targetUserId || user?.id === targetUserId;

  const { data: statusData } = useQuery<{ isFollowing: boolean; isFollower: boolean; isBlocked: boolean }>({
    queryKey: ['followStatus', targetUserId],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<{ isFollowing: boolean; isFollower: boolean; isBlocked: boolean }>>(
        `/social/follow-status/${targetUserId}`
      );
      return res.data.data!;
    },
    enabled: !!targetUserId && !isSelf,
  });

  const followMutation = useMutation({
    mutationFn: () => axiosClient.post(`/social/follow/${targetUserId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['followStatus', targetUserId] });
      qc.invalidateQueries({ queryKey: ['followers', targetUserId] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => axiosClient.delete(`/social/unfollow/${targetUserId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['followStatus', targetUserId] });
      qc.invalidateQueries({ queryKey: ['followers', targetUserId] });
    },
  });

  if (isSelf || !targetUserId) return null;

  const isFollowing = statusData?.isFollowing;
  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  const handleToggle = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1 text-xs gap-1 rounded-lg'
      : 'px-4 py-1.5 text-xs font-semibold gap-1.5 rounded-xl';

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={handleToggle}
      className={`inline-flex items-center justify-center transition-all ${sizeClasses} ${
        isFollowing
          ? 'glass-panel text-slate-300 hover:text-rose-400 hover:border-rose-500/40'
          : 'bg-gradient-to-r from-afzal to-amrin text-white shadow-md hover:brightness-110'
      } ${className}`}
    >
      {isFollowing ? (
        <>
          <UserCheck className="w-3.5 h-3.5" />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5" />
          <span>Follow</span>
        </>
      )}
    </button>
  );
};
