import React, { useState, useEffect } from 'react';
import { Search, Globe, Flame, Plus, Sparkles, Check } from 'lucide-react';
import { useChannels } from '../hooks/useChannels';
import { Channel } from '../types';
import { ChannelCard } from './ChannelCard';
import { CreateChannelModal } from './CreateChannelModal';

interface ChannelDiscoverProps {
  onSelectChannel: (channelId: string) => void;
  subscribedIds: string[];
}

const CATEGORIES = ['All', 'Tech', 'News', 'Entertainment', 'Education', 'Crypto', 'Lifestyle', 'Gaming', 'Finance'];

export function ChannelDiscover({ onSelectChannel, subscribedIds }: ChannelDiscoverProps) {
  const { searchChannels, subscribe, unsubscribe } = useChannels();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const results = await searchChannels(searchQuery, activeCategory);
      setChannels(results);
    } catch (err) {
      console.error("Error searching channels:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [searchQuery, activeCategory, subscribedIds]);

  const handleSubscribeToggle = async (channel: Channel) => {
    try {
      const isSubbed = subscribedIds.includes(channel.id);
      if (isSubbed) {
        await unsubscribe(channel.id);
      } else {
        await subscribe(channel.id);
      }
    } catch (err) {
      console.error("Subscription failed:", err);
    }
  };

  // Trending section: sort by subscribers count
  const trendingChannels = [...channels]
    .sort((a, b) => (b.subscribers || 0) - (a.subscribers || 0))
    .slice(0, 3);

  return (
    <div className="flex-1 overflow-y-auto bg-black text-zinc-100 p-6 md:p-8 progress-scroll text-left">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Welcome Hero Grid */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-zinc-900">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-amber-500" />
              <h1 className="text-lg font-bold uppercase tracking-wider text-zinc-100">Broadcast Discover Hub</h1>
            </div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Explore premium public & community channels</p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black text-xs font-sans font-black uppercase tracking-wider rounded-2xl transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <Plus size={14} strokeWidth={3} />
            <span>New Channel</span>
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                placeholder="Query channel directory..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-850/60 focus:border-zinc-750 focus:outline-none rounded-2xl pl-10 pr-4 py-3 text-xs text-zinc-200 placeholder:text-zinc-600 font-sans transition-all"
              />
            </div>

            {/* Category selection */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full progress-scroll select-none shrink-0">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 text-[9px] uppercase tracking-wider font-bold transition-all rounded-xl cursor-pointer shrink-0 border ${
                    activeCategory === cat 
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                      : 'bg-zinc-900/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Trending Spotlight Carousel */}
        {trendingChannels.length > 0 && !searchQuery && activeCategory === 'All' && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
              <Flame size={12} className="animate-bounce" />
              <span>Trending Broadcast Spotlight</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trendingChannels.map(c => (
                <div 
                  key={c.id}
                  onClick={() => onSelectChannel(c.id)}
                  className="bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-900 hover:border-zinc-850 p-4 rounded-2xl flex items-center justify-between gap-4 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={c.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${c.handle}`}
                      alt={c.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl border border-zinc-800 object-cover bg-zinc-950"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-zinc-200 truncate uppercase tracking-wider">
                        {c.name}
                      </h4>
                      <p className="text-[9px] font-mono text-zinc-500 mt-0.5">{c.subscribers} Subscribers</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-amber-500/10 text-[8px] font-mono text-amber-400 rounded uppercase font-bold tracking-widest">
                    Hot
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Channels Grid */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
            {searchQuery || activeCategory !== 'All' ? 'Matched Directory' : 'Explore Catalog'}
          </h3>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Scanning network streams...</span>
            </div>
          ) : channels.length === 0 ? (
            <div className="py-24 border border-dashed border-zinc-900 rounded-[32px] flex flex-col items-center justify-center text-center space-y-2">
              <Globe size={24} className="text-zinc-700 mb-1" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">No matching channels found</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {channels.map(channel => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  isSubscribed={subscribedIds.includes(channel.id)}
                  onSelect={() => onSelectChannel(channel.id)}
                  onToggleSubscribe={() => handleSubscribeToggle(channel)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Creation Modal */}
      {showCreateModal && (
        <CreateChannelModal 
          onClose={() => setShowCreateModal(false)} 
          onCreated={(channelId) => {
            onSelectChannel(channelId);
          }}
        />
      )}
    </div>
  );
}
