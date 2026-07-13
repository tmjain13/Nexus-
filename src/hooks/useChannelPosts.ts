import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  query, 
  orderBy, 
  onSnapshot, 
  writeBatch, 
  serverTimestamp, 
  Timestamp,
  increment,
  updateDoc,
  getDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { ChannelPost, ChannelComment } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { useScheduledMessages } from './useScheduledMessages';

export function useChannelPosts(channelId: string) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ChannelPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { scheduleMessage } = useScheduledMessages(channelId);

  useEffect(() => {
    if (!channelId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'channels', channelId, 'posts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          channelId,
          type: data.type || 'text',
          content: data.content || '',
          mediaUrl: data.mediaUrl || '',
          fileName: data.fileName || '',
          createdAt: data.createdAt,
          views: data.views || 0,
          reactions: data.reactions || {},
          comments: data.comments || 0,
          isPaidOnly: data.isPaidOnly || false,
          forwardedFrom: data.forwardedFrom || undefined,
          options: data.options || undefined,
          votes: data.votes || undefined,
          disallowForwarding: data.disallowForwarding || false
        } as ChannelPost;
      });
      setPosts(list);
      setLoading(false);
    }, (err) => {
      console.error("Error loading channel posts:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [channelId]);

  const createPost = async (
    type: 'text' | 'photo' | 'video' | 'file' | 'poll' | 'forward',
    content: string,
    mediaUrl?: string,
    fileName?: string,
    isPaidOnly: boolean = false,
    forwardedFrom?: string,
    options?: string[],
    disallowForwarding: boolean = false
  ) => {
    if (!user) throw new Error("Authentication required");

    const postRef = doc(collection(db, 'channels', channelId, 'posts'));
    const postId = postRef.id;

    const newPost: Omit<ChannelPost, 'id' | 'channelId'> = {
      type,
      content,
      mediaUrl: mediaUrl || '',
      fileName: fileName || '',
      createdAt: serverTimestamp() as any,
      views: 0,
      reactions: {},
      comments: 0,
      isPaidOnly,
      forwardedFrom: forwardedFrom || undefined,
      options: options || undefined,
      votes: type === 'poll' ? {} : undefined,
      disallowForwarding
    };

    try {
      await setDoc(doc(db, 'channels', channelId, 'posts', postId), newPost);
      return postId;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `channels/${channelId}/posts/${postId}`);
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) throw new Error("Authentication required");
    try {
      await deleteDoc(doc(db, 'channels', channelId, 'posts', postId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `channels/${channelId}/posts/${postId}`);
    }
  };

  const schedulePost = async (
    scheduledDate: Date,
    type: 'text' | 'photo' | 'video' | 'file' | 'poll',
    content: string,
    mediaUrl?: string,
    isPaidOnly: boolean = false,
    options?: string[],
    disallowForwarding: boolean = false
  ) => {
    if (!user) throw new Error("Authentication required");

    // We reuse useScheduledMessages, tagging as channel post
    const extraData: any = {
      isChannel: true,
      channelId,
      type,
      isPaidOnly,
      options,
      disallowForwarding,
      attachments: mediaUrl ? [{ url: mediaUrl, type: type }] : []
    };

    return await scheduleMessage(content, scheduledDate, extraData);
  };

  const reactToPost = async (postId: string, emoji: string) => {
    if (!user) return;

    const postRef = doc(db, 'channels', channelId, 'posts', postId);
    const userReactRef = doc(db, 'channels', channelId, 'posts', postId, 'userReactions', user.uid);

    try {
      const userReactDoc = await getDoc(userReactRef);
      const postDoc = await getDoc(postRef);
      if (!postDoc.exists()) return;

      const currentReactions = postDoc.data()?.reactions || {};
      const batch = writeBatch(db);

      if (userReactDoc.exists()) {
        const previousEmoji = userReactDoc.data().emoji;
        
        if (previousEmoji === emoji) {
          // Toggle off the reaction
          const newCount = Math.max(0, (currentReactions[emoji] || 1) - 1);
          const updatedReactions = { ...currentReactions };
          if (newCount === 0) {
            delete updatedReactions[emoji];
          } else {
            updatedReactions[emoji] = newCount;
          }
          batch.update(postRef, { reactions: updatedReactions });
          batch.delete(userReactRef);
        } else {
          // Switch reaction emoji
          const updatedReactions = { ...currentReactions };
          // Decrement previous emoji
          const prevCount = Math.max(0, (updatedReactions[previousEmoji] || 1) - 1);
          if (prevCount === 0) {
            delete updatedReactions[previousEmoji];
          } else {
            updatedReactions[previousEmoji] = prevCount;
          }
          // Increment new emoji
          updatedReactions[emoji] = (updatedReactions[emoji] || 0) + 1;

          batch.update(postRef, { reactions: updatedReactions });
          batch.set(userReactRef, { emoji, updatedAt: serverTimestamp() });
        }
      } else {
        // New reaction
        const updatedReactions = { ...currentReactions };
        updatedReactions[emoji] = (updatedReactions[emoji] || 0) + 1;

        batch.update(postRef, { reactions: updatedReactions });
        batch.set(userReactRef, { emoji, updatedAt: serverTimestamp() });
      }

      await batch.commit();
    } catch (err) {
      console.error("Error reacting to post:", err);
    }
  };

  const votePoll = async (postId: string, optionIndex: number) => {
    if (!user) return;

    const postRef = doc(db, 'channels', channelId, 'posts', postId);

    try {
      const postDoc = await getDoc(postRef);
      if (!postDoc.exists()) return;

      const currentVotes = postDoc.data().votes || {};
      const updatedVotes = { ...currentVotes, [user.uid]: optionIndex };

      await updateDoc(postRef, { votes: updatedVotes });
    } catch (err) {
      console.error("Error voting in poll:", err);
    }
  };

  const registerView = async (postId: string) => {
    // Avoid double incrementing view during same session
    const viewedKey = `viewed_${channelId}_${postId}`;
    if (sessionStorage.getItem(viewedKey)) return;

    try {
      const postRef = doc(db, 'channels', channelId, 'posts', postId);
      await updateDoc(postRef, { views: increment(1) });
      sessionStorage.setItem(viewedKey, 'true');
    } catch (err) {
      console.error("Error updating view count:", err);
    }
  };

  return {
    posts,
    loading,
    createPost,
    deletePost,
    schedulePost,
    reactToPost,
    votePoll,
    registerView
  };
}
