import React from 'react';
import { motion } from 'motion/react';
import { Pin } from 'lucide-react';

interface PinnedChat {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  unreadCount?: number;
}

interface PinnedChatsProps {
  pinnedChats: PinnedChat[];
  onSelectChat: (chatId: string) => void;
}

export const PinnedChats: React.FC<PinnedChatsProps> = ({ pinnedChats, onSelectChat }) => {
  if (pinnedChats.length === 0) return null;

  return (
    <div id="nexus_pinned_section" className="px-4 py-3 select-none">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Pin size={11} className="text-amber-500 rotate-45" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Neural Pins
        </span>
      </div>

      {/* Horizontal Scroll Area */}
      <div className="flex items-center gap-4 overflow-x-auto pb-1.5 scrollbar-none scroll-smooth">
        {pinnedChats.map((chat) => (
          <motion.button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className="flex flex-col items-center gap-1.5 shrink-0 relative focus:outline-none cursor-pointer group"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            {/* Avatar block with amber ring if has unread, or simple state ring */}
            <div className="relative w-14 h-14 rounded-2xl p-[2px] bg-slate-800 border border-slate-700/60 group-hover:border-amber-500/50 transition-colors">
              <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-900">
                <img
                  src={chat.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id}`}
                  alt={chat.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Online indicator */}
              {chat.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
              )}

              {/* Small Pin Indicator on avatar corner */}
              <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-lg shadow-md border border-slate-900">
                <Pin size={8} className="rotate-45" fill="currentColor" />
              </div>

              {/* Unread badge on pinned avatar */}
              {chat.unreadCount && chat.unreadCount > 0 ? (
                <span className="absolute -top-1 -left-1 bg-rose-500 text-white text-[9px] font-extrabold px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center border border-slate-900">
                  {chat.unreadCount}
                </span>
              ) : null}
            </div>

            {/* Truncated Name below avatar */}
            <span className="text-[10px] font-bold text-zinc-300 max-w-[64px] truncate text-center group-hover:text-white transition-colors">
              {chat.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default PinnedChats;
