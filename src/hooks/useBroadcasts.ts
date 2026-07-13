import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  writeBatch, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp, 
  Timestamp, 
  addDoc, 
  getDoc,
  setDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export interface BroadcastList {
  id: string;
  name: string;
  recipients: string[]; // user IDs
  createdAt: any;
  createdBy: string;
}

export interface BroadcastRecipientStatus {
  userId: string;
  chatId: string;
  messageId: string;
  status: 'sent' | 'delivered' | 'read';
  sentAt: any;
  deliveredAt: any | null;
  readAt: any | null;
  name?: string;
}

export interface BroadcastAnalytics {
  id: string;
  broadcastId: string;
  text: string;
  createdAt: any;
  recipients: BroadcastRecipientStatus[];
}

export interface BroadcastTemplate {
  id: string;
  title: string;
  content: string;
}

export function useBroadcasts() {
  const { user } = useAuth();
  const [broadcastLists, setBroadcastLists] = useState<BroadcastList[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Listen to broadcast lists
  useEffect(() => {
    if (!user) {
      setBroadcastLists([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'broadcasts'), where('createdBy', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BroadcastList[];
      
      setBroadcastLists(lists);
      setLoading(false);
    }, (error) => {
      console.error("Error loading broadcasts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Create a broadcast list
  const createBroadcastList = async (name: string, recipients: string[]) => {
    if (!user) throw new Error("Unauthenticated");
    if (recipients.length === 0) throw new Error("Recipient list cannot be empty");

    const docRef = await addDoc(collection(db, 'broadcasts'), {
      name,
      recipients,
      createdBy: user.uid,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  };

  // 3. Edit broadcast list
  const updateBroadcastList = async (id: string, name: string, recipients: string[]) => {
    if (!user) return;
    const docRef = doc(db, 'broadcasts', id);
    await setDoc(docRef, { name, recipients }, { merge: true });
  };

  // 4. Delete broadcast list
  const deleteBroadcastList = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'broadcasts', id));
  };

  // 5. Helper to resolve/create direct chat for a recipient
  const resolveDirectChat = async (recipientId: string): Promise<string> => {
    if (!user) throw new Error("Unauthenticated");

    // Try finding existing direct chat
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', user.uid));
    const snapshot = await getDocs(q);

    let existingChatId = '';
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const isDirect = !data.isGroup && data.type !== 'group';
      if (isDirect && data.participants?.includes(recipientId)) {
        existingChatId = docSnap.id;
      }
    });

    if (existingChatId) {
      return existingChatId;
    }

    // Create a new direct chat
    const newChatRef = await addDoc(collection(db, 'chats'), {
      participants: [user.uid, recipientId],
      isGroup: false,
      type: 'direct_hidden', // specific identifier
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return newChatRef.id;
  };

  // 6. Send broadcast message
  const sendBroadcastMessage = async (broadcastId: string, text: string) => {
    if (!user) throw new Error("Unauthenticated");

    const list = broadcastLists.find(b => b.id === broadcastId);
    if (!list) throw new Error("Broadcast list not found");

    const batch = writeBatch(db);
    const recipientsStatuses: BroadcastRecipientStatus[] = [];

    // Master Message ID
    const masterMsgId = doc(collection(db, 'broadcasts', broadcastId, 'analytics')).id;

    for (const recId of list.recipients) {
      try {
        const chatId = await resolveDirectChat(recId);
        const msgRef = doc(collection(db, 'chats', chatId, 'messages'));

        // Recipient individual message payload
        const msgPayload = {
          senderId: user.uid,
          senderName: user.displayName || 'Personnel',
          text,
          type: 'text',
          status: 'sent',
          isBroadcast: true,
          broadcastId,
          broadcastMessageId: masterMsgId,
          createdAt: serverTimestamp(),
          readBy: [user.uid]
        };

        batch.set(msgRef, msgPayload);

        recipientsStatuses.push({
          userId: recId,
          chatId,
          messageId: msgRef.id,
          status: 'sent',
          sentAt: new Date().toISOString(),
          deliveredAt: null,
          readAt: null
        });
      } catch (err) {
        console.error(`Error adding broadcast recipient ${recId}:`, err);
      }
    }

    // Write Master Analytics Doc
    const analyticsDocRef = doc(db, 'broadcasts', broadcastId, 'analytics', masterMsgId);
    const analyticsPayload: any = {
      id: masterMsgId,
      broadcastId,
      text,
      createdAt: serverTimestamp(),
      recipients: recipientsStatuses
    };

    batch.set(analyticsDocRef, analyticsPayload);
    await batch.commit();

    return masterMsgId;
  };

  // 7. Remind Non-Readers
  const remindNonReaders = async (broadcastId: string, originalMessageId: string, reminderText: string) => {
    if (!user) return;

    const analyticsRef = doc(db, 'broadcasts', broadcastId, 'analytics', originalMessageId);
    const snap = await getDoc(analyticsRef);
    if (!snap.exists()) return;

    const analytics = snap.data() as BroadcastAnalytics;
    const nonReaders = analytics.recipients.filter(r => r.status !== 'read');

    if (nonReaders.length === 0) return;

    const batch = writeBatch(db);

    for (const recipient of nonReaders) {
      const msgRef = doc(collection(db, 'chats', recipient.chatId, 'messages'));
      const msgPayload = {
        senderId: user.uid,
        senderName: user.displayName || 'Personnel',
        text: reminderText,
        type: 'text',
        status: 'sent',
        isBroadcast: true,
        broadcastId,
        parentBroadcastMessageId: originalMessageId,
        createdAt: serverTimestamp(),
        readBy: [user.uid]
      };
      batch.set(msgRef, msgPayload);
    }

    await batch.commit();
  };

  return {
    broadcastLists,
    loading,
    createBroadcastList,
    updateBroadcastList,
    deleteBroadcastList,
    sendBroadcastMessage,
    remindNonReaders
  };
}
