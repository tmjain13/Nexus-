import React, { useState } from 'react';
import { Search, Flame, Music, User, Hash } from 'lucide-react';
import { Reel } from '../types';

interface ReelSearchProps {
  reels: Reel[];
  onSelectReel: (reel: Reel) => void;
  onClose: () => void;
}

const TRENDING_HASHTAGS = [
  { tag: 'cyberpunk', count: '124K views' },
  { tag: 'ambient', count: '84K views' },
  { tag: 'dance', count: '98K views' },
  { tag: 'enclave', count: '210K views' },
  { tag: 'meditation', count: '45K views' },
  { tag: 'neonflow', count: '67K views' }
];

export const ReelSearch: React.FC<ReelSearchProps> = ({ reels, onSelectReel, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'hashtags' | 'creators' | 'sounds'>('all');

  const filteredReels = reels.filter(reel => {
    const text = (reel.caption + ' ' + reel.hashtags.join(' ') + ' ' + (reel.creatorName || '') + ' ' + (reel.music?.title || '')).toLowerCase();
    const matchesQuery = text.includes(query.toLowerCase());

    if (!matchesQuery) return false;

    if (activeTab === 'hashtags') {
      return reel.hashtags.some(h => h.toLowerCase().includes(query.toLowerCase())) || query.startsWith('#');
    }
    if (activeTab === 'creators') {
      return (reel.creatorName || '').toLowerCase().includes(query.toLowerCase());
    }
    if (activeTab === 'sounds') {
      return (reel.music?.title || '').toLowerCase().includes(query.toLowerCase());
    }
    return true;
  });

  return (
    <div id="reel_search_overlay" className="fixed inset-0 bg-black z-50 flex flex-col select-none text-white">
      {/* Header Search Bar */}
      <div className="p-4 bg-zinc-950 border-b border-zinc-900 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search hashtags, creators, sounds..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            autoFocus
          />
        </div>
        <button 
          onClick={onClose}
          className="text-xs font-bold hover:text-amber-500 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-900 bg-zinc-950 px-2 py-1 text-xs font-semibold text-zinc-400">
        {(['all', 'hashtags', 'creators', 'sounds'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-center capitalize border-b-2 transition-all cursor-pointer ${
              activeTab === tab 
                ? 'text-amber-500 border-amber-500 font-bold' 
                : 'border-transparent hover:text-zinc-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Viewport */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
        {query.length === 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-3 flex items-center gap-1.5">
              <Flame size={12} fill="currentColor" />
              Trending Hashtags
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {TRENDING_HASHTAGS.map(item => (
                <button
                  key={item.tag}
                  onClick={() => setQuery(`#${item.tag}`)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/60 rounded-xl text-left transition-all cursor-pointer"
                >
                  <Hash size={14} className="text-amber-500" />
                  <div>
                    <p className="text-xs font-bold text-zinc-200">#{item.tag}</p>
                    <p className="text-[10px] text-zinc-500">{item.count}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
          {query.length > 0 ? `Search Results (${filteredReels.length})` : 'Popular Videos'}
        </h3>

        {filteredReels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-2xl">🔍</span>
            <p className="text-xs font-bold text-zinc-400 mt-2">No matching nodes found</p>
            <p className="text-[10px] text-zinc-600 mt-1">Refine your tags, sounds, or query</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {filteredReels.map(reel => (
              <button
                key={reel.id}
                onClick={() => onSelectReel(reel)}
                className="relative aspect-[9/16] bg-zinc-900 rounded-lg overflow-hidden group border border-zinc-800/40 text-left cursor-pointer"
              >
                <img 
                  src={reel.thumbnailUrl} 
                  alt="" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-all" 
                />
                
                {/* Stats overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                  <p className="text-[10px] font-bold text-white truncate">@{reel.creatorName || 'user'}</p>
                  <div className="flex items-center gap-1 mt-0.5 text-[9px] text-zinc-300">
                    <span>❤️ {reel.likes}</span>
                    <span>•</span>
                    <span>👀 {reel.views}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default ReelSearch;
