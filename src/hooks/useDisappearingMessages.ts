import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export type DisappearingTimer = 0 | 5 | 60 | 3600 | 86400 | 604800 | 7776000; // in seconds

export interface DisappearingSettings {
  timer: DisappearingTimer;
  enabledAt: Timestamp | null;
  enabledBy: string | null;
}

export function useDisappearingMessages(chatId: string, isGroup: boolean = false) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<DisappearingSettings>({
    timer: 0,
    enabledAt: null,
    enabledBy: null
  });
  const [loading, setLoading] = useState(true);

  const collectionName = isGroup ? 'groupChat' : 'chats';

  useEffect(() => {
    if (!chatId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, collectionName, chatId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const settingsData = data.settings || {};
        const disappearingTimer = settingsData.disappearingTimer || 0;
        const enabledAt = settingsData.disappearingEnabledAt || null;
        const enabledBy = settingsData.disappearingEnabledBy || null;

        setSettings({
          timer: disappearingTimer as DisappearingTimer,
          enabledAt,
          enabledBy
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching disappearing settings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId, collectionName]);

  const updateTimer = async (timerValue: DisappearingTimer) => {
    if (!chatId || !user) return;
    const docRef = doc(db, collectionName, chatId);
    try {
      await updateDoc(docRef, {
        'settings.disappearingTimer': timerValue,
        'settings.disappearingEnabledAt': timerValue > 0 ? Timestamp.now() : null,
        'settings.disappearingEnabledBy': timerValue > 0 ? user.uid : null
      });
    } catch (error) {
      console.error("Error updating disappearing message timer:", error);
      throw error;
    }
  };

  const cleanupExpired = async () => {
    if (!chatId) return;
    try {
      const messagesRef = collection(db, collectionName, chatId, 'messages');
      const now = Timestamp.now();
      const q = query(messagesRef, where('expiresAt', '<', now));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return;

      // Limit to max 100 deletes per batch
      const docsToDelete = querySnapshot.docs.slice(0, 100);
      const batch = writeBatch(db);
      
      for (const docSnap of docsToDelete) {
        const msgData = docSnap.data();
        batch.delete(docSnap.ref);

        // Clean up media file from Firebase Storage
        if (msgData.mediaUrl) {
          try {
            // Attempt to delete if it's a valid URL pointing to our Firebase Storage bucket
            if (msgData.mediaUrl.includes('firebasestorage.googleapis.com')) {
              const storageRef = ref(storage, msgData.mediaUrl);
              await deleteObject(storageRef);
            }
          } catch (storageErr) {
            console.warn("Could not delete associated storage media (or file doesn't exist):", storageErr);
          }
        }
      }

      await batch.commit();
    } catch (error) {
      console.error("Error during client-side message cleanup:", error);
    }
  };

  return { settings, updateTimer, cleanupExpired, loading };
}
