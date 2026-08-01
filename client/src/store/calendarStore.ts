import { create } from 'zustand';
import { CalendarEvent } from '../types/index.js';

interface CalendarState {
  events: CalendarEvent[];
  todayEvents: CalendarEvent[];
  activeViewMode: 'month' | 'week' | 'day' | 'agenda';
  selectedDate: Date;
  isCreateModalOpen: boolean;
  editingEvent: CalendarEvent | null;
  selectedEventDetail: CalendarEvent | null;
  isDetailModalOpen: boolean;
  filterEventType: string;
  filterPriority: string;
  filterSearch: string;

  setEvents: (events: CalendarEvent[]) => void;
  setTodayEvents: (events: CalendarEvent[]) => void;
  setActiveViewMode: (mode: 'month' | 'week' | 'day' | 'agenda') => void;
  setSelectedDate: (date: Date) => void;
  setCreateModalOpen: (open: boolean) => void;
  setEditingEvent: (event: CalendarEvent | null) => void;
  setSelectedEventDetail: (event: CalendarEvent | null) => void;
  setDetailModalOpen: (open: boolean) => void;
  setFilterEventType: (type: string) => void;
  setFilterPriority: (priority: string) => void;
  setFilterSearch: (search: string) => void;
  resetFilters: () => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  events: [],
  todayEvents: [],
  activeViewMode: 'month',
  selectedDate: new Date(),
  isCreateModalOpen: false,
  editingEvent: null,
  selectedEventDetail: null,
  isDetailModalOpen: false,
  filterEventType: '',
  filterPriority: '',
  filterSearch: '',

  setEvents: (events) => set({ events }),
  setTodayEvents: (todayEvents) => set({ todayEvents }),
  setActiveViewMode: (activeViewMode) => set({ activeViewMode }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setCreateModalOpen: (isCreateModalOpen) => set({ isCreateModalOpen }),
  setEditingEvent: (editingEvent) => set({ editingEvent }),
  setSelectedEventDetail: (selectedEventDetail) => set({ selectedEventDetail }),
  setDetailModalOpen: (isDetailModalOpen) => set({ isDetailModalOpen }),
  setFilterEventType: (filterEventType) => set({ filterEventType }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),
  setFilterSearch: (filterSearch) => set({ filterSearch }),
  resetFilters: () => set({ filterEventType: '', filterPriority: '', filterSearch: '' }),
}));
