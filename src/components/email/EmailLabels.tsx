import React, { useState } from 'react';
import { Tag, Star, Inbox, Archive, Send, Plus, X } from 'lucide-react';

interface EmailLabelsProps {
  activeLabel: string;
  onSelectLabel: (label: string) => void;
  counts?: Record<string, number>;
  customLabels?: string[];
  onAddLabel?: (newLabel: string) => void;
  onRemoveLabel?: (label: string) => void;
}

export const EmailLabels: React.FC<EmailLabelsProps> = ({
  activeLabel,
  onSelectLabel,
  counts = {},
  customLabels = [],
  onAddLabel,
  onRemoveLabel,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newLabelText, setNewLabelText] = useState('');

  const defaultLabels = [
    { id: 'Inbox', label: 'Inbox', icon: <Inbox className="w-3.5 h-3.5" /> },
    { id: 'Starred', label: 'Starred', icon: <Star className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'Sent', label: 'Sent', icon: <Send className="w-3.5 h-3.5" /> },
    { id: 'Archive', label: 'Archive', icon: <Archive className="w-3.5 h-3.5" /> },
  ];

  const submitNewLabel = () => {
    const trimmed = newLabelText.trim();
    if (trimmed && onAddLabel) onAddLabel(trimmed);
    setNewLabelText('');
    setIsAdding(false);
  };

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

      {customLabels.map((label) => {
        const isActive = activeLabel === label;
        const count = counts[label];

        return (
          <div
            key={label}
            className={`group px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition flex items-center gap-1.5 border ${
              isActive
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/25 shadow-sm shadow-amber-500/5'
                : 'bg-slate-950 text-slate-400 hover:text-white border-slate-900 hover:border-slate-850'
            }`}
          >
            <button onClick={() => onSelectLabel(label)} className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span>{label}</span>
              {count !== undefined && count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${isActive ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'}`}>
                  {count}
                </span>
              )}
            </button>
            {onRemoveLabel && (
              <button
                onClick={() => onRemoveLabel(label)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400"
                aria-label={`Remove ${label} label`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      {onAddLabel && (
        isAdding ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={newLabelText}
              onChange={(e) => setNewLabelText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNewLabel();
                if (e.key === 'Escape') { setIsAdding(false); setNewLabelText(''); }
              }}
              onBlur={submitNewLabel}
              placeholder="Label name"
              className="px-2 py-1.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white w-24 outline-none focus:border-amber-500/50"
            />
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition flex items-center gap-1.5 border border-dashed border-slate-800 text-slate-500 hover:text-white hover:border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add label</span>
          </button>
        )
      )}
    </div>
  );
};
