import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, RotateCcw, ShieldCheck, User, Clock } from 'lucide-react';
import { useEditHistory } from '../hooks/useEditHistory';
import { useMessageEdit } from '../hooks/useMessageEdit';
import DiffViewer from './DiffViewer';
import { format } from 'date-fns';

interface EditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  chatId: string;
  isGroup?: boolean;
  sharedKey?: string | null;
  userId: string;
  isAdmin?: boolean;
  groupParticipants?: any[];
}

export default function EditHistoryModal({
  isOpen,
  onClose,
  messageId,
  chatId,
  isGroup = false,
  sharedKey = null,
  userId,
  isAdmin = false,
  groupParticipants = [],
}: EditHistoryModalProps) {
  const history = useEditHistory(messageId, chatId, isGroup, sharedKey);
  const { restoreOriginal } = useMessageEdit(chatId, messageId, isGroup);

  if (!isOpen) return null;

  const handleRestore = async () => {
    try {
      if (confirm("Are you sure you want to restore the message to its original version? This will clear all edit history.")) {
        await restoreOriginal(userId, isAdmin);
        onClose();
      }
    } catch (err: any) {
      alert(err.message || "Failed to restore message");
    }
  };

  const getEditorName = (uid: string) => {
    if (uid === userId) return 'You';
    const p = groupParticipants.find((part) => part.uid === uid || part.id === uid);
    return p?.displayName || 'Peer';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal panel */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0.5 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full md:max-w-xl h-[80vh] md:h-auto md:max-h-[85vh] bg-zinc-950/95 backdrop-blur-xl border border-zinc-900 md:rounded-3xl rounded-t-3xl flex flex-col shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-900 flex items-center justify-between shrink-0 bg-zinc-950/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                <History size={18} />
              </div>
              <div>
                <h3 className="font-sans font-bold text-zinc-100 text-base tracking-tight leading-none">
                  Transmission Revision Log
                </h3>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                  History integrity &amp; audit path
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            {history.isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                  Decrypting archives...
                </span>
              </div>
            ) : history.error ? (
              <div className="text-center p-8 bg-rose-500/5 rounded-2xl border border-rose-500/15">
                <p className="text-sm font-semibold text-rose-400">Failed to load history</p>
                <p className="text-xs text-rose-500/80 font-mono mt-1">{history.error}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Timeline view */}
                <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-900">
                  
                  {/* 1. Original version */}
                  <div className="relative group">
                    {/* Circle marker */}
                    <div className="absolute -left-[20px] top-1.5 w-[11px] h-[11px] rounded-full bg-zinc-800 ring-4 ring-zinc-950 z-10" />
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded border border-zinc-800 uppercase tracking-widest">
                          Original
                        </span>
                        <span className="text-[11px] text-zinc-500 font-medium">
                          Initial transmission payload
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-900 text-zinc-300 font-sans text-sm select-text whitespace-pre-wrap">
                        {history.original}
                      </div>
                    </div>
                  </div>

                  {/* 2. Revisions */}
                  {history.edits.map((edit, idx) => {
                    const prevText = idx === 0 ? history.original : history.edits[idx - 1].text;
                    const editTime = edit.editedAt?.toDate 
                      ? format(edit.editedAt.toDate(), 'MMM d, h:mm a') 
                      : edit.editedAt ? format(new Date(edit.editedAt), 'MMM d, h:mm a') : 'Recent';

                    return (
                      <div key={idx} className="relative group">
                        {/* Circle marker */}
                        <div className="absolute -left-[20px] top-1.5 w-[11px] h-[11px] rounded-full bg-amber-500/50 group-hover:bg-amber-500 transition-colors ring-4 ring-zinc-950 z-10" />

                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/10 uppercase tracking-widest">
                                Rev #{edit.editNumber}
                              </span>
                              <span className="text-[11px] text-zinc-300 font-medium flex items-center gap-1.5">
                                {edit.editedByAdmin ? (
                                  <>
                                    <ShieldCheck size={12} className="text-wa-primary inline" />
                                    <span className="text-wa-primary font-bold">Admin Override</span>
                                  </>
                                ) : (
                                  <>
                                    <User size={12} className="text-zinc-500 inline" />
                                    <span>{getEditorName(edit.editedBy)}</span>
                                  </>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                              <Clock size={10} />
                              <span>{editTime}</span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider pl-1">
                              Modification Diff
                            </p>
                            <DiffViewer oldText={prevText} newText={edit.text} />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* 3. Current Version */}
                  {history.edits.length > 0 && (
                    <div className="relative group">
                      {/* Circle marker */}
                      <div className="absolute -left-[20px] top-1.5 w-[11px] h-[11px] rounded-full bg-wa-primary ring-4 ring-zinc-950 z-10 animate-pulse" />

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold bg-wa-primary/10 text-wa-primary px-2 py-0.5 rounded border border-wa-primary/20 uppercase tracking-widest">
                            Current Version
                          </span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-zinc-100 font-sans text-sm font-semibold select-text whitespace-pre-wrap">
                          {history.current}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>

          {/* Footer controls */}
          {!history.isLoading && !history.error && history.edits.length > 0 && (
            <div className="p-5 border-t border-zinc-900 bg-zinc-950/40 shrink-0 flex gap-3">
              <button
                onClick={handleRestore}
                className="flex-1 py-3 px-4 rounded-xl border border-zinc-800 text-zinc-300 font-mono text-xs font-bold uppercase tracking-widest hover:bg-zinc-900 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <RotateCcw size={14} />
                Restore Original
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 text-black font-mono text-xs font-bold uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center justify-center cursor-pointer active:scale-95"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
