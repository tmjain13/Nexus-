import React, { useState } from 'react';
import { useCalendar, CalendarEvent } from '../hooks/useCalendar';
import { 
  X, 
  Trash2, 
  Edit2, 
  Calendar, 
  Clock, 
  MapPin, 
  Check, 
  HelpCircle, 
  AlertTriangle, 
  Archive, 
  Users,
  Repeat 
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface EventDetailsProps {
  event: CalendarEvent;
  onClose: () => void;
  onUpdate?: () => void;
}

export function EventDetails({ event, onClose, onUpdate }: EventDetailsProps) {
  const { deleteEvent, updateEvent } = useCalendar();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRecurrenceScopeModal, setShowRecurrenceScopeModal] = useState(false);

  // Form states
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [location, setLocation] = useState(event.location || '');

  const start = event.start.toDate();
  const end = event.end.toDate();
  const isPastEvent = start < new Date();

  const handleUpdate = async (scope: 'only_this' | 'all' = 'all') => {
    try {
      await updateEvent(event.id, {
        title,
        description,
        location: location || undefined
      });
      setIsEditing(false);
      onUpdate?.();
      onClose();
    } catch (e) {
      console.error('Failed to update event:', e);
    }
  };

  const handleSaveClick = () => {
    if (event.recurrence) {
      setShowRecurrenceScopeModal(true);
    } else {
      handleUpdate('all');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEvent(event.id);
      onClose();
    } catch (e) {
      console.error('Failed to delete event:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-amber-500" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300">
              {isEditing ? 'Adjust Block' : 'Operation Specs'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {!isEditing ? (
          <div className="space-y-4 text-left">
            {/* Past Event Grey-out Indicator */}
            {isPastEvent && (
              <div className="bg-slate-800/80 border border-slate-700/50 p-2.5 rounded-xl flex items-center gap-2 text-[9px] font-mono uppercase text-slate-400 font-bold">
                <Archive size={12} className="shrink-0 text-slate-500" />
                <span>Operational History Block (Archived & Read-Only)</span>
              </div>
            )}

            <div className={cn("space-y-2", isPastEvent && "opacity-60")}>
              <h3 className="text-sm font-black text-white">{event.title}</h3>
              {event.description && (
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{event.description}</p>
              )}
            </div>

            {/* Time / Location specifications */}
            <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-850 space-y-2 font-mono text-[10px] text-slate-300">
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-amber-500 shrink-0" />
                <span>{format(start, 'EEEE, MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 pl-5 opacity-80">
                <span>{format(start, 'h:mm a')} - {format(end, 'h:mm a')}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 border-t border-slate-850 pt-2 mt-2">
                  <MapPin size={12} className="text-amber-500 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
              {event.recurrence && (
                <div className="flex items-center gap-2 border-t border-slate-850 pt-2 mt-2">
                  <Repeat size={12} className="text-amber-500 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
                  <span className="capitalize">Repeats {event.recurrence.frequency} (Interval: {event.recurrence.interval}x)</span>
                </div>
              )}
            </div>

            {/* Attendees panel */}
            {event.attendees && event.attendees.length > 0 && (
              <div className="space-y-2">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-black flex items-center gap-1.5">
                  <Users size={11} /> Participants List ({event.attendees.length})
                </span>
                <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-1">
                  {event.attendees.map((att, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "p-2 bg-slate-950/40 border rounded-xl text-[9px] font-mono uppercase flex items-center justify-between font-bold",
                        att.status === 'accepted' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/[0.02]' :
                        att.status === 'declined' ? 'border-red-500/20 text-red-400 bg-red-500/[0.02]' :
                        'border-slate-800 text-slate-400'
                      )}
                    >
                      <span className="truncate max-w-[100px]">{att.name || att.email.split('@')[0]}</span>
                      <span className="text-[7px] font-black">{att.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-2 bg-slate-950 hover:bg-red-500/10 border border-slate-850 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-2xl text-[10px] font-mono uppercase font-bold transition flex items-center gap-1"
              >
                <Trash2 size={11} /> Cancel Event
              </button>
              
              {!isPastEvent && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl text-[10px] font-mono uppercase font-black transition flex items-center gap-1 shadow-md"
                >
                  <Edit2 size={11} /> Modify Specs
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            {/* Edit mode inputs */}
            <div className="space-y-1.5">
              <label className="block text-[8px] font-mono text-slate-400 uppercase">Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[8px] font-mono text-slate-400 uppercase">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white h-16 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[8px] font-mono text-slate-400 uppercase">Location</label>
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-2 bg-slate-950 border border-slate-850 text-slate-400 rounded-2xl text-[10px] font-mono uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClick}
                className="px-4 py-2 bg-amber-500 text-slate-950 rounded-2xl text-[10px] font-mono uppercase font-black transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation prompt */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-slate-950/95 rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-4 z-50">
            <AlertTriangle size={32} className="text-red-500 animate-bounce" />
            <div>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest">Confirm Deletion</h4>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[250px] leading-relaxed uppercase font-mono">
                Are you absolutely sure you want to cancel this event? This action is irreversible.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-1.5 bg-slate-900 text-slate-400 rounded-xl text-[9px] font-mono uppercase"
              >
                Abort
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 bg-red-500 text-slate-950 rounded-xl text-[9px] font-mono uppercase font-black"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        )}

        {/* Recurrence Scope Confirmation "This only or all?" */}
        {showRecurrenceScopeModal && (
          <div className="absolute inset-0 bg-slate-950/95 rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-4 z-50">
            <Repeat size={28} className="text-amber-500" />
            <div>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest">Adjust Recurring Rule</h4>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[240px] leading-relaxed uppercase font-mono">
                This event repeats. Would you like to modify only this specific occurrence or all future occurrences?
              </p>
            </div>
            <div className="flex flex-col w-full gap-1.5 max-w-[180px]">
              <button
                onClick={() => {
                  setShowRecurrenceScopeModal(false);
                  handleUpdate('only_this');
                }}
                className="py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-[9px] font-mono uppercase font-bold"
              >
                This occurrence only
              </button>
              <button
                onClick={() => {
                  setShowRecurrenceScopeModal(false);
                  handleUpdate('all');
                }}
                className="py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[9px] font-mono uppercase font-black"
              >
                All occurrences
              </button>
              <button
                onClick={() => setShowRecurrenceScopeModal(false)}
                className="py-1 text-[8px] font-mono text-slate-500 uppercase hover:text-slate-300 mt-1"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
