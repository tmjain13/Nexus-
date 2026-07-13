import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

export const postStatus = async (
  userId: string, 
  userName: string, 
  userPhoto: string, 
  type: 'image' | 'text' | 'video', 
  content: string,
  audience: 'public' | 'close-friends' = 'public',
  visibleTo: string[] = []
) => {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 36);

    await addDoc(collection(db, 'statuses'), {
      userId,
      userName,
      userPhoto,
      type,
      mediaUrl: (type === 'image' || type === 'video') ? content : null,
      text: type === 'text' ? content : null,
      views: [],
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      audience,
      visibleTo
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'statuses');
  }
};

export const subscribeToStatuses = (callback: (statuses: any[]) => void) => {
  const now = new Date();
  const q = query(
    collection(db, 'statuses'),
    where('expiresAt', '>', Timestamp.fromDate(now)),
    orderBy('expiresAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const statuses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(statuses);
  }, (err) => {
    console.error("Status subscription error:", err);
  });
};

export const viewStatus = async (statusId: string, userId: string) => {
  try {
    const statusRef = doc(db, 'statuses', statusId);
    await updateDoc(statusRef, {
      views: arrayUnion(userId)
    });
  } catch (err) {
    console.error("Failed to update status view:", err);
  }
};
