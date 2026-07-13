import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Image as ImageIcon, Video, FileText, BarChart2, Calendar, 
  Send, BellOff, Lock, EyeOff, Loader2, MessageSquare, Sparkles, Plus, AlertCircle 
} from 'lucide-react';
import { Channel, ChannelPost } from '../types';
import { doc, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useChannelPosts } from '../hooks/useChannelPosts';
import { useChannels } from '../hooks/useChannels';
import { ChannelHeader } from './ChannelHeader';
import { ChannelPostItem } from './ChannelPost';
import { ChannelComments } from './ChannelComments';
import { ChannelAnalytics } from './ChannelAnalytics';
import { ChannelRevenue } from './ChannelRevenue';
import { cn } from '../lib/utils';

interface ChannelChatRoomProps {
  channelId: string;
  onBack: () => void;
  subscribedIds: string[];
}

export function ChannelChatRoom({ channelId, onBack, subscribedIds }: ChannelChatRoomProps) {
  const { user } = useAuth();
  const { subscribe, unsubscribe } = useChannels();
  const { 
    posts, loading: postsLoading, createPost, deletePost, schedulePost, reactToPost, votePoll, registerView 
  } = useChannelPosts(channelId);

  const [channel, setChannel] = useState<Channel | null>(null);
  const [loadingChannel, setLoadingChannel] = useState(true);

  // Panels Active state
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showRevenue, setShowRevenue] = useState(false);
  
  // Composer state
  const [text, setText] = useState('');
  const [mediaType, setMediaType] = useState<'photo' | 'video' | 'file' | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [isPaidOnly, setIsPaidOnly] = useState(false);
  const [silentPost, setSilentPost] = useState(false);
  const [disallowForwarding, setDisallowForwarding] = useState(false);
  
  // Poll composer state
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Scheduling state
  const [showScheduleBuilder, setShowScheduleBuilder] = useState(false);
  const [scheduledDateStr, setScheduledDateStr] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load Channel Details
  useEffect(() => {
    if (!channelId) return;
    setLoadingChannel(true);
    const unsub = onSnapshot(doc(db, 'channels', channelId), (snap) => {
      if (snap.exists()) {
        setChannel({ id: snap.id, ...snap.data() } as Channel);
      }
      setLoadingChannel(false);
    }, (err) => {
      console.error("Error loading channel:", err);
      setLoadingChannel(false);
    });

    return () => unsub();
  }, [channelId]);

  // Save drafts in localStorage per channel
  useEffect(() => {
    if (!channelId) return;
    const savedDraft = localStorage.getItem(`channel_draft_${channelId}`);
    if (savedDraft) {
      setText(savedDraft);
    }
  }, [channelId]);

  const handleTextChange = (val: string) => {
    setText(val);
    localStorage.setItem(`channel_draft_${channelId}`, val);
  };

  const handleSubscribeToggle = async () => {
    if (!channel) return;
    const isSubbed = subscribedIds.includes(channel.id);
    if (isSubbed) {
      await unsubscribe(channel.id);
    } else {
      await subscribe(channel.id);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !channel) return;
    
    const hasAttachment = !!mediaUrl || showPollBuilder;
    if (!text.trim() && !hasAttachment) return;

    try {
      if (showScheduleBuilder && scheduledDateStr) {
        // Handle Scheduled Post
        const sDate = new Date(scheduledDateStr);
        if (sDate <= new Date()) {
          alert("Scheduled date must be in the future");
          return;
        }

        if (showPollBuilder) {
          const filteredOpts = pollOptions.filter(o => !!o.trim());
          await schedulePost(sDate, 'poll', pollQuestion, undefined, isPaidOnly, filteredOpts, disallowForwarding);
        } else {
          await schedulePost(
            sDate, 
            mediaType || 'text', 
            text.trim(), 
            mediaUrl || undefined, 
            isPaidOnly, 
            undefined, 
            disallowForwarding
          );
        }
        alert("Broadcast Post Scheduled Successfully!");
        setShowScheduleBuilder(false);
        setScheduledDateStr('');
      } else {
        // Live Post
        if (showPollBuilder) {
          const filteredOpts = pollOptions.filter(o => !!o.trim());
          if (filteredOpts.length < 2) {
            alert("Provide at least 2 poll options");
            return;
          }
          await createPost('poll', pollQuestion, undefined, undefined, isPaidOnly, undefined, filteredOpts, disallowForwarding);
        } else {
          await createPost(
            mediaType || 'text',
            text.trim(),
            mediaUrl || undefined,
            fileName || undefined,
            isPaidOnly,
            undefined,
            undefined,
            disallowForwarding
          );
        }
      }

      // Reset composer
      setText('');
      setMediaType(null);
      setMediaUrl('');
      setFileName('');
      setIsPaidOnly(false);
      setSilentPost(false);
      setDisallowForwarding(false);
      setShowPollBuilder(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      localStorage.removeItem(`channel_draft_${channelId}`);

      // Scroll bottom
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    } catch (err) {
      console.error("Failed to post message:", err);
    }
  };

  const handleForwardPost = (post: ChannelPost) => {
    // Simulated forward picker
    const chatName = prompt("Enter receiver name or @handle to forward to (Mock):");
    if (chatName) {
      alert(`Post forwarded to ${chatName} with 'Forwarded from ${channel?.name}' attribution!`);
    }
  };

  const addPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  if (loadingChannel || !channel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black text-zinc-500 font-mono text-xs uppercase tracking-widest gap-2">
        <Loader2 className="animate-spin text-amber-500" size={16} />
        <span>Syncing broadcast stream...</span>
      </div>
    );
  }

  const isOwner = channel.ownerId === user?.uid;
  const isSubscribed = subscribedIds.includes(channel.id);
  const canPost = isOwner || channel.admins?.includes(user?.uid || '');

  return (
    <div className="flex-1 flex h-full bg-black overflow-hidden relative">
      
      {/* Primary Chat Window */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-zinc-900">
        
        {/* Header */}
        <ChannelHeader 
          channel={channel} 
          isSubscribed={isSubscribed} 
          isOwner={isOwner}
          onBack={onBack}
          onToggleSubscribe={handleSubscribeToggle}
          onOpenAnalytics={() => setShowAnalytics(true)}
          onOpenRevenue={() => setShowRevenue(true)}
        />

        {/* Posts Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 progress-scroll">
          {postsLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-2 text-zinc-600 font-mono text-[10px] uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 animate-ping" />
              <span>Acquiring stream history...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
              <Sparkles size={24} className="text-zinc-700 animate-pulse" />
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Stream is Empty</h3>
                <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-1">Check back later for updates</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {posts.map(post => {
                // Auto register view once loaded
                registerView(post.id);

                return (
                  <ChannelPostItem
                    key={post.id}
                    post={post}
                    channel={channel}
                    isSubscribed={isSubscribed}
                    isOwner={isOwner}
                    onReact={(emoji) => {
                      if (!isSubscribed && !isOwner) {
                        alert("Subscribe to this channel to react to posts.");
                        return;
                      }
                      reactToPost(post.id, emoji);
                    }}
                    onVote={(idx) => {
                      if (!isSubscribed && !isOwner) {
                        alert("Subscribe to vote in this poll.");
                        return;
                      }
                      votePoll(post.id, idx);
                    }}
                    onForward={() => handleForwardPost(post)}
                    onOpenComments={() => {
                      if (!isSubscribed && !isOwner) {
                        alert("Subscribe to view or write comments.");
                        return;
                      }
                      setActiveCommentsPostId(post.id);
                    }}
                    onDelete={() => deletePost(post.id)}
                  />
                );
              })}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Subscriber Join Alert Call-to-action (ONLY shown to unsubscribed users) */}
        {!isSubscribed && !isOwner && (
          <div className="bg-gradient-to-r from-amber-500/10 via-zinc-950 to-zinc-950 border-t border-zinc-900 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                <Lock size={10} />
                <span>Read-Only Preview Mode</span>
              </span>
              <p className="text-xs text-zinc-300">
                Join this broadcast stream to participate in polls, react with emojis, and access exclusive comments threads.
              </p>
            </div>
            <button
              onClick={handleSubscribeToggle}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-sans font-black text-xs uppercase tracking-wider rounded-full transition-all shrink-0 active:scale-95 shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              {channel.monetization?.enabled ? "Unlock Premium Access" : "Join Channel"}
            </button>
          </div>
        )}

        {/* Composer Area (ONLY visible to Owner / Admins) */}
        {canPost && (
          <div className="border-t border-zinc-900 bg-zinc-950/90 p-4 space-y-3 shrink-0">
            {/* Attachment preview / details */}
            {mediaUrl && (
              <div className="p-3 bg-zinc-900 rounded-2xl flex items-center justify-between text-xs font-mono border border-zinc-850">
                <div className="flex items-center gap-2">
                  <ImageIcon size={14} className="text-amber-500" />
                  <span className="text-zinc-200 truncate max-w-xs">{fileName || "Media attachment added"}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setMediaUrl('');
                    setMediaType(null);
                    setFileName('');
                  }} 
                  className="text-zinc-500 hover:text-white cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Poll Builder View */}
            {showPollBuilder && (
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 text-left space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                    <BarChart2 size={12} className="animate-pulse" />
                    <span>Poll Composer</span>
                  </span>
                  <button 
                    onClick={() => setShowPollBuilder(false)} 
                    className="text-zinc-500 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />

                <div className="space-y-2">
                  {pollOptions.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={e => {
                        const copy = [...pollOptions];
                        copy[idx] = e.target.value;
                        setPollOptions(copy);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  ))}
                </div>

                {pollOptions.length < 5 && (
                  <button
                    type="button"
                    onClick={addPollOption}
                    className="text-[9px] font-mono text-zinc-500 hover:text-white uppercase tracking-widest cursor-pointer"
                  >
                    + Add Option (Max 5)
                  </button>
                )}
              </div>
            )}

            {/* Scheduling Input */}
            {showScheduleBuilder && (
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 text-left space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>Schedule Broadcast</span>
                  </span>
                  <button 
                    onClick={() => setShowScheduleBuilder(false)} 
                    className="text-zinc-500 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <input
                  type="datetime-local"
                  value={scheduledDateStr}
                  onChange={e => setScheduledDateStr(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs focus:outline-none text-zinc-200"
                />
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
              {/* Toolbar Actions */}
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const url = prompt("Enter photo attachment direct URL:");
                    if (url) {
                      setMediaUrl(url);
                      setMediaType('photo');
                      setFileName('Attachment Photo');
                    }
                  }}
                  className="p-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-zinc-400 hover:text-amber-500 rounded-xl transition-all cursor-pointer shrink-0"
                  title="Photo Attachment"
                >
                  <ImageIcon size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowPollBuilder(!showPollBuilder)}
                  className="p-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-zinc-400 hover:text-amber-500 rounded-xl transition-all cursor-pointer shrink-0"
                  title="Create Poll"
                >
                  <BarChart2 size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowScheduleBuilder(!showScheduleBuilder)}
                  className="p-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-zinc-400 hover:text-amber-500 rounded-xl transition-all cursor-pointer shrink-0"
                  title="Schedule Broadcast"
                >
                  <Calendar size={14} />
                </button>
              </div>

              {/* Main text area */}
              <input
                type="text"
                placeholder={showPollBuilder ? "Poll caption / title..." : "Broadcast to subscribers..."}
                value={text}
                onChange={e => handleTextChange(e.target.value)}
                disabled={showPollBuilder && !pollQuestion}
                className="flex-1 bg-zinc-900 border border-zinc-850 focus:border-zinc-750 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 transition-all font-sans"
              />

              <button
                type="submit"
                disabled={!text.trim() && !mediaUrl && !showPollBuilder}
                className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-35 disabled:hover:bg-amber-500 text-black rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Send size={15} />
              </button>
            </form>

            {/* Config Toggles */}
            <div className="flex gap-4 select-none pt-1 font-mono text-[8px] uppercase tracking-widest text-zinc-500 text-left">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-300">
                <input 
                  type="checkbox" 
                  checked={silentPost} 
                  onChange={e => setSilentPost(e.target.checked)} 
                  className="rounded bg-zinc-900 border-zinc-800" 
                />
                <span>Silent Mode (No Push)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-300">
                <input 
                  type="checkbox" 
                  checked={disallowForwarding} 
                  onChange={e => setDisallowForwarding(e.target.checked)} 
                  className="rounded bg-zinc-900 border-zinc-800" 
                />
                <span>Lock Forwarding</span>
              </label>

              {channel.monetization?.enabled && (
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-300">
                  <input 
                    type="checkbox" 
                    checked={isPaidOnly} 
                    onChange={e => setIsPaidOnly(e.target.checked)} 
                    className="rounded bg-zinc-900 border-zinc-800" 
                  />
                  <span className="text-amber-500 font-bold flex items-center gap-0.5">
                    <Lock size={9} /> Premium Subscribers Only
                  </span>
                </label>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side Slide Drawers for Comments */}
      {activeCommentsPostId && (
        <div className="w-full md:w-96 shrink-0 h-full">
          <ChannelComments 
            channel={channel} 
            postId={activeCommentsPostId} 
            isOwner={isOwner} 
            onClose={() => setActiveCommentsPostId(null)}
          />
        </div>
      )}

      {/* Analytics Dashboard Drawer Modal */}
      {showAnalytics && (
        <ChannelAnalytics 
          channelId={channel.id} 
          onClose={() => setShowAnalytics(false)} 
        />
      )}

      {/* Finance Dashboard Drawer Modal */}
      {showRevenue && channel.monetization?.enabled && (
        <ChannelRevenue 
          channel={channel} 
          onClose={() => setShowRevenue(false)} 
          onUpdateChannel={(updated) => setChannel(updated)}
        />
      )}
    </div>
  );
}
