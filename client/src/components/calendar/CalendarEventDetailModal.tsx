import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Repeat,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import React from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useCalendarStore } from '../../store/calendarStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { Badge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';

export const CalendarEventDetailModal: React.FC = () => {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const {
    selectedEventDetail,
    isDetailModalOpen,
    setDetailModalOpen,
    setSelectedEventDetail,
    setEditingEvent,
    setCreateModalOpen,
  } = useCalendarStore();

  if (!isDetailModalOpen || !selectedEventDetail) return null;

  const isOwner = user?.role === 'SUPER_OWNER' || user?.role === 'CO_OWNER';
  const coverMedia = selectedEventDetail.coverMediaId;

  const handleToggleComplete = async () => {
    try {
      await axiosClient.patch(`/calendar/${selectedEventDetail._id}/complete`);
      const updated = {
        ...selectedEventDetail,
        isCompleted: !selectedEventDetail.isCompleted,
        status: !selectedEventDetail.isCompleted ? ('COMPLETED' as any) : ('SCHEDULED' as any),
      };
      setSelectedEventDetail(updated);
      addToast('Status Updated', `Event marked as ${updated.isCompleted ? 'Completed' : 'Scheduled'}.`, 'success');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update status', 'error');
    }
  };

  const handleSoftDelete = async () => {
    try {
      await axiosClient.delete(`/calendar/${selectedEventDetail._id}`);
      addToast('Moved to Trash', 'Calendar event soft deleted.', 'info');
      setDetailModalOpen(false);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to delete event', 'error');
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
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl my-auto">
          <Card variant="glass" className="p-0 border-white/10 shadow-2xl overflow-hidden relative">
            
            {/* Top Close Button */}
            <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-2.5 rounded-full glass-card border border-white/10 text-slate-300 hover:text-white"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cover Image Banner */}
            {coverMedia ? (
              <div className="w-full h-64 bg-obsidian-950 relative overflow-hidden flex items-center justify-center border-b border-white/10">
                <img
                  src={coverMedia.optimizedUrl || coverMedia.secureUrl}
                  alt={selectedEventDetail.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{selectedEventDetail.icon || '📅'}</span>
                      <Badge variant="cyan" size="sm">{selectedEventDetail.eventType}</Badge>
                      <Badge variant={selectedEventDetail.isCompleted ? 'green' : 'violet'} size="sm">
                        {selectedEventDetail.status}
                      </Badge>
                    </div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">{selectedEventDetail.title}</h1>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 border-b border-white/10 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{selectedEventDetail.icon || '📅'}</span>
                  <Badge variant="cyan" size="sm">{selectedEventDetail.eventType}</Badge>
                  <Badge variant={selectedEventDetail.isCompleted ? 'green' : 'violet'} size="sm">
                    {selectedEventDetail.status}
                  </Badge>
                </div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">{selectedEventDetail.title}</h1>
              </div>
            )}

            {/* Body */}
            <div className="p-6 space-y-6">
              
              {/* Timing Metadata */}
              <div className="glass-card p-4 rounded-2xl border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-afzal" /> Date & Time Range
                  </span>
                  {selectedEventDetail.repeatRule !== 'NONE' && (
                    <Badge variant="violet" size="sm" className="flex items-center gap-1">
                      <Repeat className="w-3 h-3" /> Repeats {selectedEventDetail.repeatRule}
                    </Badge>
                  )}
                </div>
                <div className="text-sm font-bold text-white font-mono">
                  {new Date(selectedEventDetail.startDate).toLocaleString()} — {new Date(selectedEventDetail.endDate).toLocaleString()}
                </div>
              </div>

              {selectedEventDetail.description && (
                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {selectedEventDetail.description}
                </div>
              )}

              {/* Location */}
              {selectedEventDetail.location?.name && (
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <MapPin className="w-4 h-4 text-heart" />
                  <span>{selectedEventDetail.location.name}</span>
                </div>
              )}

              {/* Module 5 Timeline Event Integration Link */}
              {selectedEventDetail.timelineEventId && (
                <div className="glass-card p-4 rounded-2xl border-amrin/30 space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-amrin-glow">
                    <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Linked Relationship Memory</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs font-bold text-white">
                    {selectedEventDetail.timelineEventId.emoji} {selectedEventDetail.timelineEventId.title}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <Button
                  variant={selectedEventDetail.isCompleted ? 'glass' : 'cyan'}
                  size="sm"
                  onClick={handleToggleComplete}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  {selectedEventDetail.isCompleted ? 'Mark Incomplete' : 'Mark Completed'}
                </Button>

                {isOwner && (
                  <div className="flex items-center gap-2">
                    <Button variant="glass" size="sm" onClick={handleEdit}>
                      Edit Event
                    </Button>
                    <Button variant="glass" size="sm" onClick={handleSoftDelete} className="text-rose-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

            </div>

          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
