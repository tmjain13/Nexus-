import { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { summarizeChat, ChatSummary } from '../services/aiService';

export interface PinnedSummary extends ChatSummary {
  pinnedAt: any;
  autoUnpinAt: any;
  messageRange: {
    from: any;
    to: any;
  };
}

export function useChatSummary(chatId: string, isGroup: boolean = false) {
  const [pinnedSummary, setPinnedSummary] = useState<PinnedSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const collectionName = isGroup ? 'groupChat' : 'chats';

  // Listen for pinnedSummary updates
  useEffect(() => {
    if (!chatId) return;

    const docRef = doc(db, collectionName, chatId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const summary = data.pinnedSummary as PinnedSummary | undefined;
        if (summary) {
          // Check for 24 hours expiry
          const pinnedAtMillis = summary.pinnedAt?.toMillis ? summary.pinnedAt.toMillis() : new Date(summary.pinnedAt).getTime();
          const autoUnpinAtMillis = summary.autoUnpinAt?.toMillis ? summary.autoUnpinAt.toMillis() : (pinnedAtMillis + 24 * 60 * 60 * 1000);
          
          if (Date.now() > autoUnpinAtMillis) {
            // Expired, clear locally and trigger unpin
            unpinSummary();
            setPinnedSummary(null);
          } else {
            setPinnedSummary(summary);
          }
        } else {
          setPinnedSummary(null);
        }
      } else {
        setPinnedSummary(null);
      }
    }, (err) => {
      console.error("Error listening to pinnedSummary:", err);
    });

    return () => unsubscribe();
  }, [chatId, isGroup]);

  const generateSummary = async (messagesToSummarize: any[]): Promise<ChatSummary> => {
    setIsLoading(true);
    try {
      const result = await summarizeChat(messagesToSummarize);
      return result;
    } catch (err) {
      console.error("generateSummary error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const pinSummary = async (summary: ChatSummary, messageRange: { from: any; to: any }) => {
    if (!chatId) return;
    const docRef = doc(db, collectionName, chatId);
    
    const pinnedAt = new Date();
    const autoUnpinAt = new Date(pinnedAt.getTime() + 24 * 60 * 60 * 1000);

    const pinnedData: PinnedSummary = {
      ...summary,
      pinnedAt,
      autoUnpinAt,
      messageRange
    };

    await updateDoc(docRef, {
      pinnedSummary: pinnedData
    });
  };

  const unpinSummary = async () => {
    if (!chatId) return;
    const docRef = doc(db, collectionName, chatId);
    await updateDoc(docRef, {
      pinnedSummary: null
    });
  };

  return {
    generateSummary,
    pinSummary,
    unpinSummary,
    pinnedSummary,
    isLoading
  };
}
