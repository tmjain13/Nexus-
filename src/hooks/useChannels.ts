import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  getDocs, 
  getDoc,
  writeBatch, 
  serverTimestamp, 
  Timestamp,
  increment,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Channel, Monetization, ChannelSettings } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

export function useChannels() {
  const { user } = useAuth();
  const [subscribedChannels, setSubscribedChannels] = useState<Channel[]>([]);
  const [ownedChannels, setOwnedChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscribedChannels([]);
      setOwnedChannels([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Get owned channels
    const qOwned = query(collection(db, 'channels'), where('ownerId', '==', user.uid));
    const unsubOwned = onSnapshot(qOwned, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }) as Channel);
      setOwnedChannels(list);
    }, (err) => {
      console.error("Error loading owned channels:", err);
    });

    // 2. Get subscribed channels
    const qSubbed = query(collection(db, 'users', user.uid, 'subscribedChannels'));
    const unsubSubbed = onSnapshot(qSubbed, async (snapshot) => {
      try {
        const channelIds = snapshot.docs.map(d => d.id);
        if (channelIds.length === 0) {
          setSubscribedChannels([]);
          setLoading(false);
          return;
        }

        // Fetch each channel's detail
        const fetched: Channel[] = [];
        for (const cid of channelIds) {
          const cDoc = await getDoc(doc(db, 'channels', cid));
          if (cDoc.exists()) {
            fetched.push({ id: cDoc.id, ...(cDoc.data() as object) } as Channel);
          }
        }
        setSubscribedChannels(fetched);
      } catch (err) {
        console.error("Error fetching subscribed channel details:", err);
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error("Error loading subscribed channels list:", err);
      setLoading(false);
    });

    return () => {
      unsubOwned();
      unsubSubbed();
    };
  }, [user]);

  const createChannel = async (
    name: string,
    handle: string,
    description: string,
    privacy: 'public' | 'private',
    monetization: { enabled: boolean; price: number; currency: string },
    category: string,
    avatar?: string
  ) => {
    if (!user) throw new Error("Authentication required");

    const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase();
    
    // Validate handle format (alphanumeric + underscore)
    const handleRegex = /^[a-zA-Z0-9_]+$/;
    if (!handleRegex.test(cleanHandle)) {
      throw new Error("Handle can only contain letters, numbers, and underscores");
    }

    // Check if handle is taken
    const q = query(collection(db, 'channels'), where('handle', '==', cleanHandle));
    let handleSnap;
    try {
      handleSnap = await getDocs(q);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'channels');
    }

    if (handleSnap && !handleSnap.empty) {
      throw new Error(`The handle @${cleanHandle} is already taken`);
    }

    const channelId = doc(collection(db, 'channels')).id;
    const inviteLink = `${window.location.origin}/join-channel/${cleanHandle}`;

    const newChannel: Omit<Channel, 'id'> = {
      name: name.substring(0, 128),
      handle: cleanHandle,
      description: description.substring(0, 255),
      avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanHandle}`,
      ownerId: user.uid,
      admins: [user.uid],
      editors: [],
      createdAt: Timestamp.now() as any,
      privacy,
      inviteLink,
      subscribers: 1, // owner is first subscriber
      monetization: {
        enabled: monetization.enabled,
        price: monetization.enabled ? Math.max(50, Math.min(10000, monetization.price)) : 0,
        currency: monetization.currency || 'INR',
        revenue: 0,
        payoutPending: 0
      },
      settings: {
        allowComments: true,
        slowMode: 0,
        requireApproval: false
      },
      category
    };

    const batch = writeBatch(db);
    
    // Create the channel document
    batch.set(doc(db, 'channels', channelId), newChannel);

    // Add owner as a subscriber in the subcollection
    batch.set(doc(db, 'channels', channelId, 'subscribers', user.uid), {
      subscribedAt: serverTimestamp(),
      role: 'owner'
    });

    // Add channel to owner's subscribedChannels subcollection
    batch.set(doc(db, 'users', user.uid, 'subscribedChannels', channelId), {
      subscribedAt: serverTimestamp(),
      pricePaid: 0
    });

    try {
      await batch.commit();
      return channelId;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'channels/' + channelId);
    }
  };

  const subscribe = async (channelId: string) => {
    if (!user) throw new Error("Authentication required");

    const channelRef = doc(db, 'channels', channelId);
    const channelDoc = await getDoc(channelRef);
    if (!channelDoc.exists()) throw new Error("Channel does not exist");

    const channelData = channelDoc.data() as Channel;

    // Check if already subscribed
    const subRef = doc(db, 'channels', channelId, 'subscribers', user.uid);
    const subDoc = await getDoc(subRef);
    if (subDoc.exists()) return; // already subscribed

    const batch = writeBatch(db);

    let pricePaid = 0;
    if (channelData.monetization?.enabled) {
      pricePaid = channelData.monetization.price;
      // Mock Subscription Payment Logic
      const mockRevenue = pricePaid * 0.9; // 90% goes to creator
      batch.update(channelRef, {
        subscribers: increment(1),
        'monetization.revenue': increment(mockRevenue),
        'monetization.payoutPending': increment(mockRevenue)
      });
    } else {
      batch.update(channelRef, {
        subscribers: increment(1)
      });
    }

    batch.set(subRef, {
      subscribedAt: serverTimestamp(),
      role: 'subscriber'
    });

    batch.set(doc(db, 'users', user.uid, 'subscribedChannels', channelId), {
      subscribedAt: serverTimestamp(),
      pricePaid
    });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `channels/${channelId}/subscribers/${user.uid}`);
    }
  };

  const unsubscribe = async (channelId: string) => {
    if (!user) throw new Error("Authentication required");

    const channelRef = doc(db, 'channels', channelId);
    const subRef = doc(db, 'channels', channelId, 'subscribers', user.uid);
    const userSubRef = doc(db, 'users', user.uid, 'subscribedChannels', channelId);

    const batch = writeBatch(db);
    batch.update(channelRef, {
      subscribers: increment(-1)
    });
    batch.delete(subRef);
    batch.delete(userSubRef);

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `channels/${channelId}/subscribers/${user.uid}`);
    }
  };

  const searchChannels = async (queryStr: string, category?: string) => {
    const channelsRef = collection(db, 'channels');
    let q;

    if (category && category !== 'All') {
      q = query(channelsRef, where('category', '==', category));
    } else {
      q = query(channelsRef);
    }

    try {
      const snap = await getDocs(q);
      let list = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }) as Channel);
      
      // Filter list based on search query in name or handle
      if (queryStr.trim()) {
        const lowerQuery = queryStr.toLowerCase();
        list = list.filter(c => 
          c.name.toLowerCase().includes(lowerQuery) || 
          c.handle.toLowerCase().includes(lowerQuery) ||
          c.description.toLowerCase().includes(lowerQuery)
        );
      }

      // Hide private channels from non-subscribers in discovery
      // Unless they are already joined or it's public
      return list.filter(c => c.privacy === 'public' || c.ownerId === user?.uid);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'channels');
      return [];
    }
  };

  return {
    subscribedChannels,
    ownedChannels,
    loading,
    createChannel,
    subscribe,
    unsubscribe,
    searchChannels
  };
}
