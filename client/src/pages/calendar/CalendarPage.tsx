import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, RefreshCw, Search, Sparkles } from 'lucide-react';
import React, { useEffect } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { CalendarEventDetailModal } from '../../components/calendar/CalendarEventDetailModal.js';
import { CalendarView } from '../../components/calendar/CalendarView.js';
import { CreateCalendarEventModal } from '../../components/calendar/CreateCalendarEventModal.js';
import { MediaViewerModal } from '../../components/media/MediaViewerModal.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { useCalendarStore } from '../../store/calendarStore.js';
import { ApiResponse, CalendarEvent } from '../../types/index.js';

export const CalendarPage: React.FC = () => {
  const {
    setEvents,
    setCreateModalOpen,
    setEditingEvent,
    filterEventType,
    setFilterEventType,
    filterPriority,
    setFilterPriority,
    filterSearch,
    setFilterSearch,
  } = useCalendarStore();

  // Fetch Calendar Events via React Query
  const { data: calendarData, isLoading, refetch, isRefetching } = useQuery<CalendarEvent[]>({
    queryKey: ['calendarList', filterEventType, filterPriority, filterSearch],
    queryFn: async () => {
      const params: any = {};
      if (filterEventType) params.eventType = filterEventType;
      if (filterPriority) params.priority = filterPriority;
      if (filterSearch) params.search = filterSearch;

      const res = await axiosClient.get<ApiResponse<CalendarEvent[]>>('/calendar', { params });
      return res.data.data!;
    },
  });

  useEffect(() => {
    if (calendarData) setEvents(calendarData);
  }, [calendarData, setEvents]);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="cyan" size="sm">
                <Sparkles className="w-3 h-3" /> Life Events Engine
              </Badge>
              <Badge variant="violet" size="sm">
                Apple Calendar Design
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Relationship Calendar
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Unified schedule, reminders, dates, and milestones for Afzal & Amrin
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
            Schedule Event
          </Button>
        </div>
      </motion.div>

      {/* Control Bar: Search & Filters */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-white/10">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Search events, dates, locations..."
            className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amrin"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <select
            value={filterEventType}
            onChange={(e) => setFilterEventType(e.target.value)}
            className="bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
          >
            <option value="">All Categories</option>
            <option value="DATE">Date</option>
            <option value="ANNIVERSARY">Anniversary</option>
            <option value="BIRTHDAY">Birthday</option>
            <option value="TRIP">Trip</option>
            <option value="DINNER">Dinner</option>
            <option value="MOVIE">Movie</option>
            <option value="REMINDER">Reminder</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-obsidian-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High ⭐</option>
            <option value="URGENT">Urgent ⚡</option>
          </select>

          <Button
            variant="glass"
            size="sm"
            onClick={() => refetch()}
            isLoading={isRefetching}
            className="p-2 rounded-xl"
            title="Refresh Calendar"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

      </div>

      {/* Main Calendar View Workspace */}
      {isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <CalendarView onRefresh={() => refetch()} />
      )}

      {/* Event Details, Creation & Media Lightbox Modals */}
      <CreateCalendarEventModal onSuccess={() => refetch()} />
      <CalendarEventDetailModal />
      <MediaViewerModal />

    </div>
  );
};
