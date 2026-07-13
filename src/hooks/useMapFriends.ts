import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { MapFriend, UserLocation, LocationSettings } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

// Haversine formula to calculate distance in km between two points
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return parseFloat(d.toFixed(1));
}

export function useMapFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<MapFriend[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchFriendsLocation = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Get current user's location to compute distances
      const myDoc = await getDoc(doc(db, 'users', user.uid));
      let myLoc: UserLocation | null = null;
      if (myDoc.exists()) {
        const myData = myDoc.data();
        if (myData.location && myData.location.lat && myData.location.lng) {
          myLoc = myData.location as UserLocation;
        }
      }

      // 2. Query current user's contacts
      const contactsSnap = await getDocs(collection(db, 'users', user.uid, 'contacts'));
      const contactIds = contactsSnap.docs.map(doc => doc.id);

      if (contactIds.length === 0) {
        setFriends([]);
        setIsLoading(false);
        return;
      }

      const activeFriends: MapFriend[] = [];

      // 3. For each contact, fetch their user profile to verify privacy settings & location
      for (const cid of contactIds) {
        const friendDoc = await getDoc(doc(db, 'users', cid));
        if (friendDoc.exists()) {
          const friendData = friendDoc.data();
          const location = friendData.location;
          const locSettings = friendData.locationSettings as LocationSettings | undefined;

          // If friend has no location or location settings, skip
          if (!location || !location.lat || !location.lng || !locSettings) {
            continue;
          }

          // Strict Privacy Filters:
          // A. Ghost mode -> completely invisible
          if (locSettings.mode === 'ghost') {
            continue;
          }

          // B. Select friends mode -> only visible if current user's uid is in their allowed list
          if (locSettings.mode === 'select' && !locSettings.allowedFriends?.includes(user.uid)) {
            continue;
          }

          // C. Contacts mode -> only visible if we are also contacts (checking mutuality is optional, but if they share with contacts, we can see them since they are in our contact list and we in theirs, or standard contact list)
          // We let standard contacts view precise location if mode is 'contacts'

          // Compute distance if my location is available
          let distance = 0;
          if (myLoc) {
            distance = calculateDistance(myLoc.lat, myLoc.lng, location.lat, location.lng);
          }

          // Stories integration: Check if they have an active status story pinned
          const storyAvailable = !!friendData.statusStory?.active;
          const storyContent = friendData.statusStory?.content || "";
          const storyTime = friendData.statusStory?.createdAt || null;

          activeFriends.push({
            userId: cid,
            name: friendData.displayName || "Anonymous",
            avatar: friendData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cid}`,
            lat: location.lat,
            lng: location.lng,
            lastActive: location.updatedAt || friendData.lastActive || null,
            distance,
            storyAvailable,
            storyContent,
            storyTime
          });
        }
      }

      setFriends(activeFriends);
    } catch (err) {
      console.error("Error fetching map friends:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFriendsLocation();

    // Set up real-time listener for user contacts to be fully responsive
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'contacts'), () => {
      fetchFriendsLocation();
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/contacts`);
    });

    return () => unsubscribe();
  }, [user, fetchFriendsLocation]);

  return {
    friends,
    isLoading,
    refresh: fetchFriendsLocation
  };
}
