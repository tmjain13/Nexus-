import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { usePeaceMode } from '../hooks/usePeaceMode';

export function PeaceModeToggle() {
  const { isEnabled, enable, disable, loading } = usePeaceMode();

  const handleToggle = () => {
    if (isEnabled) {
      disable();
    } else {
      enable();
    }
  };

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center animate-spin">
        <div className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all duration-300 active:scale-95 ${
        isEnabled
          ? 'bg-amber-950/25 border-amber-500/40 text-amber-400 shadow-lg shadow-amber-950/20'
          : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
      }`}
      title={isEnabled ? "Peace Mode Enabled" : "Enable Peace Mode"}
    >
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={`w-5 h-5 transition-transform duration-500 ${isEnabled ? 'rotate-180 scale-110 text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}
        >
          {/* Custom Lotus SVG Path */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v18M12 3c-1.5 2-4 3.5-7 3.5m7-3.5c1.5 2 4 3.5 7 3.5M12 21c-1.5-2-4-3.5-7-3.5m7 3.5c1.5-2 4-3.5 7-3.5M4 10.5c2 1 4 .5 5-1.5m11 1.5c-2 1-4 .5-5-1.5"
          />
        </svg>
        {isEnabled && (
          <motion.div
            layoutId="lotus-glow"
            className="absolute inset-0 bg-amber-400/20 blur-sm rounded-full -z-10"
          />
        )}
      </div>

      <div className="flex flex-col items-start text-left">
        <span className="text-[11px] font-bold font-mono tracking-wider uppercase">
          {isEnabled ? 'Peace Active' : 'Peace Mode'}
        </span>
        <span className="text-[9px] font-mono text-zinc-500 group-hover:text-zinc-400">
          {isEnabled ? 'Only Starred notify' : 'Silence non-starred'}
        </span>
      </div>

      {/* Slide Switch */}
      <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-300 ml-1 ${isEnabled ? 'bg-amber-500' : 'bg-zinc-800'}`}>
        <motion.div
          layout
          className="w-3.5 h-3.5 rounded-full bg-white shadow-sm"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={{ x: isEnabled ? '100%' : '0%' }}
        />
      </div>
    </button>
  );
}

export default PeaceModeToggle;
