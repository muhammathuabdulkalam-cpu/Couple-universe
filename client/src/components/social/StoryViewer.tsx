import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, Heart, Trash2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { ApiResponse, StoryItem } from '../../types/index.js';

const EMOJIS = ['❤️', '😂', '🔥', '😍', '👍', '😢'];
const STORY_DURATION = 5000;

interface Props {
  story: StoryItem;
  allStories: StoryItem[];
  onClose: () => void;
  openActivitySheet?: boolean;
}

export const StoryViewer: React.FC<Props> = ({ story, allStories, onClose, openActivitySheet = false }) => {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const qc = useQueryClient();

  // Fetch partner profile data for authentic profile picture rendering
  const { data: profileData } = useQuery<any>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<any>>('/profile');
      return res.data.data;
    },
  });

  const initialIndex = allStories.findIndex((s) => s._id === story._id);
  const [index, setIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [progress, setProgress] = useState(0);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showActivityTray, setShowActivityTray] = useState(openActivitySheet);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = allStories[index] || story;

  const viewMutation = useMutation({
    mutationFn: (id: string) => axiosClient.post(`/stories/${id}/view`),
  });

  const reactMutation = useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) =>
      axiosClient.post(`/stories/${id}/react`, { emoji }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });

  const handleDeleteStory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axiosClient.delete(`/stories/${current._id}`);
      addToast('Story Deleted', 'Story removed successfully.', 'info');
      qc.invalidateQueries({ queryKey: ['stories'] });
      qc.invalidateQueries({ queryKey: ['sharedGalleryStories'] });
      onClose();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to delete story', 'error');
    }
  };

  const advance = () => {
    if (index < allStories.length - 1) {
      setIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const currentAuthorId = (current.userId as any)?._id || (current.userId as any)?.id;
  const currentUserId = user?._id || user?.id;
  const isAuthor = Boolean(currentAuthorId && currentUserId && currentAuthorId.toString() === currentUserId.toString());
  const canDelete = isAuthor || user?.role === 'SUPER_OWNER' || user?.role === 'CO_OWNER';

  useEffect(() => {
    if (!current?._id) return;

    // Story authors viewing their own story should NOT record views
    if (!isAuthor) {
      viewMutation.mutate(current._id);
    }
    setProgress(0);

    if (!showActivityTray) {
      timerRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            advance();
            return 0;
          }
          return p + 100 / (STORY_DURATION / 100);
        });
      }, 100);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [index, current?._id, showActivityTray, isAuthor]);

  if (!current) return null;

  const mediaUrl = current.mediaId?.secureUrl || current.mediaId?.optimizedUrl || '';
  const isVideo = current.mediaId?.mimeType?.startsWith('video');

  // Unified Story Activity Aggregator: 1 row bar per non-author user with watch count & emoji in SAME BAR
  const consolidatedUserActivities = React.useMemo(() => {
    const map = new Map<string, { userId: string; name: string; avatar?: string; emoji?: string; viewCount: number }>();

    const partnerName = profileData?.partner?.name || (user?.role === 'SUPER_OWNER' ? 'Amrin' : 'Afzal');
    const partnerAvatar = profileData?.partner?.avatar;

    const getUserIdStr = (u: any): string => {
      if (!u) return 'partner';
      if (typeof u === 'string') return u;
      if (typeof u === 'object') {
        const raw = u._id || u.id || (u.userId ? (typeof u.userId === 'object' ? u.userId._id || u.userId.id : u.userId) : null);
        if (raw) return raw.toString();
      }
      return 'partner';
    };

    // 1. Process Views (counting watch frequency)
    ((current.viewedBy as any[]) || []).forEach((v) => {
      const uIdStr = getUserIdStr(v);
      // Ignore story author's self views
      if (currentAuthorId && uIdStr === currentAuthorId.toString()) return;

      let entry = map.get(uIdStr);
      if (!entry) {
        const uObj = typeof v === 'object' && v ? (v.userId ? v.userId : v) : null;
        const isSelf = Boolean(currentUserId && uIdStr === currentUserId.toString());
        const name = isSelf ? (user?.name || 'Me') : (uObj?.name || partnerName);
        const avatar = isSelf ? user?.avatar : (uObj?.avatar || partnerAvatar);

        entry = {
          userId: uIdStr,
          name,
          avatar,
          viewCount: 0,
        };
        map.set(uIdStr, entry);
      }
      entry.viewCount += 1;
    });

    // 2. Process Reactions (merged into same user row bar)
    (current.reactions || []).forEach((r) => {
      const uIdStr = getUserIdStr(r.userId);
      // Ignore story author's self reactions
      if (currentAuthorId && uIdStr === currentAuthorId.toString()) return;

      let entry = map.get(uIdStr);
      if (!entry) {
        const uObj = typeof r.userId === 'object' && r.userId ? r.userId : null;
        const isSelf = Boolean(currentUserId && uIdStr === currentUserId.toString());
        const name = isSelf ? (user?.name || 'Me') : (uObj?.name || partnerName);
        const avatar = isSelf ? user?.avatar : (uObj?.avatar || partnerAvatar);

        entry = {
          userId: uIdStr,
          name,
          avatar,
          viewCount: 0,
        };
        map.set(uIdStr, entry);
      }
      if (r.emoji) entry.emoji = r.emoji;
    });

    return Array.from(map.values());
  }, [current.reactions, current.viewedBy, currentAuthorId, currentUserId, user, profileData?.partner]);

  // Calculate UNIQUE viewers count for Eye Icon (excluding author self views)
  const uniqueViewersCount = React.useMemo(() => {
    const set = new Set<string>();
    ((current.viewedBy as any[]) || []).forEach((v) => {
      const raw = typeof v === 'object' && v ? (v._id || v.id || (v.userId ? (typeof v.userId === 'object' ? v.userId._id || v.userId.id : v.userId) : null)) : v;
      if (raw) {
        const uIdStr = raw.toString();
        if (!currentAuthorId || uIdStr !== currentAuthorId.toString()) {
          set.add(uIdStr);
        }
      }
    });
    return set.size;
  }, [current.viewedBy, currentAuthorId]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm h-[90vh] rounded-3xl overflow-hidden shadow-2xl bg-obsidian-950 border border-white/10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
          {allStories.map((_, i) => (
            <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{ width: i < index ? '100%' : i === index ? `${progress}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* Story Author Header */}
        <div className="absolute top-7 left-3 right-16 z-20 flex items-center gap-2.5 bg-gradient-to-b from-black/60 to-transparent p-2 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-[2px] shrink-0">
            <div className="w-full h-full rounded-full bg-obsidian-950 overflow-hidden flex items-center justify-center">
              {current.userId.avatar ? (
                <img src={current.userId.avatar} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="text-white text-xs font-bold">{current.userId.name?.[0]}</span>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-bold leading-none truncate">{current.userId.name}</p>
            <p className="text-white/70 text-[10px] mt-0.5 font-mono truncate">
              {new Date(current.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Actions: Delete Button + Close Button */}
        <div className="absolute top-7 right-3 z-20 flex items-center gap-1.5">
          {canDelete && (
            <button
              onClick={handleDeleteStory}
              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-full glass-panel transition-colors"
              title="Delete Story"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-full glass-panel"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media */}
        <div className="w-full h-full bg-obsidian-950 flex items-center justify-center relative">
          {isVideo ? (
            <video src={mediaUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
          ) : (
            <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Caption */}
        {current.caption && (
          <div className="absolute bottom-20 left-0 right-0 px-4 z-20">
            <p className="text-white text-xs font-semibold text-center drop-shadow-xl bg-black/60 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/10">
              {current.caption}
            </p>
          </div>
        )}

        {/* Bottom Bar: Non-Author Reaction Picker vs Author Story Activity Sheet Button */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20">
          {!isAuthor ? (
            <div className="relative flex-1">
              <button
                className="text-xs text-white font-semibold glass-panel px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all flex items-center gap-1.5"
                onClick={() => setShowEmojis((v) => !v)}
              >
                <span>React</span>
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              </button>
              {showEmojis && (
                <div className="absolute bottom-12 left-0 glass-panel rounded-2xl px-3 py-2 flex gap-2 border border-white/10 bg-black/80 backdrop-blur-xl z-30">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      className="text-xl hover:scale-125 transition-transform"
                      onClick={() => {
                        reactMutation.mutate({ id: current._id, emoji: e });
                        setShowEmojis(false);
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowActivityTray((v) => !v)}
              className="text-xs text-white font-semibold glass-panel px-4 py-2 rounded-full border border-white/15 hover:bg-white/10 transition-all flex items-center gap-2 shadow-lg bg-black/50 backdrop-blur-md"
            >
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>{uniqueViewersCount}</span>
              </div>
              <span className="text-white/30">•</span>
              <div className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>{(current.reactions || []).length}</span>
              </div>
            </button>
          )}
        </div>

        {/* Instagram Story Activity & Likes Bottom Drawer */}
        <AnimatePresence>
          {showActivityTray && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="absolute inset-x-0 bottom-0 z-40 max-h-[70%] bg-obsidian-950/98 backdrop-blur-2xl border-t border-white/15 rounded-t-3xl p-4 flex flex-col space-y-3 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span>Story Activity & Likes</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowActivityTray(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                {consolidatedUserActivities.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No likes or views recorded yet.
                  </div>
                ) : (
                  consolidatedUserActivities.map((item) => (
                    <div
                      key={item.userId}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/10 shadow-md"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-afzal via-amrin to-heart p-[1.5px] overflow-hidden shrink-0 shadow-md">
                          {item.avatar ? (
                            <img src={item.avatar} alt={item.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <div className="w-full h-full bg-obsidian-900 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {item.name?.[0] || '❤️'}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-extrabold text-white truncate">{item.name}</span>
                          <span className="text-[10px] text-slate-300 font-medium truncate mt-0.5">
                            {item.emoji
                              ? item.viewCount > 1
                                ? `Reacted ${item.emoji} • Watched ${item.viewCount} times`
                                : `Reacted ${item.emoji} to your story`
                              : item.viewCount > 1
                              ? `Viewed story • Watched ${item.viewCount} times`
                              : 'Viewed your story'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.emoji && <span className="text-xl">{item.emoji}</span>}
                        {item.viewCount > 0 && (
                          <span className="text-[10px] font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                            {item.viewCount > 1 ? `${item.viewCount}x views` : 'Viewed'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>,
    document.body
  );
};
