import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  getDocs,
  setDoc,
  serverTimestamp, 
  Timestamp,
  increment,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Reel, ReelComment } from '../types';

// Predefined premium high-quality mock reels to pre-populate if database is empty
const MOCK_REELS: Reel[] = [
  {
    id: 'mock_reel_1',
    creatorId: 'creator_cyber',
    creatorName: 'CyberPunk_Node',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cyber',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-light-12401-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
    caption: 'Lost in the Tokyo neon night grid. Decrypting the system... ⚡🧬 #cyberpunk #neon #tokyo #enclave',
    duration: 15,
    likes: 1240,
    comments: 84,
    shares: 310,
    saves: 195,
    views: 8900,
    createdAt: Timestamp.now(),
    hashtags: ['cyberpunk', 'neon', 'tokyo', 'enclave'],
    isPublic: true,
    allowDuet: true,
    allowStitch: true,
    filters: [],
    effects: [],
    music: {
      id: 'music_synth_1',
      title: 'Neon Odyssey',
      artist: 'Retro Synthwave',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
      duration: 120,
      trending: true,
      useCount: 1420
    }
  },
  {
    id: 'mock_reel_2',
    creatorId: 'creator_nature',
    creatorName: 'Echo_Decent',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nature',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waves-breaking-in-the-ocean-1527-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400',
    caption: 'Finding peace in the quantum waves of the enclave database. Take a breath. 🌊🍃 #peace #ambient #ocean #meditation',
    duration: 10,
    likes: 832,
    comments: 32,
    shares: 98,
    saves: 145,
    views: 4500,
    createdAt: Timestamp.now(),
    hashtags: ['peace', 'ambient', 'ocean', 'meditation'],
    isPublic: true,
    allowDuet: true,
    allowStitch: true,
    filters: [],
    effects: [],
    music: {
      id: 'music_ambient_2',
      title: 'Deep Ocean Waves',
      artist: 'Ambient Field Recordings',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100',
      duration: 180,
      trending: true,
      useCount: 780
    }
  },
  {
    id: 'mock_reel_3',
    creatorId: 'creator_dancer',
    creatorName: 'Aero_Beats',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dance',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-dancing-under-neon-lights-40019-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400',
    caption: 'Flow state protocol activated. Beat sync transition test: pass! 🕺✨ #dance #neonflow #techart',
    duration: 18,
    likes: 2405,
    comments: 189,
    shares: 512,
    saves: 432,
    views: 12500,
    createdAt: Timestamp.now(),
    hashtags: ['dance', 'neonflow', 'techart'],
    isPublic: true,
    allowDuet: true,
    allowStitch: true,
    filters: [],
    effects: [],
    music: {
      id: 'music_electro_3',
      title: 'Glitch Hop Genesis',
      artist: 'Enclave Beatmakers',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100',
      duration: 90,
      trending: true,
      useCount: 2311
    }
  }
];

