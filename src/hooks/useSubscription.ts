import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';

export interface Subscription {
  tier: 'free' | 'premium';
  plan?: 'monthly' | 'annual';
  startedAt?: any;
  expiresAt?: any;
  autoRenew: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.subscription) {
          setSubscription(data.subscription as Subscription);
        } else {
          // If no subscription field exists, initialize with a Free tier that has a 30-day trial countdown
          const defaultSub: Subscription = {
            tier: 'free',
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
            autoRenew: false,
          };
          
          updateDoc(userRef, { subscription: defaultSub }).catch(err => {
            console.warn("Failed to initialize default subscription:", err);
          });
          
          setSubscription(defaultSub);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Subscription snapshot listener failed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getDates = () => {
    if (!subscription) return { started: null, expires: null };
    
    const started = subscription.startedAt?.toDate 
      ? subscription.startedAt.toDate() 
      : (subscription.startedAt ? new Date(subscription.startedAt) : null);
      
    const expires = subscription.expiresAt?.toDate 
      ? subscription.expiresAt.toDate() 
      : (subscription.expiresAt ? new Date(subscription.expiresAt) : null);
      
    return { started, expires };
  };

  const { expires } = getDates();
  
  const isPremium = subscription?.tier === 'premium' && expires && expires.getTime() > Date.now();
  const isTrial = subscription?.tier === 'premium' && !subscription.autoRenew; // Trial if premium but not autoRenewing / started as trial month
  
  const daysLeft = expires 
    ? Math.max(0, Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) 
    : 0;

  const upgrade = async (plan: 'monthly' | 'annual' = 'monthly') => {
    if (!user) return false;
    const durationDays = plan === 'annual' ? 365 : 30;
    const userRef = doc(db, 'users', user.uid);
    const updatedSub: Subscription = {
      tier: 'premium',
      plan,
      startedAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      autoRenew: true,
    };
    
    try {
      await updateDoc(userRef, { subscription: updatedSub });
      return true;
    } catch (err) {
      console.error("Failed to upgrade subscription:", err);
      return false;
    }
  };

  const cancel = async () => {
    if (!user || !subscription) return false;
    const userRef = doc(db, 'users', user.uid);
    
    try {
      await updateDoc(userRef, {
        'subscription.autoRenew': false
      });
      return true;
    } catch (err) {
      console.error("Failed to cancel auto-renewal:", err);
      return false;
    }
  };

  // For testing: direct downgrade to free
  const downgrade = async () => {
    if (!user) return false;
    const userRef = doc(db, 'users', user.uid);
    const updatedSub: Subscription = {
      tier: 'free',
      startedAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Reset trial
      autoRenew: false,
    };
    try {
      await updateDoc(userRef, { subscription: updatedSub });
      return true;
    } catch (err) {
      console.error("Failed to downgrade subscription:", err);
      return false;
    }
  };

  return {
    subscription,
    isPremium: !!isPremium,
    isTrial: !!isTrial,
    daysLeft,
    upgrade,
    cancel,
    downgrade,
    loading
  };
}
