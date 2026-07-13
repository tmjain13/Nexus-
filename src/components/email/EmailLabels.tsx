import React from 'react';
import { Tag, Star, Inbox, Archive, Send, Sparkles } from 'lucide-react';

interface EmailLabelsProps {
  activeLabel: string;
  onSelectLabel: (label: string) => void;
  counts?: Record<string, number>;
}

export const EmailLabels: React.FC<EmailLabelsProps> = ({
  activeLabel,
  onSelectLabel,
  counts = {}
}) => {
  const defaultLabels = [
    { id: 'Inbox', label: 'Inbox', icon: <Inbox className="w-3.5 h-3.5" /> },
    { id: 'Starred', label: 'Starred', icon: <Star className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'Sent', label: 'Sent', icon: <Send className="w-3.5 h-3.5" /> },
    { id: 'Archive', label: 'Archive', icon: <Archive className="w-3.5 h-3.5" /> },
    { id: 'Work', label: 'Work', icon: <Tag className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'Travel', label: 'Travel', icon: <Tag className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'Newsletters', label: 'Newsletters', icon: <Tag className="w-3.5 h-3.5 text-purple-400" /> },
  ];

  return (
    <div className="flex flex-wrap gap-1.5 py-1.5 border-t border-b border-slate-900/60" id="email-labels-panel">
      {defaultLabels.map((lbl) => {
        const isActive = activeLabel === lbl.id;
        const count = counts[lbl.id];

        return (
          <button
            key={lbl.id}
            onClick={() => onSelectLabel(lbl.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition flex items-center gap-1.5 border ${
              isActive
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/25 shadow-sm shadow-amber-500/5'
                : 'bg-slate-950 text-slate-400 hover:text-white border-slate-900 hover:border-slate-850'
            }`}
          >
            {lbl.icon}
            <span>{lbl.label}</span>
            {count !== undefined && count > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${isActive ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
