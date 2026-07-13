import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  getDocs,
  setDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';

export interface Attendee {
  userId?: string;
  email: string;
  name: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  daysOfWeek?: number[];
  endDate?: Timestamp;
  occurrences?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Timestamp;
  end: Timestamp;
  allDay: boolean;
  location?: string;
  attendees: Attendee[];
  recurrence?: RecurrenceRule;
  reminders: number[];
  calendarId: string;
  createdFromChat?: string;
  color?: string;
}

export interface CalendarAccount {
  id: string;
  provider: 'google' | 'outlook' | 'apple';
  email: string;
  color: string;
  syncToken?: string;
  lastSync?: Timestamp;
  isActive: boolean;
}

export function useCalendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync / Listen to accounts
  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    const accountsRef = collection(db, 'users', user.uid, 'calendarAccounts');
    const unsub = onSnapshot(accountsRef, (snapshot) => {
      const acctsList: CalendarAccount[] = [];
      snapshot.forEach((docSnap) => {
        acctsList.push({
          id: docSnap.id,
          ...docSnap.data()
        } as CalendarAccount);
      });
      setAccounts(acctsList);
      
      // Seed default accounts if none exist in Firestore, keeping robust experience
      if (acctsList.length === 0) {
        // Just let it be empty, users will connect in Settings
      }
    }, (error) => {
      console.error('Error listening to calendar accounts:', error);
    });

    return () => unsub();
  }, [user]);

  // Sync / Listen to personal events
  useEffect(() => {
    if (!user) {
      setEvents([]);
      return;
    }

    const eventsRef = collection(db, 'users', user.uid, 'events');
    const unsub = onSnapshot(eventsRef, (snapshot) => {
      const eventsList: CalendarEvent[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        eventsList.push({
          id: docSnap.id,
          ...data,
          start: data.start,
          end: data.end,
        } as CalendarEvent);
      });
      setEvents(eventsList);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to calendar events:', error);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // Connect calendar account
  const connectAccount = async (provider: 'google' | 'outlook' | 'apple', email: string, color: string) => {
    if (!user) return;
    const acctId = `${provider}_${email.replace(/[@.]/g, '_')}`;
    const accountRef = doc(db, 'users', user.uid, 'calendarAccounts', acctId);
    
    const accountData = {
      id: acctId,
      provider,
      email,
      color,
      isActive: true,
      lastSync: serverTimestamp(),
      syncToken: `token_${Math.random().toString(36).substring(2)}`
    };

    await setDoc(accountRef, accountData);

    // Seed some mock events from Google/Outlook/Apple to make the experience real & visual
    await seedMockProviderEvents(provider, email, color);
    return acctId;
  };

  const seedMockProviderEvents = async (provider: string, email: string, color: string) => {
    if (!user) return;
    const eventsRef = collection(db, 'users', user.uid, 'events');
    const now = new Date();

    const providerName = provider.toUpperCase();

    // Event 1: Tomorrow at 2:00 PM
    const start1 = new Date();
    start1.setDate(now.getDate() + 1);
    start1.setHours(14, 0, 0, 0);
    const end1 = new Date(start1);
    end1.setHours(15, 0, 0, 0);

    await addDoc(eventsRef, {
      title: `[${providerName}] Sync with ${email.split('@')[0]}`,
      description: `Imported calendar sync event from ${providerName} account.`,
      start: Timestamp.fromDate(start1),
      end: Timestamp.fromDate(end1),
      allDay: false,
      location: 'Google Meet',
      attendees: [
        { email, name: email.split('@')[0], status: 'accepted' },
        { email: user.email || 'user@example.com', name: user.displayName || 'Me', status: 'accepted' }
      ],
      reminders: [15, 30],
      calendarId: acctIdForSeed(provider, email),
      color
    });

    // Event 2: In 3 days (All Day Event)
    const start2 = new Date();
    start2.setDate(now.getDate() + 3);
    start2.setHours(0, 0, 0, 0);
    const end2 = new Date(start2);
    end2.setHours(23, 59, 59, 999);

    await addDoc(eventsRef, {
      title: `[${providerName}] Strategic Planning Focus`,
      description: 'Block out focus session.',
      start: Timestamp.fromDate(start2),
      end: Timestamp.fromDate(end2),
      allDay: true,
      reminders: [60],
      calendarId: acctIdForSeed(provider, email),
      color
    });
  };

  const acctIdForSeed = (provider: string, email: string) => {
    return `${provider}_${email.replace(/[@.]/g, '_')}`;
  };

  const disconnectAccount = async (accountId: string) => {
    if (!user) return;
    const accountRef = doc(db, 'users', user.uid, 'calendarAccounts', accountId);
    await deleteDoc(accountRef);

    // Clean up events from this calendar
    const eventsRef = collection(db, 'users', user.uid, 'events');
    const qSnap = await getDocs(query(eventsRef, where('calendarId', '==', accountId)));
    for (const d of qSnap.docs) {
      await deleteDoc(d.ref);
    }
  };

  // Toggle account active state
  const toggleAccountActive = async (accountId: string, isActive: boolean) => {
    if (!user) return;
    const accountRef = doc(db, 'users', user.uid, 'calendarAccounts', accountId);
    await updateDoc(accountRef, { isActive });
  };

  // Create personal event
  const createEvent = async (eventData: Omit<CalendarEvent, 'id'>) => {
    if (!user) return;
    const eventsRef = collection(db, 'users', user.uid, 'events');
    const docRef = await addDoc(eventsRef, {
      ...eventData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  };

  // Update personal event
  const updateEvent = async (eventId: string, eventData: Partial<CalendarEvent>) => {
    if (!user) return;
    const eventRef = doc(db, 'users', user.uid, 'events', eventId);
    await updateDoc(eventRef, eventData);
  };

  // Delete personal event
  const deleteEvent = async (eventId: string) => {
    if (!user) return;
    const eventRef = doc(db, 'users', user.uid, 'events', eventId);
    await deleteDoc(eventRef);
  };

  // Sync trigger
  const sync = async () => {
    if (!user) return;
    // Mock sync update timestamp for accounts
    for (const acct of accounts) {
      const acctRef = doc(db, 'users', user.uid, 'calendarAccounts', acct.id);
      await updateDoc(acctRef, {
        lastSync: Timestamp.now()
      });
    }
  };

  return {
    events,
    accounts,
    loading,
    connectAccount,
    disconnectAccount,
    toggleAccountActive,
    createEvent,
    updateEvent,
    deleteEvent,
    sync
  };
}
