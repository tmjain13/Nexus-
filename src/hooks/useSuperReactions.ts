import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from './useSubscription';
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { ReactionQuota } from '../types';

export const useSuperReactions = () => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [quota, setQuota] = useState<ReactionQuota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setQuota(null);
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const currentQuota = data.superReactionQuota as ReactionQuota | undefined;

        if (!currentQuota) {
          // Initialize default quota
          const resetTime = new Date();
          resetTime.setHours(resetTime.getHours() + 24); // 24-hour window
          const defaultQuota: ReactionQuota = {
            remaining: 3,
            resetAt: Timestamp.fromDate(resetTime),
            totalUsed: 0,
            isPremium: isPremium
          };

          updateDoc(userRef, { superReactionQuota: defaultQuota }).catch((err) => {
            console.warn("Failed to initialize default superReactionQuota:", err);
          });
          setQuota(defaultQuota);
        } else {
          // Reset check
          const resetDate = currentQuota.resetAt?.toDate 
            ? currentQuota.resetAt.toDate() 
            : (currentQuota.resetAt ? new Date(currentQuota.resetAt) : new Date(0));
          if (Date.now() > resetDate.getTime()) {
            const nextReset = new Date();
            nextReset.setHours(nextReset.getHours() + 24);
            const updatedQuota: ReactionQuota = {
              remaining: 3,
              resetAt: Timestamp.fromDate(nextReset),
              totalUsed: currentQuota.totalUsed || 0,
              isPremium: isPremium
            };
            updateDoc(userRef, { superReactionQuota: updatedQuota }).catch((err) => {
              console.warn("Failed to reset superReactionQuota:", err);
            });
            setQuota(updatedQuota);
          } else {
            setQuota({
              ...currentQuota,
              isPremium: isPremium
            });
          }
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Quota onSnapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isPremium]);

  const canUse = useCallback(() => {
    if (isPremium) return true;
    if (!quota) return false;
    return quota.remaining > 0;
  }, [isPremium, quota]);

  const useSuperReaction = useCallback(async () => {
    if (!user) return false;
    const userRef = doc(db, 'users', user.uid);

    try {
      if (isPremium) {
        // Premium user has unlimited quota but we still increment totalUsed
        const totalUsed = (quota?.totalUsed || 0) + 1;
        await updateDoc(userRef, {
          'superReactionQuota.totalUsed': totalUsed
        });
        return true;
      } else {
        if (!quota || quota.remaining <= 0) return false;
        const newRemaining = Math.max(0, quota.remaining - 1);
        const newTotalUsed = (quota.totalUsed || 0) + 1;

        await updateDoc(userRef, {
          'superReactionQuota.remaining': newRemaining,
          'superReactionQuota.totalUsed': newTotalUsed
        });
        return true;
      }
    } catch (err) {
      console.error("Failed to use super reaction quota:", err);
      return false;
    }
  }, [user, isPremium, quota]);

  const resetQuotaForTesting = useCallback(async () => {
    if (!user) return false;
    const userRef = doc(db, 'users', user.uid);
    const resetTime = new Date();
    resetTime.setHours(resetTime.getHours() + 24);
    const defaultQuota: ReactionQuota = {
      remaining: 3,
      resetAt: Timestamp.fromDate(resetTime),
      totalUsed: quota?.totalUsed || 0,
      isPremium: isPremium
    };
    try {
      await updateDoc(userRef, { superReactionQuota: defaultQuota });
      return true;
    } catch (err) {
      console.error("Failed to reset quota for testing:", err);
      return false;
    }
  }, [user, isPremium, quota]);

  return {
    quota,
    loading,
    canUse,
    useSuperReaction,
    resetQuotaForTesting
  };
};
