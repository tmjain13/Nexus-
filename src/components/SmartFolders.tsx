import React, { useRef } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { SortMode } from '../hooks/useChatListLayout';

interface SmartFoldersProps {
  activeFolder: string;
  onSelectFolder?: (folder: string) => void;
  onFolderChange?: (folder: string) => void;
  isPremium?: boolean;
  onLockClick?: () => void;
  sortMode: SortMode;
  onSortModeChange?: (mode: SortMode) => void;
  onToggleAiSort?: () => void;
}

const FOLDERS = [
  { id: 'all', label: 'All', isLocked: false },
  { id: 'inbox', label: 'Inbox', isLocked: false },
  { id: 'unread', label: 'Unread', isLocked: false },
  { id: 'groups', label: 'Groups', isLocked: false },
  { id: 'favorites', label: 'Favorites', isLocked: false },
  { id: 'work', label: 'Work', isLocked: true },
  { id: 'personal', label: 'Personal', isLocked: true },
];

export const SmartFolders: React.FC<SmartFoldersProps> = ({
  activeFolder,
  onSelectFolder,
  onFolderChange,
  isPremium,
  onLockClick,
  sortMode,
  onSortModeChange,
  onToggleAiSort,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleSelect = (folderId: string) => {
    if (onSelectFolder) onSelectFolder(folderId);
    if (onFolderChange) onFolderChange(folderId);
  };

  const handleAiSortToggle = () => {
    if (onToggleAiSort) onToggleAiSort();
    if (onSortModeChange) {
      onSortModeChange(sortMode === 'ai-priority' ? 'timestamp' : 'ai-priority');
    }
  };

  return (
    <div className="relative w-full py-1.5 select-none">
      {/* Scrollable Container with faded edges */}
      <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-bg-primary to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-bg-primary to-transparent pointer-events-none z-10" />

      <div
        ref={containerRef}
        className="flex items-center gap-2 overflow-x-auto px-4 scrollbar-none scroll-smooth"
      >
        {/* Regular folders list */}
        {FOLDERS.map((folder) => {
          const isActive = activeFolder === folder.id;
          return (
            <button
              key={folder.id}
              onClick={() => handleSelect(folder.id)}
              className={`flex items-center gap-1.5 shrink-0 px-5 h-[36px] text-xs transition-all duration-300 rounded-full cursor-pointer border ${
                isActive
                  ? 'bg-accent text-bg-primary border-accent font-semibold shadow-md shadow-accent/15'
                  : 'bg-bg-elevated/60 hover:bg-bg-elevated text-text-secondary border-transparent'
              }`}
            >
              <span>{folder.label}</span>
              {folder.isLocked && (
                <Lock size={10} className={isActive ? 'text-bg-primary' : 'text-text-muted'} />
              )}
            </button>
          );
        })}

        {/* Separator line */}
        <div className="w-px h-5 bg-border-subtle shrink-0 self-center" />

        {/* Gemini AI Sort Trigger */}
        <button
          onClick={handleAiSortToggle}
          className={`flex items-center gap-1 px-5 h-[36px] text-xs transition-all duration-300 rounded-full shrink-0 border cursor-pointer ${
            sortMode === 'ai-priority'
              ? 'bg-gradient-to-r from-accent to-amber-600 text-bg-primary border-accent font-semibold shadow-md shadow-accent/15 animate-pulse'
              : 'bg-bg-elevated/30 hover:bg-bg-elevated/60 text-accent border-accent/10'
          }`}
          title="AI Gemini Sorting"
        >
          <Sparkles size={11} fill="currentColor" />
          <span>AI Sort</span>
        </button>
      </div>
    </div>
  );
};

export default SmartFolders;
