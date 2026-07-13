import React from 'react';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';
import { DisappearingTimer } from '../hooks/useDisappearingMessages';

interface DisappearingBannerProps {
  timer: DisappearingTimer;
  onConfigure: () => void;
}

export const DisappearingBanner: React.FC<DisappearingBannerProps> = ({ timer, onConfigure }) => {
  if (timer === 0) return null;

  const getTimerLabel = (t: DisappearingTimer) => {
    switch (t) {
      case 5: return '5 seconds';
      case 60: return '1 minute';
      case 3600: return '1 hour';
      case 86400: return '24 hours';
      case 604800: return '7 days';
      case 7776000: return '90 days';
      default: return `${t} seconds`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 px-4 mx-4 my-2 text-amber-400 text-xs shadow-md shadow-amber-500/5 select-none"
    >
      <div className="flex items-center gap-2.5">
        <Clock size={14} className="animate-pulse text-amber-500 shrink-0" />
        <span className="font-medium text-[11px] sm:text-xs">
          Disappearing messages are <strong className="font-bold text-amber-300">Enabled</strong>. New messages will automatically expire after <strong className="font-bold text-amber-300">{getTimerLabel(timer)}</strong>.
        </span>
      </div>
      <button
        onClick={onConfigure}
        className="shrink-0 text-[10px] font-mono uppercase font-black bg-amber-500 hover:bg-amber-600 text-zinc-950 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer border-none"
      >
        Adjust
      </button>
    </motion.div>
  );
};
