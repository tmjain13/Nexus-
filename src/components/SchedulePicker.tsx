import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Sparkles, X, RefreshCw, AlertCircle } from 'lucide-react';
import { useSmartSchedule } from '../hooks/useSmartSchedule';

interface SchedulePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: Date, recurrence: { frequency: 'daily' | 'weekly' | 'monthly' } | null) => void;
  peerName?: string;
  peerId?: string;
}

export function SchedulePicker({ isOpen, onClose, onSchedule, peerName = 'Personnel', peerId }: SchedulePickerProps) {
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [customDateTime, setCustomDateTime] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const { suggestedTime, suggestedLabel, isLoading, fetchSuggestion, clearSuggestion } = useSmartSchedule(peerId || '');

  useEffect(() => {
    if (isOpen) {
      // Set default custom date to 1 hour from now formatted for datetime-local
      const date = new Date();
      date.setHours(date.getHours() + 1);
      
      // format as YYYY-MM-DDThh:mm
      const pad = (n: number) => n.toString().padStart(2, '0');
      const localString = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
      setCustomDateTime(localString);
      setSelectedTime(null);
      clearSuggestion();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQuickOption = (preset: 'today-6pm' | 'tomorrow-9am' | 'next-monday') => {
    const now = new Date();
    const date = new Date();
    
    if (preset === 'today-6pm') {
      date.setHours(18, 0, 0, 0);
      if (date < now) {
        // if 6pm passed, schedule for tomorrow 6pm
        date.setDate(date.getDate() + 1);
      }
    } else if (preset === 'tomorrow-9am') {
      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0);
    } else if (preset === 'next-monday') {
      // Find next Monday
      const day = date.getDay();
      const diff = day === 0 ? 1 : 8 - day; // next monday
      date.setDate(date.getDate() + diff);
      date.setHours(9, 0, 0, 0);
    }
    
    setSelectedTime(date);
    
    // Sync custom picker
    const pad = (n: number) => n.toString().padStart(2, '0');
    const localString = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    setCustomDateTime(localString);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomDateTime(e.target.value);
    if (e.target.value) {
      setSelectedTime(new Date(e.target.value));
    } else {
      setSelectedTime(null);
    }
  };

  const handleApply = () => {
    let finalTime = selectedTime;
    if (!finalTime && customDateTime) {
      finalTime = new Date(customDateTime);
    }

    if (!finalTime) return;

    // Boundary Validation
    const now = new Date();
    const minTime = new Date(now.getTime() + 4 * 60 * 1000); // minimum 4 mins
    const maxTime = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000); // max 30 days

    if (finalTime < minTime) {
      alert("Scheduling error: Transmission time must be at least 5 minutes in the future.");
      return;
    }

    if (finalTime > maxTime) {
      alert("Scheduling error: Transmission cannot be scheduled more than 30 days in advance.");
      return;
    }

    const recurrence = isRecurring ? { frequency } : null;
    onSchedule(finalTime, recurrence);
    onClose();
  };

  const handleAcceptSuggestion = () => {
    if (suggestedTime) {
      setSelectedTime(suggestedTime);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const localString = `${suggestedTime.getFullYear()}-${pad(suggestedTime.getMonth() + 1)}-${pad(suggestedTime.getDate())}T${pad(suggestedTime.getHours())}:${pad(suggestedTime.getMinutes())}`;
      setCustomDateTime(localString);
    }
  };

  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/10">
              <Clock size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">Schedule Transmission</h2>
              <p className="text-[10px] text-zinc-400 font-sans mt-0.5">Delay dispatch to specific window</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors border-0"
            style={{ border: 'none', background: 'none' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* AI Smart Scheduling */}
          {peerId && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 relative overflow-hidden group">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/10">
                  <Sparkles size={14} className="animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">AI Presence Analyzer</span>
                  <p className="text-xs text-zinc-300 font-sans mt-1 leading-relaxed">
                    {isLoading ? "Analyzing recipient patterns..." : (suggestedLabel || `Let AI calculate the best time based on ${peerName}'s active hours.`)}
                  </p>
                  
                  {!suggestedTime && !isLoading && (
                    <button 
                      onClick={() => fetchSuggestion(peerName, peerId)}
                      className="mt-2 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-none border-0"
                      style={{ border: 'none', background: 'none' }}
                    >
                      Analyze Active Pattern
                    </button>
                  )}

                  {suggestedTime && !isLoading && (
                    <button 
                      onClick={handleAcceptSuggestion}
                      className="mt-2 px-3 py-1 bg-amber-500 text-black text-[10px] font-mono font-black uppercase tracking-widest rounded-lg hover:bg-amber-400 transition-colors border-0"
                      style={{ border: 'none' }}
                    >
                      Apply Suggested Time
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Quick Presets</span>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleQuickOption('today-6pm')}
                className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-mono border border-zinc-800 transition-all hover:border-zinc-700 text-center"
                style={{ border: 'none' }}
              >
                Today 6:00 PM
              </button>
              <button 
                onClick={() => handleQuickOption('tomorrow-9am')}
                className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-mono border border-zinc-800 transition-all hover:border-zinc-700 text-center"
                style={{ border: 'none' }}
              >
                Tomorrow 9:00 AM
              </button>
              <button 
                onClick={() => handleQuickOption('next-monday')}
                className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-mono border border-zinc-800 transition-all hover:border-zinc-700 text-center"
                style={{ border: 'none' }}
              >
                Next Mon 9:00 AM
              </button>
            </div>
          </div>

          {/* Custom Date Time */}
          <div className="space-y-2">
            <span className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Custom Date & Time</span>
            <div className="relative">
              <input 
                type="datetime-local" 
                value={customDateTime}
                onChange={handleCustomChange}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/50 rounded-xl p-3.5 font-mono text-xs outline-none transition-all text-zinc-100 placeholder-zinc-700 shadow-inner"
              />
            </div>
          </div>

          {/* Recurrence Bonus */}
          <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw size={14} className={isRecurring ? "text-amber-500 animate-spin" : "text-zinc-500"} style={{ animationDuration: '4s' }} />
                <span className="text-xs font-mono font-bold text-zinc-300">Recurring Schedule Series</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-black peer-checked:after:border-transparent"></div>
              </label>
            </div>

            {isRecurring && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2 border-t border-zinc-900 grid grid-cols-3 gap-2"
              >
                {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setFrequency(freq)}
                    className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border transition-all text-center ${
                      frequency === freq 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                        : 'bg-zinc-950 text-zinc-500 border-zinc-900 hover:text-zinc-400'
                    }`}
                    style={{ border: 'none' }}
                  >
                    {freq}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Timezone label */}
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono px-1">
            <AlertCircle size={12} />
            <span>Sends in local time: {localTimezone}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-900 flex gap-3 bg-zinc-900/20">
          <button 
            onClick={onClose}
            className="flex-1 py-3 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 hover:bg-zinc-900 rounded-xl transition-all border border-transparent"
            style={{ border: 'none', background: 'none' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleApply}
            disabled={!selectedTime && !customDateTime}
            className="flex-1 py-3 bg-amber-500 text-black rounded-xl text-[10px] font-mono font-black uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-30 disabled:hover:bg-amber-500 shadow-lg shadow-amber-500/5 border-0"
            style={{ border: 'none' }}
          >
            Confirm Schedule
          </button>
        </div>
      </motion.div>
    </div>
  );
}
