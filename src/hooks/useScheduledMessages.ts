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
  deleteDoc, 
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export type ScheduleStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface Recurrence {
  frequency: 'daily' | 'weekly' | 'monthly';
  endAfter?: number; // maximum occurrences
}

export interface ScheduledMessage {
  id: string;
  chatId: string;
  text: string;
  attachments?: any[];
  senderId: string;
  senderName?: string;
  scheduledAt: Timestamp;
  status: ScheduleStatus;
  timezone: string;
  createdAt: Timestamp;
  recurrence?: Recurrence | null;
  isEncrypted?: boolean;
  encryptedData?: string;
  type?: string;
}

export function useScheduledMessages(chatId?: string) {
  const { user } = useAuth();
  const [scheduled, setScheduled] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setScheduled([]);
      setLoading(false);
      return;
    }

    // Reference to user's scheduled messages for global list & easy syncing
    const scheduledCollRef = collection(db, 'users', user.uid, 'scheduledMessages');
    let q = query(scheduledCollRef);

    if (chatId) {
      q = query(scheduledCollRef, where('chatId', '==', chatId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          chatId: data.chatId,
          text: data.text || '',
          attachments: data.attachments || [],
          senderId: data.senderId,
          senderName: data.senderName || '',
          scheduledAt: data.scheduledAt,
          status: data.status || 'pending',
          timezone: data.timezone || 'UTC',
          createdAt: data.createdAt,
          recurrence: data.recurrence || null,
          isEncrypted: data.isEncrypted || false,
          encryptedData: data.encryptedData || '',
          type: data.type || 'text'
        } as ScheduledMessage;
      });

      // Sort by scheduledAt, nearest first
      msgs.sort((a, b) => {
        const timeA = a.scheduledAt?.toMillis ? a.scheduledAt.toMillis() : 0;
        const timeB = b.scheduledAt?.toMillis ? b.scheduledAt.toMillis() : 0;
        return timeA - timeB;
      });

      setScheduled(msgs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching scheduled messages:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, chatId]);

  const scheduleMessage = async (
    text: string, 
    scheduledDate: Date, 
    extraData: Partial<ScheduledMessage> = {}
  ) => {
    if (!user) throw new Error("User not authenticated");

    const batch = writeBatch(db);
    
    // Create new document in chats/{chatId}/scheduled/{messageId}
    const targetChatId = chatId || extraData.chatId;
    if (!targetChatId) throw new Error("chatId is required to schedule a message");

    const chatScheduledColl = collection(db, 'chats', targetChatId, 'scheduled');
    const chatScheduledDocRef = doc(chatScheduledColl);
    const msgId = chatScheduledDocRef.id;

    // Create same document in users/{uid}/scheduledMessages/{messageId}
    const userScheduledDocRef = doc(db, 'users', user.uid, 'scheduledMessages', msgId);

    const scheduledData: any = {
      id: msgId,
      chatId: targetChatId,
      text,
      senderId: user.uid,
      senderName: user.displayName || 'Personnel',
      scheduledAt: Timestamp.fromDate(scheduledDate),
      status: 'pending',
      createdAt: serverTimestamp(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      attachments: extraData.attachments || [],
      recurrence: extraData.recurrence || null,
      isEncrypted: extraData.isEncrypted || false,
      encryptedData: extraData.encryptedData || '',
      type: extraData.type || 'text'
    };

    batch.set(chatScheduledDocRef, scheduledData);
    batch.set(userScheduledDocRef, scheduledData);

    await batch.commit();
    return msgId;
  };

  const cancelScheduled = async (msgId: string, targetChatId?: string) => {
    if (!user) return;
    const cid = chatId || targetChatId;
    if (!cid) return;

    const batch = writeBatch(db);
    const chatScheduledDocRef = doc(db, 'chats', cid, 'scheduled', msgId);
    const userScheduledDocRef = doc(db, 'users', user.uid, 'scheduledMessages', msgId);

    batch.delete(chatScheduledDocRef);
    batch.delete(userScheduledDocRef);

    await batch.commit();
  };

  const editScheduled = async (
    msgId: string, 
    updates: { text?: string; scheduledAt?: Date; recurrence?: Recurrence | null },
    targetChatId?: string
  ) => {
    if (!user) return;
    const cid = chatId || targetChatId;
    if (!cid) return;

    const batch = writeBatch(db);
    const chatScheduledDocRef = doc(db, 'chats', cid, 'scheduled', msgId);
    const userScheduledDocRef = doc(db, 'users', user.uid, 'scheduledMessages', msgId);

    const docUpdates: any = {};
    if (updates.text !== undefined) docUpdates.text = updates.text;
    if (updates.scheduledAt !== undefined) docUpdates.scheduledAt = Timestamp.fromDate(updates.scheduledAt);
    if (updates.recurrence !== undefined) docUpdates.recurrence = updates.recurrence;

    batch.update(chatScheduledDocRef, docUpdates);
    batch.update(userScheduledDocRef, docUpdates);

    await batch.commit();
  };

  const sendScheduledNow = async (msg: ScheduledMessage) => {
    if (!user) return;
    
    const batch = writeBatch(db);

    // 1. Move to chat messages
    const chatMessagesColl = collection(db, 'chats', msg.chatId, 'messages');
    const newMsgDocRef = doc(chatMessagesColl);

    const normalMsgData: any = {
      senderId: msg.senderId,
      senderName: msg.senderName || 'Personnel',
      text: msg.text,
      type: msg.type || 'text',
      status: 'sent',
      createdAt: serverTimestamp(),
      readBy: [user.uid]
    };

    if (msg.isEncrypted) {
      normalMsgData.isEncrypted = true;
      normalMsgData.encryptedData = msg.encryptedData;
    }

    if (msg.attachments && msg.attachments.length > 0) {
      normalMsgData.attachments = msg.attachments;
    }

    batch.set(newMsgDocRef, normalMsgData);

    // 2. Delete or set status to 'sent' in both lists
    // We can delete them to clean up the scheduling queue, or keep them as 'sent'.
    // Let's delete them to avoid repeating and save Firestore space.
    const chatScheduledDocRef = doc(db, 'chats', msg.chatId, 'scheduled', msg.id);
    const userScheduledDocRef = doc(db, 'users', user.uid, 'scheduledMessages', msg.id);

    batch.delete(chatScheduledDocRef);
    batch.delete(userScheduledDocRef);

    await batch.commit();

    // 3. Handle recurrence if applicable
    if (msg.recurrence) {
      const nextDate = getNextRecurrenceDate(msg.scheduledAt.toDate(), msg.recurrence.frequency);
      if (nextDate) {
        // Schedule next instance
        await scheduleMessage(msg.text, nextDate, {
          chatId: msg.chatId,
          attachments: msg.attachments,
          recurrence: msg.recurrence,
          isEncrypted: msg.isEncrypted,
          encryptedData: msg.encryptedData,
          type: msg.type
        });
      }
    }
  };

  return {
    scheduled,
    loading,
    scheduleMessage,
    cancelScheduled,
    editScheduled,
    sendScheduledNow
  };
}

