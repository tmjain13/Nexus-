import React, { useState } from 'react';
import { 
  X, Sparkles, Globe, EyeOff, ShieldCheck, 
  HelpCircle, Image as ImageIcon, Loader2, DollarSign 
} from 'lucide-react';
import { useChannels } from '../hooks/useChannels';
import { cn } from '../lib/utils';

interface CreateChannelModalProps {
  onClose: () => void;
  onCreated: (channelId: string) => void;
}

const CATEGORIES = ['Tech', 'News', 'Entertainment', 'Education', 'Crypto', 'Lifestyle', 'Gaming', 'Finance'];

export function CreateChannelModal({ onClose, onCreated }: CreateChannelModalProps) {
  const { createChannel } = useChannels();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [handle, setHandle] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [category, setCategory] = useState('Tech');
  
  // Monetization State
  const [monetizationEnabled, setMonetizationEnabled] = useState(false);
  const [price, setPrice] = useState(99);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Channel Name is required");
      return;
    }

    const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase();
    if (!cleanHandle) {
      setError("Channel Handle is required");
      return;
    }

    if (monetizationEnabled) {
      if (price < 50 || price > 10000) {
        setError("Price must be between ₹50 and ₹10,000 per month");
        return;
      }
    }

    setLoading(true);
    try {
      const channelId = await createChannel(
        name.trim(),
        cleanHandle,
        description.trim(),
        privacy,
        {
          enabled: monetizationEnabled,
          price: monetizationEnabled ? price : 0,
          currency: 'INR'
        },
        category,
        `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanHandle}`
      );
      
      if (channelId) {
        onCreated(channelId);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create channel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm text-zinc-100">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-900 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-xl flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">Launch Broadcast Channel</h2>
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Publish your exclusive stream to subscribers</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 progress-scroll text-left">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-2.5 text-red-400 text-xs font-mono uppercase tracking-wider">
              <X size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Channel Name *</label>
              <input
                type="text"
                placeholder="e.g. Daily Tech Brief"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={128}
                className="w-full bg-zinc-900 border border-zinc-850 focus:border-zinc-750 focus:outline-none rounded-2xl px-4 py-3 text-xs text-zinc-200 placeholder:text-zinc-600 transition-all font-sans"
                required
              />
            </div>

            {/* Handle */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Channel Handle *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-mono text-xs">@</span>
                <input
                  type="text"
                  placeholder="tech_briefing"
                  value={handle}
                  onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full bg-zinc-900 border border-zinc-850 focus:border-zinc-750 focus:outline-none rounded-2xl pl-8 pr-4 py-3 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 transition-all"
                  required
                />
              </div>
              <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Unique identifier. Alphanumeric and underscores only.</p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Description</label>
              <textarea
                placeholder="Explain what your channel offers subscribers..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={255}
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-850 focus:border-zinc-750 focus:outline-none rounded-2xl p-4 text-xs text-zinc-200 placeholder:text-zinc-600 transition-all font-sans"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "py-2.5 rounded-xl border text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer",
                      category === cat 
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-400" 
                        : "bg-zinc-900/60 border-zinc-850 text-zinc-400 hover:text-white"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy Select */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Privacy Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPrivacy('public')}
                  className={cn(
                    "p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer",
                    privacy === 'public' 
                      ? "bg-zinc-900 border-amber-500/20 text-amber-400" 
                      : "bg-zinc-900/40 border-zinc-900 text-zinc-400 hover:text-white"
                  )}
                >
                  <Globe size={18} />
                  <div className="text-center">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider">Public Channel</h4>
                    <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Searchable & public discovery</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPrivacy('private')}
                  className={cn(
                    "p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer",
                    privacy === 'private' 
                      ? "bg-zinc-900 border-amber-500/20 text-amber-400" 
                      : "bg-zinc-900/40 border-zinc-900 text-zinc-400 hover:text-white"
                  )}
                >
                  <EyeOff size={18} />
                  <div className="text-center">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider">Private Link</h4>
                    <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Invite link verification only</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Monetization Engine Toggle */}
            <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-left space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wide">Paid Premium Channel</h4>
                  <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Lock posts behind a subscription tier</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={monetizationEnabled} 
                    onChange={e => setMonetizationEnabled(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-black peer-checked:after:border-black"></div>
                </label>
              </div>

              {monetizationEnabled && (
                <div className="space-y-2.5 pt-2 border-t border-zinc-850/60 animate-fade-in text-left">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Monthly Membership Price (INR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-amber-500">₹</span>
                    <input
                      type="number"
                      value={price}
                      onChange={e => setPrice(Number(e.target.value))}
                      min={50}
                      max={10000}
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-zinc-750 focus:outline-none rounded-xl pl-8 pr-4 py-3 text-xs font-mono text-zinc-200"
                    />
                  </div>
                  <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest leading-relaxed">
                    Set a monthly subscription fee between ₹50 and ₹10,000. You keep 90% of the proceeds. Includes a 7-day free trial auto-applied.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black text-xs font-sans font-black uppercase tracking-wider rounded-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                <ShieldCheck size={14} strokeWidth={3} />
                <span>Publish Channel</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
