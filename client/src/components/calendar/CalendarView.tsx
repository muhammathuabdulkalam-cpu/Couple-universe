import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import React, { useState } from 'react';
import { useCalendarStore } from '../../store/calendarStore.js';
import { Badge } from '../ui/Badge.js';
import { Card } from '../ui/Card.js';

interface CalendarViewProps {
  onRefresh?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = () => {
  const {
    events,
    activeViewMode,
    setActiveViewMode,
    selectedDate,
    setSelectedDate,
    setSelectedEventDetail,
    setDetailModalOpen,
    setCreateModalOpen,
    setEditingEvent,
  } = useCalendarStore();

  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(selectedDate));

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  // Calculate Days in Month
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const isToday = (d: number) => {
    const today = new Date();
    return (
      today.getDate() === d &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  // Get events on a specific day
  const getEventsForDay = (day: number) => {
    return (events || []).filter((e) => {
      const eDate = new Date(e.startDate);
      return (
        eDate.getDate() === day &&
        eDate.getMonth() === month &&
        eDate.getFullYear() === year
      );
    });
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Calendar Workspace Header Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10">
        
        {/* Month & Year Controller */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-white tracking-tight min-w-[160px] text-center">
            {currentMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center glass-card p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeViewMode === 'month' ? 'bg-afzal text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setActiveViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeViewMode === 'agenda' ? 'bg-afzal text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Agenda View
            </button>
          </div>
        </div>

      </div>

      {/* Month View Grid */}
      {activeViewMode === 'month' ? (
        <Card variant="glass" className="p-4 border-white/10">
          
          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Blank leading cells */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[100px] rounded-xl glass-card opacity-20 border border-white/5" />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const todayClass = isToday(day);

              return (
                <div
                  key={day}
                  onClick={() => {
                    const selected = new Date(year, month, day);
                    setSelectedDate(selected);
                  }}
                  className={`min-h-[100px] p-2 rounded-xl glass-card border transition-all flex flex-col justify-between overflow-hidden cursor-pointer ${
                    todayClass
                      ? 'border-amrin ring-2 ring-amrin/40 bg-gradient-to-b from-amrin/10 to-obsidian-950/80 shadow-xl'
                      : 'border-white/10 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                        todayClass ? 'bg-amrin text-white font-extrabold' : 'text-slate-300'
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono text-afzal-glow font-bold">
                        {dayEvents.length} Event{dayEvents.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Day Events Pills */}
                  <div className="space-y-1 my-1 overflow-y-auto max-h-[60px]">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventDetail(evt);
                          setDetailModalOpen(true);
                        }}
                        className="px-2 py-1 rounded-lg text-[10px] font-semibold text-white truncate flex items-center justify-between border border-white/10 hover:scale-105 transition-transform"
                        style={{ backgroundColor: evt.color || '#06B6D4' }}
                      >
                        <span className="truncate">{evt.icon} {evt.title}</span>
                        {evt.isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-300 shrink-0" />}
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>

        </Card>
      ) : (
        /* Agenda View List */
        <div className="space-y-4 max-w-3xl mx-auto">
          {events && events.length > 0 ? (
            events.map((evt) => (
              <motion.div key={evt._id} whileHover={{ x: 4 }}>
                <Card
                  variant="glass"
                  className="p-4 flex items-center justify-between gap-4 border-white/10 hover:border-amrin/40 cursor-pointer"
                  onClick={() => {
                    setSelectedEventDetail(evt);
                    setDetailModalOpen(true);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-md"
                      style={{ backgroundColor: `${evt.color}20`, border: `1px solid ${evt.color}50` }}
                    >
                      {evt.icon || '📅'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amrin-glow">
                          {new Date(evt.startDate).toLocaleString()}
                        </span>
                        <Badge variant="cyan" size="sm">{evt.eventType}</Badge>
                      </div>
                      <h4 className="text-base font-bold text-white mt-0.5">{evt.title}</h4>
                    </div>
                  </div>

                  <Badge variant={evt.isCompleted ? 'green' : 'violet'} size="sm">
                    {evt.status}
                  </Badge>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card variant="glass" className="p-12 text-center space-y-4">
              <CalendarIcon className="w-8 h-8 text-afzal mx-auto" />
              <h3 className="text-base font-bold text-white">No Scheduled Agenda Events</h3>
              <p className="text-xs text-slate-400">Click below to schedule your first date or reminder.</p>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setCreateModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-afzal text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Schedule Event
              </button>
            </Card>
          )}
        </div>
      )}

    </div>
  );
};
