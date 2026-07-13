import { useEffect, useRef } from 'react';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export function useTypingIndicator(chatId: string | undefined, isGroup: boolean = false) {
  const { user } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveRef = useRef<number>(0);

  const targetCollection = isGroup ? 'groupChat' : 'chats';

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!user || !chatId) return;
    try {
      const docRef = doc(db, targetCollection, chatId, 'typing', user.uid);
      if (isTyping) {
        await setDoc(
          docRef,
          {
            isTyping: true,
            displayName: user.displayName || 'Someone',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        await deleteDoc(docRef);
      }
    } catch (err) {
      console.warn('Failed to update typing status:', err);
    }
  };

  const registerTypingActivity = () => {
    if (!user || !chatId) return;

    // Clear previous idle timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const now = Date.now();
    // Only write to Firestore at most once every 500ms (debounce/throttle writes)
    if (now - lastActiveRef.current > 500) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(true);
        lastActiveRef.current = Date.now();
      }, 300);
    }

    // Set idle timeout: stop typing indicator after 3 seconds of silence
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 3000);
  };

  const clearTypingStatus = async () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    await updateTypingStatus(false);
  };

  // Cleanup on unmount or chatId change
  useEffect(() => {
    return () => {
      if (user && chatId) {
        updateTypingStatus(false).catch(console.warn);
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [chatId, user]);

  return {
    registerTypingActivity,
    clearTypingStatus,
  };
}
