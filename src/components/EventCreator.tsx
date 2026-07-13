import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useCalendar, CalendarEvent } from '../hooks/useCalendar';
import { useCalendarAvailability } from '../hooks/useCalendarAvailability';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Check, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Video, 
  Bell, 
  Repeat, 
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { format, addMinutes, isSameDay } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface EventCreatorProps {
  defaultDate?: Date;
  chatContext?: string;
  chatId?: string;
  chatParticipants?: Array<{ uid: string; displayName?: string; email?: string }>;
  onClose: () => void;
  onSuccess?: (event: Omit<CalendarEvent, 'id'>) => void;
}

const DURATIONS = [
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '1h', value: 60 },
  { label: '2h', value: 120 },
  { label: 'Custom', value: 0 }
];

const REMINDERS = [
  { label: '5m before', value: 5 },
  { label: '15m before', value: 15 },
  { label: '30m before', value: 30 },
  { label: '1h before', value: 60 },
  { label: '1d before', value: 1440 }
];

export function EventCreator({ defaultDate, chatContext, chatId, chatParticipants, onClose, onSuccess }: EventCreatorProps) {
  const { user } = useAuth();
  const { createEvent, accounts } = useCalendar();
  const { freeSlots } = useCalendarAvailability();

  // State fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDateStr, setStartDateStr] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('');
  const [duration, setDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState(30);
  const [location, setLocation] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [attendeesInput, setAttendeesInput] = useState('');
  const [invitedAttendees, setInvitedAttendees] = useState<any[]>([]);
  const [selectedReminder, setSelectedReminder] = useState<number[]>([15]);
  const [selectedCalendarId, setSelectedCalendarId] = useState('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Recurrence states
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);

  // Init from defaults
  useEffect(() => {
    const initDate = defaultDate || new Date();
    setStartDateStr(format(initDate, 'yyyy-MM-dd'));
    setStartTimeStr(format(initDate, 'HH:mm'));

    // Select first calendar account as default if exists
    if (accounts.length > 0) {
      setSelectedCalendarId(accounts[0].id);
    } else {
      setSelectedCalendarId('primary');
    }

    // Auto-fill from chat context if provided
    if (chatContext) {
      setTitle('Meeting from Chat Conversation');
      setDescription(`Created securely from chat: "${chatContext.slice(0, 80)}..."`);
    }

    // Populate attendees from chat participants
    if (chatParticipants) {
      const activeList = chatParticipants
        .filter(p => p.uid !== user?.uid)
        .map(p => ({
          userId: p.uid,
          email: p.email || `${p.uid}@enclave.local`,
          name: p.displayName || 'Participant',
          status: 'pending'
        }));
      setInvitedAttendees(activeList);
    }
  }, [defaultDate, chatContext, chatParticipants, accounts, user]);

  // Check availability conflict warning live
  useEffect(() => {
    if (!startDateStr || !startTimeStr || !freeSlots) return;

    try {
      const startObj = new Date(`${startDateStr}T${startTimeStr}`);
      const matchingSlot = freeSlots.find(slot => 
        isSameDay(slot.start, startObj) && 
        slot.start.getHours() === startObj.getHours() &&
        slot.start.getMinutes() === startObj.getMinutes()
      );

      if (matchingSlot && matchingSlot.status === 'busy') {
        setConflictWarning('Overlap Detected: You have another scheduled event at this time!');
      } else {
        setConflictWarning(null);
      }
    } catch (e) {
      setConflictWarning(null);
    }
  }, [startDateStr, startTimeStr, freeSlots]);

  // Auto-generate Google Meet URL
  const handleAutoGenerateVideo = () => {
    const meetingId = Math.random().toString(36).substring(2, 5) + '-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 5);
    const generated = `https://meet.google.com/${meetingId}`;
    setVideoLink(generated);
    setLocation(generated);
  };

  // Add attendee invitation from manual input
  const handleAddInvitee = () => {
    if (!attendeesInput.trim() || !attendeesInput.includes('@')) return;
    const email = attendeesInput.trim();
    
    // Check duplication
    if (invitedAttendees.some(a => a.email === email)) return;

    setInvitedAttendees([
      ...invitedAttendees,
      {
        email,
        name: email.split('@')[0],
        status: 'pending'
      }
    ]);
    setAttendeesInput('');
  };

  // Remove attendee
  const handleRemoveInvitee = (email: string) => {
    setInvitedAttendees(invitedAttendees.filter(a => a.email !== email));
  };

  // Toggle reminder selections
  const handleToggleReminder = (minutes: number) => {
    if (selectedReminder.includes(minutes)) {
      setSelectedReminder(selectedReminder.filter(m => m !== minutes));
    } else {
      setSelectedReminder([...selectedReminder, minutes]);
    }
  };

  // Submit and create
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDateStr || !startTimeStr) return;

    const startObj = new Date(`${startDateStr}T${startTimeStr}`);
    const actualDuration = duration === 0 ? customDuration : duration;
    const endObj = addMinutes(startObj, actualDuration);

    const eventPayload: Omit<CalendarEvent, 'id'> = {
      title,
      description,
      start: Timestamp.fromDate(startObj),
      end: Timestamp.fromDate(endObj),
      allDay: false,
      location: location || undefined,
      attendees: [
        {
          userId: user?.uid,
          email: user?.email || 'me@enclave.local',
          name: user?.displayName || 'Me',
          status: 'accepted'
        },
        ...invitedAttendees
      ],
      reminders: selectedReminder,
      calendarId: selectedCalendarId,
      createdFromChat: chatId || undefined,
      recurrence: isRecurring ? {
        frequency: recurrenceFreq,
        interval: recurrenceInterval
      } : undefined
    };

    try {
      await createEvent(eventPayload);
      onSuccess?.(eventPayload);
      onClose();
    } catch (err) {
      console.error('Error creating event:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <Calendar className="text-amber-500 animate-pulse" size={20} />
            <h3 className="text-sm font-mono font-bold tracking-widest text-white uppercase">Schedule Operational Block</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4.5 text-left">
          {/* Title input */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider">Event Title</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design review session..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 transition"
            />
          </div>

          {/* Description input */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider">Event Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain target coordination guidelines..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 min-h-[60px] max-h-[100px] resize-none transition"
            />
          </div>

          {/* Date Picker + Time slots Availability Overlay */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider">Operational Date</label>
              <div className="relative">
                <input 
                  type="date" 
                  required
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 outline-none rounded-xl px-4 py-2 text-xs text-white cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider">Start Time</label>
              <input 
                type="time" 
                required
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 outline-none rounded-xl px-4 py-2 text-xs text-white cursor-pointer"
              />
            </div>
          </div>

          {/* Durations */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider">Duration Blocks</label>
            <div className="flex gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase rounded-xl border transition ${duration === d.value ? 'bg-amber-500 border-amber-500 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {duration === 0 && (
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="number" 
                  min="5" 
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none w-20 text-center"
                />
                <span className="text-[10px] font-mono text-slate-400 uppercase">Minutes</span>
              </div>
            )}
          </div>

          {/* Overlap alert */}
          {conflictWarning && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-2xl flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider animate-pulse">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{conflictWarning}</span>
            </div>
          )}

          {/* Location / Meeting Link */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider">Location / Meeting URL</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setVideoLink(e.target.value);
                  }}
                  placeholder="Physical address or video call room link..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 outline-none rounded-xl pl-8 pr-4 py-2.5 text-xs text-white placeholder-slate-500 transition"
                />
                <MapPin size={12} className="absolute left-3 top-3.5 text-slate-500" />
              </div>
              <button
                type="button"
                onClick={handleAutoGenerateVideo}
                className="px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center gap-1.5 text-slate-300 hover:text-white transition text-[10px] font-mono uppercase"
              >
                <Video size={12} className="text-amber-500 shrink-0" /> Meet URL
              </button>
            </div>
          </div>

          {/* Attendees invitations */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider">Invite Attendees</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="email" 
                  value={attendeesInput}
                  onChange={(e) => setAttendeesInput(e.target.value)}
                  placeholder="Enter email to invite..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 outline-none rounded-xl pl-8 pr-4 py-2.5 text-xs text-white placeholder-slate-500 transition"
                />
                <Users size={12} className="absolute left-3 top-3.5 text-slate-500" />
              </div>
              <button
                type="button"
                onClick={handleAddInvitee}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 text-[10px] font-mono uppercase transition font-bold"
              >
                Invite
              </button>
            </div>

            {invitedAttendees.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 bg-slate-950/40 p-2 border border-slate-850 rounded-xl">
                {invitedAttendees.map((att) => (
                  <div key={att.email} className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-750 text-[9px] font-mono rounded flex items-center gap-1.5 uppercase font-bold">
                    <span>{att.name || att.email.split('@')[0]}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveInvitee(att.email)}
                      className="text-slate-500 hover:text-red-400 text-[11px]"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reminders & Target Calendar Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider">Select Calendar</label>
              <select
                value={selectedCalendarId}
                onChange={(e) => setSelectedCalendarId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 outline-none rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
              >
                <option value="primary">Local Primary Calendar</option>
                {accounts.filter(a => a.isActive).map(a => (
                  <option key={a.id} value={a.id}>{a.provider.toUpperCase()} ({a.email})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider">Alert Reminders</label>
              <div className="flex flex-wrap gap-1">
                {REMINDERS.slice(0, 3).map(rem => {
                  const selected = selectedReminder.includes(rem.value);
                  return (
                    <button
                      key={rem.value}
                      type="button"
                      onClick={() => handleToggleReminder(rem.value)}
                      className={`px-2 py-1 text-[8px] font-mono font-black uppercase rounded-lg border transition ${selected ? 'bg-amber-500 border-amber-500 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-750'}`}
                    >
                      {rem.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recurrence Rule Builder toggle */}
          <div className="space-y-2 pt-2 border-t border-slate-850">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <Repeat size={12} className="text-amber-500 shrink-0" />
                <span>Repeat Event Block</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-slate-950"></div>
              </label>
            </div>

            {isRecurring && (
              <div className="flex gap-2 bg-slate-950/40 p-2.5 border border-slate-850 rounded-xl">
                <div className="flex-1 space-y-1">
                  <label className="block text-[8px] font-mono text-slate-500 uppercase">Frequency</label>
                  <select
                    value={recurrenceFreq}
                    onChange={(e) => setRecurrenceFreq(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[10px] text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="w-20 space-y-1">
                  <label className="block text-[8px] font-mono text-slate-500 uppercase">Every</label>
                  <div className="flex items-center gap-1">
                    <input 
                      type="number" 
                      min="1" 
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-1 text-[10px] text-white text-center w-10"
                    />
                    <span className="text-[9px] text-slate-400 font-mono">X</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions footer */}
          <div className="flex gap-2 justify-end pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 rounded-2xl text-[10px] font-mono uppercase font-bold transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl text-[10px] font-mono uppercase font-black transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Check size={12} strokeWidth={3} /> Book Block
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
