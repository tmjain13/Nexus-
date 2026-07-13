import { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc, deleteDoc, arrayUnion, arrayRemove, addDoc, collection, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export function useGroupActions(chatId: string) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addMember = async (targetUserId: string, targetDisplayName: string) => {
    if (!chatId || !user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Add to members list
      await updateDoc(doc(db, 'chats', chatId), {
        members: arrayUnion(targetUserId),
        participants: arrayUnion(targetUserId)
      });

      // 2. Distribute E2EE Public Key
      const userDocSnap = await getDoc(doc(db, 'users', targetUserId));
      if (userDocSnap.exists()) {
        const pubKey = userDocSnap.data()?.publicKey;
        if (pubKey) {
          await setDoc(doc(db, 'chats', chatId, 'memberKeys', targetUserId), {
            userId: targetUserId,
            publicKey: pubKey,
            updatedAt: serverTimestamp()
          });
        }
      }

      // 3. Write System Message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: `${user.displayName || 'Admin'} added ${targetDisplayName} to the group`,
        senderId: 'system',
        senderName: 'System',
        type: 'system',
        createdAt: serverTimestamp()
      });
    } catch (err: any) {
      console.error("useGroupActions.addMember error:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (targetUserId: string) => {
    if (!chatId || !user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch member info for system message
      const userDocSnap = await getDoc(doc(db, 'users', targetUserId));
      const displayName = userDocSnap.exists() ? userDocSnap.data()?.displayName : `User ${targetUserId.substring(0, 5)}`;

      // 2. Remove member
      await updateDoc(doc(db, 'chats', chatId), {
        members: arrayRemove(targetUserId),
        participants: arrayRemove(targetUserId),
        admins: arrayRemove(targetUserId)
      });

      // 3. Delete E2EE public key
      try {
        await deleteDoc(doc(db, 'chats', chatId, 'memberKeys', targetUserId));
      } catch (keyErr) {
        console.warn("Could not delete E2EE key for removed member:", keyErr);
      }

      // 4. Write System Message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: `${user.displayName || 'Admin'} removed ${displayName} from the group`,
        senderId: 'system',
        senderName: 'System',
        type: 'system',
        createdAt: serverTimestamp()
      });
    } catch (err: any) {
      console.error("useGroupActions.removeMember error:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const promoteMember = async (targetUserId: string) => {
    if (!chatId || !user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Add to admins
      await updateDoc(doc(db, 'chats', chatId), {
        admins: arrayUnion(targetUserId)
      });

      // 2. Fetch target name
      const userDocSnap = await getDoc(doc(db, 'users', targetUserId));
      const displayName = userDocSnap.exists() ? userDocSnap.data()?.displayName : `User ${targetUserId.substring(0, 5)}`;

      // 3. Write System Message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: `${user.displayName || 'Admin'} promoted ${displayName} to Admin`,
        senderId: 'system',
        senderName: 'System',
        type: 'system',
        createdAt: serverTimestamp()
      });
    } catch (err: any) {
      console.error("useGroupActions.promoteMember error:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const leaveGroup = async () => {
    if (!chatId || !user) return;
    setLoading(true);
    setError(null);
    try {
      const chatDocRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatDocRef);
      if (!chatSnap.exists()) return;

      const chatData = chatSnap.data();
      const members: string[] = chatData.members || [];
      const admins: string[] = chatData.admins || [];

      const isOnlyMember = members.length <= 1;
      if (isOnlyMember) {
        await deleteDoc(chatDocRef);
        return;
      }

      const isMeAdmin = admins.includes(user.uid);
      let updatedAdmins = admins.filter(id => id !== user.uid);
      let updatedMembers = members.filter(id => id !== user.uid);

      if (isMeAdmin && updatedAdmins.length === 0 && updatedMembers.length > 0) {
        // Auto-promote oldest remaining member to Admin
        const oldestMember = updatedMembers[0];
        updatedAdmins.push(oldestMember);

        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          text: `User ${oldestMember.substring(0, 5)}... was automatically promoted to Admin since the last Admin left.`,
          senderId: 'system',
          senderName: 'System',
          type: 'system',
          createdAt: serverTimestamp()
        });
      }

      await updateDoc(chatDocRef, {
        members: updatedMembers,
        participants: updatedMembers,
        admins: updatedAdmins
      });

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: `${user.displayName || 'Member'} left the group`,
        senderId: 'system',
        senderName: 'System',
        type: 'system',
        createdAt: serverTimestamp()
      });
    } catch (err: any) {
      console.error("useGroupActions.leaveGroup error:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async () => {
    if (!chatId || !user) return;
    setLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, 'chats', chatId));
    } catch (err: any) {
      console.error("useGroupActions.deleteGroup error:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    addMember,
    removeMember,
    promoteMember,
    leaveGroup,
    deleteGroup,
    loading,
    error
  };
}
