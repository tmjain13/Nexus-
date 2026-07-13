import React, { useState, useEffect } from 'react';
import { X, Send, Heart, Pin, Star, ThumbsUp } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Reel, ReelComment } from '../types';

interface ReelCommentsProps {
  reel: Reel;
  onClose: () => void;
  onAddComment: (text: string) => Promise<any>;
}

export const ReelComments: React.FC<ReelCommentsProps> = ({ reel, onClose, onAddComment }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<ReelComment[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  // Load comments in real-time
  useEffect(() => {
    const commentsRef = collection(db, 'reels', reel.id, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: ReelComment[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        loaded.push({
          id: doc.id,
          ...d,
          createdAt: d.createdAt || { toDate: () => new Date() }
        } as ReelComment);
      });

      // Sort by pinned comments first, then date
      const sorted = [...loaded].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });

      setComments(sorted);
      setLoading(false);
    }, (err) => {
      console.warn("Could not stream real comments, fallback to empty/mock:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [reel.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newCommentText = inputText;
    setInputText('');
    await onAddComment(newCommentText);
  };

  const togglePin = async (comment: ReelComment) => {
    // Only creator can pin
    if (!user || user.uid !== reel.creatorId) return;
    try {
      const commentRef = doc(db, 'reels', reel.id, 'comments', comment.id);
      await updateDoc(commentRef, {
        isPinned: !comment.isPinned
      });
    } catch (err) {
      console.error("Failed to pin comment:", err);
    }
  };

  const handleLikeComment = async (comment: ReelComment) => {
    try {
      const commentRef = doc(db, 'reels', reel.id, 'comments', comment.id);
      await updateDoc(commentRef, {
        likes: (comment.likes || 0) + 1
      });
    } catch (err) {
      console.error("Failed to like comment:", err);
    }
  };

  return (
    <div id="reel_comments_drawer" className="absolute bottom-0 left-0 right-0 h-[65vh] bg-zinc-950 border-t border-zinc-800 rounded-t-3xl flex flex-col z-40 select-none text-white animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800">
        <div>
          <h3 className="font-bold text-sm">Comments</h3>
          <p className="text-[11px] text-zinc-500">{comments.length} responses</p>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-500">Decrypting comment stream...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-2xl mb-1">💬</span>
            <p className="text-xs font-bold text-zinc-400">No comments yet</p>
            <p className="text-[10px] text-zinc-600 mt-1">Activate the protocol and start the conversation!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isCreator = comment.userId === reel.creatorId;
            const canPin = user && user.uid === reel.creatorId;

            return (
              <div key={comment.id} className="flex gap-3 items-start group">
                <img 
                  src={comment.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId}`} 
                  alt="" 
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-zinc-800 bg-zinc-900" 
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-zinc-200">
                      {comment.userName || 'Enclave Node'}
                    </span>
                    {isCreator && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-500 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold">
                        CREATOR
                      </span>
                    )}
                    {comment.isPinned && (
                      <span className="text-[9px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                        <Pin size={8} className="text-amber-500" fill="currentColor" />
                        Pinned
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-zinc-300 mt-1 break-words whitespace-pre-wrap leading-relaxed">
                    {comment.text}
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-500">
                    <span>
                      {comment.createdAt && typeof (comment.createdAt as any).toDate === 'function' 
                        ? new Date((comment.createdAt as any).toDate()).toLocaleDateString() 
                        : 'Just now'}
                    </span>
                    <button 
                      onClick={() => handleLikeComment(comment)}
                      className="hover:text-amber-500 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ThumbsUp size={10} />
                      {comment.likes || 0}
                    </button>
                    {canPin && (
                      <button 
                        onClick={() => togglePin(comment)}
                        className="text-zinc-500 hover:text-amber-500 font-bold transition-colors cursor-pointer"
                      >
                        {comment.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-800 bg-zinc-900/60 flex items-center gap-2">
        <input 
          type="text" 
          placeholder="Share your encrypted reaction..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-white placeholder-zinc-500"
        />
        <button 
          type="submit"
          className="w-8.5 h-8.5 bg-amber-500 hover:bg-amber-600 text-black flex items-center justify-center rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          disabled={!inputText.trim()}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
export default ReelComments;
