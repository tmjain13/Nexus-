import React from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, Mail, FileText, Calendar, Wallet, 
  Briefcase, Image as ImageIcon, Link as LinkIcon, Paperclip, Clock, Filter 
} from 'lucide-react';
import { SearchFilter } from '../hooks/useUniversalSearch';

interface SearchFiltersProps {
  activeFilters: SearchFilter[];
  onChange: (filters: SearchFilter[]) => void;
}

interface FilterOption {
  label: string;
  type: 'source' | 'sender' | 'date' | 'type';
  value: string;
  icon: React.ComponentType<any>;
}

const FILTER_OPTIONS: FilterOption[] = [
  // Sources
  { label: 'Chats', type: 'source', value: 'chat', icon: MessageSquare },
  { label: 'Emails', type: 'source', value: 'email', icon: Mail },
  { label: 'Documents', type: 'source', value: 'document', icon: FileText },
  { label: 'Calendar', type: 'source', value: 'calendar', icon: Calendar },
  { label: 'Wallet (Vault)', type: 'source', value: 'wallet', icon: Wallet },
  { label: 'Workspace', type: 'source', value: 'workspace', icon: Briefcase },

  // Types
  { label: 'Images', type: 'type', value: 'image', icon: ImageIcon },
  { label: 'Files', type: 'type', value: 'file', icon: Paperclip },
  { label: 'Links', type: 'type', value: 'link', icon: LinkIcon },

  // Dates
  { label: 'Last Week', type: 'date', value: 'last week', icon: Clock },
  { label: 'Last Month', type: 'date', value: 'last month', icon: Clock },
];

export function SearchFilters({ activeFilters, onChange }: SearchFiltersProps) {
  const toggleFilter = (option: FilterOption) => {
    const exists = activeFilters.some(
      (f) => f.type === option.type && f.value === option.value
    );

    if (exists) {
      // Remove filter
      onChange(
        activeFilters.filter(
          (f) => !(f.type === option.type && f.value === option.value)
        )
      );
    } else {
      // Add filter
      onChange([...activeFilters, { type: option.type, value: option.value }]);
    }
  };

  const clearAllFilters = () => {
    onChange([]);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-4" id="search-filters-container">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
          <Filter size={11} className="text-amber-500/80" />
          Filter Parameters
        </span>
        {activeFilters.length > 0 && (
          <button
            id="clear-filters-btn"
            onClick={clearAllFilters}
            className="text-[9px] font-mono uppercase tracking-widest text-amber-500 hover:text-amber-400 font-bold transition-colors"
          >
            Clear Filters ({activeFilters.length})
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
        {FILTER_OPTIONS.map((option) => {
          const isActive = activeFilters.some(
            (f) => f.type === option.type && f.value === option.value
          );
          const Icon = option.icon;

          return (
            <motion.button
              key={`${option.type}-${option.value}`}
              id={`filter-chip-${option.type}-${option.value}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleFilter(option)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 border ${
                isActive
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-md shadow-amber-500/5'
                  : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <Icon size={12} className={isActive ? 'text-amber-500' : 'text-zinc-500'} />
              <span>{option.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default SearchFilters;
