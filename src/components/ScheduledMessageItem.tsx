import React, { useState } from 'react';
import { Clock, Send, Trash2, Calendar, RefreshCw, Lock, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ScheduledMessage } from '../hooks/useScheduledMessages';

interface ScheduledMessageItemProps {
  key?: any;
  message: ScheduledMessage;
  chatName: string;
  onSendNow: (msg: ScheduledMessage) => void;
  onCancel: (id: string, chatId: string) => void;
  onEdit: (msg: ScheduledMessage) => void;
}

export function ScheduledMessageItem({ message, chatName, onSendNow, onCancel, onEdit }: ScheduledMessageItemProps) {
  const formattedScheduled = message.scheduledAt?.toDate 
    ? format(message.scheduledAt.toDate(), "eee, MMM d, h:mm a")
    : 'Pending';

  const isE2EE = message.isEncrypted;

  return (
    <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-2xl hover:bg-zinc-900/60 hover:border-zinc-800 transition-all space-y-3.5 group">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-zinc-400">
            <MessageSquare size={14} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wide font-mono">
              {chatName || 'Secure Channel'}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-zinc-500 font-mono">
              <Clock size={10} className="text-amber-500/80" />
              <span>Dispensing {formattedScheduled}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isE2EE && (
            <span className="p-1 text-[9px] bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/15 flex items-center gap-1 font-mono uppercase font-bold tracking-wider">
              <Lock size={8} /> E2EE
            </span>
          )}
          {message.recurrence && (
            <span className="p-1 text-[9px] bg-amber-500/10 text-amber-400 rounded border border-amber-500/15 flex items-center gap-1 font-mono uppercase font-bold tracking-wider">
              <RefreshCw size={8} className="animate-spin" style={{ animationDuration: '6s' }} /> {message.recurrence.frequency}
            </span>
          )}
        </div>
      </div>

      {/* Message body preview */}
      <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-900/60 text-xs text-zinc-300 font-sans leading-relaxed break-words">
        {isE2EE ? "[Encrypted Scheduled Payload]" : message.text}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-900/40">
        <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
          {message.timezone}
        </div>
        
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => onEdit(message)}
            className="p-1.5 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-[9px] font-mono uppercase font-bold tracking-wider transition-colors border-0"
            style={{ border: 'none' }}
          >
            Reschedule
          </button>
          
          <button 
            onClick={() => onSendNow(message)}
            className="p-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-black rounded-lg text-[9px] font-mono uppercase font-bold tracking-wider transition-all flex items-center gap-1 border-0"
            style={{ border: 'none' }}
          >
            <Send size={10} /> Send Now
          </button>

          <button 
            onClick={() => onCancel(message.id, message.chatId)}
            className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all border-0"
            style={{ border: 'none' }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
