import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface EmailMessage {
  id: string;
  accountId: string;
  threadId: string;
  subject: string;
  from: { name: string; email: string };
  to: { name: string; email: string }[];
  cc?: string[];
  bcc?: string[];
  body: string;
  bodyHtml?: string;
  attachments: EmailAttachment[];
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  receivedAt: any;
}

export interface EmailThread {
  id: string;
  subject: string;
  participants: string[];
  messages: EmailMessage[];
  lastMessageAt: any;
  isUnread: boolean;
}

export function useEmailInbox(activeAccountFilter?: string | null) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setThreads([]);
      setLoading(false);
      return;
    }

    const path = `users/${user.uid}/emailThreads`;
    // Order threads by lastMessageAt descending
    const q = query(
      collection(db, path)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: EmailThread[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        // Convert dates if needed
        const lastMessageAt = data.lastMessageAt?.toDate ? data.lastMessageAt.toDate() : new Date(data.lastMessageAt);
        const messages = (data.messages || []).map((m: any) => ({
          ...m,
          receivedAt: m.receivedAt?.toDate ? m.receivedAt.toDate() : new Date(m.receivedAt)
        }));

        fetched.push({
          id: docSnap.id,
          subject: data.subject || '',
          participants: data.participants || [],
          messages,
          lastMessageAt,
          isUnread: data.isUnread ?? false
        });
      });

      // Sort in-memory because firestore might complain about compound queries without custom indexes
      fetched.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

      // Apply account filter if active
      const filtered = activeAccountFilter 
        ? fetched.filter(t => t.messages.some(m => m.accountId === activeAccountFilter))
        : fetched;

      setThreads(filtered);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, activeAccountFilter]);

  const markThreadRead = async (threadId: string, isRead: boolean) => {
    if (!user) return;
    const path = `users/${user.uid}/emailThreads/${threadId}`;
    try {
      // Find current thread to update messages array
      const thread = threads.find(t => t.id === threadId);
      if (!thread) return;

      const updatedMessages = thread.messages.map(m => ({
        ...m,
        isRead: isRead
      }));

      await updateDoc(doc(db, `users/${user.uid}/emailThreads`, threadId), {
        isUnread: !isRead,
        messages: updatedMessages
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const starThread = async (threadId: string, isStarred: boolean) => {
    if (!user) return;
    const path = `users/${user.uid}/emailThreads/${threadId}`;
    try {
      const thread = threads.find(t => t.id === threadId);
      if (!thread) return;

      const updatedMessages = thread.messages.map(m => ({
        ...m,
        isStarred: isStarred
      }));

      await updateDoc(doc(db, `users/${user.uid}/emailThreads`, threadId), {
        messages: updatedMessages
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateThreadLabels = async (threadId: string, labels: string[]) => {
    if (!user) return;
    const path = `users/${user.uid}/emailThreads/${threadId}`;
    try {
      const thread = threads.find(t => t.id === threadId);
      if (!thread) return;

      const updatedMessages = thread.messages.map(m => ({
        ...m,
        labels: labels
      }));

      await updateDoc(doc(db, `users/${user.uid}/emailThreads`, threadId), {
        messages: updatedMessages
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const archiveThread = async (threadId: string) => {
    if (!user) return;
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;
    
    // Remove 'Inbox' label, and add 'Archive'
    const currentLabels = thread.messages[0]?.labels || [];
    const newLabels = currentLabels.filter(l => l !== 'Inbox');
    if (!newLabels.includes('Archive')) {
      newLabels.push('Archive');
    }
    await updateThreadLabels(threadId, newLabels);
  };

  const deleteThread = async (threadId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/emailThreads/${threadId}`;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/emailThreads`, threadId));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  return {
    threads,
    loading,
    markThreadRead,
    starThread,
    updateThreadLabels,
    archiveThread,
    deleteThread
  };
}
