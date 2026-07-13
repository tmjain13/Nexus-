import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, writeBatch, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { ChatSummary } from '../services/aiService';

export interface HistorySummary extends ChatSummary {
  id: string;
  chatId: string;
  chatName: string;
  messageCount: number;
  createdAt: any;
}

export function useSummaryHistory() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<HistorySummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setSummaries([]);
      setLoading(false);
      return;
    }

    const summariesRef = collection(db, 'users', user.uid, 'summaries');
    const q = query(summariesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyItems: HistorySummary[] = [];
      snapshot.forEach((docSnap) => {
        historyItems.push({
          id: docSnap.id,
          ...docSnap.data()
        } as HistorySummary);
      });
      setSummaries(historyItems);
      setLoading(false);
    }, (err) => {
      console.error("Error reading summaries history:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addSummaryToHistory = async (chatId: string, chatName: string, summary: ChatSummary, messageCount: number) => {
    if (!user) return;
    const summariesRef = collection(db, 'users', user.uid, 'summaries');
    await addDoc(summariesRef, {
      ...summary,
      chatId,
      chatName,
      messageCount,
      createdAt: new Date()
    });
  };

  const deleteSummary = async (summaryId: string) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid, 'summaries', summaryId);
    await deleteDoc(docRef);
  };

  const clearHistory = async () => {
    if (!user) return;
    const summariesRef = collection(db, 'users', user.uid, 'summaries');
    const snapshot = await getDocs(summariesRef);
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  };

  return {
    summaries,
    loading,
    addSummaryToHistory,
    deleteSummary,
    clearHistory
  };
}
