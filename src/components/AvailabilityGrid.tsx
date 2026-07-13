import React, { useState } from 'react';
import { useCalendarAvailability, TimeSlot } from '../hooks/useCalendarAvailability';
import { useCalendar } from '../hooks/useCalendar';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  Share2, 
  Lock, 
  Check, 
  Plus, 
  Compass, 
  Users 
} from 'lucide-react';
import { format, addDays, startOfWeek, eachDayOfInterval } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { EventCreator } from './EventCreator';

interface AvailabilityGridProps {
  chatId?: string;
  onShareSuccess?: () => void;
}

export function AvailabilityGrid({ chatId, onShareSuccess }: AvailabilityGridProps) {
  const { user } = useAuth();
  const { freeSlots, shareAvailability } = useCalendarAvailability();
  const [sharing, setSharing] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showBookCreator, setShowBookCreator] = useState(false);

  const startWeek = startOfWeek(new Date());
  const endWeek = addDays(startWeek, 6);
  const daysOfWeek = eachDayOfInterval({ start: startWeek, end: endWeek });

  const hours = Array.from({ length: 9 }, (_, i) => i + 9); // 9 AM to 5 PM

  const getSlotAt = (day: Date, hour: number): TimeSlot | undefined => {
    return freeSlots.find(slot => {
      const slotStart = slot.start;
      return (
        slotStart.getDate() === day.getDate() &&
        slotStart.getMonth() === day.getMonth() &&
        slotStart.getFullYear() === day.getFullYear() &&
        slotStart.getHours() === hour
      );
    });
  };

  const handleShare = async () => {
    if (!chatId) return;
    setSharing(true);
    try {
      await shareAvailability(chatId);
      onShareSuccess?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left max-w-2xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-4">
        <div>
          <h4 className="text-xs font-mono font-bold tracking-widest text-white uppercase flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Availability Sharing Matrix
          </h4>
          <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">Visualize free/busy slots & direct-book coordinates</p>
        </div>

        {chatId && (
          <button
            onClick={handleShare}
            disabled={sharing}
            className="p-1.5 px-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-xl text-[10px] font-mono uppercase font-black transition flex items-center gap-1.5 shadow-md self-start"
          >
            <Share2 size={12} strokeWidth={2.5} />
            {sharing ? 'Sharing...' : 'Share with Chat'}
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 p-2.5 bg-slate-950/40 border border-slate-850 rounded-xl justify-center text-[8px] font-mono uppercase font-bold text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span>Available (Free)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span>Occupied (Busy)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-amber-500 rounded-full" />
          <span>Tentative / Hold</span>
        </div>
        <div className="flex items-center gap-1.5 ml-2 border-l border-slate-800 pl-4">
          <Lock size={10} className="text-slate-500" />
          <span>Privacy Shielded</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950/20">
        <div className="min-w-[500px]">
          {/* Header row */}
          <div className="grid grid-cols-8 border-b border-slate-800 bg-slate-950/60 text-center py-2">
            <div className="text-[9px] font-mono font-bold text-slate-500 uppercase self-center">Hour</div>
            {daysOfWeek.map((day, idx) => (
              <div key={idx} className="text-[9px] font-mono font-bold text-slate-300 uppercase">
                <div>{format(day, 'E')}</div>
                <div className="text-[10px] font-black">{format(day, 'd')}</div>
              </div>
            ))}
          </div>

          {/* Time rows */}
          <div className="divide-y divide-slate-850">
            {hours.map(hour => {
              const displayTime = format(new Date().setHours(hour, 0, 0, 0), 'h:00 a');

              return (
                <div key={hour} className="grid grid-cols-8 py-1 items-center">
                  <div className="text-[9px] font-mono text-slate-400 text-center py-1 font-bold">{displayTime}</div>
                  
                  {daysOfWeek.map((day, dIdx) => {
                    const slot = getSlotAt(day, hour);
                    const status = slot?.status || 'free';

                    return (
                      <div key={dIdx} className="px-1 py-0.5">
                        <button
                          type="button"
                          disabled={status === 'busy'}
                          onClick={() => {
                            if (slot) {
                              setSelectedSlot(slot);
                              setShowBookCreator(true);
                            }
                          }}
                          className={cn(
                            "w-full h-8 rounded-lg text-[9px] font-mono uppercase font-black tracking-wider transition flex items-center justify-center border",
                            status === 'free' 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" 
                              : status === 'tentative'
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 cursor-not-allowed"
                                : "bg-red-500/10 border-red-500/20 text-red-400 cursor-not-allowed"
                          )}
                          title={status === 'free' ? 'Click to book this slot directly!' : 'Slot unavailable'}
                        >
                          {status === 'free' ? (
                            <span className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5"><Plus size={10} /></span>
                          ) : (
                            <span className="text-[7px]">HOLD</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-[8px] font-mono text-slate-500 text-center leading-relaxed">
        🔒 PRIVACY SHIELD PROTOCOL: Chat participants only see free/busy colors. Specific event details, topics, and attendees are shielded securely.
      </p>

      {/* Book Event Modal when clicking free slot */}
      <AnimatePresence>
        {showBookCreator && selectedSlot && (
          <EventCreator
            defaultDate={selectedSlot.start}
            chatId={chatId}
            onClose={() => {
              setShowBookCreator(false);
              setSelectedSlot(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
