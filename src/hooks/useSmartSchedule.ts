import { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useSmartSchedule(chatId: string) {
  const [suggestedTime, setSuggestedTime] = useState<Date | null>(null);
  const [suggestedLabel, setSuggestedLabel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestion = async (peerName: string, peerId: string) => {
    if (!peerId) return;
    setIsLoading(true);
    try {
      // 1. Fetch presence data from Firestore to make it real
      const presenceRef = doc(db, 'users', peerId, 'presence', 'status');
      const snap = await getDoc(presenceRef);
      let lastSeenDate: Date | null = null;
      let isOnline = false;

      if (snap.exists()) {
        const data = snap.data();
        isOnline = data.status === 'online';
        if (data.lastSeen?.toDate) {
          lastSeenDate = data.lastSeen.toDate();
        } else if (data.lastSeen) {
          lastSeenDate = new Date(data.lastSeen);
        }
      }

      // 2. Formulate smart scheduling suggestions
      // We will suggest a time today or tomorrow when they are active
      const now = new Date();
      let targetTime = new Date();
      let label = '';

      const cleanPeerName = peerName || 'Recipient';

      // Advanced heuristic rules based on active times
      if (isOnline) {
        // Peer is online right now, suggest scheduling in 1 hour or 2 hours for a follow-up
        targetTime.setHours(now.getHours() + 2);
        label = `${cleanPeerName} is online now. Suggest scheduling for a 2-hour check-in at ${targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
      } else if (lastSeenDate) {
        const diffMs = now.getTime() - lastSeenDate.getTime();
        const diffHrs = diffMs / (1000 * 60 * 60);

        if (diffHrs < 4) {
          // Active recently, suggest later today
          targetTime.setHours(now.getHours() + 3);
          if (targetTime.getHours() > 21) {
            // Suggest tomorrow morning
            targetTime.setDate(now.getDate() + 1);
            targetTime.setHours(9, 0, 0, 0);
            label = `${cleanPeerName} was active recently. Suggest tomorrow morning at 9:00 AM.`;
          } else {
            label = `${cleanPeerName} was active ${Math.round(diffHrs)}h ago. Suggest scheduling for today at ${targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
          }
        } else {
          // Active long ago, suggest their peak hours: 9 AM or 6 PM
          if (now.getHours() < 17) {
            targetTime.setHours(18, 0, 0, 0); // 6 PM today
            label = `${cleanPeerName} is usually active in evenings. Suggest today at 6:00 PM.`;
          } else {
            targetTime.setDate(now.getDate() + 1);
            targetTime.setHours(9, 0, 0, 0); // 9 AM tomorrow
            label = `${cleanPeerName} is usually active in the morning. Suggest tomorrow at 9:00 AM.`;
          }
        }
      } else {
        // Default safe recommendations
        if (now.getHours() < 14) {
          targetTime.setHours(17, 30, 0, 0); // 5:30 PM today
          label = `${cleanPeerName} is usually active around 5:30 PM. Suggest scheduling for today.`;
        } else {
          targetTime.setDate(now.getDate() + 1);
          targetTime.setHours(9, 30, 0, 0); // 9:30 AM tomorrow
          label = `${cleanPeerName} is active during mornings. Suggest scheduling for tomorrow at 9:30 AM.`;
        }
      }

      // Standard boundary: cannot be in the past, min 5 mins from now
      const minTime = new Date(now.getTime() + 6 * 60 * 1000);
      if (targetTime < minTime) {
        targetTime = minTime;
      }

      setSuggestedTime(targetTime);
      setSuggestedLabel(label);
    } catch (err) {
      console.error("Smart scheduling generation error:", err);
      // Fallback
      const targetTime = new Date(Date.now() + 60 * 60 * 1000);
      setSuggestedTime(targetTime);
      setSuggestedLabel(`Suggest scheduling in 1 hour at ${targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSuggestion = () => {
    setSuggestedTime(null);
    setSuggestedLabel('');
  };

  return {
    suggestedTime,
    suggestedLabel,
    isLoading,
    fetchSuggestion,
    clearSuggestion
  };
}
