import { useState, useEffect } from 'react';

export interface ShortcutItem {
  keys: string;
  description: string;
  action: () => void;
  category: 'General' | 'Navigation' | 'Chat Room';
}

export function useKeyboardShortcuts(onTabChange?: (tabIndex: number) => void) {
  const [showHelp, setShowHelp] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>([]);

  const registerShortcut = (shortcut: ShortcutItem) => {
    setShortcuts((prev) => {
      // Avoid duplicate registration
      if (prev.some((s) => s.keys === shortcut.keys && s.description === shortcut.description)) {
        return prev;
      }
      return [...prev, shortcut];
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isMeta = isMac ? e.metaKey : e.ctrlKey;

      // Escape key to close modals or help
      if (e.key === 'Escape') {
        setShowHelp(false);
        const closeBtn = document.getElementById('close-search-overlay-btn') || 
                         document.getElementById('voice-search-mic-btn');
        if (closeBtn) closeBtn.click();
      }

      // Help menu shortcut: Cmd/Ctrl + /
      if (isMeta && e.key === '/') {
        e.preventDefault();
        setShowHelp((prev) => !prev);
      }

      // Tab Swappers: Cmd/Ctrl + 1 to 6
      if (isMeta && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        const tabIndex = parseInt(e.key, 10) - 1;
        if (onTabChange) {
          onTabChange(tabIndex);
        } else {
          // Fallback direct redirection based on tabs
          const paths = ['/chats', '/inbox', '/calls', '/reels', '/vault', '/profile'];
          const target = paths[tabIndex];
          if (target) {
            window.location.hash = target; // or router push
            const customEvent = new CustomEvent('nexus-tab-switch', { detail: { path: target } });
            window.dispatchEvent(customEvent);
          }
        }
      }

      // Search Focus: Cmd/Ctrl + E
      if (isMeta && e.key === 'e') {
        e.preventDefault();
        const searchInput = document.getElementById('nexus-universal-search-input') || 
                            document.getElementById('floating-search-input');
        if (searchInput) {
          searchInput.focus();
        } else {
          // Open search overlay
          window.dispatchEvent(new CustomEvent('open-universal-search'));
        }
      }

      // New Chat Shortcut: Cmd/Ctrl + N
      if (isMeta && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        const newChatBtn = document.getElementById('new-dm-btn') || document.getElementById('new-chat-floating-btn');
        if (newChatBtn) newChatBtn.click();
      }

      // New Group Shortcut: Cmd/Ctrl + Shift + N
      if (isMeta && e.shiftKey && e.key === 'n') {
        e.preventDefault();
        const groupBtn = document.getElementById('create-group-btn');
        if (groupBtn) groupBtn.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTabChange]);

  return {
    shortcuts,
    showHelp,
    setShowHelp,
    registerShortcut,
  };
}

export default useKeyboardShortcuts;
