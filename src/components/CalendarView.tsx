import React, { useState } from 'react';
import { useCalendar, CalendarEvent } from '../hooks/useCalendar';
import { useCalendarAI } from '../hooks/useCalendarAI';
import { 
  format, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  addDays, 
  subDays, 
  isSameDay, 
  isToday, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  parse,
  isSameMonth,
  startOfDay
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Plus, 
  ListTodo, 
  Sparkles, 
  AlertTriangle, 
  MapPin, 
  Users 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface CalendarViewProps {
  onAddEventClick?: (defaultDate?: Date) => void;
  onSelectEventClick?: (event: CalendarEvent) => void;
}

export function CalendarView({ onAddEventClick, onSelectEventClick }: CalendarViewProps) {
  const { events, loading, accounts } = useCalendar();
  const { summarizeDay, loading: aiLoading } = useCalendarAI();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [aiSummary, setAiSummary] = useState<string>('');

  // Day list helper for Week View
  const hoursOfDay = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM

  // Get color for an event based on calendar account
  const getEventColor = (evt: CalendarEvent) => {
    if (evt.color) return evt.color;
    const acct = accounts.find(a => a.id === evt.calendarId);
    return acct ? acct.color : '#f59e0b'; // amber default
  };

  // Month navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
  };

  // AI Agenda summary call
  const handleAiBriefing = async () => {
    const todayEvents = events.filter(e => isSameDay(e.start.toDate(), selectedDate));
    const summary = await summarizeDay(todayEvents);
    setAiSummary(summary);
  };

  // Render Month grid
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/50">
          {weekDays.map((day, idx) => (
            <div key={idx} className="py-2 text-center text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-[350px]">
          {dateRange.map((day, idx) => {
            const isTodayDay = isToday(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const dayEvents = events.filter(e => isSameDay(e.start.toDate(), day));
            const isSelected = isSameDay(day, selectedDate);

            return (
              <div
                key={idx}
                onClick={() => {
                  setSelectedDate(day);
                  setAiSummary('');
                }}
                onDoubleClick={() => onAddEventClick?.(day)}
                className={cn(
                  "border-b border-r border-slate-800 p-1.5 flex flex-col justify-between transition relative group cursor-pointer select-none min-h-[60px]",
                  !isCurrentMonth && "opacity-35 hover:opacity-50",
                  isSelected && "bg-slate-800/40",
                  isTodayDay && "bg-amber-500/5"
                )}
              >
                {/* Day number */}
                <div className="flex justify-between items-center">
                  <span className={cn(
                    "text-[11px] font-bold font-mono px-1.5 py-0.5 rounded-full",
                    isTodayDay ? "bg-amber-500 text-slate-950 font-black" : "text-slate-300"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Plus create button on hover */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddEventClick?.(day);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 bg-slate-800 text-amber-500 rounded hover:bg-slate-700 transition"
                  >
                    <Plus size={10} />
                  </button>
                </div>

                {/* Event indicators */}
                <div className="space-y-1 mt-1 max-h-[45px] overflow-hidden">
                  {dayEvents.slice(0, 3).map((evt) => (
                    <div 
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEventClick?.(evt);
                      }}
                      className="text-[9px] truncate px-1 py-0.5 rounded flex items-center gap-1 hover:brightness-110 border"
                      style={{ 
                        backgroundColor: `${getEventColor(evt)}15`, 
                        borderColor: `${getEventColor(evt)}40`,
                        color: getEventColor(evt)
                      }}
                    >
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: getEventColor(evt) }} />
                      <span className="font-medium truncate">{evt.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[8px] font-mono text-slate-500 text-right px-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Week view with hourly cells
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(weekStart);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        {/* Header Days of Week */}
        <div className="grid grid-cols-8 border-b border-slate-800 bg-slate-950/50 py-2 sticky top-0 z-10">
          <div className="text-center text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider self-center">Time</div>
          {days.map((day, idx) => (
            <div 
              key={idx} 
              onClick={() => {
                setSelectedDate(day);
                setAiSummary('');
              }}
              className={cn(
                "text-center cursor-pointer select-none flex flex-col items-center gap-0.5",
                isToday(day) && "text-amber-500"
              )}
            >
              <span className="text-[10px] font-mono font-bold uppercase">{format(day, 'E')}</span>
              <span className="text-xs font-black font-mono">{format(day, 'd')}</span>
            </div>
          ))}
        </div>

        {/* Hour Rows */}
        <div className="flex-1 overflow-y-auto max-h-[500px]">
          {hoursOfDay.map((hour) => {
            const displayTime = format(parse(`${hour}`, 'H', new Date()), 'h:00 a');

            return (
              <div key={hour} className="grid grid-cols-8 border-b border-slate-850 min-h-[48px]">
                <div className="text-right pr-3 self-center text-[10px] font-mono text-slate-400">
                  {displayTime}
                </div>
                {days.map((day, idx) => {
                  const dayEvents = events.filter(evt => {
                    const dStart = evt.start.toDate();
                    return isSameDay(dStart, day) && dStart.getHours() === hour;
                  });

                  return (
                    <div 
                      key={idx}
                      onClick={() => {
                        const target = new Date(day);
                        target.setHours(hour, 0, 0, 0);
                        onAddEventClick?.(target);
                      }}
                      className="border-r border-slate-850 p-1 relative hover:bg-slate-850/10 transition group min-h-[48px] cursor-crosshair"
                    >
                      {dayEvents.map(evt => (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEventClick?.(evt);
                          }}
                          className="absolute inset-x-1 top-1 bottom-1 rounded-lg p-1 text-[9px] leading-tight border overflow-hidden cursor-pointer shadow-sm hover:brightness-110 flex flex-col justify-between"
                          style={{
                            backgroundColor: `${getEventColor(evt)}20`,
                            borderColor: getEventColor(evt),
                            color: getEventColor(evt),
                            borderLeftWidth: '3px'
                          }}
                        >
                          <span className="font-bold truncate leading-none">{evt.title}</span>
                          <span className="font-mono text-[7px] opacity-75">{format(evt.start.toDate(), 'h:mm a')}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Day View
  const renderDayView = () => {
    const dayEvents = events.filter(e => isSameDay(e.start.toDate(), currentDate));

    return (
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 bg-slate-900 border border-slate-800 rounded-3xl p-6">
        {/* Left Column: List of hours */}
        <div className="flex-1 flex flex-col border-r border-slate-800 pr-6">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Day Timings</h3>
            <button 
              onClick={() => onAddEventClick?.(currentDate)}
              className="p-1 px-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-mono font-bold text-[10px] rounded-lg uppercase flex items-center gap-1 transition"
            >
              <Plus size={11} strokeWidth={3} /> Add
            </button>
          </div>

          <div className="overflow-y-auto max-h-[450px] space-y-1 pr-2">
            {hoursOfDay.map((hour) => {
              const displayTime = format(parse(`${hour}`, 'H', new Date()), 'h:00 a');
              const activeHourEvents = dayEvents.filter(e => e.start.toDate().getHours() === hour);

              return (
                <div key={hour} className="flex gap-4 items-start min-h-[50px] border-b border-slate-850/40 py-1">
                  <span className="text-[10px] font-mono text-slate-400 w-16 text-right pt-0.5 shrink-0">{displayTime}</span>
                  <div className="flex-1">
                    {activeHourEvents.length === 0 ? (
                      <div className="text-[9px] font-mono text-slate-600 uppercase tracking-wide py-1">Free</div>
                    ) : (
                      activeHourEvents.map(evt => (
                        <div
                          key={evt.id}
                          onClick={() => onSelectEventClick?.(evt)}
                          className="p-2.5 bg-slate-800 border-l-4 rounded-xl text-left cursor-pointer hover:bg-slate-750 transition flex justify-between items-center mb-1 shadow-sm"
                          style={{ borderLeftColor: getEventColor(evt) }}
                        >
                          <div>
                            <h5 className="text-xs font-bold text-white">{evt.title}</h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {format(evt.start.toDate(), 'h:mm a')} - {format(evt.end.toDate(), 'h:mm a')}
                            </p>
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 uppercase">{evt.location || 'No Location'}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: AI summary summary */}
        <div className="w-full md:w-64 bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Sparkles size={13} className="animate-pulse" /> AI Day Briefing
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed mb-4 uppercase font-mono tracking-wide">
              Selected Date: {format(currentDate, 'EEEE, MMM d')}
            </p>
            
            {aiSummary ? (
              <div className="text-xs text-slate-200 leading-relaxed italic bg-slate-900 border border-slate-800 p-3 rounded-xl">
                "{aiSummary}"
              </div>
            ) : (
              <button
                onClick={handleAiBriefing}
                disabled={aiLoading}
                className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-xl text-[10px] font-mono uppercase tracking-wider font-bold transition flex items-center justify-center gap-1.5"
              >
                {aiLoading ? 'Synthesizing...' : 'Generate Briefing'}
              </button>
            )}
          </div>
          <div className="text-[9px] text-slate-500 font-mono text-center border-t border-slate-850 pt-3 mt-4">
            Today: {dayEvents.length} operational blocks
          </div>
        </div>
      </div>
    );
  };

  // Render Agenda View
  const renderAgendaView = () => {
    // Sort upcoming events chronologically
    const upcomingEvents = [...events]
      .filter(e => e.start.toDate() >= startOfDay(new Date()))
      .sort((a, b) => a.start.toDate().getTime() - b.start.toDate().getTime());

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 text-left">
          Agenda Overview
        </h3>

        {upcomingEvents.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs font-mono">
            No upcoming events scheduled. Use Chat or click Create to add one.
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto max-h-[420px] pr-2">
            {upcomingEvents.map(evt => {
              const color = getEventColor(evt);
              const eventDate = evt.start.toDate();

              return (
                <div 
                  key={evt.id}
                  onClick={() => onSelectEventClick?.(evt)}
                  className="bg-slate-950/40 hover:bg-slate-800/20 border border-slate-850 hover:border-slate-800 transition p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 cursor-pointer text-left"
                  style={{ borderLeftColor: color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="text-center shrink-0 w-12 py-1 bg-slate-900 border border-slate-800 rounded-xl font-mono">
                      <span className="block text-[8px] uppercase text-slate-500 font-bold">{format(eventDate, 'MMM')}</span>
                      <span className="block text-sm font-black text-white">{format(eventDate, 'd')}</span>
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{evt.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                        <Clock size={10} />
                        {format(eventDate, 'h:mm a')} - {format(evt.end.toDate(), 'h:mm a')}
                        {evt.allDay && <span className="bg-amber-500/10 text-amber-500 text-[8px] font-mono px-1 py-0.5 rounded font-black uppercase">All Day</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 sm:self-center">
                    {evt.location && (
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-xl">
                        <MapPin size={10} className="text-slate-500" />
                        {evt.location}
                      </span>
                    )}
                    {evt.attendees?.length > 0 && (
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-xl">
                        <Users size={10} className="text-slate-500" />
                        {evt.attendees.length}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar controls bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-slate-850">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
            <button 
              onClick={handlePrev} 
              className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => {
                setCurrentDate(new Date());
                setSelectedDate(new Date());
              }} 
              className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase hover:bg-slate-800 text-slate-300 rounded-lg transition"
            >
              Today
            </button>
            <button 
              onClick={handleNext} 
              className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <h3 className="text-xs font-mono font-bold tracking-widest text-white uppercase">
            {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
            {viewMode === 'week' && `Wk ${format(currentDate, 'w')} - ${format(currentDate, 'yyyy')}`}
            {viewMode === 'day' && format(currentDate, 'EEEE, MMM d, yyyy')}
            {viewMode === 'agenda' && 'Upcoming Agenda'}
          </h3>
        </div>

        {/* View switcher and Create action */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-slate-900 rounded-xl p-0.5 border border-slate-800">
            {(['month', 'week', 'day', 'agenda'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-2.5 py-1 text-[9px] font-mono uppercase font-bold rounded-lg transition",
                  viewMode === mode 
                    ? "bg-amber-500 text-slate-950 font-black" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => onAddEventClick?.(selectedDate)}
            className="p-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[10px] font-mono uppercase font-black flex items-center gap-1 transition shadow-md cursor-pointer"
          >
            <Plus size={11} strokeWidth={3} /> Book Event
          </button>
        </div>
      </div>

      {/* Render selected view */}
      <div className="min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12 text-slate-400 text-xs">
            <RefreshCw className="animate-spin mr-2" size={14} /> LOADING SCHEDULER MATRIX...
          </div>
        ) : (
          <>
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
            {viewMode === 'agenda' && renderAgendaView()}
          </>
        )}
      </div>
    </div>
  );
}

// Support RefreshCw loading icon helper
function RefreshCw({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
