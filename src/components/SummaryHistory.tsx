import React, { useState } from 'react';
import { useSummaryHistory, HistorySummary } from '../hooks/useSummaryHistory';
import { Trash2, Sparkles, MessageCircle, Calendar, ArrowLeft, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import ChatSummaryModal from './ChatSummaryModal';

interface SummaryHistoryProps {
  onBack: () => void;
}

export default function SummaryHistory({ onBack }: SummaryHistoryProps) {
  const { summaries, loading, deleteSummary, clearHistory } = useSummaryHistory();
  const [selectedSummary, setSelectedSummary] = useState<HistorySummary | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const formatCreatedAt = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div className="p-6 border border-zinc-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-sm space-y-6 text-left max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-900 dark:text-white uppercase font-sans">AI Summaries History</h4>
            <p className="text-[9px] text-zinc-500 font-medium font-sans uppercase tracking-wide">Digest archive & topics</p>
          </div>
        </div>
        <button 
          onClick={onBack} 
          className="p-1 px-3 bg-zinc-50 dark:bg-slate-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-slate-700 rounded-xl text-[10px] font-mono uppercase font-bold hover:bg-zinc-100 dark:hover:bg-slate-750 transition-colors flex items-center gap-2"
          style={{ border: 'none' }}
        >
          <ArrowLeft size={10} /> Back
        </button>
      </div>

      {/* Clear All Option */}
      {summaries.length > 0 && !loading && (
        <div className="flex justify-end">
          {showClearConfirm ? (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-1.5 px-3 rounded-xl">
              <span className="text-[10px] text-red-400 font-semibold uppercase tracking-wide">Confirm purge?</span>
              <button
                onClick={async () => {
                  await clearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-2 py-0.5 bg-red-500 text-white rounded text-[9px] font-bold uppercase hover:bg-red-600 transition-colors"
              >
                Yes, Purge
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-0.5 bg-zinc-600 text-white rounded text-[9px] font-bold uppercase hover:bg-zinc-700 transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-all border border-red-500/10 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear History
            </button>
          )}
        </div>
      )}

      {/* Main List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-3 border-amber-500/10 border-t-amber-500 animate-spin" />
          <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider animate-pulse">Accessing summaries archive...</span>
        </div>
      ) : summaries.length === 0 ? (
        <div className="text-center py-16 space-y-4 bg-zinc-50/50 dark:bg-slate-850/10 rounded-2xl border border-dashed border-zinc-200 dark:border-slate-800">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">No Summaries Generated Yet</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-600 max-w-xs mx-auto leading-relaxed">
            Summaries generated in individual secure chat rooms will automatically be indexed here for quick reference.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {summaries.map((summary) => (
            <motion.div
              key={summary.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ y: -1 }}
              className="group relative bg-zinc-50 dark:bg-slate-850/40 border border-zinc-100 dark:border-slate-800/80 hover:border-amber-500/30 p-4 rounded-2xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
              onClick={() => setSelectedSummary(summary)}
            >
              {/* Info Column */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    {summary.chatName || 'Unknown Chat'}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                    {formatCreatedAt(summary.createdAt)}
                  </span>
                </div>

                {/* TL;DR snippet */}
                <p className="text-xs text-zinc-500 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                  {summary.tldr}
                </p>

                {/* Sub-info and topic tags */}
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-zinc-500" />
                    {summary.messageCount} messages
                  </span>

                  <span className="text-zinc-400 uppercase tracking-wider font-semibold">
                    Urgency: <span className={
                      summary.urgency === 'high' ? 'text-red-400' : summary.urgency === 'medium' ? 'text-amber-400' : 'text-green-400'
                    }>{summary.urgency}</span>
                  </span>

                  {summary.topics && summary.topics.length > 0 && (
                    <div className="flex gap-1 overflow-hidden truncate max-w-xs text-amber-500">
                      {summary.topics.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="shrink-0 bg-amber-500/10 px-1.5 py-0.5 rounded text-[9px] font-medium font-mono lowercase">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Column */}
              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSummary(summary);
                  }}
                  className="p-1.5 px-3 rounded-xl bg-amber-500/5 group-hover:bg-amber-500/10 text-amber-500 border border-amber-500/10 hover:border-amber-500/20 transition-all text-[10px] font-mono uppercase tracking-wider font-bold flex items-center gap-1 shrink-0"
                >
                  View Details
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await deleteSummary(summary.id);
                  }}
                  className="p-2 text-zinc-400 hover:text-red-400 rounded-xl hover:bg-slate-800/40 transition-colors shrink-0"
                  title="Purge Summary"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Selected Detailed Modal View */}
      <ChatSummaryModal
        isOpen={!!selectedSummary}
        onClose={() => setSelectedSummary(null)}
        summary={selectedSummary}
        isLoading={false}
        error={null}
        onRetry={() => {}}
        onPin={() => {}}
        isPinned={false} // Pinning from setting history is not applicable
      />
    </div>
  );
}
