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

  const currentUserIdStr = (user?._id || user?.id || '').toString();

  // Group active stories by user ID string
  const grouped = stories.reduce<Record<string, StoryItem[]>>((acc, s) => {
    const rawId = s.userId._id || (s.userId as any).id || s.userId;
    const uid = String(rawId);
    if (!acc[uid]) acc[uid] = [];
    acc[uid].push(s);
    return acc;
  }, {});

  // My active stories
  const myStories = grouped[currentUserIdStr] || [];
  const hasMyStories = myStories.length > 0;

  // Filter out current user from other user bubbles list to prevent duplicate story bubbles
  const partnerUserStoriesList = Object.entries(grouped)
    .filter(([uid]) => uid !== currentUserIdStr)
    .map(([, userStories]) => userStories);

  const handleYourStoryClick = () => {
    if (hasMyStories) {
      setActiveStory(myStories[0]);
    } else {
      setShowStoryCreator(true);
    }
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStoryCreator(true);
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide px-1 select-none items-center py-0.5 max-w-full">
        {/* Your Story Bubble (Views your story if present, else opens Creator) */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            onClick={handleYourStoryClick}
            className="relative cursor-pointer group shrink-0"
          >
            <div
              className={`w-14 h-14 rounded-full p-[2px] shadow-md group-hover:scale-105 transition-transform shrink-0 overflow-hidden ${
                hasMyStories
                  ? 'bg-gradient-to-tr from-afzal via-amrin to-heart'
                  : 'bg-slate-700/80'
              }`}
            >
              <div className="w-full h-full rounded-full bg-obsidian-950 flex items-center justify-center overflow-hidden shrink-0">
                {user?.avatar && !user.avatar.includes('unsplash.com') ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-full shrink-0"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <span className="text-base font-bold text-white">{user?.name?.[0] || 'U'}</span>
                )}
              </div>
            </div>

            {/* Plus badge to add new story */}
            <div
              onClick={handlePlusClick}
              className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-sky-500 hover:bg-sky-400 border-2 border-obsidian-950 flex items-center justify-center shadow-md transition-colors"
              title="Add to Story"
            >
              <Plus className="w-3 h-3 text-white stroke-[3]" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-300 w-14 text-center truncate">Your Story</span>
        </div>

        {/* Other Active User Story Bubbles */}
        {partnerUserStoriesList.map((userStories) => {
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
                  {storyUser.avatar && !storyUser.avatar.includes('unsplash.com') ? (
                    <img
                      src={storyUser.avatar}
                      alt={storyUser.name}
                      className="w-full h-full object-cover rounded-full shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
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

        {partnerUserStoriesList.length === 0 && !hasMyStories && (
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
          allStories={grouped[String(activeStory.userId._id || (activeStory.userId as any).id || activeStory.userId)] ?? []}
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
