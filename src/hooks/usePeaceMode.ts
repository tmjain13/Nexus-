import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc, collection, getDocs, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { PeaceModeSettings, PeaceStats } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

const DEFAULT_SETTINGS: PeaceModeSettings = {
  enabled: false,
  autoReplyText: "I'm in Peace Mode right now. I'll respond when I'm back. 🧘",
  messageLimit: 20,
  focusTimer: 30,
  schedule: {
    enabled: false,
    daily: { start: "22:00", end: "07:00" },
    weekend: { start: "22:00", end: "07:00" }
  },
  zenTheme: 'blue'
};

export function isWithinSchedule(schedule: any): boolean {
  if (!schedule || !schedule.enabled) return false;
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = day === 0 || day === 6;

  let scheduleRange = null;
  if (isWeekend && schedule.weekend) {
    scheduleRange = schedule.weekend;
  } else if (schedule.daily) {
    scheduleRange = schedule.daily;
  }

  if (!scheduleRange) return false;

  const { start, end } = scheduleRange;
  if (!start || !end) return false;

  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    // Overnight, e.g. 22:00 to 07:00
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
}

export function usePeaceMode() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PeaceModeSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [activeScheduled, setActiveScheduled] = useState(false);
  const [queuedNotifications, setQueuedNotifications] = useState<any[]>([]);

  // Periodically check schedule
  useEffect(() => {
    if (!settings.schedule?.enabled) {
      setActiveScheduled(false);
      return;
    }
    const check = () => {
      setActiveScheduled(isWithinSchedule(settings.schedule));
    };
    check();
    const interval = setInterval(check, 30000); // check every 30s
    return () => clearInterval(interval);
  }, [settings.schedule]);

  // Sync settings and presence
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      setLoading(false);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.settings?.peaceMode) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...data.settings.peaceMode
          });
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user?.uid}`);
    });

    // Also sync the notificationQueue subcollection
    const queueRef = collection(db, 'users', user.uid, 'notificationQueue');
    const unsubQueue = onSnapshot(queueRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setQueuedNotifications(list);
    });

    return () => {
      unsub();
      unsubQueue();
    };
  }, [user]);

  const isEnabled = settings.enabled || activeScheduled;

  // Sync presence doc
  useEffect(() => {
    if (!user) return;
    const updatePresence = async () => {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          'presence.peaceMode': isEnabled
        });
      } catch (err) {
        // Fallback in case of document structure differences
        try {
          await setDoc(doc(db, 'users', user.uid, 'presence', 'status'), {
            peaceMode: isEnabled
          }, { merge: true });
        } catch (e) {
          console.warn("Could not sync peaceMode to presence:", e);
        }
      }
    };
    updatePresence();
  }, [isEnabled, user]);

  const updateSettings = async (newSettings: Partial<PeaceModeSettings>) => {
    if (!user) return;
    const updated = { ...settings, ...newSettings };
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.peaceMode': updated
      });
      setSettings(updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const enable = () => updateSettings({ enabled: true });
  
  const disable = async () => {
    if (!user) return;
    try {
      // 1. Deliver batch queued notifications
      if (queuedNotifications.length > 0) {
        // Dispatch custom event to notify NotificationToast
        const event = new CustomEvent('batch-deliver-notifications', {
          detail: {
            title: "While you were in Peace Mode...",
            notifications: queuedNotifications
          }
        });
        window.dispatchEvent(event);

        // Clear queue in Firestore
        const batch = writeBatch(db);
        const queueRef = collection(db, 'users', user.uid, 'notificationQueue');
        const snap = await getDocs(queueRef);
        snap.forEach((d) => {
          batch.delete(d.ref);
        });
        await batch.commit();
      }

      await updateSettings({ enabled: false });
    } catch (err) {
      console.error("Error deactivating Peace Mode:", err);
    }
  };

  return {
    settings,
    isEnabled,
    enable,
    disable,
    updateSettings,
    loading,
    queuedNotifications
  };
}
