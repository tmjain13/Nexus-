import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { CloseFriend } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

export function useCloseFriends() {
  const { user } = useAuth();
  const [list, setList] = useState<CloseFriend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setList([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const friends: CloseFriend[] = data.closeFriends || [];
        setList(friends);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading close friends:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const isCloseFriend = useCallback((userId: string) => {
    return list.some(f => f.userId === userId);
  }, [list]);

  const add = useCallback(async (friendId: string, addedBy: 'manual' | 'ai-suggested' = 'manual') => {
    if (!user) return;
    if (list.length >= 50) {
      throw new Error("You have reached the maximum limit of 50 close friends.");
    }
    if (isCloseFriend(friendId)) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const newFriend: CloseFriend = {
        userId: friendId,
        addedAt: Timestamp.now(),
        addedBy
      };
      
      const updatedList = [...list, newFriend];
      await updateDoc(userRef, {
        closeFriends: updatedList
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  }, [user, list, isCloseFriend]);

  const remove = useCallback(async (friendId: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedList = list.filter(f => f.userId !== friendId);
      await updateDoc(userRef, {
        closeFriends: updatedList
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  }, [user, list]);

  return {
    list,
    loading,
    add,
    remove,
    isCloseFriend
  };
}
