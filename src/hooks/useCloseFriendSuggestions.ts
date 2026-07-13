import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { secureFetch } from '../lib/secureFetch';
import { CloseFriendSuggestion } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

export function useCloseFriendSuggestions() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<CloseFriendSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from Firestore user doc
  useEffect(() => {
    if (!user) {
      setSuggestions([]);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const rawSuggestions: CloseFriendSuggestion[] = data.closeFriendSuggestions || [];
        const dismissed: Record<string, any> = data.dismissedSuggestions || {};

        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

        // Filter out suggestions that are recently dismissed (< 30 days)
        const activeSuggestions = rawSuggestions.filter(s => {
          const dismissedVal = dismissed[s.userId];
          if (!dismissedVal) return true;
          
          const dismissedTime = dismissedVal.seconds 
            ? dismissedVal.seconds * 1000 
            : new Date(dismissedVal).getTime();
            
          return (now - dismissedTime) >= thirtyDaysMs;
        });

        setSuggestions(activeSuggestions);
      }
    }, (err) => {
      console.error("Error watching suggestions:", err);
    });

    return () => unsubscribe();
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await secureFetch('/api/ai/close-friends-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze chat patterns.");
      }
    } catch (err: any) {
      console.error("Error refreshing close friends suggestions:", err);
      setError(err.message || "Diagnostic check failed.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const dismiss = useCallback(async (suggestedUserId: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Save dismiss timestamp in dismissedSuggestions map
      await updateDoc(userRef, {
        [`dismissedSuggestions.${suggestedUserId}`]: Timestamp.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  }, [user]);

  return {
    suggestions,
    loading,
    error,
    refresh,
    dismiss
  };
}
