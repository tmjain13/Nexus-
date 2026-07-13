import React from 'react';
import { Sparkles, Users, TrendingUp, Search, Award } from 'lucide-react';

interface ReelDiscoverProps {
  currentFeedTab: 'foryou' | 'following' | 'trending';
  onChangeTab: (tab: 'foryou' | 'following' | 'trending') => void;
  onSearchClick: () => void;
  onAnalyticsClick: () => void;
}

export const ReelDiscover: React.FC<ReelDiscoverProps> = ({
  currentFeedTab,
  onChangeTab,
  onSearchClick,
  onAnalyticsClick
}) => {
  return (
    <div id="reel_discover_header" className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-4 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-auto select-none">
      
      {/* Search Button */}
      <button 
        onClick={onSearchClick}
        className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-all border border-zinc-800/40 cursor-pointer"
        title="Search Reels"
      >
        <Search size={16} />
      </button>

      {/* Tabs list */}
      <div className="flex items-center gap-4 text-sm font-bold drop-shadow-lg">
        <button
          onClick={() => onChangeTab('foryou')}
          className={`relative py-1 transition-all flex items-center gap-1 cursor-pointer ${
            currentFeedTab === 'foryou' 
              ? 'text-white font-black scale-105' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {currentFeedTab === 'foryou' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-500 rounded-full" />
          )}
          For You
        </button>

        <button
          onClick={() => onChangeTab('following')}
          className={`relative py-1 transition-all flex items-center gap-1 cursor-pointer ${
            currentFeedTab === 'following' 
              ? 'text-white font-black scale-105' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {currentFeedTab === 'following' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-500 rounded-full" />
          )}
          Following
        </button>

        <button
          onClick={() => onChangeTab('trending')}
          className={`relative py-1 transition-all flex items-center gap-1 cursor-pointer ${
            currentFeedTab === 'trending' 
              ? 'text-white font-black scale-105' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {currentFeedTab === 'trending' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-500 rounded-full" />
          )}
          Trending
        </button>
      </div>

      {/* Analytics Creator Studio Trigger */}
      <button 
        onClick={onAnalyticsClick}
        className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-amber-500 hover:bg-black/60 transition-all border border-amber-500/20 cursor-pointer animate-pulse"
        title="Creator Analytics Studio"
      >
        <Award size={16} />
      </button>

    </div>
  );
};
export default ReelDiscover;
