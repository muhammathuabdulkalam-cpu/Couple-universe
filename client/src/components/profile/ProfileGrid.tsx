import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Film, Heart, Image as ImageIcon, MessageCircle, X } from 'lucide-react';
import React, { useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useMediaStore } from '../../store/mediaStore.js';
import { ActivityItem, ApiResponse, MediaItem, StoryItem } from '../../types/index.js';
import { FeedCard } from '../social/FeedCard.js';
import { Skeleton } from '../ui/Skeleton.js';

interface ProfileGridProps {
  activeTab: 'posts' | 'stories' | 'memories' | 'tagged';
  targetUser?: any;
}

export const ProfileGrid: React.FC<ProfileGridProps> = ({ activeTab, targetUser }) => {
  const { user: currentUser } = useAuthStore();
  const { openViewer, setMediaList } = useMediaStore();
  const [selectedPost, setSelectedPost] = useState<ActivityItem | null>(null);

  const profileUser = targetUser || currentUser;
  const profileUserId = profileUser?._id;

  // Fetch Items strictly based on active tab and target user ID
  const { data: items = [], isLoading } = useQuery<any[]>({
    queryKey: ['profileGridContent', activeTab, profileUserId],
    queryFn: async () => {
      if (!profileUserId) return [];

      if (activeTab === 'posts') {
        // Fetch ONLY social posts created by this user
        const res = await axiosClient.get<ApiResponse<ActivityItem[]>>('/feed', {
          params: { userId: profileUserId },
        });

        const allFeedItems = res.data.data || [];
        
        // Filter ONLY posts that belong to this profile user and contain images/media
        const userPosts = allFeedItems.filter((act: any) => {
          const actUserId = String(act.userId?._id || act.userId?.id || act.userId);
          const isOwner = actUserId === String(profileUserId);
          const hasMediaUrl = !!(
            act.imageUrl ||
            act.referenceId?.secureUrl ||
            act.referenceId?.optimizedUrl ||
            act.referenceId?.url ||
            act.referenceId
          );
          return isOwner && hasMediaUrl;
        });

        return userPosts;
      }

      if (activeTab === 'stories') {
        // Fetch ONLY active stories created by this user
        const res = await axiosClient.get<ApiResponse<StoryItem[]>>('/stories');
        const userStories = (res.data.data || []).filter(
          (s: any) => String(s.userId?._id || s.userId?.id || s.userId) === String(profileUserId)
        );
        return userStories;
      }

      if (activeTab === 'memories') {
        // Fetch ONLY timeline memory events created by this user
        const res = await axiosClient.get<ApiResponse<any[]>>('/timeline/events');
        const userMemories = (res.data.data || []).filter(
          (m: any) => String(m.owner?._id || m.owner?.id || m.owner) === String(profileUserId)
        );
        return userMemories;
      }

      return [];
    },
    enabled: !!profileUserId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-1 md:gap-3 pt-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg md:rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 space-y-3 glass-panel rounded-2xl border border-white/5 my-4">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-400">
          <ImageIcon className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-300">No {activeTab} shared yet</p>
        <p className="text-xs text-slate-500">
          {activeTab === 'posts'
            ? 'Social posts shared by this user will appear here.'
            : activeTab === 'stories'
            ? 'Active stories shared by this user will appear here.'
            : 'Timeline memories created by this user will appear here.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-3 gap-1 md:gap-3 pt-2 select-none"
      >
        {items.map((item, index) => {
          const imageUrl =
            activeTab === 'posts'
              ? item.imageUrl ||
                item.referenceId?.secureUrl ||
                item.referenceId?.optimizedUrl ||
                item.referenceId?.url ||
                (typeof item.referenceId === 'string' ? item.referenceId : null)
              : activeTab === 'stories'
              ? item.mediaId?.secureUrl || item.mediaId?.optimizedUrl || item.mediaUrl
              : item.imageUrl || item.mediaUrl;

          if (!imageUrl) return null;

          const isVideo = typeof imageUrl === 'string' && (imageUrl.endsWith('.mp4') || imageUrl.endsWith('.webm'));

          const userRef = {
            _id: profileUser?._id || '',
            name: profileUser?.name || '',
            email: profileUser?.email || '',
            avatar: profileUser?.avatar,
          };

          const mediaAdapter: MediaItem = {
            _id: item._id,
            owner: profileUser?._id || '',
            createdBy: userRef,
            title: item.title || item.caption || 'Post Media',
            caption: item.description || item.caption,
            tags: [],
            peopleTagged: [],
            visibility: 'COUPLE',
            memoryDate: item.createdAt || new Date().toISOString(),
            cloudinaryPublicId: item._id,
            secureUrl: imageUrl,
            optimizedUrl: imageUrl,
            thumbnailUrl: imageUrl,
            width: 1080,
            height: 1080,
            aspectRatio: 1,
            orientation: 'SQUARE',
            mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
            fileSize: 1024,
            isFavorite: false,
            isArchived: false,
            isDeleted: false,
            viewCount: 1,
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString(),
          };

          return (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => {
                if (activeTab === 'posts') {
                  setSelectedPost(item);
                } else {
                  setMediaList([mediaAdapter]);
                  openViewer(mediaAdapter);
                }
              }}
              className="group relative aspect-square bg-obsidian-900 rounded-md md:rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-amrin/40 transition-all shadow-md"
            >
              {/* Image / Video Thumbnail */}
              {isVideo ? (
                <video
                  src={imageUrl}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  muted
                />
              ) : (
                <img
                  src={imageUrl}
                  alt={item.title || 'Post thumbnail'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              )}

              {/* Video Badge */}
              {isVideo && (
                <div className="absolute top-2 right-2 p-1 rounded-full bg-black/60 backdrop-blur-sm text-white">
                  <Film className="w-3 h-3" />
                </div>
              )}

              {/* Hover Overlay with Likes/Comments count */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-semibold text-xs md:text-sm backdrop-blur-[2px]">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-heart fill-heart" />
                  <span>1</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>0</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Instagram Single Post Overlay Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl select-none overflow-y-auto pt-14 pb-10">
            {/* Floating Close Button */}
            <button
              onClick={() => setSelectedPost(null)}
              className="fixed top-4 right-4 z-[310] p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg mx-auto px-0 sm:px-4"
            >
              <FeedCard activity={selectedPost} autoOpenComments={false} highlighted={false} variant="modal" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
