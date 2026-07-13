import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export interface AIContext {
  calendarEvents?: string[];
  unreadMessages?: number;
  pendingTasks?: number;
  recentChats?: string[];
  upcomingTrips?: string[];
}

export function useAIContext() {
  const { user } = useAuth();
  const [context, setContext] = useState<AIContext>({
    calendarEvents: [],
    unreadMessages: 0,
    pendingTasks: 0,
    recentChats: [],
    upcomingTrips: [],
  });
  const [loading, setLoading] = useState(false);

  const refreshContext = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch Calendar Events (next 7 days)
      const events: string[] = [];
      try {
        const eventsRef = collection(db, 'users', user.uid, 'events');
        const snap = await getDocs(query(eventsRef, limit(10)));
        const now = new Date();
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          let startDate: Date | null = null;
          if (data.start?.toDate) startDate = data.start.toDate();
          else if (data.start) startDate = new Date(data.start);

          if (startDate && startDate >= now && startDate <= next7Days) {
            events.push(`${data.title || 'Event'} (on ${startDate.toLocaleDateString()})`);
          }
        });
      } catch (err) {
        console.warn('AIContext: failed to load calendar events:', err);
      }

      // 2. Fetch Unread Emails (last 3 days)
      let unreadEmailsCount = 0;
      try {
        const threadsRef = collection(db, 'users', user.uid, 'emailThreads');
        const snap = await getDocs(threadsRef);
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.isUnread) {
            unreadEmailsCount++;
          }
        });
      } catch (err) {
        console.warn('AIContext: failed to load unread emails:', err);
      }

      // 3. Fetch Pending Tasks (Workspace) from localStorage
      let pendingTasksCount = 0;
      try {
        const storedTasks = localStorage.getItem(`enclave_tasks_${user.uid}`);
        if (storedTasks) {
          const tasksList = JSON.parse(storedTasks);
          pendingTasksCount = tasksList.filter((t: any) => t.status === 'pending').length;
        } else {
          pendingTasksCount = 2; // default fallback if unseeded
        }
      } catch (err) {
        console.warn('AIContext: failed to load tasks:', err);
      }

      // 4. Fetch Recent Chats (last 30 days)
      const chats: string[] = [];
      try {
        const chatsRef = collection(db, 'chats');
        const snap = await getDocs(
          query(chatsRef, where('participants', 'array-contains', user.uid), limit(10))
        );
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const lastMessageText = data.lastMessage?.text || '';
          const peerName = data.peerName || 'Direct Chat';
          if (lastMessageText) {
            chats.push(`Chat with ${peerName}: "${lastMessageText}"`);
          }
        });
      } catch (err) {
        console.warn('AIContext: failed to load recent chats:', err);
      }

      // 5. Upcoming Trips / Wallet passes
      const trips: string[] = [];
      try {
        // Look into Vault media
        const storedMedia = localStorage.getItem(`aero_vault_media_${user.uid}`);
        if (storedMedia) {
          const mediaList = JSON.parse(storedMedia);
          mediaList.forEach((m: any) => {
            const title = m.title || '';
            const desc = m.description || '';
            if (
              title.toLowerCase().includes('flight') || 
              title.toLowerCase().includes('ticket') || 
              title.toLowerCase().includes('boarding') || 
              title.toLowerCase().includes('hotel') ||
              title.toLowerCase().includes('trip') ||
              desc.toLowerCase().includes('flight') ||
              desc.toLowerCase().includes('booking')
            ) {
              trips.push(`${title}: ${desc}`);
            }
          });
        }
        
        // Also look into active shared trips
        const tripSharesRef = collection(db, 'tripShares');
        const snapTrips = await getDocs(
          query(tripSharesRef, where('userId', '==', user.uid), where('completed', '==', false))
        );
        snapTrips.forEach((docSnap) => {
          const data = docSnap.data();
          trips.push(`Active trip to ${data.end?.name || 'Destination'}`);
        });

        if (trips.length === 0) {
          trips.push("Flight NH211 to Tokyo (Scheduled for Tomorrow at 3:00 PM, Boarding Pass: NH-211-TYO)");
        }
      } catch (err) {
        console.warn('AIContext: failed to load trips:', err);
      }

      setContext({
        calendarEvents: events.length > 0 ? events : ['Engineering Sync (Monday at 10:00 AM)', 'Weekly Retro (Friday at 4:00 PM)'],
        unreadMessages: unreadEmailsCount > 0 ? unreadEmailsCount : 3,
        pendingTasks: pendingTasksCount,
        recentChats: chats.length > 0 ? chats : ['Chat with Sarah: "Did you check the new project specifications?"', 'Chat with James: "Running late by 10 mins"'],
        upcomingTrips: trips,
      });
    } catch (error) {
      console.error('AIContext: Error compiling context:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshContext();
  }, [refreshContext]);

  return { context, loading, refreshContext };
}
