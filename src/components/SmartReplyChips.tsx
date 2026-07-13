import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { SmartReply } from '../hooks/useSmartReplies';

interface SmartReplyChipsProps {
  replies: SmartReply[];
  onSelectReply: (text: string) => void;
  isLoading?: boolean;
}

export function SmartReplyChips({ replies, onSelectReply, isLoading }: SmartReplyChipsProps) {
  if (replies.length === 0 && !isLoading) return null;

  return (
    <div className="flex flex-col gap-1.5 px-4 py-2.5 bg-zinc-900/40 dark:bg-zinc-950/20 border-t border-zinc-100/10 dark:border-zinc-800/30">
      <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-500/80 uppercase tracking-widest select-none">
        <Sparkles size={11} className="animate-pulse" /> Smart Replies
      </div>
      
      <div className="flex flex-wrap gap-2 items-center">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 italic py-1 font-mono">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" /> Analyzing incoming message...
            </div>
          ) : (
            replies.map((reply, idx) => (
              <motion.button
                key={reply.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.18, delay: idx * 0.05 }}
                onClick={() => onSelectReply(reply.text)}
                className="bg-slate-800 hover:bg-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 active:scale-95 text-zinc-100 font-medium px-4 py-1.5 rounded-full text-xs transition-all border border-transparent hover:border-amber-500/20 shadow-sm cursor-pointer"
                title={`Confidence: ${Math.round(reply.confidence * 100)}%`}
              >
                {reply.text}
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
