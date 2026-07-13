import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Calendar, ClipboardCheck, Check, CornerDownRight, Play, Cpu } from 'lucide-react';
import { AIMessage, AIAction } from '../hooks/useAIAssistant';
import { useAuth } from '../context/AuthContext';

interface AIMessageBubbleProps {
  message: AIMessage;
  onExecuteAction: (action: AIAction) => Promise<void>;
}

export function AIMessageBubble({ message, onExecuteAction }: AIMessageBubbleProps) {
  const { user } = useAuth();
  const isUser = message.role === 'user';
  
  const [executedActions, setExecutedActions] = useState<string[]>([]);
  const [executing, setExecuting] = useState<string | null>(null);

  const handleConfirmAction = async (action: AIAction, idx: number) => {
    const actionKey = `${action.type}-${idx}`;
    setExecuting(actionKey);
    try {
      await onExecuteAction(action);
      setExecutedActions(prev => [...prev, actionKey]);
    } catch (e) {
      console.error("Action error:", e);
    } finally {
      setExecuting(null);
    }
  };

  // Safe inline markdown & code block renderer
  const renderMessageContent = (text: string) => {
    if (!text) return null;
    
    // Split by code blocks ```
    const segments = text.split(/(```[\s\S]*?```)/g);
    
    return segments.map((seg, i) => {
      if (seg.startsWith('```') && seg.endsWith('```')) {
        // Extract language and code
        const rawCode = seg.slice(3, -3).trim();
        const firstNewLineIdx = rawCode.indexOf('\n');
        const language = firstNewLineIdx > 0 ? rawCode.substring(0, firstNewLineIdx).trim() : 'code';
        const codeText = firstNewLineIdx > 0 ? rawCode.substring(firstNewLineIdx + 1) : rawCode;

        return (
          <div key={i} className="my-2.5 rounded-xl border border-zinc-800 bg-zinc-950 p-3 overflow-hidden font-mono text-[11px] text-zinc-300 relative group">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 mb-2">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{language}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(codeText)}
                className="text-[9px] text-zinc-500 hover:text-amber-500 transition-colors uppercase font-bold cursor-pointer"
              >
                Copy Code
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">{codeText}</pre>
          </div>
        );
      }

      // Handle simple inline highlights like `code` and bold **text**
      const inlineSegments = seg.split(/(`[^`\n]+`|\*\*[^*]+\*\*)/g);
      
      return (
        <span key={i} className="whitespace-pre-wrap leading-relaxed">
          {inlineSegments.map((subSeg, j) => {
            if (subSeg.startsWith('`') && subSeg.endsWith('`')) {
              return (
                <code key={j} className="px-1.5 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-amber-400 mx-0.5">
                  {subSeg.slice(1, -1)}
                </code>
              );
            }
            if (subSeg.startsWith('**') && subSeg.endsWith('**')) {
              return (
                <strong key={j} className="font-extrabold text-zinc-100">
                  {subSeg.slice(2, -2)}
                </strong>
              );
            }
            return subSeg;
          })}
        </span>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex w-full gap-3 py-3 px-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      id={`ai-message-${message.id}`}
    >
      {/* 1. LEFT SIDE AI AVATAR */}
      {!isUser && (
        <div className="relative shrink-0 select-none">
          {/* Animated pulsing outer golden border shield */}
          <div className="absolute inset-0 rounded-xl bg-amber-500/10 border border-amber-500/30 animate-pulse scale-105" />
          <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-amber-500 relative z-10 shadow-md">
            <Sparkles size={16} className="animate-spin-slow" />
          </div>
        </div>
      )}

      {/* 2. CHAT TEXT BUBBLE CONTAINER */}
      <div className={`max-w-[75%] md:max-w-[65%] flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl p-4 shadow-md border text-sm font-medium ${
            isUser
              ? 'bg-amber-500 border-amber-600 text-zinc-950 rounded-tr-sm'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300 rounded-tl-sm'
          }`}
        >
          {renderMessageContent(message.content)}

          {/* Action triggers execution banner */}
          {message.actions && message.actions.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex flex-col gap-2.5">
              {message.actions.map((act, idx) => {
                const actionKey = `${act.type}-${idx}`;
                const isExecuted = executedActions.includes(actionKey);
                const isThisExecuting = executing === actionKey;

                return (
                  <div key={idx} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex flex-col gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <Cpu size={14} className="text-amber-500 animate-pulse" />
                      <span className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase">
                        PROPOSED SYSTEM ACTION
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-zinc-300 bg-zinc-950/80 p-2 rounded-lg border border-zinc-900 leading-normal">
                      <div className="font-bold text-amber-400 capitalize mb-1">{act.type.replace('_', ' ')}</div>
                      {Object.entries(act.params || {}).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-zinc-500">{k}:</span>
                          <span className="text-zinc-300 truncate">{JSON.stringify(v)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      {isExecuted ? (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase font-mono">
                          <Check size={14} />
                          <span>Executed Successfully</span>
                        </div>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          disabled={isThisExecuting}
                          onClick={() => handleConfirmAction(act, idx)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 text-zinc-950 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                        >
                          {isThisExecuting ? (
                            <span className="w-3 h-3 border border-zinc-950 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Play size={10} fill="currentColor" />
                          )}
                          <span>Confirm & Execute</span>
                        </motion.button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Citations / Sources row */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {message.sources.map((source, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[9px] font-mono font-bold text-zinc-500"
              >
                <CornerDownRight size={8} className="text-amber-500/60" />
                <span>{source}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. RIGHT SIDE USER AVATAR */}
      {isUser && (
        <div className="shrink-0 select-none">
          <img
            src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`}
            alt="User Avatar"
            className="w-9 h-9 rounded-xl border border-amber-500/20 object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </motion.div>
  );
}

export default AIMessageBubble;
