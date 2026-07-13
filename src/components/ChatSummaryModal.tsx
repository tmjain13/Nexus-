import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Pin, Sparkles, Smile, Meh, Frown, Check, AlertTriangle } from 'lucide-react';
import { ChatSummary } from '../services/aiService';
import SmartReplySuggestions from './SmartReplySuggestions';

interface ChatSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ChatSummary | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onPin: () => void;
  isPinned: boolean;
  onSelectSmartReply?: (reply: string) => void;
}

export default function ChatSummaryModal({
  isOpen,
  onClose,
  summary,
  isLoading,
  error,
  onRetry,
  onPin,
  isPinned,
  onSelectSmartReply
}: ChatSummaryModalProps) {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const toggleCheck = (index: number) => {
    setCheckedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const getSentimentDetails = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return {
          icon: <Smile className="w-4 h-4" />,
          classes: 'bg-green-500/20 text-green-400 border border-green-500/30',
          label: 'Positive'
        };
      case 'negative':
        return {
          icon: <Frown className="w-4 h-4" />,
          classes: 'bg-red-500/20 text-red-400 border border-red-500/30',
          label: 'Negative'
        };
      case 'neutral':
      default:
        return {
          icon: <Meh className="w-4 h-4" />,
          classes: 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30',
          label: 'Neutral'
        };
    }
  };

  const getUrgencyDetails = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'high':
        return { dotColor: 'bg-red-500 shadow-red-500/50', label: 'High Urgency', textClass: 'text-red-400' };
      case 'medium':
        return { dotColor: 'bg-amber-500 shadow-amber-500/50', label: 'Medium Urgency', textClass: 'text-amber-400' };
      case 'low':
      default:
        return { dotColor: 'bg-green-500 shadow-green-500/50', label: 'Low Urgency', textClass: 'text-green-400' };
    }
  };

  if (!isOpen) return null;

  const sentiment = summary ? getSentimentDetails(summary.sentiment) : null;
  const urgency = summary ? getUrgencyDetails(summary.urgency) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-white">AI Chat Summary</h2>
            </div>
            <div className="flex items-center gap-2">
              {summary && !isLoading && !error && (
                <button
                  onClick={onPin}
                  className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium ${
                    isPinned
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800 text-zinc-400 hover:text-white border border-slate-700/50'
                  }`}
                  title={isPinned ? "Pinned" : "Pin to Chat"}
                >
                  <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400' : ''}`} />
                  {isPinned ? 'Pinned' : 'Pin'}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading && (
              <div className="space-y-5 py-8">
                <div className="flex items-center justify-center gap-3 text-amber-500 animate-pulse">
                  <Sparkles className="w-6 h-6 animate-spin" />
                  <span className="font-medium">Synthesizing chat with Gemini...</span>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-800 rounded-md w-full animate-pulse" />
                  <div className="h-4 bg-slate-800 rounded-md w-11/12 animate-pulse" />
                  <div className="h-4 bg-slate-800 rounded-md w-4/5 animate-pulse" />
                </div>
                <div className="h-24 bg-slate-850/50 border border-slate-800 rounded-xl animate-pulse flex items-center justify-center">
                  <div className="h-3 bg-slate-800 rounded-full w-1/3 animate-pulse" />
                </div>
              </div>
            )}

            {error && !isLoading && (
              <div className="text-center py-10 space-y-4">
                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <p className="text-sm text-zinc-300 font-medium">Couldn't summarize. Try again.</p>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">{error}</p>
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/10"
                >
                  Retry Summary
                </button>
              </div>
            )}

            {!isLoading && !error && summary && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* TL;DR Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-zinc-500 tracking-wider uppercase">TL;DR Overview</h3>
                  <p className="text-base text-white font-medium leading-relaxed bg-slate-850/30 p-4 rounded-xl border border-slate-800/50">
                    {summary.tldr}
                  </p>
                </div>

                {/* Key Metadata (Sentiment + Urgency) */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Sentiment Badge */}
                  {sentiment && (
                    <div className="bg-slate-850/30 p-3 rounded-xl border border-slate-800/40 space-y-1.5">
                      <span className="text-xs text-zinc-500">Sentiment Tone</span>
                      <div className="flex">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sentiment.classes}`}>
                          {sentiment.icon}
                          {sentiment.label}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Urgency Badge */}
                  {urgency && (
                    <div className="bg-slate-850/30 p-3 rounded-xl border border-slate-800/40 space-y-1.5">
                      <span className="text-xs text-zinc-500">Urgency Level</span>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${urgency.dotColor} shadow-sm animate-pulse`} />
                        <span className={`text-xs font-medium ${urgency.textClass}`}>{urgency.label}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Key Topics Section */}
                {summary.topics && summary.topics.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-zinc-500 tracking-wider uppercase">Key Topics</h3>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
                      {summary.topics.map((topic, i) => (
                        <span
                          key={i}
                          className="flex-shrink-0 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-3 py-1 text-xs font-medium"
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Items Section */}
                {summary.actionItems && summary.actionItems.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-zinc-500 tracking-wider uppercase">Action Items & Decisions</h3>
                    <div className="space-y-2 bg-slate-850/20 p-4 rounded-xl border border-slate-800/50">
                      {summary.actionItems.map((item, index) => {
                        const isChecked = !!checkedItems[index];
                        return (
                          <div
                            key={index}
                            onClick={() => toggleCheck(index)}
                            className="flex items-start gap-3 p-1.5 rounded-lg hover:bg-slate-800/30 cursor-pointer transition-colors group"
                          >
                            <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              isChecked
                                ? 'bg-amber-500 border-amber-500 text-slate-950'
                                : 'border-zinc-700 group-hover:border-zinc-500'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={`text-xs select-none transition-all ${
                              isChecked ? 'line-through text-zinc-500' : 'text-zinc-300'
                            }`}>
                              {item}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Smart Replies */}
                {summary.actionItems && summary.actionItems.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/50">
                    <h3 className="text-xs font-semibold text-zinc-500 tracking-wider uppercase">Smart Reply Suggestions</h3>
                    <SmartReplySuggestions
                      actionItems={summary.actionItems}
                      onSelectReply={(reply) => {
                        if (onSelectSmartReply) {
                          onSelectSmartReply(reply);
                        }
                        onClose();
                      }}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-center flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] text-zinc-500 font-mono tracking-wide uppercase">Generated in Enclave OS Secure Workspace by Gemini AI</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
