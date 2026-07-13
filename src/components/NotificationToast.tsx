import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Heart, Sparkles, X, MessageSquare } from 'lucide-react';
import { usePeaceMode } from '../hooks/usePeaceMode';

export function NotificationToast() {
  const { isEnabled } = usePeaceMode();
  const [showPeaceToast, setShowPeaceToast] = useState(false);
  const [batchData, setBatchData] = useState<{ title: string; notifications: any[] } | null>(null);

  // When Peace Mode is enabled, show the informative toast
  useEffect(() => {
    if (isEnabled) {
      setShowPeaceToast(true);
      // Auto dismiss after 6 seconds
      const t = setTimeout(() => setShowPeaceToast(false), 6000);
      return () => clearTimeout(t);
    } else {
      setShowPeaceToast(false);
    }
  }, [isEnabled]);

  // Listen for batch notifications event when Peace Mode ends
  useEffect(() => {
    const handleBatch = (e: Event) => {
      const customEvent = e as CustomEvent;
      setBatchData(customEvent.detail);
    };

    window.addEventListener('batch-deliver-notifications', handleBatch);
    return () => window.removeEventListener('batch-deliver-notifications', handleBatch);
  }, []);

  return (
    <div className="fixed bottom-24 right-6 left-6 md:left-auto md:w-96 z-[100] flex flex-col gap-3 pointer-events-none">
      {/* 1. Peace Mode Active Informational Toast */}
      <AnimatePresence>
        {isEnabled && showPeaceToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto bg-zinc-950/95 border border-amber-500/30 text-zinc-100 rounded-2xl p-4 shadow-xl shadow-amber-950/20 flex items-start gap-3.5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 3c-1.5 2-4 3.5-7 3.5m7-3.5c1.5 2 4 3.5 7 3.5M12 21c-1.5-2-4-3.5-7-3.5m7 3.5c1.5-2 4-3.5 7-3.5M4 10.5c2 1 4 .5 5-1.5m11 1.5c-2 1-4 .5-5-1.5" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1">
                Peace Mode Active <Sparkles size={11} className="animate-pulse" />
              </h4>
              <p className="text-[11px] text-zinc-400 font-mono mt-1 leading-relaxed">
                Only starred contacts will notify you. All other messages will be queued silently.
              </p>
            </div>
            <button
              onClick={() => setShowPeaceToast(false)}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-900 transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Batch Notification Delivery Toast */}
      <AnimatePresence>
        {batchData && batchData.notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto bg-zinc-950/95 border border-zinc-800 text-zinc-100 rounded-3xl p-5 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-amber-400 animate-bounce" />
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-300">
                  {batchData.title}
                </span>
              </div>
              <button
                onClick={() => setBatchData(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-900"
              >
                <X size={14} />
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto flex flex-col gap-2.5 pr-1">
              {batchData.notifications.map((notif, idx) => (
                <div key={idx} className="flex gap-3 items-start bg-zinc-900/40 p-3 rounded-2xl border border-zinc-900">
                  <div className="p-1.5 rounded-lg bg-zinc-850 text-amber-500 mt-0.5">
                    <MessageSquare size={12} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 block uppercase">
                      Incoming Alert
                    </span>
                    <p className="text-[11px] text-zinc-300 font-mono mt-0.5">
                      {notif.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[9px] font-mono text-zinc-500 text-center uppercase tracking-widest mt-1">
              — Delivered in one batch —
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationToast;
