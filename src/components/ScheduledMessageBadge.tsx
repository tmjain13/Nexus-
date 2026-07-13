import React from 'react';
import { Clock, X, Edit2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduledMessageBadgeProps {
  scheduledDate: Date | null;
  recurrence: { frequency: 'daily' | 'weekly' | 'monthly' } | null;
  onEdit: () => void;
  onCancel: () => void;
}

export function ScheduledMessageBadge({ scheduledDate, recurrence, onEdit, onCancel }: ScheduledMessageBadgeProps) {
  if (!scheduledDate) return null;

  const formattedTime = format(scheduledDate, "eee, h:mm a");

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-t border-b border-amber-500/15 text-xs text-amber-400 font-mono">
      <div className="flex items-center gap-2">
        <Clock size={12} className="text-amber-400 animate-pulse" />
        <span>Scheduled: <strong className="text-amber-300">{formattedTime}</strong></span>
        {recurrence && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-[10px] text-amber-400 border border-amber-500/10 font-bold uppercase tracking-wider">
            <RefreshCw size={8} /> {recurrence.frequency}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <button 
          onClick={onEdit}
          className="p-1 hover:text-white transition-colors flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-none border-0"
          style={{ border: 'none', background: 'none' }}
        >
          <Edit2 size={10} /> Edit Time
        </button>
        <span className="text-amber-500/30">|</span>
        <button 
          onClick={onCancel}
          className="p-1 hover:text-red-400 transition-colors flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-none border-0"
          style={{ border: 'none', background: 'none' }}
        >
          <X size={10} /> Cancel
        </button>
      </div>
    </div>
  );
}
