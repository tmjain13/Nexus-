import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { GroupChatDoc } from '../types';

export function useGroup(chatId: string) {
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupChatDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!chatId) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, 'chats', chatId),
      (docSnap) => {
        setLoading(false);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.type === 'group') {
            setGroup({ id: docSnap.id, ...data } as GroupChatDoc);
          } else {
            setGroup(null);
          }
        } else {
          setGroup(null);
        }
      },
      (err) => {
        console.error("useGroup hook error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [chatId]);

  const isAdmin = group?.admins?.includes(user?.uid || '') || false;
  const isMember = group?.members?.includes(user?.uid || '') || false;

  return {
    group,
    members: group?.members || [],
    isAdmin,
    isMember,
    loading,
    error
  };
}
