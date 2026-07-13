import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useCalendar, CalendarEvent } from '../hooks/useCalendar';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Check, 
  X, 
  HelpCircle, 
  AlertTriangle, 
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { format, isSameDay, isWithinInterval } from 'date-fns';
import { cn } from '../lib/utils';

interface EventCardProps {
  messageId: string;
  chatId: string;
  eventInfo: any; // Raw JSON payload of event
  onRescheduleClick?: (event: any) => void;
}

export function EventCard({ messageId, chatId, eventInfo, onRescheduleClick }: EventCardProps) {
  const { user } = useAuth();
  const { events } = useCalendar();
  const [userStatus, setUserStatus] = useState<'pending' | 'accepted' | 'declined' | 'tentative'>('pending');
  const [conflict, setConflict] = useState<string | null>(null);

  const start = eventInfo.start?.toDate ? eventInfo.start.toDate() : new Date(eventInfo.start);
  const end = eventInfo.end?.toDate ? eventInfo.end.toDate() : new Date(eventInfo.end);

  // Parse attendees
  const attendees = eventInfo.attendees || [];

  // Check overlap with user's personal calendar events
  useEffect(() => {
    if (!events || !start) return;
    
    let overlapTitle: string | null = null;
    for (const evt of events) {
      if (evt.id === eventInfo.id) continue; // skip comparing to itself
      
      const evtStart = evt.start.toDate();
      const evtEnd = evt.end.toDate();

      // Overlap check
      if (
        (start >= evtStart && start < evtEnd) ||
        (end > evtStart && end <= evtEnd) ||
        (evtStart >= start && evtStart < end)
      ) {
        overlapTitle = evt.title;
        break;
      }
    }
    setConflict(overlapTitle);
  }, [events, start, end, eventInfo.id]);

  // Read current user RSVP status
  useEffect(() => {
    if (!user || !attendees) return;
    const found = attendees.find((a: any) => a.userId === user.uid || a.email === user.email);
    if (found) {
      setUserStatus(found.status);
    }
  }, [attendees, user]);

  const handleRSVP = async (status: 'accepted' | 'declined' | 'tentative') => {
    if (!user) return;

    try {
      // Build updated attendees list
      let updatedAttendees = [...attendees];
      const idx = updatedAttendees.findIndex((a: any) => a.userId === user.uid || a.email === user.email);
      
      if (idx >= 0) {
        updatedAttendees[idx] = {
          ...updatedAttendees[idx],
          status
        };
      } else {
        updatedAttendees.push({
          userId: user.uid,
          email: user.email || 'user@example.com',
          name: user.displayName || 'Me',
          status
        });
      }

      // Update message in Firestore
      const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
      await updateDoc(msgRef, {
        'eventInfo.attendees': updatedAttendees
      });

      setUserStatus(status);
    } catch (e) {
      console.error('Error updating RSVP in chat:', e);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'declined': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'tentative': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div 
      className="bg-slate-800 border-l-4 rounded-xl p-4 text-left max-w-sm shadow-xl space-y-3.5 transition hover:shadow-2xl"
      style={{ borderLeftColor: eventInfo.color || '#f59e0b' }}
    >
      {/* Event Header */}
      <div>
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-sm font-bold text-white leading-snug">{eventInfo.title}</h4>
          <span className="text-[7px] font-mono uppercase bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-amber-500 font-extrabold tracking-widest shrink-0">
            {eventInfo.allDay ? 'All Day' : 'Meeting'}
          </span>
        </div>
        {eventInfo.description && (
          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {eventInfo.description}
          </p>
        )}
      </div>

      {/* Date-time Slot Details */}
      <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
        <div className="flex items-center gap-2 text-[10px] text-slate-300 font-medium">
          <Calendar size={11} className="text-amber-500 shrink-0" />
          <span>{format(start, 'EEEE, MMMM d, yyyy')}</span>
        </div>
        {!eventInfo.allDay && (
          <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono">
            <Clock size={11} className="text-amber-500 shrink-0" />
            <span>{format(start, 'h:mm a')} - {format(end, 'h:mm a')}</span>
          </div>
        )}
        {eventInfo.location && (
          <div className="flex items-center gap-2 text-[10px] text-slate-300 truncate">
            <MapPin size={11} className="text-amber-500 shrink-0" />
            <span className="truncate">{eventInfo.location}</span>
            {eventInfo.location.startsWith('http') && (
              <a href={eventInfo.location} target="_blank" rel="noopener noreferrer" className="p-0.5 hover:bg-slate-800 rounded">
                <ExternalLink size={9} className="text-amber-400" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Conflict Alert Banner */}
      {conflict && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2.5 rounded-xl flex items-start gap-2 text-[9px] font-mono uppercase tracking-wide animate-pulse">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold">Schedule Conflict Warning</p>
            <p className="opacity-80 mt-0.5 text-[8px] leading-relaxed">Overlaps with: "{conflict}"</p>
          </div>
        </div>
      )}

      {/* Attendees list avatars */}
      {attendees.length > 0 && (
        <div className="space-y-1.5 pt-1.5 border-t border-slate-700/50">
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Attendees Status Matrix</span>
          <div className="flex flex-wrap gap-1.5">
            {attendees.map((att: any, idx: number) => (
              <div 
                key={idx} 
                className={cn(
                  "px-2 py-0.5 rounded-md border text-[9px] font-mono flex items-center gap-1 uppercase font-bold",
                  getStatusColor(att.status)
                )}
                title={`${att.name || att.email} (${att.status})`}
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-current" />
                <span className="max-w-[70px] truncate">{att.name || att.email.split('@')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RSVP Action Toggles */}
      <div className="flex gap-1.5 pt-2 border-t border-slate-700/50">
        <button
          onClick={() => handleRSVP('accepted')}
          className={cn(
            "flex-1 py-1.5 rounded-xl text-[9px] font-mono font-bold uppercase tracking-wider border transition flex items-center justify-center gap-1 cursor-pointer",
            userStatus === 'accepted'
              ? "bg-emerald-500 text-slate-950 border-emerald-500 font-extrabold"
              : "bg-slate-900 border-slate-750 text-slate-300 hover:border-emerald-500/55 hover:text-emerald-400"
          )}
        >
          <Check size={10} strokeWidth={3} /> Yes
        </button>
        <button
          onClick={() => handleRSVP('tentative')}
          className={cn(
            "flex-1 py-1.5 rounded-xl text-[9px] font-mono font-bold uppercase tracking-wider border transition flex items-center justify-center gap-1 cursor-pointer",
            userStatus === 'tentative'
              ? "bg-amber-500 text-slate-950 border-amber-500 font-extrabold"
              : "bg-slate-900 border-slate-750 text-slate-300 hover:border-amber-500/55 hover:text-amber-400"
          )}
        >
          <HelpCircle size={10} strokeWidth={2.5} /> Maybe
        </button>
        <button
          onClick={() => handleRSVP('declined')}
          className={cn(
            "flex-1 py-1.5 rounded-xl text-[9px] font-mono font-bold uppercase tracking-wider border transition flex items-center justify-center gap-1 cursor-pointer",
            userStatus === 'declined'
              ? "bg-red-500 text-slate-950 border-red-500 font-extrabold"
              : "bg-slate-900 border-slate-750 text-slate-300 hover:border-red-500/55 hover:text-red-400"
          )}
        >
          <X size={10} strokeWidth={3} /> No
        </button>

        {onRescheduleClick && (
          <button
            onClick={() => onRescheduleClick(eventInfo)}
            className="px-2 py-1.5 bg-slate-900 border border-slate-750 text-slate-400 hover:text-white rounded-xl text-[9px] font-mono uppercase tracking-wider transition"
            title="Propose rescheduled slot"
          >
            Move
          </button>
        )}
      </div>
    </div>
  );
}
