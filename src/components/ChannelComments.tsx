import React, { useState, useEffect, useRef } from 'react';
import { 
  X, MessageSquare, CornerDownRight, Trash2, 
  UserMinus, AlertCircle, Send, ShieldAlert, Clock 
} from 'lucide-react';
import { 
  collection, 
  doc, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  getDoc,
  serverTimestamp,
  increment,
  Timestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Channel, ChannelComment, ChannelPost } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

interface ChannelCommentsProps {
  channel: Channel;
  postId: string;
  isOwner: boolean;
  onClose: () => void;
}

export function ChannelComments({ channel, postId, isOwner, onClose }: ChannelCommentsProps) {
  const { user } = useAuth();
  const [post, setPost] = useState<ChannelPost | null>(null);
  const [comments, setComments] = useState<ChannelComment[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeReplyTo, setActiveReplyTo] = useState<ChannelComment | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);
  
  // Slow mode handling
  const [lastCommentTime, setLastCommentTime] = useState<number>(0);
  const [slowModeCountdown, setSlowModeCountdown] = useState(0);

  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Load post details
  useEffect(() => {
    if (!channel.id || !postId) return;
    const unsubPost = onSnapshot(doc(db, 'channels', channel.id, 'posts', postId), (docSnap) => {
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() } as ChannelPost);
      }
    });
    return () => unsubPost();
  }, [channel.id, postId]);

  // Load comments
  useEffect(() => {
    if (!channel.id || !postId) return;

    setLoading(true);
    const q = query(
      collection(db, 'channels', channel.id, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          postId,
          userId: data.userId,
          text: data.text || '',
          replyTo: data.replyTo || undefined,
          createdAt: data.createdAt,
          userName: data.userName || 'Subscriber',
          userAvatar: data.userAvatar || ''
        } as ChannelComment;
      });
      setComments(list);
      setLoading(false);
      
      // Scroll to bottom on load
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (err) => {
      console.error("Error loading comments:", err);
      setLoading(false);
    });

    // Load blocked/banned users list if available on channel
    const unsubChannel = onSnapshot(doc(db, 'channels', channel.id), (snap) => {
      if (snap.exists()) {
        setBannedUsers(snap.data().bannedUsers || []);
      }
    });

    return () => {
      unsubscribe();
      unsubChannel();
    };
  }, [channel.id, postId]);

  // Slow mode countdown timer
  useEffect(() => {
    if (slowModeCountdown <= 0) return;
    const interval = setInterval(() => {
      setSlowModeCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [slowModeCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!inputText.trim()) return;

    // Check if user is banned
    if (bannedUsers.includes(user.uid)) {
      alert("You are restricted from posting comments in this channel.");
      return;
    }

    // Check Slow Mode
    const slowModeLimit = channel.settings?.slowMode || 0;
    if (slowModeLimit > 0 && !isOwner) {
      const elapsed = (Date.now() - lastCommentTime) / 1000;
      if (elapsed < slowModeLimit) {
        setSlowModeCountdown(Math.ceil(slowModeLimit - elapsed));
        return;
      }
    }

    const commentsColl = collection(db, 'channels', channel.id, 'posts', postId, 'comments');
    const newComment = {
      postId,
      userId: user.uid,
      text: inputText.trim(),
      replyTo: activeReplyTo?.id || null,
      createdAt: serverTimestamp(),
      userName: user.displayName || 'Subscriber',
      userAvatar: user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`
    };

    setInputText('');
    setActiveReplyTo(null);
    setLastCommentTime(Date.now());

    try {
      // 1. Add comment to subcollection
      await addDoc(commentsColl, newComment);

      // 2. Increment comments counter in post
      await updateDoc(doc(db, 'channels', channel.id, 'posts', postId), {
        comments: increment(1)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `channels/${channel.id}/posts/${postId}/comments`);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!isOwner) return;
    if (!window.confirm("Delete this comment?")) return;

    try {
      await deleteDoc(doc(db, 'channels', channel.id, 'posts', postId, 'comments', commentId));
      await updateDoc(doc(db, 'channels', channel.id, 'posts', postId), {
        comments: increment(-1)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleBanUser = async (userId: string, userName: string) => {
    if (!isOwner) return;
    if (!window.confirm(`Ban ${userName} from commenting?`)) return;

    try {
      await updateDoc(doc(db, 'channels', channel.id), {
        bannedUsers: arrayUnion(userId)
      });
      alert(`${userName} has been banned.`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-900/60 overflow-hidden font-sans">
      {/* Header */}
      <div className="p-4 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-amber-500" />
          <div>
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Comments Thread</h3>
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Post Feed Discussion</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-1.5 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Post Context Preview */}
      {post && (
        <div className="p-4 bg-zinc-900/20 border-b border-zinc-900 text-left shrink-0 max-h-32 overflow-y-auto">
          <span className="text-[8px] font-mono font-bold text-amber-500/60 uppercase tracking-widest block mb-1">Original Post Preview</span>
          <p className="text-xs text-zinc-400 truncate leading-relaxed">
            {post.content}
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 progress-scroll">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Loading thread discussions...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
            <MessageSquare size={24} className="text-zinc-700" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">No comments yet. Start the conversation!</span>
          </div>
        ) : (
          <div className="space-y-3.5 text-left">
            {comments.map((cmt) => {
              const isReply = !!cmt.replyTo;
              const parentComment = isReply ? comments.find(c => c.id === cmt.replyTo) : null;

              return (
                <div 
                  key={cmt.id} 
                  className={cn(
                    "flex gap-3 items-start p-3 rounded-2xl border transition-colors bg-zinc-900/30",
                    isReply ? "ml-6 border-zinc-900 bg-zinc-950/20" : "border-zinc-850/60"
                  )}
                >
                  <img 
                    src={cmt.userAvatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${cmt.userId}`}
                    alt={cmt.userName}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-800 shrink-0"
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-200">
                          {cmt.userName}
                        </span>
                        {cmt.userId === channel.ownerId && (
                          <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[7px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                            OWNER
                          </span>
                        )}
                      </div>
                      
                      <span className="text-[9px] font-mono text-zinc-500">
                        {cmt.createdAt ? formatDistanceToNow(cmt.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                      </span>
                    </div>

                    {/* Reply attribution */}
                    {isReply && parentComment && (
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-900 max-w-max">
                        <CornerDownRight size={10} className="text-amber-500/70" />
                        <span>In reply to <strong className="text-zinc-400">{parentComment.userName}</strong></span>
                      </div>
                    )}

                    <p className="text-xs text-zinc-300 leading-relaxed break-words font-sans">
                      {cmt.text}
                    </p>

                    {/* Interactions panel */}
                    <div className="flex items-center gap-3 pt-1.5 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                      <button 
                        onClick={() => setActiveReplyTo(cmt)}
                        className="hover:text-amber-500 transition-colors cursor-pointer"
                      >
                        Reply
                      </button>

                      {isOwner && (
                        <>
                          <span className="text-zinc-800">•</span>
                          <button 
                            onClick={() => handleDeleteComment(cmt.id)}
                            className="hover:text-red-400 text-red-500/80 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 size={10} />
                            <span>Delete</span>
                          </button>

                          {cmt.userId !== user?.uid && (
                            <>
                              <span className="text-zinc-800">•</span>
                              <button 
                                onClick={() => handleBanUser(cmt.userId, cmt.userName)}
                                className="hover:text-red-400 text-red-500/80 transition-colors cursor-pointer flex items-center gap-1"
                                title="Restrict User"
                              >
                                <UserMinus size={10} />
                                <span>Ban</span>
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Input Composer */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950 shrink-0">
        {/* Reply indicator banner */}
        {activeReplyTo && (
          <div className="mb-3 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-400 text-left">
            <div className="flex items-center gap-2">
              <CornerDownRight size={12} className="text-amber-500" />
              <span>Replying to <strong className="text-zinc-200">@{activeReplyTo.userName}</strong></span>
            </div>
            <button 
              onClick={() => setActiveReplyTo(null)}
              className="text-zinc-500 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder={
              slowModeCountdown > 0 
                ? `Slow Mode: Wait ${slowModeCountdown}s...` 
                : bannedUsers.includes(user?.uid || '') 
                ? "Restricted from commenting" 
                : "Type a comment..."
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={bannedUsers.includes(user?.uid || '') || slowModeCountdown > 0}
            className={cn(
              "flex-1 bg-zinc-900 border border-zinc-850 focus:border-zinc-750 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 transition-all font-sans",
              slowModeCountdown > 0 && "border-red-500/20 bg-red-950/5 text-red-400 placeholder:text-red-500/40"
            )}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || bannedUsers.includes(user?.uid || '') || slowModeCountdown > 0}
            className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 text-black rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
          >
            {slowModeCountdown > 0 ? <Clock size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>

        {channel.settings?.slowMode > 0 && (
          <p className="text-[8px] font-mono text-zinc-500 text-left uppercase tracking-widest mt-2 flex items-center gap-1">
            <AlertCircle size={10} />
            <span>Slow mode active: 1 comment per {channel.settings.slowMode}s</span>
          </p>
        )}
      </div>
    </div>
  );
}
