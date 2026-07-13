import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { secureFetch } from '../lib/secureFetch';

export interface SearchFilter {
  type: 'source' | 'sender' | 'date' | 'type';
  value: string;
}

export interface SearchResult {
  id: string;
  source: 'chat' | 'email' | 'document' | 'calendar' | 'wallet' | 'contact' | 'channel' | 'workspace';
  title: string;
  preview: string;
  timestamp: any;
  relevance: number;
  data: any;
  highlights: string[];
  isSensitive?: boolean;
}

export interface SearchResponse {
  query: string;
  intent: string;
  summary: string;
  results: SearchResult[];
  totalCount: number;
}

export function useUniversalSearch() {
  const { user } = useAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [intent, setIntent] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const search = async (queryText: string, activeFilters: SearchFilter[] = []) => {
    if (!queryText || !queryText.trim()) {
      setResults([]);
      setIntent('');
      setSummary('');
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsOfflineMode(!navigator.onLine);

    // 1. Gather Client-Side Local Data to merge/rank
    const uid = user?.uid || 'guest';
    
    let localTasks: any[] = [];
    let localEvents: any[] = [];
    let localVaultChats: any[] = [];
    let localVaultMedia: any[] = [];

    try {
      const storedTasks = localStorage.getItem(`enclave_tasks_${uid}`);
      if (storedTasks) localTasks = JSON.parse(storedTasks);

      const storedEvents = localStorage.getItem(`enclave_events_${uid}`);
      if (storedEvents) localEvents = JSON.parse(storedEvents);

      const storedVaultChats = localStorage.getItem(`aero_vault_chats_${uid}`);
      if (storedVaultChats) localVaultChats = JSON.parse(storedVaultChats);

      const storedVaultMedia = localStorage.getItem(`aero_vault_media_${uid}`);
      if (storedVaultMedia) localVaultMedia = JSON.parse(storedVaultMedia);
    } catch (e) {
      console.warn('Error reading local search data:', e);
    }

    const localData = {
      tasks: localTasks,
      events: localEvents,
      vaultChats: localVaultChats,
      vaultMedia: localVaultMedia
    };

    // 2. Perform Search (Server-side with Client fallback)
    if (navigator.onLine) {
      try {
        const response = await secureFetch('/api/ai/universal-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: queryText, localData }),
        });

        if (!response.ok) {
          throw new Error('Server search returned non-OK status');
        }

        const data: SearchResponse = await response.json();
        
        // Apply active frontend filters to results if specified
        let filteredResults = data.results;
        if (activeFilters.length > 0) {
          activeFilters.forEach((filter) => {
            const val = filter.value.toLowerCase();
            if (filter.type === 'source') {
              filteredResults = filteredResults.filter(r => r.source === val);
            } else if (filter.type === 'sender') {
              filteredResults = filteredResults.filter(r => r.preview.toLowerCase().includes(val) || r.title.toLowerCase().includes(val));
            } else if (filter.type === 'type') {
              filteredResults = filteredResults.filter(r => r.preview.toLowerCase().includes(val) || r.title.toLowerCase().includes(val));
            }
          });
        }

        setResults(filteredResults);
        setIntent(data.intent || 'General Query');
        setSummary(data.summary || 'Search complete.');
        setIsOfflineMode(false);
      } catch (err: any) {
        console.warn('Backend search failed, falling back to local search:', err);
        runLocalOfflineSearch(queryText, activeFilters, localData);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Direct Local-Only Offline Search
      runLocalOfflineSearch(queryText, activeFilters, localData);
      setIsLoading(false);
    }
  };

  const runLocalOfflineSearch = (queryText: string, activeFilters: SearchFilter[], localData: any) => {
    setIsOfflineMode(true);
    setIntent('Offline Local Search');
    setSummary('Network offline. Searching cached local data only. Limited results.');

    const localResults: SearchResult[] = [];
    const lowerQuery = queryText.toLowerCase();
    const keywords = [lowerQuery];

    // Search tasks
    localData.tasks.forEach((task: any) => {
      const matchText = `${task.title} ${task.category} ${task.status}`.toLowerCase();
      if (matchText.includes(lowerQuery)) {
        localResults.push({
          id: task.id,
          source: 'workspace',
          title: task.title || 'Untitled Task',
          preview: `Category: ${task.category || 'Workspace'} | Status: ${task.status || 'pending'} | Priority: ${task.priority || 'Medium'}`,
          timestamp: new Date().toISOString(),
          relevance: 90,
          highlights: [queryText],
          data: task
        });
      }
    });

    // Search local events
    localData.events.forEach((ev: any) => {
      const matchText = `${ev.title} ${ev.time} ${ev.attendees} ${ev.category}`.toLowerCase();
      if (matchText.includes(lowerQuery)) {
        localResults.push({
          id: ev.id,
          source: 'workspace',
          title: ev.title || 'Untitled Workspace Event',
          preview: `Scheduled: ${ev.time || ''} | Attendees: ${ev.attendees || ''} | Category: ${ev.category || ''}`,
          timestamp: new Date().toISOString(),
          relevance: 90,
          highlights: [queryText],
          data: ev
        });
      }
    });

    // Search vault chats
    localData.vaultChats.forEach((chat: any) => {
      const text = chat.text || chat.message || '';
      if (text.toLowerCase().includes(lowerQuery)) {
        localResults.push({
          id: chat.id,
          source: 'wallet',
          title: 'Vault Secure Chat Entry',
          preview: text,
          timestamp: chat.timestamp || new Date().toISOString(),
          relevance: 95,
          isSensitive: true,
          highlights: [queryText],
          data: chat
        });
      }
    });

    // Search vault media
    localData.vaultMedia.forEach((media: any) => {
      const matchText = `${media.title} ${media.description}`.toLowerCase();
      if (matchText.includes(lowerQuery)) {
        localResults.push({
          id: media.id,
          source: 'wallet',
          title: media.title || 'Vault Encrypted Resource',
          preview: media.description || 'Secure encrypted credentials/media',
          timestamp: media.timestamp || new Date().toISOString(),
          relevance: 95,
          isSensitive: true,
          highlights: [queryText],
          data: media
        });
      }
    });

    // Apply active frontend filters
    let filteredResults = localResults;
    if (activeFilters.length > 0) {
      activeFilters.forEach((filter) => {
        const val = filter.value.toLowerCase();
        if (filter.type === 'source') {
          filteredResults = filteredResults.filter(r => r.source === val);
        } else if (filter.type === 'sender') {
          filteredResults = filteredResults.filter(r => r.preview.toLowerCase().includes(val) || r.title.toLowerCase().includes(val));
        } else if (filter.type === 'type') {
          filteredResults = filteredResults.filter(r => r.preview.toLowerCase().includes(val) || r.title.toLowerCase().includes(val));
        }
      });
    }

    setResults(filteredResults);
  };

  return {
    search,
    results,
    isLoading,
    intent,
    summary,
    error,
    isOfflineMode
  };
}

export default useUniversalSearch;
