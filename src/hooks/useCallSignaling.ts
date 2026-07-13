import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export interface IncomingCall {
  id: string;
  callerId: string;
  callerName: string;
  type: 'audio' | 'video';
}

export function useCallSignaling() {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'calls'),
      where('calleeId', '==', user.uid),
      where('status', '==', 'ringing')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const ringing = snapshot.docs.find(d => d.data().status === 'ringing');
      if (ringing) {
        const data = ringing.data();
        setIncomingCall({
          id: ringing.id,
          callerId: data.callerId,
          callerName: data.callerName || 'Unknown Caller',
          type: data.type || 'audio',
        });
      } else {
        setIncomingCall(null);
      }
    }, (err) => {
      console.warn("Incoming call listener error (might need Firestore index):", err);
    });

    return unsub;
  }, [user]);

  return { incomingCall, clearIncomingCall: () => setIncomingCall(null) };
}
