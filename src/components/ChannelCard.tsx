import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Tag, Lock, MessageSquare } from 'lucide-react';
import { Channel, ChannelPost } from '../types';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

interface ChannelCardProps {
  key?: any;
  channel: Channel;
  isSubscribed: boolean;
  onSelect: () => void;
  onToggleSubscribe: () => Promise<void>;
}

export function ChannelCard({ channel, isSubscribed, onSelect, onToggleSubscribe }: ChannelCardProps) {
  const [latestPosts, setLatestPosts] = useState<ChannelPost[]>([]);

  // Query latest 3 posts for preview
  useEffect(() => {
    if (!channel.id) return;
    const q = query(
      collection(db, 'channels', channel.id, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ChannelPost);
      setLatestPosts(posts);
    }, (err) => {
      console.warn(`Unable to fetch preview posts for channel ${channel.id}:`, err);
    });

    return () => unsubscribe();
  }, [channel.id]);

  return (
    <div className="bg-zinc-900 border border-zinc-850/60 rounded-3xl p-5 flex flex-col justify-between hover:border-zinc-800 transition-all shadow-xl text-left group">
      <div className="space-y-4">
        {/* Info Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <img 
              src={channel.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${channel.handle}`}
              alt={channel.name}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-2xl border border-zinc-800 object-cover bg-zinc-950"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-bold text-zinc-100 truncate group-hover:text-amber-400 transition-colors uppercase tracking-wide">
                  {channel.name}
                </h3>
                <ShieldCheck size={13} className="text-amber-500 shrink-0 fill-amber-500/10" />
              </div>
              <p className="text-[10px] font-mono text-zinc-500">@{channel.handle}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {channel.category && (
              <span className="px-2 py-0.5 border border-zinc-800 bg-zinc-950 text-[8px] font-mono text-zinc-400 rounded uppercase tracking-widest flex items-center gap-1">
                <Tag size={8} className="text-amber-500" />
                <span>{channel.category}</span>
              </span>
            )}
            {channel.monetization?.enabled && (
              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-[8px] font-mono font-bold text-amber-400 rounded uppercase tracking-widest flex items-center gap-0.5">
                <Lock size={8} />
                <span>Premium</span>
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {channel.description || "No description provided."}
        </p>

        {/* 3 Latest Posts Preview */}
        <div className="space-y-2 bg-zinc-950/40 p-3 rounded-2xl border border-zinc-900/40">
          <span className="text-[8px] font-mono font-bold text-zinc-600 uppercase tracking-widest block">Latest Posts Feed Preview</span>
          {latestPosts.length === 0 ? (
            <span className="text-[9px] font-mono text-zinc-600 uppercase block py-2">Stream is currently empty</span>
          ) : (
            <div className="space-y-1.5">
              {latestPosts.map(p => (
                <div key={p.id} className="flex items-start gap-1.5 text-[10px] text-zinc-400 font-sans truncate">
                  <span className="text-amber-500/70 shrink-0 select-none">•</span>
                  <span className="truncate leading-none pt-0.5">
                    {p.isPaidOnly && !isSubscribed ? "[Locked premium broadcast]" : (p.content || "[Media file]")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Actions Bottom */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-zinc-900/60 font-mono text-[9px] uppercase tracking-widest">
        <div className="flex items-center gap-1 text-zinc-500">
          <Users size={12} className="text-amber-500/70" />
          <span>{channel.subscribers} Subscribers</span>
        </div>

        <button
          onClick={onSelect}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/60 text-zinc-300 font-bold uppercase rounded-xl transition-all cursor-pointer"
        >
          View Stream
        </button>
      </div>
    </div>
  );
}
