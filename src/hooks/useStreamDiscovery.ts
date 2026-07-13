import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { LiveStream } from '../types';

export const useStreamDiscovery = () => {
  const [liveNow, setLiveNow] = useState<LiveStream[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'streams'), where('status', '==', 'live'));
    const unsub = onSnapshot(q, (snapshot) => {
      setLiveNow(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveStream)));
    });
    return unsub;
  }, []);

  return { liveNow };
};
