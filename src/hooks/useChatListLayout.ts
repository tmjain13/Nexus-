import { useState, useEffect } from 'react';

export type ChatListView = 'list' | 'grid' | 'compact';
export type SortMode = 'recent' | 'unread' | 'ai-priority';

export function useChatListLayout() {
  const [layout, setLayout] = useState<ChatListView>(() => {
    const saved = localStorage.getItem('nexus_chat_layout');
    return (saved as ChatListView) || 'list';
  });

  const [sortMode, setSortMode] = useState<SortMode>(() => {
    const saved = localStorage.getItem('nexus_chat_sort_mode');
    return (saved as SortMode) || 'recent';
  });

  useEffect(() => {
    localStorage.setItem('nexus_chat_layout', layout);
  }, [layout]);

  useEffect(() => {
    localStorage.setItem('nexus_chat_sort_mode', sortMode);
  }, [sortMode]);

  return {
    layout,
    setLayout,
    sortMode,
    setSortMode,
  };
}
