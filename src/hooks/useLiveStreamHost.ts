import { db } from '../lib/firebase';
import { doc, updateDoc, deleteDoc, arrayUnion, addDoc, collection, serverTimestamp } from 'firebase/firestore';

export const useLiveStreamHost = (streamId: string) => {
  const startStream = async () => {
    await updateDoc(doc(db, 'streams', streamId), { status: 'live', startedAt: serverTimestamp() });
  };

  const endStream = async () => {
    await updateDoc(doc(db, 'streams', streamId), { status: 'ended', endedAt: serverTimestamp() });
  };

  const muteViewer = async (userId: string) => {
    // Implement logic to update stream settings or add a moderation subcollection entry
  };

  const banViewer = async (userId: string) => {
    await updateDoc(doc(db, 'streams', streamId), { bannedUsers: arrayUnion(userId) });
  };

  const inviteCohost = async (userId: string) => {
    await updateDoc(doc(db, 'streams', streamId), { cohosts: arrayUnion(userId) });
  };

  return { startStream, endStream, muteViewer, banViewer, inviteCohost };
};
