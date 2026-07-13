import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, MessageSquare, Users, Megaphone, X } from 'lucide-react';

interface QuickActionsFABProps {
  onNewChat: () => void;
  onNewGroup: () => void;
  onNewChannel: () => void;
}

export const QuickActionsFAB: React.FC<QuickActionsFABProps> = ({
  onNewChat,
  onNewGroup,
  onNewChannel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const items = [
    {
      icon: <MessageSquare size={18} strokeWidth={1.5} />,
      label: 'New Chat',
      onClick: () => {
        onNewChat();
        setIsOpen(false);
      },
      color: 'bg-emerald-500 text-slate-950',
    },
    {
      icon: <Users size={18} strokeWidth={1.5} />,
      label: 'New Group',
      onClick: () => {
        onNewGroup();
        setIsOpen(false);
      },
      color: 'bg-cyan-500 text-slate-950',
    },
    {
      icon: <Megaphone size={18} strokeWidth={1.5} />,
      label: 'New Broadcast Channel',
      onClick: () => {
        onNewChannel();
        setIsOpen(false);
      },
      color: 'bg-accent text-slate-950',
    },
  ];

  return (
    <div ref={menuRef} className="fixed bottom-20 right-6 z-50 select-none">
      {/* Ambient backdrop blur overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-bg-primary/45 backdrop-blur-sm z-40 pointer-events-auto"
          />
        )}
      </AnimatePresence>

      <div className="relative z-50 flex flex-col items-end gap-3">
        {/* Floating Actions List */}
        <AnimatePresence>
          {isOpen && (
            <div className="flex flex-col items-end gap-2.5 mb-2">
              {items.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={item.onClick}
                >
                  {/* Label tag */}
                  <span className="bg-bg-secondary/90 border border-border-subtle text-text-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg shadow-black/40">
                    {item.label}
                  </span>
                  {/* Circular Button */}
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg cursor-pointer ${item.color} hover:scale-105 active:scale-95 transition-transform`}>
                    {item.icon}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Master FAB Button: bg-accent, rounded-2xl (not circle), 56px, shadow-accent-glow, white icon */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-accent-glow cursor-pointer text-white transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] ${
            isOpen ? 'bg-bg-elevated border border-border-subtle text-accent' : 'bg-accent'
          }`}
          whileTap={{ scale: 0.92 }}
          animate={{ rotate: isOpen ? 135 : 0 }}
          title="Command Palette Menu"
        >
          {isOpen ? <X size={24} strokeWidth={1.5} className="text-white" /> : <Plus size={24} strokeWidth={1.5} className="text-white" />}
        </motion.button>
      </div>
    </div>
  );
};

export default QuickActionsFAB;
