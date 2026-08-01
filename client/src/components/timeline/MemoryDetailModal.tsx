import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Heart,
  MapPin,
  Sparkles,
  Star,
  Tag,
  User,
  X,
} from 'lucide-react';
import React from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useMediaStore } from '../../store/mediaStore.js';
import { useTimelineStore } from '../../store/timelineStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { Badge } from '../ui/Badge.js';
import { Card } from '../ui/Card.js';

export const MemoryDetailModal: React.FC = () => {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const { openViewer } = useMediaStore();
  const {
    events,
    selectedEventDetail,
    isDetailModalOpen,
    setDetailModalOpen,
    setSelectedEventDetail,
    setEditingEvent,
    setCreateModalOpen,
  } = useTimelineStore();

  if (!isDetailModalOpen || !selectedEventDetail) return null;

  const coverMedia = selectedEventDetail.coverMediaId || (selectedEventDetail.mediaIds && selectedEventDetail.mediaIds[0]);

  // Previous & Next memory navigation
  const currentIndex = events.findIndex((e) => e._id === selectedEventDetail._id);
  const prevMemory = currentIndex > 0 ? events[currentIndex - 1] : null;
  const nextMemory = currentIndex < events.length - 1 ? events[currentIndex + 1] : null;

  const handleFavoriteToggle = async () => {
    try {
      await axiosClient.patch(`/timeline/${selectedEventDetail._id}/favorite`);
      const updated = { ...selectedEventDetail, isFavorite: !selectedEventDetail.isFavorite };
      setSelectedEventDetail(updated);
      addToast('Favorite Updated', `Favorite status updated.`, 'info');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update favorite', 'error');
    }
  };

  const handleEdit = () => {
    setDetailModalOpen(false);
    setEditingEvent(selectedEventDetail);
    setCreateModalOpen(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/90 backdrop-blur-2xl p-4 sm:p-6 overflow-y-auto select-none">
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-4xl my-auto">
          <Card variant="glass" className="p-0 border-white/10 shadow-2xl overflow-hidden relative">
            
            {/* Top Close Floating Bar */}
            <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
              <button
                onClick={handleFavoriteToggle}
                className={`p-2.5 rounded-full glass-card border border-white/10 ${
                  selectedEventDetail.isFavorite ? 'text-heart fill-heart bg-heart/20' : 'text-slate-300 hover:text-heart'
                }`}
                title="Favorite Memory"
              >
                <Heart className={`w-4 h-4 ${selectedEventDetail.isFavorite ? 'fill-heart text-heart' : ''}`} />
              </button>

              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-2.5 rounded-full glass-card border border-white/10 text-slate-300 hover:text-white"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hero Cover Image Banner */}
            {coverMedia ? (
              <div className="w-full h-80 bg-obsidian-950 relative overflow-hidden flex items-center justify-center border-b border-white/10">
                <img
                  src={coverMedia.optimizedUrl || coverMedia.secureUrl}
                  alt={selectedEventDetail.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{selectedEventDetail.emoji}</span>
                      <Badge variant="violet" size="sm">{selectedEventDetail.chapter}</Badge>
                      {selectedEventDetail.importance === 'MILESTONE' && (
                        <Badge variant="green" size="sm"><Sparkles className="w-3 h-3" /> MILESTONE</Badge>
                      )}
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">{selectedEventDetail.title}</h1>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 border-b border-white/10 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{selectedEventDetail.emoji}</span>
                  <Badge variant="violet" size="sm">{selectedEventDetail.chapter}</Badge>
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">{selectedEventDetail.title}</h1>
              </div>
            )}

            {/* Main Details Body */}
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Metadata Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 glass-card p-4 rounded-2xl border-white/10 text-xs">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5 font-semibold text-amrin-glow">
                    <Calendar className="w-4 h-4 text-amrin" />
                    {new Date(selectedEventDetail.eventDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>

                  {selectedEventDetail.location?.name && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-4 h-4 text-afzal" /> {selectedEventDetail.location.name}
                    </span>
                  )}

                  {selectedEventDetail.weather && (
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <CloudSun className="w-4 h-4" /> {selectedEventDetail.weather}
                    </span>
                  )}

                  {selectedEventDetail.mood && (
                    <span className="flex items-center gap-1 text-afzal-glow font-medium">
                      <Star className="w-4 h-4" /> {selectedEventDetail.mood}
                    </span>
                  )}
                </div>

                {(user?.role === 'SUPER_OWNER' || user?.role === 'CO_OWNER') && (
                  <button
                    onClick={handleEdit}
                    className="text-xs font-semibold text-afzal-glow hover:underline"
                  >
                    Edit Memory
                  </button>
                )}
              </div>

              {/* Memory Story Content */}
              {selectedEventDetail.shortDescription && (
                <div className="text-sm font-semibold text-slate-200 leading-relaxed italic">
                  "{selectedEventDetail.shortDescription}"
                </div>
              )}

              {selectedEventDetail.content && (
                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line space-y-2 border-t border-white/5 pt-4">
                  {selectedEventDetail.content}
                </div>
              )}

              {/* Attached Image Gallery (Google Photos Style Uncropped) */}
              {selectedEventDetail.mediaIds && selectedEventDetail.mediaIds.length > 0 && (
                <div className="space-y-3 border-t border-white/5 pt-4">
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                    Memory Gallery ({selectedEventDetail.mediaIds.length} Attachments)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedEventDetail.mediaIds.map((media) => (
                      <div
                        key={media._id}
                        onClick={() => openViewer(media)}
                        className="aspect-square rounded-xl overflow-hidden glass-card border border-white/10 bg-obsidian-950/90 relative cursor-pointer hover:scale-105 transition-transform flex items-center justify-center p-1"
                      >
                        <img
                          src={media.thumbnailUrl || media.secureUrl}
                          alt={media.title}
                          className="w-full h-full object-contain object-center"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags & People */}
              {((selectedEventDetail.tags && selectedEventDetail.tags.length > 0) || (selectedEventDetail.people && selectedEventDetail.people.length > 0)) && (
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-4 text-xs">
                  {selectedEventDetail.tags && selectedEventDetail.tags.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <div className="flex flex-wrap gap-1">
                        {selectedEventDetail.tags.map((tag, i) => (
                          <Badge key={i} variant="cyan" size="sm">#{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEventDetail.people && selectedEventDetail.people.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amrin" />
                      <span className="text-slate-300 font-medium">Tagged: {selectedEventDetail.people.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Previous & Next Navigation Footer */}
              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs">
                {prevMemory ? (
                  <button
                    onClick={() => setSelectedEventDetail(prevMemory)}
                    className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous: {prevMemory.title}
                  </button>
                ) : (
                  <div />
                )}

                {nextMemory && (
                  <button
                    onClick={() => setSelectedEventDetail(nextMemory)}
                    className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors ml-auto"
                  >
                    Next: {nextMemory.title} <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>

          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
