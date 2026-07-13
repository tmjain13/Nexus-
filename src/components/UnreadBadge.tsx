import React from 'react';
import { motion } from 'motion/react';

interface UnreadBadgeProps {
  count: number;
}

export const UnreadBadge: React.FC<UnreadBadgeProps> = ({ count }) => {
  if (count <= 0) return null;

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center justify-center min-w-[20px] h-5 px-1 bg-[#f59e0b] text-white text-[11px] font-bold rounded-full shrink-0"
    >
      {count}
    </motion.span>
  );
};
