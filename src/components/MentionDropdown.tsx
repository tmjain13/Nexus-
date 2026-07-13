import React from 'react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

interface MemberProfile {
  id: string;
  displayName: string;
  username?: string;
  photoURL?: string;
}

interface MentionDropdownProps {
  members: MemberProfile[];
  filterText: string;
  onSelect: (username: string) => void;
  onClose: () => void;
}

export default function MentionDropdown({ members, filterText, onSelect, onClose }: MentionDropdownProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const lowerFilter = filterText.toLowerCase();
  const matchedMembers = members.filter(m => {
    const nameMatch = m.displayName?.toLowerCase().includes(lowerFilter);
    const userMatch = m.username?.toLowerCase().includes(lowerFilter);
    return nameMatch || userMatch;
  });

  if (matchedMembers.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "absolute bottom-full left-4 mb-2 w-64 max-h-56 rounded-xl border shadow-xl flex flex-col overflow-y-auto z-50 animate-in fade-in slide-in-from-bottom-2 duration-150",
      isDark ? "bg-[#0b0f12] border-zinc-850 text-zinc-150" : "bg-white border-zinc-200 text-zinc-800"
    )}>
      <div className={cn(
        "px-3 py-1.5 text-[9px] uppercase font-bold tracking-wider shrink-0 select-none border-b",
        isDark ? "text-zinc-500 border-zinc-900/50 bg-[#070b0e]" : "text-zinc-400 border-zinc-100 bg-zinc-50"
      )}>
        Mention Member
      </div>
      <div className="divide-y divide-zinc-850/10 flex-1">
        {matchedMembers.map(member => {
          const photo = member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username || member.id}`;
          const username = member.username || member.id.substring(0, 8);
          
          return (
            <button
              key={member.id}
              onClick={() => onSelect(username)}
              className={cn(
                "w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 transition-colors cursor-pointer hover:bg-amber-500/5",
                isDark ? "hover:bg-zinc-900/40 text-zinc-200" : "hover:bg-zinc-50 text-zinc-800"
              )}
            >
              <img src={photo} alt={member.displayName} className="w-7 h-7 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate leading-none">{member.displayName}</p>
                <p className="text-[10px] text-zinc-500 truncate mt-0.5">@{username}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
