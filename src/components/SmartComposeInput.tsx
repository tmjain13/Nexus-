import React, { useState, useEffect, useRef } from 'react';
import { useSmartCompose } from '../hooks/useSmartCompose';
import { GhostText } from './GhostText';
import { Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SmartComposeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend?: () => void;
  disabled?: boolean;
  placeholder?: string;
  chatId: string;
  isGroup?: boolean;
}

export function SmartComposeInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Type message...",
  chatId,
  isGroup = false,
}: SmartComposeInputProps) {
  const { suggestion, accept, dismiss, isLoading } = useSmartCompose(chatId, value, isGroup);
  
  const [showHint, setShowHint] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Responsive device detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Display 'Tab to accept' hint for 2 seconds when suggestion appears
  useEffect(() => {
    if (suggestion && !isMobile) {
      setShowHint(true);
      const timer = setTimeout(() => {
        setShowHint(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowHint(false);
    }
  }, [suggestion, isMobile]);

  const handleAccept = () => {
    if (!suggestion) return;
    const completed = accept();
    onChange(completed);
    
    // Suggestion accepted: flash amber briefly
    setIsFlashing(true);
    setTimeout(() => {
      setIsFlashing(false);
      // Put cursor back to the end of text
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestion) {
      if (e.key === 'Tab' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleAccept();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        dismiss();
      }
    } else if (e.key === 'Enter' && onSend && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative flex-1 flex flex-col min-w-0">
      {/* Mobile Suggestion Chip */}
      {isMobile && suggestion && (
        <div className="absolute -top-12 left-0 right-0 flex justify-center z-20">
          <button
            type="button"
            onClick={handleAccept}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 px-3.5 py-1.5 rounded-full text-[11px] font-mono font-black shadow-lg flex items-center gap-1 animate-bounce cursor-pointer"
          >
            <Plus size={12} /> Complete: "{suggestion}"
          </button>
        </div>
      )}

      {/* Input wrapper with flash effect */}
      <div 
        className={`relative flex-1 flex items-center transition-all duration-300 rounded-xl ${
          isFlashing 
            ? 'bg-amber-500/20 ring-2 ring-amber-500/40' 
            : 'bg-transparent'
        }`}
      >
        {/* Ghost suggestion overlay behind or on top of input */}
        <GhostText typedText={value} suggestion={suggestion} />

        {/* The interactive input */}
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-[14px] py-2 px-1 placeholder:text-zinc-400 font-medium dark:text-white z-10"
        />

        {/* Tiny sparkle indicator when AI is generating */}
        {isLoading && (
          <div className="absolute right-2 text-amber-500/40 animate-pulse">
            <Sparkles size={14} className="animate-spin duration-3000" />
          </div>
        )}
      </div>

      {/* Suggestion tip below input */}
      <AnimatePresence>
        {showHint && suggestion && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="absolute top-10 left-1 text-[10px] font-mono font-bold text-amber-500/60 flex items-center gap-1 select-none pointer-events-none"
          >
            <Sparkles size={10} /> Press [Tab] or [➔] to accept completion
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
