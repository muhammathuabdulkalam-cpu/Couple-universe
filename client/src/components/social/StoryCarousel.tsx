import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { ApiResponse, StoryItem } from '../../types/index.js';
import { StoryCreator } from './StoryCreator.js';
import { StoryViewer } from './StoryViewer.js';

export const StoryCarousel: React.FC = () => {
  const { user } = useAuthStore();
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);
  const [showStoryCreator, setShowStoryCreator] = useState(false);

  const { data: stories = [] } = useQuery<StoryItem[]>({
    queryKey: ['stories'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<StoryItem[]>>('/stories');
      return res.data.data ?? [];
    },
    staleTime: 15_000,
  });

  // Group active stories by user ID string
  const grouped = stories.reduce<Record<string, StoryItem[]>>((acc, s) => {
    const uid = String(s.userId._id || s.userId);
    if (!acc[uid]) acc[uid] = [];
    acc[uid].push(s);
    return acc;
  }, {});

  const users = Object.values(grouped);

  return (
    <>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide px-1 select-none items-center py-0.5 max-w-full">
        {/* Your Story Bubble */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            onClick={() => setShowStoryCreator(true)}
            className="relative cursor-pointer group shrink-0"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-afzal via-amrin to-heart p-[2px] shadow-md group-hover:scale-105 transition-transform shrink-0 overflow-hidden">
              <div className="w-full h-full rounded-full bg-obsidian-950 flex items-center justify-center overflow-hidden shrink-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-full shrink-0"
                  />
                ) : (
                  <span className="text-base font-bold text-white">{user?.name?.[0] || 'U'}</span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-sky-500 border-2 border-obsidian-950 flex items-center justify-center shadow-md">
              <Plus className="w-2.5 h-2.5 text-white stroke-[3]" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-300 w-14 text-center truncate">Your Story</span>
        </div>

        {/* Other Active User Story Bubbles */}
        {users.map((userStories) => {
          const first = userStories[0];
          const storyUser = first.userId;
          const isViewed = first.viewedBy?.includes(user?._id ?? '');
          const storyUserId = String(storyUser._id || storyUser);

          return (
            <div
              key={storyUserId || first._id}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
              onClick={() => setActiveStory(first)}
            >
              <div
                className={`w-14 h-14 rounded-full p-[2px] shadow-md hover:scale-105 transition-transform shrink-0 overflow-hidden ${
                  isViewed
                    ? 'bg-slate-700'
                    : 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 animate-pulse-glow'
                }`}
              >
                <div className="w-full h-full rounded-full bg-obsidian-950 p-[2px] overflow-hidden shrink-0">
                  {storyUser.avatar ? (
                    <img
                      src={storyUser.avatar}
                      alt={storyUser.name}
                      className="w-full h-full object-cover rounded-full shrink-0"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-base rounded-full bg-obsidian-900">
                      {storyUser.name?.[0]}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-300 w-14 text-center truncate">
                {storyUser.name?.split(' ')[0]}
              </span>
            </div>
          );
        })}

        {users.length === 0 && (
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 py-1 px-3 glass-panel rounded-full border border-white/5 shrink-0">
            <span>Share a 24h Story</span>
            <span className="text-amrin-glow">✨</span>
          </div>
        )}
      </div>

      {/* Story Fullscreen Viewer */}
      {activeStory && (
        <StoryViewer
          story={activeStory}
          allStories={grouped[String(activeStory.userId._id || activeStory.userId)] ?? []}
          onClose={() => setActiveStory(null)}
        />
      )}

      {/* Story Multi-Source Creator & Preview Editor */}
      <StoryCreator
        isOpen={showStoryCreator}
        onClose={() => setShowStoryCreator(false)}
      />
    </>
  );
};
