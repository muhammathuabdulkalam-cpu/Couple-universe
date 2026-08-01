import { create } from 'zustand';
import { TimelineEvent } from '../types/index.js';

interface TimelineState {
  events: TimelineEvent[];
  todayInHistoryEvents: TimelineEvent[];
  isCreateModalOpen: boolean;
  editingEvent: TimelineEvent | null;
  selectedEventDetail: TimelineEvent | null;
  isDetailModalOpen: boolean;
  filterEventType: string;
  filterChapter: string;
  filterMood: string;
  filterSearch: string;

  setEvents: (events: TimelineEvent[]) => void;
  setTodayInHistoryEvents: (events: TimelineEvent[]) => void;
  setCreateModalOpen: (open: boolean) => void;
  setEditingEvent: (event: TimelineEvent | null) => void;
  setSelectedEventDetail: (event: TimelineEvent | null) => void;
  setDetailModalOpen: (open: boolean) => void;
  setFilterEventType: (type: string) => void;
  setFilterChapter: (chapter: string) => void;
  setFilterMood: (mood: string) => void;
  setFilterSearch: (search: string) => void;
  resetFilters: () => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
  events: [],
  todayInHistoryEvents: [],
  isCreateModalOpen: false,
  editingEvent: null,
  selectedEventDetail: null,
  isDetailModalOpen: false,
  filterEventType: '',
  filterChapter: '',
  filterMood: '',
  filterSearch: '',

  setEvents: (events) => set({ events }),
  setTodayInHistoryEvents: (todayInHistoryEvents) => set({ todayInHistoryEvents }),
  setCreateModalOpen: (isCreateModalOpen) => set({ isCreateModalOpen }),
  setEditingEvent: (editingEvent) => set({ editingEvent }),
  setSelectedEventDetail: (selectedEventDetail) => set({ selectedEventDetail }),
  setDetailModalOpen: (isDetailModalOpen) => set({ isDetailModalOpen }),
  setFilterEventType: (filterEventType) => set({ filterEventType }),
  setFilterChapter: (filterChapter) => set({ filterChapter }),
  setFilterMood: (filterMood) => set({ filterMood }),
  setFilterSearch: (filterSearch) => set({ filterSearch }),
  resetFilters: () =>
    set({
      filterEventType: '',
      filterChapter: '',
      filterMood: '',
      filterSearch: '',
    }),
}));
