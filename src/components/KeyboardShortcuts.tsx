import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Keyboard, ArrowUp, CornerDownLeft, HelpCircle } from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutDef {
  keys: string[];
  description: string;
}

interface CategoryDef {
  title: string;
  items: ShortcutDef[];
}

const SHORTCUT_CATEGORIES: CategoryDef[] = [
  {
    title: "General & Search",
    items: [
      { keys: ["⌘ / ⌃", "K"], description: "Open Omnipresent Universal Search Index" },
      { keys: ["⌘ / ⌃", "/"], description: "Toggle this Keyboard Shortcuts Help Board" },
      { keys: ["⌘ / ⌃", "E"], description: "Focus or initiate text search queries" },
      { keys: ["Esc"], description: "Close active overlays, search indexes, or modals" },
    ],
  },
  {
    title: "Navigation & Tabs",
    items: [
      { keys: ["⌘ / ⌃", "1"], description: "Navigate to Chats & Transmissions Tab" },
      { keys: ["⌘ / ⌃", "2"], description: "Navigate to Inbox & E-mails Tab" },
      { keys: ["⌘ / 0", "3"], description: "Navigate to Calls & Signals Tab" },
      { keys: ["⌘ / ⌃", "4"], description: "Navigate to Reels & Discover Tab" },
      { keys: ["⌘ / ⌃", "5"], description: "Navigate to Secure Vault Tab" },
      { keys: ["⌘ / ⌃", "6"], description: "Navigate to Profile & Identity Tab" },
    ],
  },
  {
    title: "Messaging Controls",
    items: [
      { keys: ["⌘ / ⌃", "N"], description: "Instantly launch a New Direct Transmission (DM)" },
      { keys: ["⌘ / ⌃", "Shift", "N"], description: "Create a Secure Group Chat Channel" },
      { keys: ["Enter"], description: "Transmit draft message (when focused in input)" },
      { keys: ["Shift", "Enter"], description: "Insert clean new line carriage return" },
      { keys: ["↑ Arrow"], description: "Quickly edit last message (when input is empty)" },
      { keys: ["Delete"], description: "Erase or remove selected transmission draft" },
    ],
  },
];

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="shortcuts-help-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header section */}
          <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Keyboard size={18} />
              </div>
              <div>
                <h3 className="text-sm font-sans font-bold text-zinc-100">
                  Nexus Keybindings Registry
                </h3>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  Power user shortcuts & control bindings
                </p>
              </div>
            </div>

            <button
              id="close-shortcuts-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-800 hover:border-amber-500/30 text-zinc-400 hover:text-amber-500 flex items-center justify-center transition-all"
            >
              <X size={14} />
            </button>
          </div>

          {/* Core content grid */}
          <div className="p-6 overflow-y-auto max-h-[60vh] flex flex-col gap-6 no-scrollbar">
            {SHORTCUT_CATEGORIES.map((category) => (
              <div key={category.title} className="flex flex-col gap-3">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-500/80 border-b border-zinc-850 pb-1">
                  {category.title}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5">
                  {category.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
                      <span className="text-xs text-zinc-400 font-sans font-medium">
                        {item.description}
                      </span>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((key, keyIdx) => (
                          <React.Fragment key={keyIdx}>
                            <kbd className="bg-zinc-950 border border-zinc-850 px-2 py-1 rounded-lg text-[9px] font-mono font-bold text-zinc-300 shadow-inner min-w-[20px] text-center">
                              {key}
                            </kbd>
                            {keyIdx < item.keys.length - 1 && (
                              <span className="text-[10px] font-mono text-zinc-600 font-bold">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom helper tip bar */}
          <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-850 flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span className="flex items-center gap-1.5">
              <HelpCircle size={12} className="text-amber-500" />
              Press <kbd className="bg-zinc-900 border border-zinc-800 px-1 py-0.2 rounded text-[10px] text-zinc-400">Esc</kbd> anytime to dismiss active focus frames.
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default KeyboardShortcuts;