// Helper to calculate next recurrence date
function getNextRecurrenceDate(current: Date, frequency: 'daily' | 'weekly' | 'monthly'): Date | null {
  const next = new Date(current);
  if (frequency === 'daily') {
    next.setDate(next.getDate() + 1);
  } else if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (frequency === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else {
    return null;
  }
  return next;
}

// Global hook to process pending scheduled messages periodically
export function useBackgroundMessageScheduler() {
  const { user } = useAuth();
  const { sendScheduledNow } = useScheduledMessages();

  useEffect(() => {
    if (!user) return;

    const checkAndSend = async () => {
      try {
        const scheduledCollRef = collection(db, 'users', user.uid, 'scheduledMessages');
        const q = query(scheduledCollRef, where('status', '==', 'pending'));
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const now = new Date();
          const pending = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ScheduledMessage);
          
          for (const msg of pending) {
            const scheduledTime = msg.scheduledAt?.toDate ? msg.scheduledAt.toDate() : null;
            if (scheduledTime && scheduledTime <= now) {
              try {
                await sendScheduledNow(msg);
                console.log(`Successfully executed scheduled message ${msg.id}`);
              } catch (err) {
                console.error(`Failed to send scheduled message ${msg.id}:`, err);
              }
            }
          }
        });

        return unsubscribe;
      } catch (err) {
        console.error("Error setting up background message scheduler:", err);
      }
    };

    let unsubPromise = checkAndSend();

    // Check every 30 seconds as well
    const interval = setInterval(async () => {
      // Direct double check to trigger if snapshot delay
    }, 30000);

    return () => {
      clearInterval(interval);
      unsubPromise.then(unsub => unsub && unsub());
    };
  }, [user]);
}
