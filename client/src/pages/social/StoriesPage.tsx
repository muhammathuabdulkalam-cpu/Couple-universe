import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Plus, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { MediaPicker } from '../../components/media/MediaPicker.js';
import { StoryViewer } from '../../components/social/StoryViewer.js';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { ApiResponse, MediaItem, StoryItem } from '../../types/index.js';

export const StoriesPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const qc = useQueryClient();
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'FRIENDS' | 'PARTNER'>('PARTNER');
  const [showComposer, setShowComposer] = useState(false);
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);

  // Fetch active stories
  const { data: stories = [], isLoading } = useQuery<StoryItem[]>({
    queryKey: ['stories'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<StoryItem[]>>('/stories');
      return res.data.data ?? [];
    },
  });

  const createStoryMutation = useMutation({
    mutationFn: () =>
      axiosClient.post('/stories', {
        mediaId: selectedMedia?._id,
        caption: caption.trim() || undefined,
        visibility,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['sharedGalleryStories'] });
      addToast('Story Published!', 'Your 24h story has been shared.', 'success');
      setShowComposer(false);
      setSelectedMedia(null);
      setCaption('');
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/stories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories'] });
      qc.invalidateQueries({ queryKey: ['sharedGalleryStories'] });
      addToast('Story Deleted', 'Story removed successfully.', 'info');
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 select-none">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-2xl flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">24h Stories Engine</h1>
          <p className="text-xs text-slate-400">Share instant moments that expire after 24 hours</p>
        </div>
        <button
          type="button"
          onClick={() => setShowComposer(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-afzal to-amrin text-white text-xs font-semibold shadow-lg hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Story</span>
        </button>
      </div>

      {/* Story Composer Modal */}
      {showComposer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-card rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setShowComposer(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-afzal" />
              <span>Create 24h Story</span>
            </h3>

            {/* Select Media */}
            {selectedMedia ? (
              <div className="relative w-full aspect-[3/4] max-h-64 rounded-2xl overflow-hidden bg-black border border-white/10">
                <img src={selectedMedia.secureUrl || selectedMedia.optimizedUrl} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setSelectedMedia(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => setShowMediaPicker(true)}
                className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center cursor-pointer glass-panel hover:border-afzal transition-all flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-afzal/20 border border-afzal/30 flex items-center justify-center text-afzal font-bold text-xl">
                  +
                </div>
                <p className="text-xs font-semibold text-white">Choose Story Image or Video</p>
                <p className="text-[11px] text-slate-400">Upload from device, camera, or vault</p>
              </div>
            )}

            {/* Caption */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Caption (Optional)</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a short caption..."
                className="w-full bg-obsidian-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-afzal/50"
              />
            </div>

            {/* Visibility */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Visibility</label>
              <select
                value={visibility}
                onChange={(e: any) => setVisibility(e.target.value)}
                className="w-full bg-obsidian-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="PARTNER">Partner Only ❤️</option>
                <option value="FRIENDS">Friends & Family 👥</option>
                <option value="PUBLIC">Public 🌐</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                className="px-4 py-2 rounded-xl glass-panel text-xs text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedMedia || createStoryMutation.isPending}
                onClick={() => createStoryMutation.mutate()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-afzal to-amrin text-white text-xs font-semibold disabled:opacity-40"
              >
                {createStoryMutation.isPending ? 'Publishing...' : 'Publish Story'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker modal */}
      {showMediaPicker && (
        <MediaPicker
          title="Select Photo/Video for Story"
          onSelectMedia={(media) => {
            setSelectedMedia(media);
            setShowMediaPicker(false);
          }}
          onClose={() => setShowMediaPicker(false)}
        />
      )}

      {/* Active Stories Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">All Active Stories</h3>

        {isLoading ? (
          <p className="text-center text-xs text-slate-500 py-8">Loading stories...</p>
        ) : stories.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center text-xs text-slate-400 border border-white/10">
            No active stories right now. Click "New Story" to create one!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {stories.map((story) => {
              const isAuthor = story.userId._id === user?._id || story.userId._id === user?.id;
              const canDelete = isAuthor || user?.role === 'SUPER_OWNER' || user?.role === 'CO_OWNER';

              return (
                <div
                  key={story._id}
                  className="glass-card rounded-2xl overflow-hidden border border-white/10 relative group cursor-pointer aspect-[3/4]"
                  onClick={() => setActiveStory(story)}
                >
                  <img
                    src={story.mediaId?.secureUrl || story.mediaId?.optimizedUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-white bg-black/40 px-2 py-0.5 rounded-full">
                        {story.userId.name}
                      </span>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteStoryMutation.mutate(story._id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {story.caption && (
                      <p className="text-xs text-white font-medium truncate">{story.caption}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeStory && (
        <StoryViewer
          story={activeStory}
          allStories={stories}
          onClose={() => setActiveStory(null)}
        />
      )}
    </div>
  );
};
