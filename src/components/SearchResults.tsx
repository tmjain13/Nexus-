import React from 'react';
import { SearchResult } from '../hooks/useUniversalSearch';
import { SearchResultCard } from './SearchResultCard';
import { AlertCircle, PlusCircle, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  totalCount: number;
  onCloseOverlay: () => void;
}

const CATEGORY_NAMES: { [key: string]: string } = {
  chat: "Chats & Transmissions",
  email: "Emails & Threads",
  document: "Scanned Documents",
  calendar: "Calendar & Schedule Events",
  wallet: "Secure Vault (Wallet)",
  contact: "Contacts & Profiles",
  channel: "Channels & Streams",
  workspace: "Workspace Board Tasks",
};

export function SearchResults({ results, isLoading, totalCount, onCloseOverlay }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 gap-3" id="search-loading-state">
        <div className="relative">
          {/* Pulsing golden loader */}
          <div className="w-12 h-12 rounded-full border border-amber-500/20 border-t-amber-500 animate-spin" />
          <div className="absolute inset-0 bg-amber-500/10 rounded-full animate-ping pointer-events-none scale-75" />
        </div>
        <p className="text-xs font-mono font-bold text-amber-500 tracking-wider uppercase animate-pulse">
          Searching across your Nexus...
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="w-full text-center py-16 max-w-md mx-auto" id="search-no-results">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto mb-4">
          <Search size={20} />
        </div>
        <h4 className="text-sm font-sans font-semibold text-zinc-300 mb-1">
          No records discovered
        </h4>
        <p className="text-xs text-zinc-500 leading-relaxed font-medium">
          I couldn't find anything. Try rephrasing or purging applied search parameters.
        </p>
      </div>
    );
  }

  // Group results by source category
  const groupedResults = results.reduce<{ [key: string]: SearchResult[] }>((acc, result) => {
    const category = result.source;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(result);
    return acc;
  }, {});

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 flex flex-col gap-6" id="search-results-list">
      {/* Heavy Results Indicator Banner */}
      {totalCount > 15 && (
        <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-3 flex items-center gap-2.5 text-zinc-400">
          <AlertCircle size={14} className="text-amber-500" />
          <span className="text-[10px] font-mono leading-none">
            Found {totalCount} items, displaying top {results.length}. Add filters to narrow down this query.
          </span>
        </div>
      )}

      {/* Render grouped category lists */}
      {Object.entries(groupedResults).map(([category, items], catIndex) => (
        <motion.div 
          key={category} 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: catIndex * 0.08, duration: 0.35 }}
          className="flex flex-col gap-2.5"
          id={`search-group-${category}`}
        >
          {/* Category Header */}
          <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-zinc-500 mt-2 mb-1 pl-1">
            {CATEGORY_NAMES[category] || category} ({items.length})
          </h3>

          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <SearchResultCard 
                key={item.id} 
                result={item} 
                onCloseOverlay={onCloseOverlay} 
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default SearchResults;
