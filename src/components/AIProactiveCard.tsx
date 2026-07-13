import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Calendar, Plane, Gift, AlertCircle, ChevronLeft, ChevronRight, MessageSquare, Check } from 'lucide-react';

interface AIProactiveCardProps {
  onTriggerPrompt: (promptText: string) => void;
}

export function AIProactiveCard({ onTriggerPrompt }: AIProactiveCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<number[]>([]);

  const alerts = [
    {
      id: 0,
      type: 'morning',
      icon: Sparkles,
      color: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
      title: 'Dynamic Daily Briefing',
      description: 'Good morning! You have 3 engineering sync meetings scheduled today and 5 unread threads in your inbox.',
      actionLabel: 'Review Briefing',
      actionPrompt: 'Summarize today\'s schedule and outstanding emails please.',
    },
    {
      id: 1,
      type: 'flight',
      icon: Plane,
      color: 'text-sky-400 border-sky-500/20 bg-sky-500/5',
      title: 'Upcoming Transit Pass',
      description: 'Your flight NH211 to Tokyo is scheduled tomorrow at 3:00 PM. Terminal 2. Your boarding pass is stashed in the Vault.',
      actionLabel: 'Check Pass',
      actionPrompt: 'Check my upcoming Tokyo flight details and boarding pass.',
    },
    {
      id: 2,
      type: 'birthday',
      icon: Gift,
      color: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
      title: 'Peer Celebration',
      description: 'It is Sarah\'s birthday today! Would you like to transmit a congratulatory greeting?',
      actionLabel: 'Draft Wish',
      actionPrompt: 'Draft a short, creative birthday message to Sarah.',
    },
    {
      id: 3,
      type: 'overdue',
      icon: AlertCircle,
      color: 'text-red-400 border-red-500/20 bg-red-500/5',
      title: 'Workspace Alert',
      description: 'You have 2 high-priority tasks in Workspace that are past their expected due dates.',
      actionLabel: 'Check Tasks',
      actionPrompt: 'What overdue tasks do I have on my workspace board?',
    }
  ];

  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.id));

  if (visibleAlerts.length === 0) return null;

  const activeAlert = visibleAlerts[currentIndex % visibleAlerts.length];
  const Icon = activeAlert.icon;

  const nextAlert = () => {
    setCurrentIndex((prev) => (prev + 1) % visibleAlerts.length);
  };

  const prevAlert = () => {
    setCurrentIndex((prev) => (prev - 1 + visibleAlerts.length) % visibleAlerts.length);
  };

  const dismissActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(prev => [...prev, activeAlert.id]);
    setCurrentIndex(0);
  };

  return (
    <div className="px-4 py-3 shrink-0" id="ai-proactive-container">
      <motion.div
        layout
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-4 border relative overflow-hidden transition-all duration-300 ${activeAlert.color}`}
      >
        <div className="flex gap-3 items-start pr-8">
          {/* Circular icon shield */}
          <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center text-amber-500 shrink-0">
            <Icon size={18} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-500">
                PROACTIVE INSIGHT
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <h4 className="text-xs font-bold text-zinc-200 mt-0.5 tracking-tight">
              {activeAlert.title}
            </h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed font-medium">
              {activeAlert.description}
            </p>

            {/* Quick-action execution trigger */}
            <div className="flex gap-3 mt-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onTriggerPrompt(activeAlert.actionPrompt)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
              >
                {activeAlert.actionLabel}
              </motion.button>
              
              <button
                onClick={dismissActive}
                className="px-3 py-1.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-zinc-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>

        {/* Carousel controls (only show if multiple alerts) */}
        {visibleAlerts.length > 1 && (
          <div className="absolute right-3 top-3 flex items-center gap-1">
            <button
              onClick={prevAlert}
              className="w-6 h-6 rounded-md bg-black/40 hover:bg-black/60 flex items-center justify-center text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <ChevronLeft size={12} />
            </button>
            <span className="text-[9px] font-mono font-semibold text-zinc-500 px-1">
              {currentIndex + 1}/{visibleAlerts.length}
            </span>
            <button
              onClick={nextAlert}
              className="w-6 h-6 rounded-md bg-black/40 hover:bg-black/60 flex items-center justify-center text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default AIProactiveCard;
