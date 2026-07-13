import { useState, useEffect } from 'react';
import { MessageDraft } from './useDraft';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function useDraftPreviews() {
  const [previews, setPreviews] = useState<Record<string, MessageDraft>>({});

  const scanDrafts = () => {
    const keys = Object.keys(localStorage);
    const newPreviews: Record<string, MessageDraft> = {};

    keys.forEach((key) => {
      if (key.startsWith('nexus_draft_')) {
        const chatId = key.replace('nexus_draft_', '');
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const draft: MessageDraft = JSON.parse(value);
            const savedAtTime = new Date(draft.savedAt).getTime();
            
            // Filter out old drafts and empty text drafts
            if (Date.now() - savedAtTime <= SEVEN_DAYS_MS && draft.text.trim()) {
              newPreviews[chatId] = draft;
            }
          } catch (err) {
            // Silently clean up corrupt drafts
            localStorage.removeItem(key);
          }
        }
      }
    });

    setPreviews(newPreviews);
  };

  useEffect(() => {
    // Initial scan
    scanDrafts();

    const handleStorageChange = () => {
      scanDrafts();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return previews;
}
