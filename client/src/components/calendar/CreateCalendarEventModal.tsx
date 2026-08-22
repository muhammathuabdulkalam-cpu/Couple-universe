import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar as CalendarIcon, Check, Image, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useCalendarStore } from '../../store/calendarStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { ApiResponse, CalendarEventType, EventPriority, MediaItem, RepeatRule, TimelineEvent } from '../../types/index.js';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';

interface CreateCalendarEventModalProps {
  onSuccess: () => void;
}

export const CreateCalendarEventModal: React.FC<CreateCalendarEventModalProps> = ({ onSuccess }) => {
  const { isCreateModalOpen, setCreateModalOpen, editingEvent, setEditingEvent } = useCalendarStore();
  const { addToast } = useUIStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<CalendarEventType>('DATE');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
  const [allDay, setAllDay] = useState(false);
  const [repeatRule, setRepeatRule] = useState<RepeatRule>('NONE');
  const [priority, setPriority] = useState<EventPriority>('MEDIUM');
  const [color, setColor] = useState('#06B6D4');
  const [icon, setIcon] = useState('📅');
  const [locationName, setLocationName] = useState('');
  const [selectedCoverId, setSelectedCoverId] = useState<string | undefined>(undefined);
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Fetch available Module 4 Media Items for cover selection
  const { data: mediaVault } = useQuery<MediaItem[]>({
    queryKey: ['mediaListForCalendar'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<MediaItem[]>>('/media');
      return res.data.data!;
    },
    enabled: isCreateModalOpen,
  });

  // Fetch available Module 5 Timeline Events for linking
  const { data: timelineVault } = useQuery<TimelineEvent[]>({
    queryKey: ['timelineListForCalendar'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<TimelineEvent[]>>('/timeline');
      return res.data.data!;
    },
    enabled: isCreateModalOpen,
  });

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description || '');
      setEventType(editingEvent.eventType);
      setStartDate(new Date(editingEvent.startDate).toISOString().slice(0, 16));
      setEndDate(new Date(editingEvent.endDate).toISOString().slice(0, 16));
      setAllDay(editingEvent.allDay);
      setRepeatRule(editingEvent.repeatRule);
      setPriority(editingEvent.priority);
      setColor(editingEvent.color || '#06B6D4');
      setIcon(editingEvent.icon || '📅');
      setLocationName(editingEvent.location?.name || '');
      setSelectedCoverId(editingEvent.coverMediaId ? editingEvent.coverMediaId._id : undefined);
      setSelectedTimelineId(editingEvent.timelineEventId ? editingEvent.timelineEventId._id : undefined);
    } else {
      setTitle('');
      setDescription('');
      setEventType('DATE');
      setStartDate(new Date().toISOString().slice(0, 16));
      setEndDate(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
      setAllDay(false);
      setRepeatRule('NONE');
      setPriority('MEDIUM');
      setColor('#06B6D4');
      setIcon('📅');
      setLocationName('');
      setSelectedCoverId(undefined);
      setSelectedTimelineId(undefined);
    }
  }, [editingEvent, isCreateModalOpen]);

  if (!isCreateModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) {
      addToast('Validation Error', 'Title, start date, and end date are required.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title,
      description,
      eventType,
      startDate,
      endDate,
      allDay,
      repeatRule,
      priority,
      color,
      icon,
      location: locationName ? { name: locationName } : undefined,
      coverMediaId: selectedCoverId || undefined,
      timelineEventId: selectedTimelineId || undefined,
      notifications: [{ triggerTime: new Date(startDate).toISOString(), offsetMinutes: 15, channel: 'IN_APP' }],
    };

    try {
      if (editingEvent) {
        await axiosClient.patch(`/calendar/${editingEvent._id}`, payload);
        addToast('Event Updated!', `Updated calendar event "${title}".`, 'success');
      } else {
        await axiosClient.post('/calendar', payload);
        addToast('Event Scheduled!', `Added "${title}" to relationship calendar.`, 'success');
      }

      setCreateModalOpen(false);
      setEditingEvent(null);
      onSuccess();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to save calendar event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/80 p-4 select-none overflow-y-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl my-8">
          <Card variant="glass" className="p-6 space-y-6 border-white/10 shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <CalendarIcon className="w-5 h-5 text-afzal" />
                <span>{editingEvent ? 'Edit Calendar Event' : 'Schedule Life Event'}</span>
              </div>
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  setEditingEvent(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title & Icon */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Icon</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-3 text-center text-lg text-white"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Event Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Dinner Date at Seaside Lounge"
                    required
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-4 text-xs text-white focus:border-amrin"
                  />
                </div>
              </div>

              {/* Event Type, Priority, Repeat Rule */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Event Category</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as CalendarEventType)}
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  >
                    <option value="DATE">DATE</option>
                    <option value="ANNIVERSARY">ANNIVERSARY</option>
                    <option value="BIRTHDAY">BIRTHDAY</option>
                    <option value="TRIP">TRIP</option>
                    <option value="VACATION">VACATION</option>
                    <option value="DINNER">DINNER</option>
                    <option value="MOVIE">MOVIE</option>
                    <option value="SHOPPING">SHOPPING</option>
                    <option value="FAMILY">FAMILY</option>
                    <option value="REMINDER">REMINDER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as EventPriority)}
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH ⭐</option>
                    <option value="URGENT">URGENT ⚡</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Recurrence</label>
                  <select
                    value={repeatRule}
                    onChange={(e) => setRepeatRule(e.target.value as RepeatRule)}
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  >
                    <option value="NONE">Does not repeat</option>
                    <option value="DAILY">Every Day</option>
                    <option value="WEEKLY">Every Week</option>
                    <option value="MONTHLY">Every Month</option>
                    <option value="YEARLY">Every Year (Anniversary)</option>
                  </select>
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
              </div>

              {/* Location & Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Marina Beach Lounge"
                  className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-4 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event Description & Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event notes or reminder details..."
                  rows={2}
                  className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-4 text-xs text-white"
                />
              </div>

              {/* Module Integrations: Module 4 Cover Media & Module 5 Linked Timeline Event */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Link Cover Photo (Module 4)</label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="glass"
                      size="sm"
                      onClick={() => setIsMediaPickerOpen(!isMediaPickerOpen)}
                      leftIcon={<Image className="w-3.5 h-3.5 text-afzal" />}
                    >
                      {selectedCoverId ? 'Change Cover Photo' : 'Select Cover Photo'}
                    </Button>
                  </div>
                </div>

                {timelineVault && timelineVault.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Link Timeline Memory (Module 5)</label>
                    <select
                      value={selectedTimelineId || ''}
                      onChange={(e) => setSelectedTimelineId(e.target.value || undefined)}
                      className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                    >
                      <option value="">No linked timeline memory</option>
                      {timelineVault.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.emoji} {t.title} ({new Date(t.eventDate).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Media Picker Drawer */}
              {isMediaPickerOpen && mediaVault && (
                <div className="glass-card p-3 rounded-2xl max-h-40 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 gap-2 border-white/10">
                  {mediaVault.map((m) => {
                    const isSelected = selectedCoverId === m._id;
                    return (
                      <div
                        key={m._id}
                        onClick={() => setSelectedCoverId(isSelected ? undefined : m._id)}
                        className={`aspect-square rounded-xl overflow-hidden relative cursor-pointer border ${
                          isSelected ? 'border-amrin ring-2 ring-amrin' : 'border-white/10'
                        }`}
                      >
                        <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-amrin/40 flex items-center justify-center text-white">
                            <Check className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <Button
                  type="button"
                  variant="glass"
                  size="md"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setEditingEvent(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="cyan" size="md" isLoading={isSubmitting}>
                  {editingEvent ? 'Update Event' : 'Schedule Event'}
                </Button>
              </div>

            </form>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
