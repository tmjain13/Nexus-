import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isMe?: boolean;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '✨', '🙏'];

const containerVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 24,
      staggerChildren: 0.04,
      delayChildren: 0.02
    }
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    y: 5,
    transition: {
      duration: 0.12,
      ease: "easeIn"
    }
  }
};

const itemVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 18
    }
  }
};

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, isOpen, onClose, isMe }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "absolute z-[101] -top-12 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-lg border border-zinc-200/80 dark:border-zinc-800/80 rounded-full p-1 flex gap-1 items-center justify-center pointer-events-auto",
            isMe ? "right-0 origin-bottom-right" : "left-0 origin-bottom-left"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {EMOJIS.map(emoji => (
            <motion.button
              key={emoji}
              variants={itemVariants}
              whileHover={{ scale: 1.35, y: -4 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { onSelect(emoji); onClose(); }}
              className="relative text-xl p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer select-none"
            >
              {emoji}
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
