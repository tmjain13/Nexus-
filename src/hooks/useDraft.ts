import { useState, useEffect } from 'react';

export interface MessageDraft {
  text: string;
  savedAt: string;
  chatId: string;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function useDraft(chatId: string) {
  const [draftText, setDraftText] = useState<string>('');
  const [isDraftSaved, setIsDraftSaved] = useState<boolean>(false);
  const [warning, setWarning] = useState<string | null>(null);

  // Load draft on mount or when chatId changes
  useEffect(() => {
    if (!chatId) {
      setDraftText('');
      setIsDraftSaved(false);
      setWarning(null);
      return;
    }

    const key = `nexus_draft_${chatId}`;
    const rawValue = localStorage.getItem(key);

    if (rawValue) {
      try {
        const draft: MessageDraft = JSON.parse(rawValue);
        const savedAtTime = new Date(draft.savedAt).getTime();
        
        if (Date.now() - savedAtTime > SEVEN_DAYS_MS) {
          // Exceeded 7 days, delete and start fresh
          localStorage.removeItem(key);
          setDraftText('');
          setIsDraftSaved(false);
          setWarning(null);
        } else {
          // Valid draft, load it
          setDraftText(draft.text);
          setIsDraftSaved(false); // It is loaded, not newly auto-saved
          setWarning(draft.text.length >= 2000 ? 'Draft exceeds the 2000 character limit and was truncated.' : null);
        }
      } catch (err) {
        // Invalid JSON, delete and start fresh
        console.error('Error parsing draft from localStorage:', err);
        localStorage.removeItem(key);
        setDraftText('');
        setIsDraftSaved(false);
        setWarning(null);
      }
    } else {
      setDraftText('');
      setIsDraftSaved(false);
      setWarning(null);
    }
  }, [chatId]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!chatId) return;

    // If text is empty or only whitespace, delete the draft
    if (!draftText.trim()) {
      const key = `nexus_draft_${chatId}`;
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        window.dispatchEvent(new Event('storage'));
      }
      setIsDraftSaved(false);
      setWarning(null);
      return;
    }

    let isCancelled = false;

    // Debounce duration: 100ms for instant saving so navigating away is preserved
    const handler = setTimeout(() => {
      saveDraft();
    }, 100);

    function saveDraft() {
      if (isCancelled) return;
      let textToSave = draftText;
      let limitWarning: string | null = null;

      if (draftText.length > 2000) {
        textToSave = draftText.slice(0, 2000);
        limitWarning = 'Draft exceeds the 2000 character limit and was truncated.';
        setWarning(limitWarning);
        setDraftText(textToSave);
      } else {
        setWarning(null);
      }

      const draft: MessageDraft = {
        text: textToSave,
        savedAt: new Date().toISOString(),
        chatId: chatId,
      };

      try {
        localStorage.setItem(`nexus_draft_${chatId}`, JSON.stringify(draft));
        setIsDraftSaved(true);
        window.dispatchEvent(new Event('storage'));

        // Fade out indicator after 2s
        const fadeTimer = setTimeout(() => {
          setIsDraftSaved(false);
        }, 2000);

        return () => clearTimeout(fadeTimer);
      } catch (err) {
        // Catch localStorage full (quota exceeded)
        console.error('Failed to save draft to localStorage (quota exceeded):', err);
        setIsDraftSaved(false);
      }
    }

    return () => {
      isCancelled = true;
      clearTimeout(handler);
      // Immediately save on unmount/cleanup to guarantee persistence when navigating away!
      if (draftText.trim()) {
        let textToSave = draftText;
        if (draftText.length > 2000) {
          textToSave = draftText.slice(0, 2000);
        }
        const draft: MessageDraft = {
          text: textToSave,
          savedAt: new Date().toISOString(),
          chatId: chatId,
        };
        try {
          localStorage.setItem(`nexus_draft_${chatId}`, JSON.stringify(draft));
          window.dispatchEvent(new Event('storage'));
        } catch (e) {
          console.error('Failed to save draft on cleanup:', e);
        }
      }
    };
  }, [draftText, chatId]);

  // Sync draft across tabs via StorageEvent and same-tab custom event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | Event) => {
      if (e instanceof StorageEvent) {
        if (e.key === `nexus_draft_${chatId}`) {
          if (e.newValue) {
            try {
              const draft: MessageDraft = JSON.parse(e.newValue);
              if (draft.text !== draftText) {
                setDraftText(draft.text);
              }
            } catch (err) {
              console.error('Error parsing cross-tab draft JSON:', err);
            }
          } else {
            setDraftText('');
          }
        }
      } else {
        // Custom storage event (for same-tab sync)
        const key = `nexus_draft_${chatId}`;
        const rawValue = localStorage.getItem(key);
        if (rawValue) {
          try {
            const draft: MessageDraft = JSON.parse(rawValue);
            if (draft.text !== draftText) {
              setDraftText(draft.text);
            }
          } catch (err) {
            console.error('Error parsing same-tab draft JSON:', err);
          }
        } else {
          setDraftText('');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [chatId, draftText]);

  const clearDraft = () => {
    if (!chatId) return;
    localStorage.removeItem(`nexus_draft_${chatId}`);
    setDraftText('');
    setIsDraftSaved(false);
    setWarning(null);
    window.dispatchEvent(new Event('storage'));
  };

  const saveDraft = (text: string) => {
    setDraftText(text);
  };

  // Perform migration/cleanup on load (older than 7 days)
  useEffect(() => {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith('nexus_draft_')) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const draft: MessageDraft = JSON.parse(value);
            const savedAtTime = new Date(draft.savedAt).getTime();
            if (Date.now() - savedAtTime > SEVEN_DAYS_MS) {
              localStorage.removeItem(key);
              window.dispatchEvent(new Event('storage'));
            }
          } catch (err) {
            localStorage.removeItem(key);
            window.dispatchEvent(new Event('storage'));
          }
        }
      }
    });
  }, []);

  return {
    draftText,
    setDraftText,
    saveDraft,
    clearDraft,
    isDraftSaved,
    warning,
  };
}
