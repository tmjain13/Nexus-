import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export interface HistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

export function useSearchHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const key = user ? `nexus_search_history_${user.uid}` : 'nexus_search_history_guest';

  // Load history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse search history:', e);
        setHistory([]);
      }
    } else {
      setHistory([]);
    }
  }, [key]);

  // Save a new search query
  const saveSearch = (queryText: string) => {
    if (!queryText || !queryText.trim()) return;
    const cleanQuery = queryText.trim();
    
    setHistory((prev) => {
      // Remove any existing duplicate of this query
      const filtered = prev.filter((item) => item.query.toLowerCase() !== cleanQuery.toLowerCase());
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        query: cleanQuery,
        timestamp: Date.now(),
      };
      const updated = [newItem, ...filtered].slice(0, 15); // limit to 15 items
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
  };

  // Clear all history
  const clearHistory = () => {
    localStorage.removeItem(key);
    setHistory([]);
  };

  // Re-run search
  const reRunSearch = (queryText: string, onSearch: (q: string) => void) => {
    saveSearch(queryText);
    onSearch(queryText);
  };

  return {
    history,
    saveSearch,
    clearHistory,
    reRunSearch,
  };
}

export default useSearchHistory;
