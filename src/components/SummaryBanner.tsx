import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pin, ChevronDown, ChevronUp, Trash2, Calendar, Smile, Meh, Frown } from 'lucide-react';
import { PinnedSummary } from '../hooks/useChatSummary';
import { formatDistanceToNow } from 'date-fns';

interface SummaryBannerProps {
  pinnedSummary: PinnedSummary | null;
  onUnpin: () => void;
  onViewFull: () => void;
}

export default function SummaryBanner({
  pinnedSummary,
  onUnpin,
  onViewFull
}: SummaryBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!pinnedSummary) return null;

  const getSentimentDetails = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return { icon: <Smile className="w-3.5 h-3.5" />, color: 'text-green-400' };
      case 'negative':
        return { icon: <Frown className="w-3.5 h-3.5" />, color: 'text-red-400' };
      case 'neutral':
      default:
        return { icon: <Meh className="w-3.5 h-3.5" />, color: 'text-zinc-400' };
    }
  };

  const sentiment = getSentimentDetails(pinnedSummary.sentiment);

  // Parse pinned date safely
  const getPinnedTimeText = () => {
    if (!pinnedSummary.pinnedAt) return '';
    try {
      const date = pinnedSummary.pinnedAt.toDate ? pinnedSummary.pinnedAt.toDate() : new Date(pinnedSummary.pinnedAt);
      return `Pinned ${formatDistanceToNow(date, { addSuffix: true })}`;
    } catch {
      return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="border-l-4 border-amber-500 bg-amber-500/10 rounded-lg p-3 mx-4 my-2 shadow-sm border border-slate-800/60"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Title and Pin Icon */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <Pin className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
          <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider font-mono">📌 Pinned AI Summary</span>
          <span className="text-[10px] text-zinc-500 hidden sm:inline">{getPinnedTimeText()}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onViewFull}
            className="px-2 py-0.5 text-[10px] font-semibold text-amber-400 hover:text-white hover:bg-amber-500/20 rounded border border-amber-500/20 transition-all font-mono"
          >
            Full View
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-slate-850/60 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onUnpin}
            className="p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-slate-850/60 transition-colors"
            title="Unpin Summary"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded view */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-3 pt-3 border-t border-slate-800/40 space-y-3"
          >
            <p className="text-xs text-zinc-200 leading-relaxed font-medium">
              {pinnedSummary.tldr}
            </p>

            {/* Quick Chips Info */}
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono">
              {/* Sentiment badge */}
              {sentiment && (
                <div className="flex items-center gap-1 text-zinc-400 bg-slate-900/40 px-2 py-0.5 rounded border border-slate-800/40">
                  <span className="text-zinc-500 uppercase">Tone:</span>
                  <span className={`flex items-center gap-0.5 font-semibold ${sentiment.color}`}>
                    {sentiment.icon}
                    {pinnedSummary.sentiment}
                  </span>
                </div>
              )}

              {/* Urgency Badge */}
              <div className="flex items-center gap-1.5 text-zinc-400 bg-slate-900/40 px-2 py-0.5 rounded border border-slate-800/40">
                <span className="text-zinc-500 uppercase">Urgency:</span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  pinnedSummary.urgency === 'high' ? 'bg-red-500' : pinnedSummary.urgency === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                }`} />
                <span className="font-semibold text-zinc-300 uppercase">{pinnedSummary.urgency}</span>
              </div>

              {/* Topics Count */}
              {pinnedSummary.topics && pinnedSummary.topics.length > 0 && (
                <div className="flex items-center gap-1 text-zinc-400 bg-slate-900/40 px-2 py-0.5 rounded border border-slate-800/40 max-w-xs truncate">
                  <span className="text-zinc-500 uppercase">Topics:</span>
                  <span className="text-amber-400 font-semibold truncate">
                    {pinnedSummary.topics.slice(0, 3).map(t => `#${t}`).join(', ')}
                    {pinnedSummary.topics.length > 3 && '...'}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
