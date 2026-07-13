import React from 'react';
import { MapFriend } from '../types';
import { Users, ChevronRight, X } from 'lucide-react';

interface MapClusterProps {
  friends: MapFriend[];
  onSelectFriend: (friend: MapFriend) => void;
  onClose: () => void;
}

export function MapCluster({ friends, onSelectFriend, onClose }: MapClusterProps) {
  if (friends.length === 0) return null;

  return (
    <div id="map-friends-cluster" className="bg-slate-850/95 backdrop-blur-md text-zinc-100 rounded-2xl border border-zinc-750 shadow-2xl p-4 max-w-xs w-full animate-slideUp space-y-3.5">
      {/* Cluster Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 font-bold text-xs">
            {friends.length}
          </div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
            Friend Cluster
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 p-1 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          style={{ border: 'none' }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Clustered friends list */}
      <div className="max-h-48 overflow-y-auto space-y-2 pr-1 no-scrollbar">
        {friends.map((friend) => (
          <div
            key={friend.userId}
            onClick={() => onSelectFriend(friend)}
            className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-750 cursor-pointer transition-all duration-150"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={friend.avatar}
                className="w-8 h-8 rounded-full object-cover border border-zinc-800"
                alt={friend.name}
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-200 truncate">{friend.name}</div>
                <div className="text-[9px] text-zinc-500 font-mono">
                  {friend.distance} km away
                </div>
              </div>
            </div>
            <ChevronRight size={14} className="text-zinc-600" />
          </div>
        ))}
      </div>
    </div>
  );
}
