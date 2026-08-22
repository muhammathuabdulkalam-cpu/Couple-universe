import { motion } from 'framer-motion';
import { Calendar, CloudSun, Heart, Image, MapPin, MoreHorizontal, Sparkles, Star, Tag } from 'lucide-react';
import React, { useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useMediaStore } from '../../store/mediaStore.js';
import { useTimelineStore } from '../../store/timelineStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { TimelineEvent } from '../../types/index.js';
import { Badge } from '../ui/Badge.js';
import { Card } from '../ui/Card.js';

interface TimelineEventCardProps {
  event: TimelineEvent;
  onRefresh?: () => void;
}

export const TimelineEventCard: React.FC<TimelineEventCardProps> = ({ event, onRefresh }) => {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const { openViewer } = useMediaStore();
  const { setEditingEvent, setCreateModalOpen, setSelectedEventDetail, setDetailModalOpen } =
    useTimelineStore();

  const [isFav, setIsFav] = useState(event.isFavorite);
  const isOwner = user?.role === 'SUPER_OWNER' || user?.role === 'CO_OWNER';

  const coverMedia = event.coverMediaId || (event.mediaIds && event.mediaIds[0]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axiosClient.patch(`/timeline/${event._id}/favorite`);
      setIsFav(!isFav);
      addToast('Favorite Updated', `Memory favorite status set to ${!isFav}`, 'info');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update favorite', 'error');
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    setCreateModalOpen(true);
  };

  const isMilestone = event.importance === 'MILESTONE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="relative select-none"
    >
      <Card
        variant="glass"
        className={`p-0 cursor-pointer transition-all overflow-hidden border ${
          isMilestone
            ? 'border-heart/40 bg-gradient-to-br from-slate-100 via-white to-heart/10 dark:from-obsidian-900 dark:via-obsidian-900 dark:to-heart/10 shadow-2xl shadow-heart/10'
            : 'border-slate-200 dark:border-white/10 hover:border-amrin/40'
        }`}
        onClick={() => {
          setSelectedEventDetail(event);
          setDetailModalOpen(true);
        }}
      >
        {/* Large Cover Image Banner (Apple Photos / Google Photos Memories Style) */}
        {coverMedia && (
          <div className="w-full h-56 bg-slate-100 dark:bg-obsidian-950 relative overflow-hidden flex items-center justify-center border-b border-slate-200 dark:border-white/10">
            <img
              src={coverMedia.optimizedUrl || coverMedia.secureUrl || coverMedia.thumbnailUrl || coverMedia.url}
              alt={event.title}
              onError={(e) => {
                const target = e.currentTarget;
                if (coverMedia.secureUrl && target.src !== coverMedia.secureUrl) {
                  target.src = coverMedia.secureUrl;
                } else if (coverMedia.url && target.src !== coverMedia.url) {
                  target.src = coverMedia.url;
                }
              }}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-obsidian-950 via-white/30 dark:via-obsidian-950/30 to-transparent" />
            
            {/* Media Count Badge */}
            {event.mediaIds && event.mediaIds.length > 1 && (
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full glass-card text-[10px] font-semibold text-white flex items-center gap-1 border border-slate-200 dark:border-white/10 z-10">
                <Image className="w-3 h-3 text-afzal" />
                <span>{event.mediaIds.length} Photos</span>
              </div>
            )}
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* Card Header: Emoji, Title, Date & Badges */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-afzal/20 via-amrin/20 to-heart/20 border border-slate-200 dark:border-white/10 flex items-center justify-center text-2xl shrink-0 shadow-lg">
                {event.emoji || '❤️'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-amrin dark:text-amrin-glow flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(event.eventDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <Badge variant="violet" size="sm">
                    {event.chapter}
                  </Badge>
                  {isMilestone && (
                    <Badge variant="green" size="sm">
                      <Sparkles className="w-3 h-3" /> MILESTONE
                    </Badge>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">{event.title}</h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-xl transition-colors ${
                  isFav ? 'text-heart fill-heart bg-heart/20' : 'text-slate-400 hover:text-heart'
                }`}
                title="Favorite Memory"
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-heart text-heart' : ''}`} />
              </button>
              {isOwner && (
                <button
                  onClick={handleEdit}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                  title="Edit Memory"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Short Description */}
          {event.shortDescription && (
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
              {event.shortDescription}
            </p>
          )}

          {/* Additional Uncropped Gallery Previews (if > 1 media) */}
          {!coverMedia && event.mediaIds && event.mediaIds.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {event.mediaIds.slice(0, 3).map((media) => (
                <div
                  key={media._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    openViewer(media);
                  }}
                  className="aspect-square rounded-xl overflow-hidden glass-card border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-obsidian-950/90 relative flex items-center justify-center p-1 group/img"
                >
                  <img
                    src={media.thumbnailUrl || media.secureUrl}
                    alt={media.title}
                    className="w-full h-full object-contain object-center transition-transform duration-300 group-hover/img:scale-105"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Footer Details: Location, Weather, Mood, Tags */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5 pt-3">
            <div className="flex items-center gap-3 flex-wrap">
              {event.location?.name && (
                <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-afzal" /> {event.location.name}
                </span>
              )}
              {event.weather && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <CloudSun className="w-3.5 h-3.5" /> {event.weather}
                </span>
              )}
              {event.mood && (
                <span className="flex items-center gap-1 text-amrin dark:text-amrin-glow font-medium">
                  <Star className="w-3.5 h-3.5" /> {event.mood}
                </span>
              )}
            </div>

            {event.tags && event.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] text-slate-500 dark:text-slate-400">#{event.tags.join(', #')}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
