import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

export interface InviteLink {
  url: string;
  code: string;
  createdAt: any;
  clicks: number;
}

export interface Referral {
  userId: string;
  joinedAt: any;
  lastActive: any;
}

export interface ReferralStats {
  totalSent: number;
  totalJoined: number;
  totalActive: number;
  referredUsers: Referral[];
}

// Generate an 8-character uppercase alphanumeric code
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function useInviteLink() {
  const { user } = useAuth();
  const [inviteLink, setInviteLink] = useState<InviteLink | null>(null);
  const [referrals, setReferrals] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch or initialize the user's invite link and referrals on load
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchInviteData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          
          // Set referral stats
          if (data.referrals) {
            setReferrals(data.referrals as ReferralStats);
          } else {
            // Initialize default referrals stats structure
            const initialReferrals: ReferralStats = {
              totalSent: 0,
              totalJoined: 0,
              totalActive: 0,
              referredUsers: []
            };
            setReferrals(initialReferrals);
          }

          // Set or generate invite link
          if (data.inviteLink) {
            setInviteLink(data.inviteLink as InviteLink);
          } else {
            // Auto-generate if not exists
            await generateLink();
          }
        }
      } catch (err) {
        console.error('Error fetching invite data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInviteData();
  }, [user]);

  const generateLink = async (): Promise<InviteLink | null> => {
    if (!user) return null;

    try {
      const code = generateReferralCode();
      const origin = window.location.origin;
      const url = `${origin}/invite/${user.uid}?ref=${code}`;
      
      const newInviteLink: InviteLink = {
        url,
        code,
        createdAt: new Date(),
        clicks: 0
      };

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        inviteLink: newInviteLink,
        // Also initialize referrals stats structure if not present
        referrals: referrals || {
          totalSent: 0,
          totalJoined: 0,
          totalActive: 0,
          referredUsers: []
        }
      });

      setInviteLink(newInviteLink);
      return newInviteLink;
    } catch (err) {
      console.error('Error generating invite link:', err);
      return null;
    }
  };

  const copyLink = async (): Promise<boolean> => {
    if (!inviteLink) return false;
    try {
      await navigator.clipboard.writeText(inviteLink.url);
      return true;
    } catch (err) {
      console.error('Error copying link:', err);
      return false;
    }
  };

  const shareLink = async (): Promise<boolean> => {
    if (!inviteLink) return false;
    const shareMessage = `Join me on Enclave OS — the peaceful messenger. ${inviteLink.url}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Enclave OS Invitation',
          text: shareMessage,
          url: inviteLink.url,
        });
        return true;
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        console.warn('Navigator share failed, falling back to copy:', err);
        return await copyLink();
      }
    } else {
      return await copyLink();
    }
  };

  const trackClick = async (referrerId: string): Promise<void> => {
    try {
      const referrerRef = doc(db, 'users', referrerId);
      // Increment clicks atomically
      await updateDoc(referrerRef, {
        'inviteLink.clicks': increment(1)
      });
    } catch (err) {
      console.error('Error tracking invite click:', err);
    }
  };

  return {
    inviteLink,
    referrals,
    loading,
    generateLink,
    copyLink,
    shareLink,
    trackClick,
  };
}
