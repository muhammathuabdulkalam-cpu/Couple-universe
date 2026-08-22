import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Heart, Plus, RefreshCw, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { MediaViewerModal } from '../../components/media/MediaViewerModal.js';
import { CreateTimelineEventModal } from '../../components/timeline/CreateTimelineEventModal.js';
import { MemoryDetailModal } from '../../components/timeline/MemoryDetailModal.js';
import { TimelineEventCard } from '../../components/timeline/TimelineEventCard.js';
import { TodayInHistoryBanner } from '../../components/timeline/TodayInHistoryBanner.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { useTimelineStore } from '../../store/timelineStore.js';
import { ApiResponse, TimelineEvent } from '../../types/index.js';

export const TimelinePage: React.FC = () => {
  const {
    events,
    setEvents,
    setTodayInHistoryEvents,
    setCreateModalOpen,
    setEditingEvent,
    filterEventType,
    setFilterEventType,
    filterChapter,
    setFilterChapter,
    filterMood,
    setFilterMood,
    filterSearch,
    setFilterSearch,
  } = useTimelineStore();

  const [filterYear, setFilterYear] = useState('');

  // Fetch Timeline Events via React Query
  const { data: timelineData, isLoading, refetch, isRefetching } = useQuery<TimelineEvent[]>({
    queryKey: ['timelineList', filterEventType, filterChapter, filterMood, filterSearch, filterYear],
    queryFn: async () => {
      const params: any = {};
      if (filterEventType) params.eventType = filterEventType;
      if (filterChapter) params.chapter = filterChapter;
      if (filterMood) params.mood = filterMood;
      if (filterSearch) params.search = filterSearch;
      if (filterYear) params.year = filterYear;

      const res = await axiosClient.get<ApiResponse<TimelineEvent[]>>('/timeline', { params });
      return res.data.data!;
    },
  });

  // Fetch Today In History Events
  const { data: todayEvents } = useQuery<TimelineEvent[]>({
    queryKey: ['todayInHistory'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<TimelineEvent[]>>('/timeline/today-in-history');
      return res.data.data!;
    },
  });

  useEffect(() => {
    if (timelineData) setEvents(timelineData);
  }, [timelineData, setEvents]);

  useEffect(() => {
    if (todayEvents) setTodayInHistoryEvents(todayEvents);
  }, [todayEvents, setTodayInHistoryEvents]);

  // Group events by Year -> Month
  const groupedEvents = (events || []).reduce((acc: Record<string, Record<string, TimelineEvent[]>>, event) => {
    const date = new Date(event.eventDate);
    const year = date.getFullYear().toString();
    const month = date.toLocaleString('en-US', { month: 'long' });

    if (!acc[year]) acc[year] = {};
    if (!acc[year][month]) acc[year][month] = [];
    acc[year][month].push(event);
    return acc;
  }, {});

  const years = Object.keys(groupedEvents).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="violet" size="sm">
                <Heart className="w-3 h-3 fill-heart text-heart" /> Relationship Timeline
              </Badge>
              <Badge variant="cyan" size="sm">
                March 26, 2026 Chapter
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Memory & Timeline Journal
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
              Chronological journey of Afzal & Amrin's lifetime memories
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingEvent(null);
              setCreateModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Memory Event
          </Button>
        </div>
      </motion.div>

      {/* Today In History Header Banner */}
      <TodayInHistoryBanner />

      {/* Control Bar: Search & Filters */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-200 dark:border-white/10">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Search by title, location, tag..."
            className="w-full bg-white dark:bg-obsidian-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl py-2 left-10 pl-10 pr-4 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amrin focus:ring-1 focus:ring-amrin transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="bg-white dark:bg-obsidian-950 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amrin"
          >
            <option value="">All Years</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
          </select>

          <select
            value={filterChapter}
            onChange={(e) => setFilterChapter(e.target.value)}
            className="bg-white dark:bg-obsidian-950 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amrin"
          >
            <option value="">All Chapters</option>
            <option value="LOVE">LOVE</option>
            <option value="ENGAGEMENT">ENGAGEMENT</option>
            <option value="MARRIAGE">MARRIAGE</option>
            <option value="HONEYMOON">HONEYMOON</option>
            <option value="TRAVEL">TRAVEL</option>
            <option value="FAMILY">FAMILY</option>
            <option value="BABY">BABY</option>
          </select>

          <select
            value={filterEventType}
            onChange={(e) => setFilterEventType(e.target.value)}
            className="bg-white dark:bg-obsidian-950 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amrin"
          >
            <option value="">All Event Types</option>
            <option value="FIRST_CONVERSATION">First Conversation</option>
            <option value="FIRST_MEETING">First Meeting</option>
            <option value="DATE">Date</option>
            <option value="TRIP">Trip</option>
            <option value="ANNIVERSARY">Anniversary</option>
            <option value="BIRTHDAY">Birthday</option>
          </select>

          <select
            value={filterMood}
            onChange={(e) => setFilterMood(e.target.value)}
            className="bg-white dark:bg-obsidian-950 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amrin"
          >
            <option value="">All Moods</option>
            <option value="ROMANTIC">Romantic ❤️</option>
            <option value="HAPPY">Happy 😄</option>
            <option value="EXCITED">Excited ✨</option>
            <option value="NOSTALGIC">Nostalgic 📜</option>
          </select>

          <Button
            variant="glass"
            size="sm"
            onClick={() => refetch()}
            isLoading={isRefetching}
            className="p-2 rounded-xl"
            title="Refresh Timeline"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

      </div>

      {/* Main Timeline Stream */}
      {isLoading ? (
        <div className="space-y-6 max-w-3xl mx-auto">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : years.length > 0 ? (
        <div className="max-w-4xl mx-auto space-y-12 relative">
          
          {/* Central Vertical Connector Line */}
          <div className="absolute left-6 md:left-1/2 top-4 bottom-4 w-0.5 bg-gradient-to-b from-afzal via-amrin to-heart opacity-30 pointer-events-none -translate-x-1/2" />

          {years.map((year) => (
            <div key={year} className="space-y-8 relative">
              
              {/* Sticky Year Header Pill */}
              <div className="sticky top-20 z-20 flex justify-center">
                <span className="glass-card px-6 py-2 rounded-full border border-slate-200 dark:border-white/10 text-sm font-extrabold text-slate-900 dark:text-white shadow-xl bg-white/95 dark:bg-obsidian-950/90 backdrop-blur-md gradient-text-couple">
                  Year {year}
                </span>
              </div>

              {Object.keys(groupedEvents[year]).map((month) => (
                <div key={month} className="space-y-6">
                  
                  {/* Month Separator */}
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs uppercase font-bold tracking-widest text-slate-600 dark:text-slate-400 glass-panel px-3 py-1 rounded-full border border-slate-200 dark:border-white/5">
                      {month}
                    </span>
                  </div>

                  {/* Timeline Memory Cards */}
                  <div className="space-y-6">
                    {groupedEvents[year][month].map((event) => (
                      <TimelineEventCard key={event._id} event={event} onRefresh={() => refetch()} />
                    ))}
                  </div>

                </div>
              ))}

            </div>
          ))}

        </div>
      ) : (
        <Card variant="glass" className="p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-heart/10 border border-heart/30 flex items-center justify-center text-heart mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Timeline Events Recorded</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Record your first conversation, coffee date, or travel milestone in Afzal & Amrin's lifetime journal.
          </p>
          <Button
            variant="violet"
            size="md"
            onClick={() => {
              setEditingEvent(null);
              setCreateModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add First Timeline Memory
          </Button>
        </Card>
      )}

      {/* Lightbox, Detail Modal & Timeline Event Create/Edit Modals */}
      <MemoryDetailModal />
      <CreateTimelineEventModal onSuccess={() => refetch()} />
      <MediaViewerModal />

    </div>
  );
};
