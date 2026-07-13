import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { usePeaceMode } from './usePeaceMode';

export function useMessageLimit() {
  const { user } = useAuth();
  const { isEnabled, settings } = usePeaceMode();
  const [messagesSentThisHour, setMessagesSentThisHour] = useState<number>(0);
  const [hourStarted, setHourStarted] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const limit = settings?.messageLimit || 20;

  useEffect(() => {
    if (!user || !isEnabled) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'users', user.uid, 'peaceModeStats', 'currentHour');
    const unsub = onSnapshot(docRef, (snapshot) => {
      setLoading(false);
      if (snapshot.exists()) {
        const data = snapshot.data();
        const startedTime = data.hourStarted?.toDate ? data.hourStarted.toDate() : new Date(data.hourStarted);
        const elapsed = Date.now() - startedTime.getTime();

        if (elapsed > 3600000) {
          // Reset hour
          setDoc(docRef, {
            messagesSentThisHour: 0,
            hourStarted: serverTimestamp()
          });
          setMessagesSentThisHour(0);
          setHourStarted(new Date());
        } else {
          setMessagesSentThisHour(data.messagesSentThisHour || 0);
          setHourStarted(startedTime);
        }
      } else {
        // Initialize
        setDoc(docRef, {
          messagesSentThisHour: 0,
          hourStarted: serverTimestamp()
        });
        setMessagesSentThisHour(0);
        setHourStarted(new Date());
      }
    });

    return () => unsub();
  }, [user, isEnabled]);

  const incrementMessageCount = async () => {
    if (!user || !isEnabled) return;
    const docRef = doc(db, 'users', user.uid, 'peaceModeStats', 'currentHour');
    try {
      const snap = await getDoc(docRef);
      let count = 0;
      let started = new Date();
      if (snap.exists()) {
        const data = snap.data();
        count = data.messagesSentThisHour || 0;
        started = data.hourStarted?.toDate ? data.hourStarted.toDate() : new Date(data.hourStarted);
      }

      const elapsed = Date.now() - started.getTime();
      if (elapsed > 3600000) {
        await setDoc(docRef, {
          messagesSentThisHour: 1,
          hourStarted: serverTimestamp()
        });
      } else {
        await updateDoc(docRef, {
          messagesSentThisHour: count + 1
        });
      }

      // Also increment today's total stats
      const today = new Date().toISOString().split('T')[0];
      const todayRef = doc(db, 'users', user.uid, 'peaceModeStats', today);
      const todaySnap = await getDoc(todayRef);
      if (todaySnap.exists()) {
        await updateDoc(todayRef, {
          messagesSent: todaySnap.data().messagesSent + 1
        });
      } else {
        await setDoc(todayRef, {
          date: today,
          minutesInPeaceMode: 0,
          focusSessions: 0,
          messagesSent: 1,
          notificationsBlocked: 0,
          peaceScore: 85
        });
      }
    } catch (err) {
      console.warn("Failed to increment message limit counter:", err);
    }
  };

  const resetHour = async () => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid, 'peaceModeStats', 'currentHour');
    try {
      await setDoc(docRef, {
        messagesSentThisHour: 0,
        hourStarted: serverTimestamp()
      });
    } catch (err) {
      console.warn("Failed to reset hour limit:", err);
    }
  };

  const messagesLeft = Math.max(0, limit - messagesSentThisHour);
  const isLocked = isEnabled && messagesSentThisHour >= limit;
  
  // 80% limit check
  const warning = isEnabled && messagesSentThisHour >= limit * 0.8 && messagesSentThisHour < limit
    ? `${messagesLeft} message${messagesLeft !== 1 ? 's' : ''} left this hour`
    : null;

  return {
    messagesLeft,
    isLocked,
    warning,
    messagesSentThisHour,
    limit,
    incrementMessageCount,
    resetHour,
    loading
  };
}
