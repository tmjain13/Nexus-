import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface ContactMatch {
  userId: string;
  displayName: string;
  username: string;
  photoURL?: string;
  phoneHash: string;
}

// Client-side SHA-256 helper for phone numbers (normalized by removing all non-digits)
export async function hashPhoneNumber(phone: string): Promise<string> {
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone || cleanPhone.length < 5) return '';
  
  // Convert string to UTF-8 array buffer
  const msgBuffer = new TextEncoder().encode(cleanPhone);
  
  // Hash the buffer
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  
  // Convert ArrayBuffer to Hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function useContactSync() {
  const { user, googleAccessToken, signInWithGoogleContacts } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [matchedUsers, setMatchedUsers] = useState<ContactMatch[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Google Contacts synchronization states
  const [isGoogleSyncing, setIsGoogleSyncing] = useState(false);
  const [googleMatchedUsers, setGoogleMatchedUsers] = useState<ContactMatch[]>([]);
  const [nonMatchedGoogleContacts, setNonMatchedGoogleContacts] = useState<any[]>([]);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Checks if the Contacts API is supported in the browser
  const isContactsApiSupported = () => {
    return 'contacts' in navigator && 'ContactsManager' in window;
  };

  const syncGoogleContacts = async (): Promise<boolean> => {
    if (!user) return false;
    setIsGoogleSyncing(true);
    setGoogleError(null);
    setGoogleMatchedUsers([]);
    setNonMatchedGoogleContacts([]);

    try {
      let token = googleAccessToken;
      if (!token) {
        token = await signInWithGoogleContacts();
      }
      if (!token) {
        throw new Error("Could not retrieve Google access credentials.");
      }

      // Fetch connections from Google People API
      const response = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,photos&pageSize=100',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Google Contacts API returned error status: ${response.status}`);
      }

      const data = await response.json();
      const connections = data.connections || [];

      const contactsList: any[] = [];
      const emailsList: string[] = [];
      const phoneHashesList: string[] = [];
      const phoneToContactMap: { [hash: string]: any } = {};
      const emailToContactMap: { [email: string]: any } = {};

      for (const connection of connections) {
        const names = connection.names || [];
        const displayName = names[0]?.displayName || 'Google Contact';
        const photos = connection.photos || [];
        const photoURL = photos[0]?.url || '';
        const emailAddresses = connection.emailAddresses || [];
        const phoneNumbers = connection.phoneNumbers || [];

        const emails = emailAddresses.map((e: any) => e.value?.toLowerCase()).filter(Boolean);
        const phones = phoneNumbers.map((p: any) => p.value).filter(Boolean);

        const contactObj = {
          displayName,
          photoURL,
          emails,
          phones,
          resourceName: connection.resourceName,
        };
        contactsList.push(contactObj);

        for (const email of emails) {
          emailsList.push(email);
          emailToContactMap[email] = contactObj;
        }

        for (const phone of phones) {
          const hash = await hashPhoneNumber(phone);
          if (hash) {
            phoneHashesList.push(hash);
            phoneToContactMap[hash] = contactObj;
          }
        }
      }

      // If no contacts have emails or phone hashes to match, finish early
      if (emailsList.length === 0 && phoneHashesList.length === 0) {
        setGoogleMatchedUsers([]);
        setNonMatchedGoogleContacts(contactsList);
        setIsGoogleSyncing(false);
        return true;
      }

      const matchedMap: { [userId: string]: ContactMatch } = {};
      const matchedResourceNames = new Set<string>();

      // Batch query by phoneHash (Firestore supports 'in' with up to 10 items)
      if (phoneHashesList.length > 0) {
        // Unique and filtered list of hashes
        const uniqueHashes = Array.from(new Set(phoneHashesList));
        const hashBatches: string[][] = [];
        for (let i = 0; i < uniqueHashes.length; i += 10) {
          hashBatches.push(uniqueHashes.slice(i, i + 10));
        }

        for (const batch of hashBatches) {
          const q = query(
            collection(db, 'users'),
            where('phoneHash', 'in', batch)
          );
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((docSnap) => {
            if (docSnap.id !== user.uid) {
              const uData = docSnap.data();
              const hash = uData.phoneHash || '';
              matchedMap[docSnap.id] = {
                userId: docSnap.id,
                displayName: uData.displayName || 'User',
                username: uData.username || '',
                photoURL: uData.photoURL || '',
                phoneHash: hash
              };
              if (hash && phoneToContactMap[hash]) {
                matchedResourceNames.add(phoneToContactMap[hash].resourceName);
              }
            }
          });
        }
      }

      // Batch query by email
      if (emailsList.length > 0) {
        const uniqueEmails = Array.from(new Set(emailsList));
        const emailBatches: string[][] = [];
        for (let i = 0; i < uniqueEmails.length; i += 10) {
          emailBatches.push(uniqueEmails.slice(i, i + 10));
        }

        for (const batch of emailBatches) {
          const q = query(
            collection(db, 'users'),
            where('email', 'in', batch)
          );
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((docSnap) => {
            if (docSnap.id !== user.uid) {
              const uData = docSnap.data();
              matchedMap[docSnap.id] = {
                userId: docSnap.id,
                displayName: uData.displayName || 'User',
                username: uData.username || '',
                photoURL: uData.photoURL || '',
                phoneHash: uData.phoneHash || ''
              };
              const email = uData.email?.toLowerCase();
              if (email && emailToContactMap[email]) {
                matchedResourceNames.add(emailToContactMap[email].resourceName);
              }
            }
          });
        }
      }

      const matchedList = Object.values(matchedMap);
      setGoogleMatchedUsers(matchedList);

      const nonMatchedList = contactsList.filter(
        (c) => !matchedResourceNames.has(c.resourceName)
      );
      setNonMatchedGoogleContacts(nonMatchedList);
      setIsGoogleSyncing(false);
      return true;
    } catch (err: any) {
      console.error("Failed Google Contacts sync:", err);
      setGoogleError(err.message || "Failed to sync Google Contacts");
      setIsGoogleSyncing(false);
      return false;
    }
  };

  const syncPhoneContacts = async (): Promise<ContactMatch[]> => {
    if (!user) return [];
    setIsSyncing(true);
    setError(null);

    try {
      let rawPhones: string[] = [];

      // Try navigator.contacts API
      if (isContactsApiSupported()) {
        try {
          const props = ['tel'];
          const options = { multiple: true };
          const contacts = await (navigator as any).contacts.select(props, options);
          
          if (contacts && contacts.length > 0) {
            contacts.forEach((c: any) => {
              if (c.tel && Array.isArray(c.tel)) {
                c.tel.forEach((t: string) => {
                  if (t) rawPhones.push(t);
                });
              } else if (c.tel) {
                rawPhones.push(c.tel);
              }
            });
          }
        } catch (apiErr) {
          console.warn('Navigator Contacts API failed, falling back:', apiErr);
          throw new Error('Contacts API permission denied or failed.');
        }
      } else {
        throw new Error('Contacts API not supported on this browser.');
      }

      return await matchPhoneNumbers(rawPhones);
    } catch (err: any) {
      setError(err.message || 'Failed to sync phone contacts');
      setIsSyncing(false);
      return [];
    }
  };

  const matchPhoneNumbers = async (phones: string[]): Promise<ContactMatch[]> => {
    if (!user) return [];
    setIsSyncing(true);
    setError(null);

    try {
      const hashes: string[] = [];
      for (const phone of phones) {
        const hash = await hashPhoneNumber(phone);
        if (hash && !hashes.includes(hash)) {
          hashes.push(hash);
        }
      }

      if (hashes.length === 0) {
        setIsSyncing(false);
        return [];
      }

      // Query Firestore in batches of 10 (Firestore 'in' limit)
      const matched: ContactMatch[] = [];
      const hashBatches: string[][] = [];
      
      for (let i = 0; i < hashes.length; i += 10) {
        hashBatches.push(hashes.slice(i, i + 10));
      }

      for (const batch of hashBatches) {
        const q = query(
          collection(db, 'users'),
          where('phoneHash', 'in', batch)
        );
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((docSnap) => {
          // Do not match oneself
          if (docSnap.id !== user.uid) {
            const data = docSnap.data();
            matched.push({
              userId: docSnap.id,
              displayName: data.displayName || 'User',
              username: data.username || '',
              photoURL: data.photoURL || '',
              phoneHash: data.phoneHash || ''
            });
          }
        });
      }

      setMatchedUsers(matched);
      setIsSyncing(false);
      return matched;
    } catch (err: any) {
      console.error('Error matching phone numbers:', err);
      setError(err.message || 'Error occurred while matching numbers');
      setIsSyncing(false);
      return [];
    }
  };

  const addMatchedContact = async (matchedUser: ContactMatch): Promise<boolean> => {
    if (!user) return false;
    try {
      // Add contact in local contacts subcollection
      await setDoc(doc(db, 'users', user.uid, 'contacts', matchedUser.userId), {
        displayName: matchedUser.displayName,
        username: matchedUser.username,
        photoURL: matchedUser.photoURL || '',
        addedAt: serverTimestamp()
      });
      return true;
    } catch (err) {
      console.error('Error adding contact:', err);
      return false;
    }
  };

  return {
    isSyncing,
    matchedUsers,
    error,
    isContactsApiSupported,
    syncPhoneContacts,
    matchPhoneNumbers,
    addMatchedContact,
    isGoogleSyncing,
    googleMatchedUsers,
    nonMatchedGoogleContacts,
    googleError,
    syncGoogleContacts,
  };
}
