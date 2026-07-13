import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { NowPlaying } from '../types';

export const useSharedListening = (chatId: string) => {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);

  useEffect(() => {
    if (!chatId) return;
    const unsub = onSnapshot(doc(db, 'nowPlaying', chatId), (docSnap) => {
      if (docSnap.exists()) {
        setNowPlaying(docSnap.data() as NowPlaying);
      }
    });
    return unsub;
  }, [chatId]);

  const join = async (userId: string) => {
    await updateDoc(doc(db, 'nowPlaying', chatId), { listeners: arrayUnion(userId) });
  };

  const leave = async (userId: string) => {
    await updateDoc(doc(db, 'nowPlaying', chatId), { listeners: arrayRemove(userId) });
  };

  const sync = async (data: Partial<NowPlaying>) => {
    await updateDoc(doc(db, 'nowPlaying', chatId), data);
  };

  return { nowPlaying, join, leave, sync };
};
