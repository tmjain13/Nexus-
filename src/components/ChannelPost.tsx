import React, { useState } from 'react';
import { 
  Eye, MessageCircle, Share2, ShieldAlert, Lock, 
  FileText, Download, BarChart2, Radio, Check 
} from 'lucide-react';
import { ChannelPost, Channel } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

interface ChannelPostItemProps {
  key?: any;
  post: ChannelPost;
  channel: Channel;
  isSubscribed: boolean;
  isOwner: boolean;
  onReact: (emoji: string) => void;
  onVote: (optionIndex: number) => void;
  onForward?: () => void;
  onOpenComments?: () => void;
  onDelete?: () => void;
}

const POPULAR_EMOJIS = ['🔥', '👍', '❤️', '😂', '😮', '🎉', '👏', '💡'];

export function ChannelPostItem({
  post,
  channel,
  isSubscribed,
  isOwner,
  onReact,
  onVote,
  onForward,
  onOpenComments,
  onDelete
}: ChannelPostItemProps) {
  const { user } = useAuth();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Content lock check
  const hasAccess = isOwner || isSubscribed || !post.isPaidOnly;

  // Poll processing
  const totalVotes = post.votes ? Object.keys(post.votes).length : 0;
  const userVote = user && post.votes ? post.votes[user.uid] : undefined;
  const hasVoted = userVote !== undefined;

  // Calculate poll votes per option
  const optionVotes = post.options?.map((_, idx) => {
    if (!post.votes) return 0;
    return Object.values(post.votes).filter(v => v === idx).length;
  }) || [];

  return (
    <div className="bg-zinc-900 border border-zinc-850 rounded-2xl overflow-hidden shadow-xl transition-all hover:border-zinc-800 flex flex-col relative">
      {/* Forward attribution if applicable */}
      {post.forwardedFrom && (
        <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-900 flex items-center gap-2 text-[10px] font-mono text-amber-500 uppercase tracking-wider">
          <Share2 size={11} className="animate-pulse" />
          <span>Forwarded from {post.forwardedFrom}</span>
        </div>
      )}

      {/* Premium Lock Banner */}
      {post.isPaidOnly && (
        <div className="absolute top-3 right-3 z-10 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[8px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
          <Lock size={9} />
          <span>Premium</span>
        </div>
      )}

      <div className="p-5 space-y-4 flex-1">
        {/* Post Metadata Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              {post.createdAt ? formatDistanceToNow((post.createdAt as any).toDate ? (post.createdAt as any).toDate() : new Date(post.createdAt as any), { addSuffix: true }) : 'Just now'}
            </span>
          </div>

          {isOwner && onDelete && (
            <button
              onClick={onDelete}
              className="text-[9px] font-mono text-red-500 hover:text-red-400 uppercase tracking-wider px-2 py-1 hover:bg-red-950/20 rounded-md transition-all cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>

        {/* Post Content Area */}
        {!hasAccess ? (
          // Content Locked View
          <div className="py-8 px-4 border border-dashed border-zinc-800 bg-zinc-950/40 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-full flex items-center justify-center">
              <Lock size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Exclusive Subscriber Content</h4>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Unlock by joining this premium channel</p>
            </div>
          </div>
        ) : (
          // Unlocked Content View
          <div className="space-y-4">
            {/* Text description */}
            {post.content && (
              <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line text-left">
                {post.content}
              </p>
            )}

            {/* Photo / Video / File renderers */}
            {post.mediaUrl && (
              <div className="rounded-xl overflow-hidden border border-zinc-850 bg-zinc-950/80 max-h-96 flex items-center justify-center relative">
                {post.type === 'photo' ? (
                  <img 
                    src={post.mediaUrl} 
                    alt="Channel attachment"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain max-h-96"
                  />
                ) : post.type === 'video' ? (
                  <video 
                    src={post.mediaUrl} 
                    controls 
                    className="w-full h-full max-h-96"
                  />
                ) : post.type === 'file' ? (
                  <div className="p-4 flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-amber-500">
                        <FileText size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-zinc-200 truncate max-w-[200px]">
                          {post.fileName || 'Attachment Document'}
                        </p>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Digital asset</span>
                      </div>
                    </div>
                    <a 
                      href={post.mediaUrl} 
                      download 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-zinc-900 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white transition-all"
                    >
                      <Download size={14} />
                    </a>
                  </div>
                ) : null}
              </div>
            )}

            {/* Poll Render Engine */}
            {post.type === 'poll' && post.options && (
              <div className="space-y-2.5 bg-zinc-950/30 border border-zinc-850 rounded-2xl p-4 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Radio size={11} className="animate-pulse" />
                    <span>Public Poll</span>
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{totalVotes} Votes</span>
                </div>

                <div className="space-y-2">
                  {post.options.map((opt, idx) => {
                    const votesForOpt = optionVotes[idx] || 0;
                    const percent = totalVotes > 0 ? Math.round((votesForOpt / totalVotes) * 100) : 0;
                    const isUserChoice = userVote === idx;

                    return (
                      <button
                        key={idx}
                        onClick={() => !hasVoted && onVote(idx)}
                        disabled={hasVoted}
                        className={cn(
                          "w-full rounded-xl border p-3 flex items-center justify-between relative overflow-hidden transition-all text-left font-sans text-xs cursor-pointer",
                          hasVoted 
                            ? "bg-zinc-900/40 border-zinc-850" 
                            : "bg-zinc-900/60 hover:bg-zinc-900 border-zinc-850 hover:border-zinc-800",
                          isUserChoice && "border-amber-500/30 bg-amber-500/5"
                        )}
                      >
                        {/* Progress filler bar */}
                        {hasVoted && (
                          <div 
                            className={cn(
                              "absolute left-0 top-0 bottom-0 transition-all duration-500",
                              isUserChoice ? "bg-amber-500/10" : "bg-zinc-800/40"
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        )}

                        <div className="flex items-center gap-2 relative z-10">
                          {isUserChoice && <Check size={14} className="text-amber-500 font-bold shrink-0" />}
                          <span className={cn(isUserChoice ? "text-amber-400 font-bold" : "text-zinc-200")}>{opt}</span>
                        </div>

                        {hasVoted && (
                          <span className="relative z-10 font-mono text-[10px] font-bold text-zinc-400">
                            {percent}% ({votesForOpt})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Interaction Toolbar (ONLY visible if they have access to content) */}
      {hasAccess && (
        <div className="px-5 py-3 border-t border-zinc-900/60 bg-zinc-950/40 flex items-center justify-between text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
          <div className="flex items-center gap-4">
            {/* Views counter */}
            <span className="flex items-center gap-1.5 text-zinc-500">
              <Eye size={12} />
              <span>{post.views}</span>
            </span>

            {/* Reactions manager */}
            <div className="flex items-center gap-1.5 relative">
              {/* List already reacted counts */}
              <div className="flex items-center gap-1">
                {Object.entries(post.reactions || {}).map(([emoji, count]) => (
                  <button
                    key={emoji}
                    onClick={() => onReact(emoji)}
                    className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-1.5 py-0.5 rounded-lg text-zinc-300 transition-all cursor-pointer"
                  >
                    <span>{emoji}</span>
                    <span className="text-[8px] font-bold text-zinc-400">{count}</span>
                  </button>
                ))}
              </div>

              {/* Add Emoji Reaction toggle */}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="hover:text-amber-500 transition-colors cursor-pointer px-1 text-zinc-400"
              >
                + React
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-6 left-0 z-20 bg-zinc-950 border border-zinc-800 p-1.5 rounded-xl shadow-2xl flex items-center gap-1">
                  {POPULAR_EMOJIS.map(em => (
                    <button
                      key={em}
                      onClick={() => {
                        onReact(em);
                        setShowEmojiPicker(false);
                      }}
                      className="p-1.5 hover:bg-zinc-900 rounded-lg text-sm transition-all active:scale-125 cursor-pointer"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Comments button */}
            {channel.settings?.allowComments && onOpenComments && (
              <button
                onClick={onOpenComments}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <MessageCircle size={12} />
                <span>{post.comments} Comments</span>
              </button>
            )}
          </div>

          {/* Forward Action (if not disabled by owner) */}
          {!post.disallowForwarding && onForward && (
            <button
              onClick={onForward}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer"
            >
              <Share2 size={12} />
              <span>Forward</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
