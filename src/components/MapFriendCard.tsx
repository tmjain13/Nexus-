import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapFriend } from '../types';
import { MessageSquare, PhoneCall, Navigation, Eye, Clock, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MapFriendCardProps {
  friend: MapFriend;
  onClose: () => void;
}

export function MapFriendCard({ friend, onClose }: MapFriendCardProps) {
  const navigate = useNavigate();

  const chatId = [friend.userId, ...(window as any).e2ee_keys ? [friend.userId] : []].sort().join('_'); 
  // Get active chat ID
  const directChatId = [friend.userId, 'current_user_placeholder'].sort(); // We will get actual current user uid inside click if needed, or compute it.
  
  const handleMessage = () => {
    // Dynamically retrieve current user uid from localStorage or window session to formulate sorted chat id
    const savedSession = localStorage.getItem('nexus_user_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        const cid = [parsed.uid, friend.userId].sort().join('_');
        navigate(`/chats/${cid}`);
      } catch {
        navigate(`/chats`);
      }
    } else {
      navigate(`/chats`);
    }
  };

  const handleCall = () => {
    const savedSession = localStorage.getItem('nexus_user_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        const cid = [parsed.uid, friend.userId].sort().join('_');
        navigate(`/chats/${cid}?action=call`);
      } catch {
        navigate(`/chats`);
      }
    } else {
      navigate(`/chats`);
    }
  };

  const handleDirections = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${friend.lat},${friend.lng}`, '_blank', 'noopener,noreferrer');
  };

  const lastActiveDate = (() => {
    if (!friend.lastActive) return new Date();
    if (typeof friend.lastActive.toDate === 'function') {
      return friend.lastActive.toDate();
    }
    if (typeof friend.lastActive === 'object' && 'seconds' in friend.lastActive) {
      return new Date((friend.lastActive as any).seconds * 1000);
    }
    return new Date(friend.lastActive as any);
  })();

  const lastActiveStr = friend.lastActive
    ? formatDistanceToNow(lastActiveDate, { addSuffix: true })
    : 'Recently';

  return (
    <div id={`friend-popup-${friend.userId}`} className="bg-slate-800 text-zinc-100 rounded-2xl border border-zinc-700/80 shadow-2xl p-4.5 space-y-4 max-w-xs w-full animate-slideUp">
      {/* Profile summary */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={friend.avatar}
              className="w-11 h-11 rounded-full object-cover border-2 border-amber-500 shadow-md"
              alt={friend.name}
              referrerPolicy="no-referrer"
            />
            {friend.storyAvailable && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 ring-2 ring-slate-800 animate-pulse flex items-center justify-center text-[8px] font-bold text-zinc-950 font-mono">
                ★
              </span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5 leading-snug">
              {friend.name}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5 font-mono">
              <Clock size={10} className="text-zinc-500" />
              <span>Active {lastActiveStr}</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            {friend.distance} km
          </div>
        </div>
      </div>

      {/* Story Status */}
      {friend.storyAvailable && friend.storyContent && (
        <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1">
          <span className="text-[8px] font-mono uppercase tracking-widest text-amber-500 font-bold block">
            Pinned Location Story
          </span>
          <p className="text-[11px] text-zinc-300 italic font-sans leading-normal">
            "{friend.storyContent}"
          </p>
        </div>
      )}

      {/* Coordinates / Privacy Badging */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 border-t border-zinc-700/60 pt-3">
        <span className="font-mono text-[9px] text-zinc-500">
          {friend.lat.toFixed(2)}°, {friend.lng.toFixed(2)}°
        </span>
        <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
          <ShieldCheck size={11} />
          E2EE Encrypted
        </span>
      </div>

      {/* Action panel */}
      <div className="grid grid-cols-3 gap-2 border-t border-zinc-700/60 pt-3">
        <button
          onClick={handleMessage}
          className="flex flex-col items-center justify-center py-2.5 bg-slate-700 hover:bg-slate-650 rounded-xl transition-all cursor-pointer text-zinc-300 hover:text-white border border-zinc-650"
          style={{ borderStyle: 'solid' }}
        >
          <MessageSquare size={15} />
          <span className="text-[9px] font-mono uppercase mt-1 font-bold">Message</span>
        </button>
        <button
          onClick={handleCall}
          className="flex flex-col items-center justify-center py-2.5 bg-slate-700 hover:bg-slate-650 rounded-xl transition-all cursor-pointer text-zinc-300 hover:text-white border border-zinc-650"
          style={{ borderStyle: 'solid' }}
        >
          <PhoneCall size={15} />
          <span className="text-[9px] font-mono uppercase mt-1 font-bold">Call</span>
        </button>
        <button
          onClick={handleDirections}
          className="flex flex-col items-center justify-center py-2.5 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all cursor-pointer text-zinc-950 border border-amber-600 font-bold"
          style={{ borderStyle: 'solid' }}
        >
          <Navigation size={15} className="rotate-45" />
          <span className="text-[9px] font-mono uppercase mt-1">Route</span>
        </button>
      </div>
    </div>
  );
}
