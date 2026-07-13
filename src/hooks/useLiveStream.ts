import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { LiveStream, StreamComment, StreamTip } from '../types';

export const useLiveStream = (streamId: string) => {
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!streamId) return;
    const unsub = onSnapshot(doc(db, 'streams', streamId), (docSnap) => {
      if (docSnap.exists()) {
        setStream({ id: docSnap.id, ...docSnap.data() } as LiveStream);
      }
      setLoading(false);
    });
    return unsub;
  }, [streamId]);

  const sendComment = async (userId: string, text: string) => {
    await addDoc(collection(db, 'streams', streamId, 'comments'), {
      streamId,
      userId,
      text,
      timestamp: serverTimestamp(),
      isFlagged: false
    });
  };

  const sendTip = async (userId: string, amount: number, message?: string) => {
    await addDoc(collection(db, 'streams', streamId, 'tips'), {
      streamId,
      userId,
      amount,
      message,
      timestamp: serverTimestamp()
    });
  };

  return { stream, loading, sendComment, sendTip };
};
