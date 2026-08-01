import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { StoryItem } from '../../types/index.js';

const EMOJIS = ['❤️', '😂', '🔥', '😍', '👍', '😢'];
const STORY_DURATION = 5000;

interface Props {
  story: StoryItem;
  allStories: StoryItem[];
  onClose: () => void;
}

export const StoryViewer: React.FC<Props> = ({ story, allStories, onClose }) => {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const qc = useQueryClient();

  const initialIndex = allStories.findIndex((s) => s._id === story._id);
  const [index, setIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [progress, setProgress] = useState(0);
  const [showEmojis, setShowEmojis] = useState(false);
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

  useEffect(() => {
    if (!current) return;
    viewMutation.mutate(current._id);
    setProgress(0);

    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          advance();
          return 0;
        }
        return p + 100 / (STORY_DURATION / 100);
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [index, current?._id]);

  if (!current) return null;

  const mediaUrl = current.mediaId?.secureUrl || current.mediaId?.optimizedUrl || '';
  const isVideo = current.mediaId?.mimeType?.startsWith('video');

  const isAuthor = current.userId._id === user?._id || current.userId._id === user?.id;
  const canDelete = isAuthor || user?.role === 'SUPER_OWNER' || user?.role === 'CO_OWNER';

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm h-[90vh] rounded-3xl overflow-hidden shadow-2xl bg-obsidian-950 border border-white/10"
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
        <div className="w-full h-full bg-obsidian-950 flex items-center justify-center">
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

        {/* Emoji Reactions */}
        {!isAuthor && (
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20">
            <button
              className="text-xs text-white font-semibold glass-panel px-4 py-2 rounded-full border border-white/10"
              onClick={() => setShowEmojis((v) => !v)}
            >
              React ❤️
            </button>
            {showEmojis && (
              <div className="absolute bottom-12 left-0 glass-panel rounded-2xl px-3 py-2 flex gap-2 border border-white/10 bg-black/80 backdrop-blur-xl">
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
        )}

        {/* Tap areas for nav */}
        <button
          className="absolute left-0 top-0 w-1/3 h-full z-10 opacity-0"
          onClick={() => {
            setIndex(Math.max(0, index - 1));
            setProgress(0);
          }}
        />
        <button className="absolute right-0 top-0 w-1/3 h-full z-10 opacity-0" onClick={advance} />

        {/* Nav arrows on desktop */}
        {index > 0 && (
          <button
            onClick={() => {
              setIndex(index - 1);
              setProgress(0);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 glass-panel rounded-full flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {index < allStories.length - 1 && (
          <button
            onClick={advance}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 glass-panel rounded-full flex items-center justify-center text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};
