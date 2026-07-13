import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, MessageSquare } from 'lucide-react';

interface SmartReplySuggestionsProps {
  actionItems: string[];
  onSelectReply: (reply: string) => void;
}

export default function SmartReplySuggestions({
  actionItems,
  onSelectReply
}: SmartReplySuggestionsProps) {
  // Derive 3 smart response strings based on the action items
  const generateSuggestions = (): string[] => {
    if (!actionItems || actionItems.length === 0) {
      return [
        "Sounds like a plan, let's do it!",
        "Thanks for the summary, got it.",
        "I'll review the discussion and catch up."
      ];
    }

    const firstItem = actionItems[0] || "";
    const cleanFirstItem = firstItem.replace(/^(task|action item|todo|decision|who|what):/i, '').trim();

    // Dynamically build suggestions around the first action item
    const suggestions = [
      `I'll take care of "${cleanFirstItem.length > 35 ? cleanFirstItem.slice(0, 35) + '...' : cleanFirstItem}"!`,
      "That works for me, let's go ahead.",
      "Let me check my schedule and get back to you."
    ];

    return suggestions;
  };

  const suggestions = generateSuggestions();

  return (
    <div className="flex flex-col gap-2 pt-1">
      <div className="flex flex-wrap gap-2">
        {suggestions.map((reply, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectReply(reply)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/15 rounded-xl transition-all font-medium text-left max-w-full truncate"
          >
            <MessageSquare className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
            <span className="truncate">{reply}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
