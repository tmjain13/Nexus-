import React from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceSearchButtonProps {
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function VoiceSearchButton({ isListening, onClick, disabled }: VoiceSearchButtonProps) {
  return (
    <div className="relative flex items-center justify-center">
      {isListening && (
        <div className="absolute flex items-center justify-center gap-1.5 pointer-events-none">
          {/* Animated Waveform */}
          {[1, 2, 3, 4, 5].map((index) => (
            <motion.div
              key={index}
              className="w-1 bg-amber-500 rounded-full"
              initial={{ height: 8 }}
              animate={{
                height: [8, index % 2 === 0 ? 28 : 20, 8],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: index * 0.1,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      <motion.button
        id="voice-search-mic-btn"
        onClick={onClick}
        disabled={disabled}
        className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 relative z-10 ${
          isListening
            ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-lg shadow-amber-500/20'
            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-amber-500 hover:border-amber-500/50 hover:bg-zinc-850'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        whileTap={{ scale: 0.92 }}
        title={isListening ? "Stop listening" : "Start voice search"}
      >
        <motion.div
          animate={isListening ? { scale: [1, 1.15, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          {isListening ? <Mic size={20} className="animate-pulse" /> : <Mic size={20} />}
        </motion.div>
      </motion.button>
    </div>
  );
}

export default VoiceSearchButton;
