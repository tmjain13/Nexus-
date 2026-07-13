import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface AISummaryProps {
  summary: string;
  intent?: string;
}

export function AISummary({ summary, intent }: AISummaryProps) {
  if (!summary) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full max-w-3xl mx-auto mb-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 md:p-5 relative overflow-hidden"
      id="ai-search-summary-card"
    >
      {/* Decorative accent background glows */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex gap-3 md:gap-4 relative z-10">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
          <Sparkles size={16} className="animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold tracking-wider text-amber-500 uppercase">
              Nexus Intelligence Briefing
            </span>
            {intent && (
              <span className="text-[9px] font-mono px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-full">
                {intent}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed font-sans font-medium">
            {summary}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default AISummary;
