import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Calendar, Receipt, Send, ShieldAlert } from 'lucide-react';

interface AIQuickActionsProps {
  onSelectAction: (promptText: string) => void;
}

export function AIQuickActions({ onSelectAction }: AIQuickActionsProps) {
  const actions = [
    {
      label: 'Today\'s schedule',
      prompt: 'What does my day look like? Summarize my upcoming calendar events.',
      icon: Calendar,
    },
    {
      label: 'Summarize unread',
      prompt: 'Please fetch and summarize my unread messages and emails from the last 3 days.',
      icon: Sparkles,
    },
    {
      label: 'Find receipts',
      prompt: 'Search across my inbox and wallet passes for flight, hotel, or purchase receipts.',
      icon: Receipt,
    },
    {
      label: 'Draft a message',
      prompt: 'Draft a message saying "I am running late by 10 minutes" to James.',
      icon: Send,
    },
    {
      label: 'Peace Mode info',
      prompt: 'Show me my current Peace Mode status and settings.',
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="flex gap-2 py-2.5 px-4 overflow-x-auto no-scrollbar scroll-smooth shrink-0 border-t border-zinc-900 bg-zinc-950/60" id="ai-quick-actions-bar">
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={i}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectAction(action.prompt)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900/90 text-zinc-300 hover:text-amber-500 text-xs font-semibold whitespace-nowrap cursor-pointer transition-all duration-200"
            id={`ai-chip-${i}`}
          >
            <Icon size={13} className="shrink-0" />
            <span>{action.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

export default AIQuickActions;
