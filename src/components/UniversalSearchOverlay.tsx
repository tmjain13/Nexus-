import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, WifiOff } from 'lucide-react';
import { useUniversalSearch, SearchFilter } from '../hooks/useUniversalSearch';
import { useSearchHistory } from '../hooks/useSearchHistory';
import SearchInput from './SearchInput';
import SearchFilters from './SearchFilters';
import AISummary from './AISummary';
import SearchHistory from './SearchHistory';
import SearchResults from './SearchResults';

interface UniversalSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UniversalSearchOverlay({ isOpen, onClose }: UniversalSearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([]);
  const [incognito, setIncognito] = useState(false);

  const { search, results, isLoading, intent, summary, isOfflineMode } = useUniversalSearch();
  const { history, saveSearch, clearHistory, reRunSearch } = useSearchHistory();

  // Handle global Escape key press to close overlay
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Execute Search
  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    // Save to search history if not in incognito mode
    if (!incognito) {
      saveSearch(searchQuery);
    }
    
    search(searchQuery, activeFilters);
  };

  // Re-run an item from history
  const handleSelectHistoryItem = (historyQuery: string) => {
    setQuery(historyQuery);
    handleSearch(historyQuery);
  };

  // Trigger search whenever filters are changed and there is active query text
  useEffect(() => {
    if (query.trim()) {
      search(query, activeFilters);
    }
  }, [activeFilters]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="nexus-universal-search-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-zinc-950/95 backdrop-blur-xl z-50 overflow-y-auto flex flex-col no-scrollbar"
        onClick={(e) => {
          // Close if they clicked the exact backdrop background
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Navigation / Control Row */}
        <div className="w-full max-w-4xl mx-auto flex justify-between items-center px-4 py-5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-widest text-zinc-400 uppercase">
              Nexus Omnipresent Search Index
            </span>
          </div>

          <button
            id="close-search-overlay-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 text-zinc-400 hover:text-amber-500 flex items-center justify-center transition-all"
            title="Close Search (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Core Search Workspace */}
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 pb-16 flex flex-col">
          {/* Main search input with microphone */}
          <SearchInput
            value={query}
            onChange={setQuery}
            onSearch={handleSearch}
            incognito={incognito}
            onToggleIncognito={() => setIncognito(!incognito)}
          />

          {/* Quick interactive filter chips */}
          <SearchFilters
            activeFilters={activeFilters}
            onChange={setActiveFilters}
          />

          {/* Offline indicator banner */}
          {isOfflineMode && (
            <div className="w-full max-w-3xl mx-auto mt-4 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3 text-amber-500">
              <WifiOff size={16} />
              <p className="text-xs font-mono font-medium">
                Offline Mode: Showing cached files and localStorage items only.
              </p>
            </div>
          )}

          {/* Search History (show only when search box is empty and history exists) */}
          {!query && (
            <SearchHistory
              history={history}
              onSelect={handleSelectHistoryItem}
              onClear={clearHistory}
            />
          )}

          {/* Search results or active query summary */}
          {query && (
            <div className="mt-8 flex-1 flex flex-col">
              {/* Intelligent AI executive summary */}
              {!isLoading && results.length > 0 && (
                <AISummary summary={summary} intent={intent} />
              )}

              {/* Categorized grouped list cards */}
              <SearchResults
                results={results}
                isLoading={isLoading}
                totalCount={results.length}
                onCloseOverlay={onClose}
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default UniversalSearchOverlay;
