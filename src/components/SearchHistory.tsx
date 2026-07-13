import React from 'react';
import { Clock, Trash2, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { HistoryItem } from '../hooks/useSearchHistory';

interface SearchHistoryProps {
  history: HistoryItem[];
  onSelect: (query: string) => void;
  onClear: () => void;
}

export function SearchHistory({ history, onSelect, onClear }: SearchHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-6" id="search-history-container">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3">
        <h3 className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2">
          <Clock size={12} className="text-zinc-500" />
          Recent Inquiries
        </h3>
        <button
          id="clear-history-btn"
          onClick={onClear}
          className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-amber-500 flex items-center gap-1 transition-all"
          title="Clear search history"
        >
          <Trash2 size={11} />
          Purge Log
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {history.map((item, index) => (
          <motion.button
            key={item.id}
            id={`history-item-${item.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, ease: 'easeOut' }}
            onClick={() => onSelect(item.query)}
            className="group flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/30 hover:bg-zinc-900 rounded-full text-xs text-zinc-400 hover:text-amber-500 transition-all duration-300"
          >
            {/* Amber dot representing fresh result tracking */}
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 group-hover:scale-125 transition-transform" />
            <span className="max-w-[180px] truncate">{item.query}</span>
            <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-all duration-300" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default SearchHistory;
