import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export interface TypingUser {
  id: string;
  displayName: string;
  isTyping: boolean;
  updatedAt: any;
}

export function useTypingStatus(chatId: string | undefined, isGroup: boolean = false) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    if (!chatId || !user) {
      setTypingUsers([]);
      return;
    }

    const targetCollection = isGroup ? 'groupChat' : 'chats';
    const typingRef = collection(db, targetCollection, chatId, 'typing');

    // Subscribe to typing collection
    const unsubscribe = onSnapshot(
      typingRef,
      (snapshot) => {
        const now = Date.now();
        const users: TypingUser[] = [];

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const userId = docSnap.id;

          // Filter out current user and ensure isTyping is true
          if (userId !== user.uid && data.isTyping) {
            let isFresh = true;
            if (data.updatedAt) {
              const updatedAtMs = data.updatedAt.toDate
                ? data.updatedAt.toDate().getTime()
                : new Date(data.updatedAt).getTime();
              
              // Filter out updates older than 10 seconds
              if (now - updatedAtMs > 10000) {
                isFresh = false;
              }
            }

            if (isFresh) {
              users.push({
                id: userId,
                displayName: data.displayName || 'Someone',
                isTyping: data.isTyping,
                updatedAt: data.updatedAt,
              });
            }
          }
        });

        setTypingUsers(users);
      },
      (err) => {
        console.warn('Typing status subscription failed:', err);
      }
    );

    // Periodic cleanup interval: Filter out stale users every 3 seconds to keep UI responsive
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        return prev.filter((u) => {
          if (!u.updatedAt) return true;
          const updatedAtMs = u.updatedAt.toDate
            ? u.updatedAt.toDate().getTime()
            : new Date(u.updatedAt).getTime();
          return now - updatedAtMs <= 10000;
        });
      });
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [chatId, isGroup, user]);

  return typingUsers;
}
