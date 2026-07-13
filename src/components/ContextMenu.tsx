import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface ContextMenuItem {
  label: string;
  icon?: React.ComponentType<any>;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  items: ContextMenuItem[];
}

export function ContextMenu({ x, y, isOpen, onClose, items }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', onClose);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', onClose);
    };
  }, [isOpen, onClose]);

  // Adjust coordinates so the menu does not overflow the viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const menuWidth = 180;
  const menuHeight = items.length * 36 + 10;

  const adjustedX = x + menuWidth > viewportWidth ? viewportWidth - menuWidth - 10 : x;
  const adjustedY = y + menuHeight > viewportHeight ? viewportHeight - menuHeight - 10 : y;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.12 }}
        className="fixed z-50 bg-zinc-950/95 border border-zinc-800/80 rounded-xl shadow-2xl p-1.5 min-w-[170px] backdrop-blur-md"
        style={{ left: adjustedX, top: adjustedY }}
      >
        <div className="flex flex-col gap-0.5">
          {items.map((item, index) => {
            const Icon = item.icon;
            const isDanger = item.variant === 'danger';
            return (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick();
                  onClose();
                }}
                className={`flex items-center gap-2.5 px-3 py-2 text-left rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 ${
                  isDanger
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                {Icon && <Icon size={14} className={isDanger ? 'text-red-400' : 'text-zinc-500'} />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ContextMenu;
