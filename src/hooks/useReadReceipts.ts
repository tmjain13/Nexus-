import { useEffect, useRef } from 'react';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export interface ReadReceipt {
  userId: string;
  timestamp: any;
}

export function useReadReceipts(
  chatId: string, 
  messages: any[], 
  isGroup: boolean, 
  isPeaceMode: boolean = false
) {
  const { user } = useAuth();
  const elementsMap = useRef<Map<string, HTMLElement>>(new Map());
  const pendingRead = useRef<Set<string>>(new Set());
  const pendingDelivered = useRef<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const collectionName = isGroup ? 'groupChat' : 'chats';
  const currentUserId = user?.uid;

  const processPendingUpdates = async () => {
    if (!currentUserId || !chatId) return;

    const readIds = Array.from(pendingRead.current);
    const deliveredIds = Array.from(pendingDelivered.current).filter(
      (id) => !pendingRead.current.has(id)
    );

    if (readIds.length === 0 && deliveredIds.length === 0) return;

    // Clear queues before Firestore calls to prevent double-submitting
    pendingRead.current.clear();
    pendingDelivered.current.clear();

    try {
      const batch = writeBatch(db);

      // Batch up read updates
      readIds.forEach((msgId) => {
        const msgRef = doc(db, `${collectionName}/${chatId}/messages/${msgId}`);
        batch.update(msgRef, {
          status: 'read',
          [`readBy.${currentUserId}`]: serverTimestamp(),
        });
      });

      // Batch up delivered updates
      deliveredIds.forEach((msgId) => {
        const msgRef = doc(db, `${collectionName}/${chatId}/messages/${msgId}`);
        batch.update(msgRef, {
          status: 'delivered',
          [`deliveredTo.${currentUserId}`]: serverTimestamp(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error committing read/delivered receipt batch:', error);
    }
  };

  // Run the batch update worker every 2 seconds
  useEffect(() => {
    batchTimerRef.current = setInterval(() => {
      processPendingUpdates();
    }, 2000);

    return () => {
      if (batchTimerRef.current) {
        clearInterval(batchTimerRef.current);
      }
      // Attempt to flush any pending changes on unmount
      processPendingUpdates();
    };
  }, [chatId, isGroup, currentUserId]);

  // Handle auto-delivered receipts upon loaded messages
  useEffect(() => {
    if (!currentUserId || !messages) return;

    messages.forEach((msg) => {
      if (msg.senderId !== currentUserId) {
        const hasRead =
          msg.readBy?.[currentUserId] !== undefined ||
          (!isGroup && msg.status === 'read');
        const hasDelivered =
          msg.deliveredTo?.[currentUserId] !== undefined ||
          (!isGroup && msg.status === 'delivered');

        if (!hasRead && !hasDelivered) {
          pendingDelivered.current.add(msg.id);
        }
      }
    });
  }, [messages, currentUserId, isGroup]);

  // Intersection Observer for viewport-based read receipts
  useEffect(() => {
    if (!currentUserId) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const msgId = entry.target.getAttribute('data-message-id');
            if (msgId) {
              // Don't mark messages as read if user is in "Peace Mode"
              if (isPeaceMode) {
                return;
              }

              const msg = messages.find((m) => m.id === msgId);
              if (msg && msg.senderId !== currentUserId) {
                const hasRead =
                  msg.readBy?.[currentUserId] !== undefined ||
                  (!isGroup && msg.status === 'read');
                if (!hasRead) {
                  pendingRead.current.add(msgId);
                }
              }
            }
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
      }
    );

    // Observe all currently registered elements
    elementsMap.current.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [chatId, messages, currentUserId, isPeaceMode, isGroup]);

  // Callback ref generator to be attached to message bubbles
  const registerRef = (msgId: string) => (el: HTMLElement | null) => {
    if (el) {
      elementsMap.current.set(msgId, el);
      observerRef.current?.observe(el);
    } else {
      const existingEl = elementsMap.current.get(msgId);
      if (existingEl && observerRef.current) {
        observerRef.current.unobserve(existingEl);
      }
      elementsMap.current.delete(msgId);
    }
  };

  return { registerRef };
}
