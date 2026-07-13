import React, { useState, useRef, useEffect } from 'react';
import { Search, Mic, MicOff, SlidersHorizontal, Grid, List, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatListView, SortMode } from '../hooks/useChatListLayout';

interface FloatingSearchProps {
  value: string;
  onChange: (val: string) => void;
  layout: ChatListView;
  onChangeLayout: (layout: ChatListView) => void;
  sortMode: SortMode;
  onChangeSortMode: (mode: SortMode) => void;
}

export const FloatingSearch: React.FC<FloatingSearchProps> = ({
  value,
  onChange,
  layout,
  onChangeLayout,
  sortMode,
  onChangeSortMode,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Web Speech API Integration
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("🎙️ Speech recognition is not supported in this browser. Please try Chrome or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onChange(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  return (
    <div id="nexus_search_container" className="px-4 py-2 w-full select-none relative">
      <motion.div
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ duration: 0.2 }}
        className={`flex items-center gap-2 px-3.5 py-2.5 bg-bg-elevated/50 backdrop-blur-md rounded-[24px] border transition-all cursor-pointer ${
          isFocused 
            ? 'border-accent/30 shadow-accent-glow' 
            : 'border-border-subtle hover:border-accent/20'
        }`}
        onClick={() => window.dispatchEvent(new CustomEvent('open-universal-search'))}
      >
        {/* Left: Search icon */}
        <Search size={16} className="text-text-secondary hover:text-accent transition-colors" />

        {/* Input Field */}
        <input
          type="text"
          placeholder="Ask Nexus anything... (Cmd+K)"
          value={value}
          readOnly
          className="flex-1 bg-transparent border-none text-xs text-text-primary placeholder-text-muted focus:outline-none cursor-pointer"
        />

        {/* Right Controls: Mic and Custom Grid/Sort Settings */}
        <div className="flex items-center gap-1.5">
          {/* Speech Mic */}
          <button
            onClick={startSpeechRecognition}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isListening 
                ? 'bg-rose-500/15 text-rose-500 animate-pulse' 
                : 'text-text-secondary hover:text-accent'
            }`}
            title="Voice Search"
          >
            {isListening ? <MicOff size={14} /> : <Mic size={14} />}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              showFilterDropdown 
                ? 'bg-accent/10 text-accent border border-accent/20' 
                : 'text-text-secondary hover:text-accent border border-transparent'
            }`}
            title="Display Matrix Filters"
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </motion.div>

      {/* Floating View/Sort Dropdown */}
      <AnimatePresence>
        {showFilterDropdown && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-4 top-13 z-50 w-52 p-3 bg-slate-900 border border-slate-800/80 rounded-2xl shadow-xl shadow-black/60 flex flex-col gap-3.5"
          >
            {/* Layout Options */}
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-2">
                Matrix View
              </p>
              <div className="grid grid-cols-3 gap-1 bg-slate-850 p-0.5 rounded-xl border border-slate-800/30">
                {(['list', 'compact', 'grid'] as const).map((mode) => {
                  const isActive = layout === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => {
                        onChangeLayout(mode);
                        setShowFilterDropdown(false);
                      }}
                      className={`py-1.5 rounded-lg capitalize text-[10px] font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-slate-800'
                      }`}
                    >
                      {mode === 'list' && <List size={11} />}
                      {mode === 'compact' && <Grid size={11} />}
                      {mode === 'grid' && <Layers size={11} />}
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort Mode */}
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-2">
                Priority Sorting
              </p>
              <div className="flex flex-col gap-1">
                {[
                  { mode: 'recent', label: 'Chronological' },
                  { mode: 'unread', label: 'Unread First' },
                  { mode: 'ai-priority', label: 'AI Priority' },
                ].map((item) => {
                  const isActive = sortMode === item.mode;
                  return (
                    <button
                      key={item.mode}
                      onClick={() => {
                        onChangeSortMode(item.mode as SortMode);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[10px] font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-slate-850/50'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingSearch;
