import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Smile } from 'lucide-react';
import { motion } from 'motion/react';
import AIVoiceMode from './AIVoiceMode';

interface AIAssistantInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  lastAIResponse?: string;
}

export function AIAssistantInput({ onSend, isLoading, lastAIResponse }: AIAssistantInputProps) {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    onSend(inputText.trim());
    setInputText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleVoiceTranscript = (text: string) => {
    if (text.trim()) {
      onSend(text.trim());
    }
  };

  return (
    <div className="p-4 border-t border-zinc-900 bg-zinc-950 flex flex-col gap-3 shrink-0" id="ai-assistant-input-container">
      <div className="flex items-center gap-3 w-full">
        {/* Main Text Input Box */}
        <div className="flex-1 bg-zinc-900 border border-zinc-800 focus-within:border-amber-500/30 rounded-xl px-3 py-1.5 flex items-center gap-2.5 transition-all">
          <Sparkles size={16} className="text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Query your database, emails, tasks..."
            className="flex-1 bg-transparent text-zinc-100 text-xs font-semibold focus:outline-none placeholder-zinc-500 py-1.5 h-full"
          />
        </div>

        {/* Dynamic Voice Module (Web Speech API) */}
        <AIVoiceMode
          onTranscriptComplete={handleVoiceTranscript}
          lastAIResponse={lastAIResponse}
          isAiResponding={isLoading}
        />

        {/* Send Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={!inputText.trim() || isLoading}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
            inputText.trim() && !isLoading
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/15'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </motion.button>
      </div>
    </div>
  );
}

export default AIAssistantInput;
