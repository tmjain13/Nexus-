import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, EyeOff, ShieldCheck, X } from 'lucide-react';
import { usePeaceMode } from '../hooks/usePeaceMode';

export function PeaceModeBanner() {
  const { isEnabled } = usePeaceMode();
  const [dismissed, setDismissed] = useState(false);

  if (!isEnabled || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full bg-gradient-to-r from-amber-950/40 via-zinc-950 to-amber-950/40 border-b border-amber-500/20 px-5 py-2.5 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 text-amber-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4 animate-pulse"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v18M12 3c-1.5 2-4 3.5-7 3.5m7-3.5c1.5 2 4 3.5 7 3.5M12 21c-1.5-2-4-3.5-7-3.5m7 3.5c1.5-2 4-3.5 7-3.5M4 10.5c2 1 4 .5 5-1.5m11 1.5c-2 1-4 .5-5-1.5"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold font-mono tracking-wider text-amber-400 uppercase flex items-center gap-1">
              Enclave Peace Mode Active <Sparkles size={10} className="animate-pulse" />
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              Notifications silenced from non-starred contacts. Focus preserved.
            </span>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-zinc-500 hover:text-zinc-300 rounded-full hover:bg-zinc-900 transition-colors"
        >
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export default PeaceModeBanner;
