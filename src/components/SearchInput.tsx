import React, { useState, useEffect, useRef } from 'react';
import { Search, X, EyeOff, Eye } from 'lucide-react';
import { VoiceSearchButton } from './VoiceSearchButton';
import { useVoiceSearch } from '../hooks/useVoiceSearch';

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: (val: string) => void;
  incognito: boolean;
  onToggleIncognito: () => void;
}

const PLACEHOLDERS = [
  "Ask Nexus anything...",
  "Find my flight to Tokyo",
  "What did Sarah say about the budget?",
  "When is my next meeting?",
  "Show me receipts from last month",
  "Find the password John sent me",
  "Photos from the party",
  "Unread emails from my boss"
];

export function SearchInput({
  value,
  onChange,
  onSearch,
  incognito,
  onToggleIncognito,
}: SearchInputProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { isListening, transcript, startListening, stopListening } = useVoiceSearch();

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  }, []);

  // Update input text with voice transcripts
  useEffect(() => {
    if (transcript) {
      onChange(transcript);
      onSearch(transcript);
    }
  }, [transcript]);

  // Rotate through placeholders beautifully
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Typewriter style transition for placeholders
  useEffect(() => {
    const targetPlaceholder = PLACEHOLDERS[placeholderIndex];
    let currentText = "";
    let i = 0;
    let timer: any;

    const type = () => {
      if (i < targetPlaceholder.length) {
        currentText += targetPlaceholder.charAt(i);
        setAnimatedPlaceholder(currentText);
        i++;
        timer = setTimeout(type, 35);
      }
    };

    type();
    return () => clearTimeout(timer);
  }, [placeholderIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(value);
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center" id="search-input-wrapper">
      <div className="w-full flex items-center gap-4 relative border-b border-zinc-800 focus-within:border-amber-500/50 pb-3 transition-colors duration-300">
        <Search size={22} className="text-zinc-500 shrink-0" />
        
        <input
          ref={inputRef}
          id="nexus-universal-search-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 200))} // truncate long queries at 200 chars
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-xl md:text-2xl font-sans font-medium text-zinc-100 placeholder-zinc-600 focus:outline-none tracking-tight"
          placeholder={animatedPlaceholder}
        />

        {value && (
          <button
            id="clear-search-query-btn"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Clear search"
          >
            <X size={20} />
          </button>
        )}

        {/* Voice Search Mic Button */}
        <VoiceSearchButton isListening={isListening} onClick={toggleVoice} />
      </div>

      {/* Incognito & Privacy Panel */}
      <div className="w-full flex justify-between items-center mt-3 px-1 text-[11px] font-mono text-zinc-500">
        <span>Press <kbd className="bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded text-[10px]">Enter</kbd> to search</span>
        
        <button
          id="toggle-incognito-btn"
          onClick={onToggleIncognito}
          className={`flex items-center gap-1.5 transition-all duration-300 py-1 px-2.5 rounded-lg border ${
            incognito
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
              : 'border-transparent hover:text-zinc-300'
          }`}
          title={incognito ? "Incognito Search is Active (No History Saved)" : "Enable Incognito Mode"}
        >
          {incognito ? <EyeOff size={11} /> : <Eye size={11} />}
          <span>{incognito ? "Incognito Active" : "Incognito Mode"}</span>
        </button>
      </div>
    </div>
  );
}

export default SearchInput;
