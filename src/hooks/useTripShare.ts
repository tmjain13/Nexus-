import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, serverTimestamp, getDoc, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { TripShare, UserLocation } from '../types';
import { calculateDistance } from './useMapFriends';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

export function useTripShare() {
  const { user } = useAuth();
  const [activeTrip, setActiveTrip] = useState<TripShare | null>(null);
  const [sharedTripsWithMe, setSharedTripsWithMe] = useState<TripShare[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync active trip started by me
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'tripShares'),
      where('userId', '==', user.uid),
      where('completed', '==', false)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        setActiveTrip({ id: docSnap.id, ...docSnap.data() } as any);
      } else {
        setActiveTrip(null);
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'tripShares');
    });

    return () => unsub();
  }, [user]);

  // Sync trips shared with me by friends
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tripShares'),
      where('sharedWith', '==', user.uid),
      where('completed', '==', false)
    );

    const unsub = onSnapshot(q, (snap) => {
      const trips = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setSharedTripsWithMe(trips);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'tripShares');
    });

    return () => unsub();
  }, [user]);

  const startTrip = async (
    sharedWith: string,
    startLoc: UserLocation,
    endLoc: UserLocation,
    durationMinutes: number
  ) => {
    if (!user) return;
    try {
      const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
      const tripData = {
        userId: user.uid,
        userName: user.displayName || 'Friend',
        userAvatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        sharedWith,
        start: startLoc,
        end: endLoc,
        route: [startLoc],
        startedAt: serverTimestamp(),
        expiresAt: expiresAt,
        completed: false
      };

      const docRef = await addDoc(collection(db, 'tripShares'), tripData);
      
      // Send message in direct chat to notify them
      const chatId = [user.uid, sharedWith].sort().join('_');
      const messageId = `trip_${Date.now()}`;
      await setDoc(doc(db, 'chats', chatId, 'messages', messageId), {
        senderId: 'system',
        text: `${user.displayName || 'I'} shared a live trip with you. Check the Enclave Map to view progress! 🧭`,
        type: 'text',
        status: 'sent',
        createdAt: serverTimestamp()
      });

      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'tripShares');
    }
  };

  const endTrip = async (tripId: string, arrivedSafely: boolean = false) => {
    try {
      const tripRef = doc(db, 'tripShares', tripId);
      await updateDoc(tripRef, {
        completed: true,
        arrivedSafely,
        completedAt: serverTimestamp()
      });

      // Post arrived safely notification in chat
      const tripSnap = await getDoc(tripRef);
      if (tripSnap.exists()) {
        const data = tripSnap.data();
        if (arrivedSafely && data) {
          const chatId = [data.userId, data.sharedWith].sort().join('_');
          const messageId = `arrived_${Date.now()}`;
          await setDoc(doc(db, 'chats', chatId, 'messages', messageId), {
            senderId: 'system',
            text: `🏁 Arrived Safely! ${data.userName || 'Your contact'} has reached their destination.`,
            type: 'text',
            status: 'sent',
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tripShares/${tripId}`);
    }
  };

  const shareLocation = useCallback(async (tripId: string, currentLoc: UserLocation) => {
    try {
      const tripRef = doc(db, 'tripShares', tripId);
      const tripSnap = await getDoc(tripRef);
      if (!tripSnap.exists()) return;

      const data = tripSnap.data();
      const currentRoute = data.route || [];
      const updatedRoute = [...currentRoute, currentLoc];

      // Check for arrived safely condition (within 150m of end location)
      const distanceToEnd = calculateDistance(
        currentLoc.lat,
        currentLoc.lng,
        data.end.lat,
        data.end.lng
      );

      const hasArrived = distanceToEnd <= 0.15; // 150 meters

      if (hasArrived) {
        await updateDoc(tripRef, {
          route: updatedRoute,
          completed: true,
          arrivedSafely: true,
          completedAt: serverTimestamp()
        });

        const chatId = [data.userId, data.sharedWith].sort().join('_');
        const messageId = `arrived_${Date.now()}`;
        await setDoc(doc(db, 'chats', chatId, 'messages', messageId), {
          senderId: 'system',
          text: `🏁 Arrived Safely! ${data.userName || 'Your contact'} has reached their destination.`,
          type: 'text',
          status: 'sent',
          createdAt: serverTimestamp()
        });
      } else {
        await updateDoc(tripRef, {
          route: updatedRoute
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tripShares/${tripId}`);
    }
  }, []);

  return {
    activeTrip,
    sharedTripsWithMe,
    startTrip,
    endTrip,
    shareLocation,
    loading
  };
}
