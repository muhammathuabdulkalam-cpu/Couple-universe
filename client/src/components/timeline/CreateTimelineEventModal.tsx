import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Image, Plus, Sparkles, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useMediaStore } from '../../store/mediaStore.js';
import { useTimelineStore } from '../../store/timelineStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { ApiResponse, ChapterType, EventImportance, EventType, MediaItem, MemoryMood, WeatherType } from '../../types/index.js';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';

interface CreateTimelineEventModalProps {
  onSuccess: () => void;
}

export const CreateTimelineEventModal: React.FC<CreateTimelineEventModalProps> = ({ onSuccess }) => {
  const { isCreateModalOpen, setCreateModalOpen, editingEvent, setEditingEvent } = useTimelineStore();
  const { setUploadModalOpen } = useMediaStore();
  const { addToast } = useUIStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventType, setEventType] = useState<EventType>('DATE');
  const [chapter, setChapter] = useState<ChapterType>('LOVE');
  const [mood, setMood] = useState<MemoryMood>('ROMANTIC');
  const [weather, setWeather] = useState<WeatherType>('SUNNY');
  const [emoji, setEmoji] = useState('❤️');
  const [importance, setImportance] = useState<EventImportance>('NORMAL');
  const [locationName, setLocationName] = useState('');
  const [tags, setTags] = useState('');
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Fetch available Module 4 Media Vault items
  const { data: mediaVault } = useQuery<MediaItem[]>({
    queryKey: ['mediaListForPicker'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<MediaItem[]>>('/media');
      return res.data.data!;
    },
    enabled: isCreateModalOpen,
  });

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setContent(editingEvent.content || '');
      setShortDescription(editingEvent.shortDescription || '');
      setEventDate(new Date(editingEvent.eventDate).toISOString().split('T')[0]);
      setEventType(editingEvent.eventType);
      setChapter(editingEvent.chapter);
      setMood(editingEvent.mood);
      setWeather(editingEvent.weather || 'SUNNY');
      setEmoji(editingEvent.emoji || '❤️');
      setImportance(editingEvent.importance);
      setLocationName(editingEvent.location?.name || '');
      setTags(editingEvent.tags ? editingEvent.tags.join(', ') : '');
      setSelectedMediaIds(editingEvent.mediaIds ? editingEvent.mediaIds.map((m) => m._id) : []);
    } else {
      setTitle('');
      setContent('');
      setShortDescription('');
      setEventDate(new Date().toISOString().split('T')[0]);
      setEventType('DATE');
      setChapter('LOVE');
      setMood('ROMANTIC');
      setEmoji('❤️');
      setImportance('NORMAL');
      setLocationName('');
      setTags('');
      setSelectedMediaIds([]);
    }
  }, [editingEvent, isCreateModalOpen]);

  if (!isCreateModalOpen) return null;

  const toggleMediaSelection = (id: string) => {
    if (selectedMediaIds.includes(id)) {
      setSelectedMediaIds(selectedMediaIds.filter((item) => item !== id));
    } else {
      setSelectedMediaIds([...selectedMediaIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !eventDate) {
      addToast('Validation Error', 'Title and event date are required.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const parsedTags = tags.split(',').map((t) => t.trim()).filter((t) => t);

    const payload = {
      title,
      content,
      shortDescription,
      eventDate,
      eventType,
      chapter,
      mood,
      weather,
      emoji,
      importance,
      location: locationName ? { name: locationName } : undefined,
      tags: parsedTags,
      mediaIds: selectedMediaIds,
      coverMediaId: selectedMediaIds.length > 0 ? selectedMediaIds[0] : undefined,
    };

    try {
      if (editingEvent) {
        await axiosClient.patch(`/timeline/${editingEvent._id}`, payload);
        addToast('Memory Updated!', `Updated timeline event "${title}".`, 'success');
      } else {
        await axiosClient.post('/timeline', payload);
        addToast('Memory Saved!', `Added "${title}" to relationship timeline.`, 'success');
      }

      setCreateModalOpen(false);
      setEditingEvent(null);
      onSuccess();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to save timeline event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/80 backdrop-blur-xl p-4 select-none overflow-y-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl my-8">
          <Card variant="glass" className="p-6 space-y-6 border-white/10 shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <Sparkles className="w-5 h-5 text-amrin-glow" />
                <span>{editingEvent ? 'Edit Timeline Memory' : 'Create Timeline Memory'}</span>
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
              {/* Title & Emoji */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Emoji</label>
                  <input
                    type="text"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-3 text-center text-lg text-white"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Memory Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Our First Coffee Date"
                    required
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-4 text-xs text-white focus:border-amrin"
                  />
                </div>
              </div>

              {/* Event Date, Chapter, Event Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Event Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Chapter</label>
                  <select
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value as ChapterType)}
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  >
                    <option value="LOVE">LOVE</option>
                    <option value="ENGAGEMENT">ENGAGEMENT</option>
                    <option value="MARRIAGE">MARRIAGE</option>
                    <option value="HONEYMOON">HONEYMOON</option>
                    <option value="TRAVEL">TRAVEL</option>
                    <option value="FAMILY">FAMILY</option>
                    <option value="BABY">BABY</option>
                    <option value="CAREER">CAREER</option>
                    <option value="HOME">HOME</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  >
                    <option value="FIRST_CONVERSATION">FIRST_CONVERSATION</option>
                    <option value="FIRST_CALL">FIRST_CALL</option>
                    <option value="FIRST_MEETING">FIRST_MEETING</option>
                    <option value="FIRST_PHOTO">FIRST_PHOTO</option>
                    <option value="DATE">DATE</option>
                    <option value="TRIP">TRIP</option>
                    <option value="BIRTHDAY">BIRTHDAY</option>
                    <option value="ANNIVERSARY">ANNIVERSARY</option>
                    <option value="CELEBRATION">CELEBRATION</option>
                    <option value="ACHIEVEMENT">ACHIEVEMENT</option>
                    <option value="FAMILY_EVENT">FAMILY_EVENT</option>
                    <option value="MARRIAGE">MARRIAGE</option>
                    <option value="BABY">BABY</option>
                    <option value="TRAVEL">TRAVEL</option>
                  </select>
                </div>
              </div>

              {/* Mood, Weather, Importance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mood</label>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value as MemoryMood)}
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  >
                    <option value="ROMANTIC">ROMANTIC ❤️</option>
                    <option value="HAPPY">HAPPY 😄</option>
                    <option value="EXCITED">EXCITED ✨</option>
                    <option value="PEACEFUL">PEACEFUL 🌿</option>
                    <option value="GRATEFUL">GRATEFUL 🙏</option>
                    <option value="NOSTALGIC">NOSTALGIC 📜</option>
                    <option value="MEMORABLE">MEMORABLE ⭐</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Weather</label>
                  <select
                    value={weather}
                    onChange={(e) => setWeather(e.target.value as WeatherType)}
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  >
                    <option value="SUNNY">SUNNY ☀️</option>
                    <option value="RAINY">RAINY 🌧️</option>
                    <option value="CLOUDY">CLOUDY 🌤️</option>
                    <option value="SNOW">SNOW ❄️</option>
                    <option value="WINDY">WINDY 🌬️</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Importance</label>
                  <select
                    value={importance}
                    onChange={(e) => setImportance(e.target.value as EventImportance)}
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="IMPORTANT">IMPORTANT</option>
                    <option value="MILESTONE">MILESTONE ⭐</option>
                  </select>
                </div>
              </div>

              {/* Short Description & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. Marina Beach / Cafe Lounge"
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-4 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tags (Comma Separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="coffee, date, firsttime"
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-4 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Short Summary</label>
                <textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="A quick summary of this special memory..."
                  rows={2}
                  className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-4 text-xs text-white"
                />
              </div>

              {/* Attached Media Picker Section (Module 4 Integration) */}
              <div className="space-y-2 border-t border-white/5 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Attached Media ({selectedMediaIds.length} Selected)</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="glass"
                      size="sm"
                      onClick={() => setIsMediaPickerOpen(!isMediaPickerOpen)}
                      leftIcon={<Image className="w-3.5 h-3.5 text-afzal" />}
                    >
                      Pick Vault Media
                    </Button>
                    <Button
                      type="button"
                      variant="glass"
                      size="sm"
                      onClick={() => setUploadModalOpen(true)}
                      leftIcon={<Plus className="w-3.5 h-3.5 text-amrin" />}
                    >
                      Upload New
                    </Button>
                  </div>
                </div>

                {/* Media Picker Grid Drawer */}
                {isMediaPickerOpen && mediaVault && (
                  <div className="glass-card p-3 rounded-2xl max-h-48 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 gap-2 border-white/10">
                    {mediaVault.map((m) => {
                      const isSelected = selectedMediaIds.includes(m._id);
                      return (
                        <div
                          key={m._id}
                          onClick={() => toggleMediaSelection(m._id)}
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
              </div>

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
                <Button type="submit" variant="violet" size="md" isLoading={isSubmitting}>
                  {editingEvent ? 'Update Memory' : 'Save Memory'}
                </Button>
              </div>

            </form>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