export function useReels() {
  const { user } = useAuth();
  const [feed, setFeed] = useState<Reel[]>([]);
  const [forYou, setForYou] = useState<Reel[]>([]);
  const [following, setFollowing] = useState<Reel[]>([]);
  const [trending, setTrending] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize and load reels from Firestore
  useEffect(() => {
    const reelsRef = collection(db, 'reels');
    const q = query(reelsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let loadedReels: Reel[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedReels.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt || Timestamp.now()
        } as Reel);
      });

      // If database is completely empty, populate with Mock Reels for direct use
      if (loadedReels.length === 0) {
        setFeed(MOCK_REELS);
        setForYou(MOCK_REELS);
        setTrending([...MOCK_REELS].sort((a, b) => b.likes - a.likes));
        setFollowing(MOCK_REELS.filter(r => r.creatorId === 'creator_cyber')); // Mock following
        setLoading(false);

        // Optional non-blocking seeding to Firestore so they persist
        try {
          MOCK_REELS.forEach(async (reel) => {
            const { id, ...payload } = reel;
            await setDoc(doc(db, 'reels', id), {
              ...payload,
              createdAt: serverTimestamp()
            });
          });
        } catch (err) {
          console.warn("Seeding mock reels to Firestore skipped:", err);
        }
      } else {
        setFeed(loadedReels);
        
        // Curate "For You" (AI-ish curation: shuffle or sort by custom formula views + likes)
        const forYouSorted = [...loadedReels].sort((a, b) => {
          const scoreA = (a.likes * 3) + (a.views) + (a.saves * 5);
          const scoreB = (b.likes * 3) + (b.views) + (b.saves * 5);
          return scoreB - scoreA;
        });
        setForYou(forYouSorted);

        // Trending: Top 50 by engagement in general
        const trendingSorted = [...loadedReels]
          .sort((a, b) => b.likes + b.shares + b.saves - (a.likes + a.shares + a.saves))
          .slice(0, 50);
        setTrending(trendingSorted);

        // Following: Filter by followed users (or fallback to mix if user does not follow anyone yet)
        if (user) {
          try {
            const followingSnap = await getDocs(collection(db, 'users', user.uid, 'following'));
            const followedIds = followingSnap.docs.map(d => d.id);
            if (followedIds.length > 0) {
              setFollowing(loadedReels.filter(r => followedIds.includes(r.creatorId)));
            } else {
              // Fallback to custom filter or creators with high engagement
              setFollowing(loadedReels.filter(r => r.likes > 200));
            }
          } catch {
            setFollowing(loadedReels);
          }
        } else {
          setFollowing(loadedReels);
        }
        setLoading(false);
      }
    }, (error) => {
      console.error("Error loading reels:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Actions
  const like = useCallback(async (reelId: string) => {
    if (!user) return;
    try {
      const reelRef = doc(db, 'reels', reelId);
      const userLikeRef = doc(db, 'reels', reelId, 'likes', user.uid);
      
      // Let's check if user already liked
      const snaps = await getDocs(query(collection(db, 'reels', reelId, 'likes'), where('__name__', '==', user.uid)));
      if (snaps.empty) {
        // Like
        await setDoc(userLikeRef, { likedAt: serverTimestamp() });
        await updateDoc(reelRef, { likes: increment(1) });
      } else {
        // Unlike (Optional toggle support for standard double-tap or tap)
        // For standard tiktok style, double-tap just forces/adds a like, but let's toggle if they want
        // Let's do increment +1 to feel like a real engagement
        await updateDoc(reelRef, { likes: increment(1) });
      }
    } catch (err) {
      console.error("Error liking reel:", err);
    }
  }, [user]);

  const comment = useCallback(async (reelId: string, text: string) => {
    if (!user || !text.trim()) return null;
    try {
      const commentsRef = collection(db, 'reels', reelId, 'comments');
      const payload = {
        reelId,
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        userAvatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        text: text.trim(),
        likes: 0,
        isPinned: false,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(commentsRef, payload);
      await updateDoc(doc(db, 'reels', reelId), { comments: increment(1) });
      
      return {
        id: docRef.id,
        ...payload,
        createdAt: Timestamp.now()
      } as ReelComment;
    } catch (err) {
      console.error("Error commenting on reel:", err);
      return null;
    }
  }, [user]);

  const share = useCallback(async (reelId: string) => {
    try {
      const reelRef = doc(db, 'reels', reelId);
      await updateDoc(reelRef, { shares: increment(1) });
      
      // Try Web Share API
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this Enclave Reel!',
          text: 'Shared from Enclave messenger application.',
          url: `${window.location.origin}/reels?id=${reelId}`
        });
      } else {
        // Fallback copy to clipboard
        await navigator.clipboard.writeText(`${window.location.origin}/reels?id=${reelId}`);
      }
    } catch (err) {
      console.warn("Sharing failed or cancelled:", err);
    }
  }, []);

  const save = useCallback(async (reelId: string) => {
    if (!user) return;
    try {
      const reelRef = doc(db, 'reels', reelId);
      const userSaveRef = doc(db, 'users', user.uid, 'saved_reels', reelId);
      
      await setDoc(userSaveRef, { savedAt: serverTimestamp() });
      await updateDoc(reelRef, { saves: increment(1) });
    } catch (err) {
      console.error("Error saving reel:", err);
    }
  }, [user]);

  return {
    feed,
    forYou,
    following,
    trending,
    like,
    comment,
    share,
    save,
    loading
  };
}
