import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getSmartCompose } from '../services/aiService';
import { useComposeSettings } from './useComposeSettings';

interface SmartComposeState {
  partialText: string;
  suggestion: string;
  isLoading: boolean;
  isVisible: boolean;
}

// Simple local cache for rejected suggestions to implement "don't show similar for 5 minutes"
const rejectedCache: { [suggestion: string]: number } = {};

export function useSmartCompose(chatId: string, partialText: string, isGroup: boolean = false) {
  const { settings } = useComposeSettings();
  const [state, setState] = useState<SmartComposeState>({
    partialText: '',
    suggestion: '',
    isLoading: false,
    isVisible: false,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cancelFetchRef = useRef<boolean>(false);

  // Clear state when chatId changes
  useEffect(() => {
    setState({
      partialText: '',
      suggestion: '',
      isLoading: false,
      isVisible: false,
    });
  }, [chatId]);

  useEffect(() => {
    // If Smart Compose is disabled, do nothing
    if (!settings.enabled) {
      setState(prev => ({ ...prev, isVisible: false, suggestion: '' }));
      return;
    }

    // Cancel existing timers and pending fetches
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    cancelFetchRef.current = true;

    const trimmed = partialText.trim();
    // Requirements: after 3+ words typed, pause 300ms, then fetch suggestion
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length < 3) {
      setState(prev => ({ ...prev, partialText, isVisible: false, suggestion: '' }));
      return;
    }

    // Check if input is a URL or a command (Edge Cases)
    const lastWord = words[words.length - 1];
    const isUrl = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(lastWord);
    const isCommand = lastWord.startsWith('/') || lastWord.startsWith('!');
    if (isUrl || isCommand) {
      setState(prev => ({ ...prev, partialText, isVisible: false, suggestion: '' }));
      return;
    }

    // Start 300ms debounce
    cancelFetchRef.current = false;
    timerRef.current = setTimeout(async () => {
      if (cancelFetchRef.current) return;

      setState(prev => ({ ...prev, partialText, isLoading: true, isVisible: false }));

      try {
        // 1. Fetch conversation history (last 5 messages)
        const collectionName = isGroup ? 'groupChat' : 'chats';
        const messagesRef = collection(db, collectionName, chatId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);
        
        const historyMsgs: any[] = [];
        querySnapshot.forEach((doc) => {
          historyMsgs.push(doc.data());
        });
        historyMsgs.reverse();
        
        const formattedHistory = historyMsgs
          .map(m => `${m.senderName || m.senderId || 'Participant'}: ${m.text || ''}`)
          .join('\n');

        // 2. Fetch local writing style samples if enabled
        let styleContext = '';
        if (settings.learnStyle) {
          try {
            const savedSamples = localStorage.getItem('nexus_user_style_samples');
            if (savedSamples) {
              const samples: string[] = JSON.parse(savedSamples);
              if (samples.length > 0) {
                styleContext = `\nUser's typical writing style samples:\n${samples.slice(-15).map(s => `- ${s}`).join('\n')}\nPlease emulate this tone, phrasing, capitalization, punctuation, and emoji density.`;
              }
            }
          } catch (e) {
            console.error("Failed to read user style samples:", e);
          }
        }

        // 3. Environment/Context Clues
        const now = new Date();
        const hour = now.getHours();
        let timeContext = '';
        if (hour >= 5 && hour < 12) timeContext = "Current time is Morning.";
        else if (hour >= 12 && hour < 17) timeContext = "Current time is Afternoon.";
        else if (hour >= 17 && hour < 21) timeContext = "Current time is Evening.";
        else timeContext = "Current time is Night/Late Evening.";

        // 4. Construct Prompt
        const prompt = `Complete this message naturally in a chat context. 
Conversation history (last 5 messages):
${formattedHistory || 'No preceding history.'}

Current draft: '${trimmed}'
${timeContext}${styleContext}

Suggest completion (max 100 chars, natural, conversational):
The suggestion should be ONLY the continuation of the user's current draft, so that when appended to the draft, it flows seamlessly. Do not repeat what they already typed. Keep it brief.`;

        // 5. Call API
        const suggestionResult = await getSmartCompose(prompt);
        
        if (cancelFetchRef.current) return;

        let cleanSuggestion = suggestionResult.trim();

        // Check if suggestion is in rejected cache and still valid (within 5 minutes)
        const rejectedTime = rejectedCache[cleanSuggestion.toLowerCase()];
        const isCooldownActive = rejectedTime && (Date.now() - rejectedTime < 5 * 60 * 1000);

        if (cleanSuggestion && !isCooldownActive) {
          setState({
            partialText,
            suggestion: cleanSuggestion,
            isLoading: false,
            isVisible: true,
          });
        } else {
          setState({
            partialText,
            suggestion: '',
            isLoading: false,
            isVisible: false,
          });
        }
      } catch (err) {
        console.error("Smart compose fetch failed:", err);
        if (!cancelFetchRef.current) {
          setState({
            partialText,
            suggestion: '',
            isLoading: false,
            isVisible: false,
          });
        }
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      cancelFetchRef.current = true;
    };
  }, [partialText, chatId, settings.enabled, settings.learnStyle, isGroup]);

  const accept = (): string => {
    const fullText = (partialText + ' ' + state.suggestion).trim().replace(/\s+/g, ' ');
    setState(prev => ({ ...prev, suggestion: '', isVisible: false }));
    return fullText;
  };

  const dismiss = () => {
    if (state.suggestion) {
      // Put the dismissed suggestion in rejected cache
      rejectedCache[state.suggestion.toLowerCase()] = Date.now();
    }
    setState(prev => ({ ...prev, suggestion: '', isVisible: false }));
  };

  return {
    suggestion: state.isVisible ? state.suggestion : '',
    accept,
    dismiss,
    isLoading: state.isLoading,
  };
}

// Helper to save sent messages locally for style learning
export function learnSentMessage(text: string) {
  const trimmed = text.trim();
  if (trimmed.length < 10 || trimmed.includes('/') || trimmed.startsWith('http')) return;
  try {
    const saved = localStorage.getItem('nexus_user_style_samples');
    let samples: string[] = saved ? JSON.parse(saved) : [];
    
    // De-duplicate and keep last 30 messages
    samples = samples.filter(s => s !== trimmed);
    samples.push(trimmed);
    if (samples.length > 30) {
      samples.shift();
    }
    localStorage.setItem('nexus_user_style_samples', JSON.stringify(samples));
  } catch (e) {
    console.error("Failed to save writing style sample:", e);
  }
}
