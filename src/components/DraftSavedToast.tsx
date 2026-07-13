import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';

interface DraftSavedToastProps {
  show: boolean;
}

export function DraftSavedToast({ show }: DraftSavedToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 text-xs mt-1 select-none"
        >
          <Check size={14} className="text-emerald-500" />
          <span>Draft saved</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
