import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

export interface EmailAccount {
  id: string;
  provider: 'gmail' | 'outlook' | 'yahoo' | 'imap';
  email: string;
  displayName: string;
  avatar?: string;
  connectedAt: any;
  lastSync: any;
  isActive: boolean;
  imapHost?: string;
  imapPort?: number;
  smtpHost?: string;
  smtpPort?: number;
  useSsl?: boolean;
}

export function useEmailAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    const path = `users/${user.uid}/emailAccounts`;
    const q = query(collection(db, path));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: EmailAccount[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as EmailAccount);
      });
      setAccounts(fetched);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const connect = async (
    provider: 'gmail' | 'outlook' | 'yahoo' | 'imap',
    email: string,
    displayName: string,
    customSettings?: {
      imapHost?: string;
      imapPort?: number;
      smtpHost?: string;
      smtpPort?: number;
      useSsl?: boolean;
    }
  ) => {
    if (!user) throw new Error("User must be authenticated");

    const id = `${provider}_${email.replace(/[@.]/g, '_')}`;
    const path = `users/${user.uid}/emailAccounts/${id}`;

    const newAccount: Partial<EmailAccount> = {
      id,
      provider,
      email,
      displayName,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
      connectedAt: serverTimestamp(),
      lastSync: serverTimestamp(),
      isActive: true,
      ...customSettings,
    };

    try {
      await setDoc(doc(db, `users/${user.uid}/emailAccounts`, id), newAccount);
      // Seed initial dummy threads/emails for this new account to make the Inbox immediately rich and interactive!
      await seedInitialEmails(user.uid, id, email, displayName);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const disconnect = async (accountId: string) => {
    if (!user) throw new Error("User must be authenticated");

    const path = `users/${user.uid}/emailAccounts/${accountId}`;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/emailAccounts`, accountId));
      
      // Also clean up email threads for this account
      const threadsPath = `users/${user.uid}/emailThreads`;
      const threadsSnap = await getDocs(collection(db, threadsPath));
      const batch = writeBatch(db);
      let count = 0;
      
      threadsSnap.forEach((threadDoc) => {
        const data = threadDoc.data();
        const firstMsg = data.messages?.[0];
        if (firstMsg?.accountId === accountId) {
          batch.delete(threadDoc.ref);
          count++;
        }
      });
      
      if (count > 0) {
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const sync = async (accountId?: string) => {
    if (!user) return;
    const targets = accountId ? accounts.filter(a => a.id === accountId) : accounts;
    
    for (const acc of targets) {
      const path = `users/${user.uid}/emailAccounts/${acc.id}`;
      try {
        await setDoc(doc(db, `users/${user.uid}/emailAccounts`, acc.id), {
          lastSync: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  };

  return { accounts, loading, connect, disconnect, sync };
}

// Seeding engine to make the app's Unified Inbox feel alive instantly
async function seedInitialEmails(userId: string, accountId: string, email: string, displayName: string) {
  const threadsPath = `users/${userId}/emailThreads`;
  
  const initialThreads = [
    {
      id: `thread_boss_${accountId}`,
      subject: "Project Nexus - Final Review and Q3 Milestones",
      participants: ["Sarah Jenkins <sarah.j@nexuscorp.com>", email],
      isUnread: true,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
      messages: [
        {
          id: `msg_boss_1_${accountId}`,
          accountId,
          threadId: `thread_boss_${accountId}`,
          subject: "Project Nexus - Final Review and Q3 Milestones",
          from: { name: "Sarah Jenkins", email: "sarah.j@nexuscorp.com" },
          to: [{ name: displayName, email }],
          body: "Hi Team,\n\nWe are wrapping up the Q3 deliverables for the Nexus Messenger system. Please verify if the AI smart replies and the location-sharing features are fully optimized before our demo with the executive stakeholders on Monday morning.\n\nAlso, I've attached the complete design document. Let me know if you see any bottlenecks.\n\nBest regards,\nSarah Jenkins\nDirector of Product, Nexus Corp",
          bodyHtml: "<p>Hi Team,</p><p>We are wrapping up the Q3 deliverables for the Nexus Messenger system. Please verify if the AI smart replies and the location-sharing features are fully optimized before our demo with the executive stakeholders on Monday morning.</p><p>Also, I've attached the complete design document. Let me know if you see any bottlenecks.</p><p>Best regards,<br><b>Sarah Jenkins</b><br>Director of Product, Nexus Corp</p>",
          isRead: false,
          isStarred: true,
          labels: ["Inbox", "Work", "Urgent"],
          receivedAt: new Date(Date.now() - 1000 * 60 * 45),
          attachments: [
            {
              filename: "nexus_q3_milestones.pdf",
              mimeType: "application/pdf",
              size: 4210000,
              url: "https://example.com/nexus_q3_milestones.pdf"
            }
          ]
        }
      ]
    },
    {
      id: `thread_newsletter_${accountId}`,
      subject: "The Weekly Byte - Newsletter #104",
      participants: ["The Weekly Byte <newsletter@theweeklybyte.io>", email],
      isUnread: false,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      messages: [
        {
          id: `msg_news_1_${accountId}`,
          accountId,
          threadId: `thread_newsletter_${accountId}`,
          subject: "The Weekly Byte - Newsletter #104",
          from: { name: "The Weekly Byte", email: "newsletter@theweeklybyte.io" },
          to: [{ name: displayName, email }],
          body: "Hello Tech Enthusiasts,\n\nIn this issue, we dive deep into local-first architectures, state management in modern React 19, and security hardening for Firestore rules. Discover why developers are moving away from traditional single-page setups to hybrid models.\n\nUnsubscribe by replying directly to this email.",
          bodyHtml: "<p>Hello Tech Enthusiasts,</p><p>In this issue, we dive deep into local-first architectures, state management in modern React 19, and security hardening for Firestore rules. Discover why developers are moving away from traditional single-page setups to hybrid models.</p><p style='font-size:11px;color:#71717a;'>Unsubscribe by replying directly to this email.</p>",
          isRead: true,
          isStarred: false,
          labels: ["Inbox", "Newsletters"],
          receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
          attachments: []
        }
      ]
    },
    {
      id: `thread_flight_${accountId}`,
      subject: "Flight Confirmation - NEXUS 404 to San Francisco",
      participants: ["Nexus Airlines <booking@nexusairlines.com>", email],
      isUnread: false,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 24 hours ago
      messages: [
        {
          id: `msg_flight_1_${accountId}`,
          accountId,
          threadId: `thread_flight_${accountId}`,
          subject: "Flight Confirmation - NEXUS 404 to San Francisco",
          from: { name: "Nexus Airlines", email: "booking@nexusairlines.com" },
          to: [{ name: displayName, email }],
          body: "Your booking is confirmed! Flight NEXUS 404 will depart from Seattle (SEA) to San Francisco (SFO) on July 15 at 14:30. Seat assigned: 12C (Aisle).\n\nFind your boarding pass attached.",
          bodyHtml: "<h3>Booking Confirmed!</h3><p>Flight <b>NEXUS 404</b> will depart from Seattle (SEA) to San Francisco (SFO) on July 15 at 14:30. Seat assigned: 12C (Aisle).</p><p>Find your boarding pass attached.</p>",
          isRead: true,
          isStarred: false,
          labels: ["Inbox", "Travel"],
          receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
          attachments: [
            {
              filename: "boarding_pass_sfo.png",
              mimeType: "image/png",
              size: 1540000,
              url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=60"
            }
          ]
        }
      ]
    }
  ];

  for (const thread of initialThreads) {
    try {
      await setDoc(doc(db, threadsPath, thread.id), thread);
    } catch (err) {
      console.error("Failed to seed initial email threads:", err);
    }
  }
}
