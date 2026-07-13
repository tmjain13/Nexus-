import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { generateKeyPair, exportPublicKey } from '../lib/e2ee';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  credentialSignIn: (role: 'viewer' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
  googleAccessToken: string | null;
  signInWithGoogleContacts: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Clear Google token when user changes or signs out
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) {
        setGoogleAccessToken(null);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Check local credential session first
    const localUserSession = localStorage.getItem('nexus_user_session');
    if (localUserSession) {
      try {
        const parsedUser = JSON.parse(localUserSession) as User;
        setUser(parsedUser);
        setLoading(false);

        // Run non-blocking background sync for restored user session
        (async () => {
          try {
            const userRef = doc(db, 'users', parsedUser.uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
              const role = parsedUser.email?.includes('admin') ? 'admin' : 'viewer';
              await setDoc(userRef, {
                displayName: parsedUser.displayName,
                username: role === 'admin' ? 'admin' : 'viewer',
                email: parsedUser.email,
                photoURL: parsedUser.photoURL,
                bio: role === 'admin' ? 'Nexus Core Overseer' : 'Standard Decent Node',
                followersCount: 16,
                followingCount: 3,
                publicKey: localStorage.getItem(`e2ee_pub_${parsedUser.uid}`),
                createdAt: new Date(),
                role: role,
              });
            }
          } catch (err) {
            console.warn("Restore sync background error:", err);
          }
        })();

        return;
      } catch (e) {
        localStorage.removeItem('nexus_user_session');
      }
    }

    const timeout = setTimeout(() => {
      console.warn("Auth check timed out, setting loading to false");
      setLoading(false);
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(timeout);
      if (localStorage.getItem('nexus_user_session')) {
        setLoading(false);
        return;
      }
      if (user) {
        // Handle E2EE keys
        let needsKeyUpdate = false;
        let pubKeyStr = null;
        
        try {
          // If keys don't exist locally or are not stashed in memory, generate them
          const stashedKey = (window as any).e2ee_keys?.[`priv_${user.uid}`];
          if (!stashedKey || !localStorage.getItem(`e2ee_priv_${user.uid}`)) {
            const keyPair = await generateKeyPair();
            const exportedPub = await exportPublicKey(keyPair.publicKey);
            
            if (!(window as any).e2ee_keys) {
              (window as any).e2ee_keys = {};
            }
            (window as any).e2ee_keys[`priv_${user.uid}`] = keyPair.privateKey;
            
            localStorage.setItem(`e2ee_pub_${user.uid}`, JSON.stringify(exportedPub));
            localStorage.setItem(`e2ee_priv_${user.uid}`, "non-extractable");
            needsKeyUpdate = true;
            pubKeyStr = exportedPub;
          }
        } catch (err) {
          console.error("Setup E2EE error:", err);
        }

        // Ensure user document exists
        const userRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            const rawName = user.displayName || 'Anonymous';
            const safeDisplayName = rawName.length >= 2 ? rawName : `${rawName}_Anon`;
            const referrerUserId = localStorage.getItem('enclave_referred_by_user');
            
            const signupPayload: any = {
              displayName: safeDisplayName,
              username: user.email?.split('@')[0] || user.uid.slice(0, 8),
              email: user.email || `${user.uid.slice(0, 10)}@enclave.os`,
              photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid.slice(0, 8)}`,
              bio: '',
              followersCount: 0,
              followingCount: 0,
              publicKey: pubKeyStr,
              createdAt: serverTimestamp(),
            };

            if (referrerUserId) {
              signupPayload.referredBy = referrerUserId;
            }

            await setDoc(userRef, signupPayload);

            // Connect referred user and referrer as mutual contacts
            if (referrerUserId) {
              try {
                const referrerRef = doc(db, 'users', referrerUserId);
                const referrerSnap = await getDoc(referrerRef);
                if (referrerSnap.exists()) {
                  const rData = referrerSnap.data();

                  // 1. Add referrer to new user's contacts
                  await setDoc(doc(db, 'users', user.uid, 'contacts', referrerUserId), {
                    displayName: rData.displayName || 'User',
                    username: rData.username || '',
                    photoURL: rData.photoURL || '',
                    addedAt: serverTimestamp()
                  });

                  // 2. Add new user to referrer's contacts
                  await setDoc(doc(db, 'users', referrerUserId, 'contacts', user.uid), {
                    displayName: safeDisplayName,
                    username: signupPayload.username,
                    photoURL: signupPayload.photoURL,
                    addedAt: serverTimestamp()
                  });

                  // 3. Update referrer's referrals stats
                  const updatedReferredUsers = rData.referrals?.referredUsers || [];
                  updatedReferredUsers.push({
                    userId: user.uid,
                    joinedAt: new Date(),
                    lastActive: new Date()
                  });

                  await setDoc(referrerRef, {
                    referrals: {
                      totalSent: rData.referrals?.totalSent || 0,
                      totalJoined: (rData.referrals?.totalJoined || 0) + 1,
                      totalActive: (rData.referrals?.totalActive || 0) + 1,
                      referredUsers: updatedReferredUsers
                    }
                  }, { merge: true });

                  // 4. Create chat room and welcome message
                  const chatId = [user.uid, referrerUserId].sort().join('_');
                  const chatRef = doc(db, 'chats', chatId);
                  await setDoc(chatRef, {
                    participants: [user.uid, referrerUserId],
                    isGroup: false,
                    peerName: rData.displayName,
                    peerPhoto: rData.photoURL,
                    updatedAt: serverTimestamp()
                  });

                  const messageId = `welcome_${Date.now()}`;
                  await setDoc(doc(db, 'chats', chatId, 'messages', messageId), {
                    senderId: 'system',
                    text: `You and ${rData.displayName || 'User'} are now connected on Enclave OS.`,
                    type: 'text',
                    status: 'sent',
                    createdAt: serverTimestamp()
                  });
                }
              } catch (connErr) {
                console.warn("Failed to create auto-referral contact connection:", connErr);
              }

              // Clean up local referral tracking
              localStorage.removeItem('enclave_referred_by_user');
              localStorage.removeItem('enclave_referral_code');
            }
          } else if (needsKeyUpdate && pubKeyStr) {
            await setDoc(userRef, { publicKey: pubKeyStr }, { merge: true });
          }
        } catch (err) {
          console.warn("Failed to ensure user doc exists, likely offline.", err);
        }
      }
      setUser(user);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const credentialSignIn = async (role: 'viewer' | 'admin') => {
    const mockUser = {
      uid: role === 'admin' ? 'nexus-admin-101' : 'nexus-viewer-202',
      displayName: role === 'admin' ? 'Nexus Admin' : 'Nexus Viewer',
      email: role === 'admin' ? 'admin@nexus.social' : 'viewer@nexus.social',
      photoURL: role === 'admin' 
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=admin`
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=viewer`,
      emailVerified: true,
      metadata: {},
      providerData: [],
    } as unknown as User;

    // Generate keys if not existing
    try {
      if (!localStorage.getItem(`e2ee_priv_${mockUser.uid}`)) {
        const keyPair = await generateKeyPair();
        const exportedPub = await exportPublicKey(keyPair.publicKey);
        
        if (!(window as any).e2ee_keys) {
          (window as any).e2ee_keys = {};
        }
        (window as any).e2ee_keys[`priv_${mockUser.uid}`] = keyPair.privateKey;
        
        localStorage.setItem(`e2ee_pub_${mockUser.uid}`, JSON.stringify(exportedPub));
        localStorage.setItem(`e2ee_priv_${mockUser.uid}`, "non-extractable");
      }
    } catch (e) {
      console.error("Setup cred E2EE error:", e);
    }

    localStorage.setItem('nexus_user_session', JSON.stringify(mockUser));
    setUser(mockUser);

    // Guaranteed sync task on Firestore. We run it in a Promise.race with a 1200ms timeout 
    // to block when connected (preventing "No such user") but still bypass immediately when offline.
    const syncUserDoc = async () => {
      try {
        const userRef = doc(db, 'users', mockUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            displayName: mockUser.displayName,
            username: role === 'admin' ? 'admin' : 'viewer',
            email: mockUser.email,
            photoURL: mockUser.photoURL,
            bio: role === 'admin' ? 'Nexus Core Overseer' : 'Standard Decent Node',
            followersCount: 16,
            followingCount: 3,
            publicKey: localStorage.getItem(`e2ee_pub_${mockUser.uid}`),
            createdAt: new Date(),
            role: role,
          });
        }
      } catch (err) {
        console.warn("Firestore sync inner error:", err);
      }
    };

    try {
      await Promise.race([
        syncUserDoc(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1200))
      ]);
    } catch (err) {
      console.warn("Firestore sync resolved via fallback or timeout:", err);
      // Run retry in background in case database is slow to initialize
      syncUserDoc().catch(() => {});
    }
  };

  const signInWithGoogleContacts = async (): Promise<string | null> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/contacts');
    provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    provider.addScope('https://www.googleapis.com/auth/contacts.other.readonly');
    provider.addScope('https://www.googleapis.com/auth/directory.readonly');
    provider.addScope('https://www.googleapis.com/auth/user.emails.read');
    provider.addScope('https://www.googleapis.com/auth/user.phonenumbers.read');
    
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        return credential.accessToken;
      }
      return null;
    } catch (err) {
      console.error("Google sign in for contacts failed:", err);
      throw err;
    }
  };

  const logout = async () => {
    localStorage.removeItem('nexus_user_session');
    try {
      await signOut(auth);
    } catch (e) {}
    setUser(null);
    setGoogleAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, credentialSignIn, logout, googleAccessToken, signInWithGoogleContacts }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
