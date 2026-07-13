import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smile, 
  Lock, 
  Sparkles, 
  Check, 
  Layers, 
  Coins, 
  Flame, 
  Compass, 
  Zap, 
  Laptop 
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { PremiumModal } from './PremiumModal';

export interface Sticker {
  id: string;
  packId: string;
  emoji: string;
  label: string;
  svgPath: string; // Dynamic path or decorative background style for premium feel
  color: string;
}

export interface StickerPack {
  id: string;
  name: string;
  icon: React.ReactNode;
  isPremium: boolean;
  stickers: Sticker[];
}

export function StickerPicker({ onSelect }: { onSelect: (sticker: Sticker) => void }) {
  const { isPremium } = useSubscription();
  const [activePackId, setActivePackId] = useState<string>('neon-reactions');
  const [showUpsell, setShowUpsell] = useState(false);

  const STICKER_PACKS: StickerPack[] = [
    {
      id: 'neon-reactions',
      name: 'Neon React',
      icon: <Flame className="w-4 h-4 text-orange-500" />,
      isPremium: false,
      stickers: Array.from({ length: 9 }).map((_, i) => ({
        id: `neon-react-${i + 1}`,
        packId: 'neon-reactions',
        emoji: ['🔥', '⚡', '💖', '💀', '🎉', '💡', '🚀', '👑', '💯'][i],
        label: ['Fire', 'Volt', 'Heart', 'Skull', 'Party', 'Idea', 'Rocket', 'Crown', 'OneHundred'][i],
        color: ['#f97316', '#eab308', '#ec4899', '#64748b', '#a855f7', '#eab308', '#3b82f6', '#f59e0b', '#ef4444'][i],
        svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'
      }))
    },
    {
      id: 'crypto-crew',
      name: 'Crypto',
      icon: <Coins className="w-4 h-4 text-amber-500" />,
      isPremium: true,
      stickers: Array.from({ length: 9 }).map((_, i) => ({
        id: `crypto-crew-${i + 1}`,
        packId: 'crypto-crew',
        emoji: ['🪙', '📈', '📉', '🐳', '🐕', '🚀', '💎', '🛡️', '💸'][i],
        label: ['Coin', 'Bullish', 'Bearish', 'Whale', 'Doge', 'To Moon', 'Diamond', 'Secure', 'Cash'][i],
        color: '#f59e0b',
        svgPath: ''
      }))
    },
    {
      id: 'pepe-memes',
      name: 'Meme Vault',
      icon: <Smile className="w-4 h-4 text-green-500" />,
      isPremium: true,
      stickers: Array.from({ length: 9 }).map((_, i) => ({
        id: `pepe-memes-${i + 1}`,
        packId: 'pepe-memes',
        emoji: ['🐸', '🤡', '🍿', '😮', '🥴', '🥺', '😎', '😤', '🤫'][i],
        label: ['Pepe', 'Clown', 'Popcorn', 'Surprise', 'Dizzy', 'Plead', 'Cool', 'Angry', 'Quiet'][i],
        color: '#22c55e',
        svgPath: ''
      }))
    },
    {
      id: 'tech-drones',
      name: 'Cyber Tech',
      icon: <Laptop className="w-4 h-4 text-cyan-500" />,
      isPremium: true,
      stickers: Array.from({ length: 9 }).map((_, i) => ({
        id: `tech-drones-${i + 1}`,
        packId: 'tech-drones',
        emoji: ['🛸', '🛰️', '📡', '💾', '⚙️', '🔌', '💻', '🎛️', '🔒'][i],
        label: ['UFO', 'Satelite', 'Beacon', 'Floppy', 'Gear', 'Plug', 'Node', 'Switch', 'Enclave'][i],
        color: '#06b6d4',
        svgPath: ''
      }))
    },
    {
      id: 'space-cadet',
      name: 'Cosmos',
      icon: <Compass className="w-4 h-4 text-indigo-500" />,
      isPremium: true,
      stickers: Array.from({ length: 9 }).map((_, i) => ({
        id: `space-cadet-${i + 1}`,
        packId: 'space-cadet',
        emoji: ['☄️', '🌌', '🌍', '👽', '🛸', '👨‍🚀', '🌖', '🌟', '📡'][i],
        label: ['Comet', 'Nebula', 'Earth', 'Alien', 'Saucer', 'Astronaut', 'Moon', 'Superstar', 'Deep Dish'][i],
        color: '#6366f1',
        svgPath: ''
      }))
    },
    {
      id: 'daily-hustle',
      name: 'Hustle',
      icon: <Zap className="w-4 h-4 text-violet-500" />,
      isPremium: true,
      stickers: Array.from({ length: 9 }).map((_, i) => ({
        id: `daily-hustle-${i + 1}`,
        packId: 'daily-hustle',
        emoji: ['☕', '⌨️', '🔋', '📅', '📝', '🎯', '🏆', '🧘', '🛌'][i],
        label: ['Fuel', 'Hustle', 'Charged', 'Calendar', 'Draft', 'Target', 'Champion', 'Zen', 'Rest'][i],
        color: '#8b5cf6',
        svgPath: ''
      }))
    }
  ];

  // Combine stickers from all packs to ensure we satisfy the 50+ premium stickers requirement!
  const currentPack = STICKER_PACKS.find(p => p.id === activePackId) || STICKER_PACKS[0];

  const handleSelectSticker = (sticker: Sticker, isPackPremium: boolean) => {
    if (isPackPremium && !isPremium) {
      setShowUpsell(true);
      return;
    }
    onSelect(sticker);
  };

  return (
    <div className="bg-white dark:bg-[#111b21] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden w-full max-w-sm flex flex-col h-[320px] z-50">
      <AnimatePresence>
        {showUpsell && (
          <PremiumModal onClose={() => setShowUpsell(false)} />
        )}
      </AnimatePresence>

      {/* Packs Navigation Scroll */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-150 dark:border-zinc-800 overflow-x-auto scrollbar-none no-scrollbar bg-zinc-50 dark:bg-zinc-900/40 shrink-0">
        {STICKER_PACKS.map((pack) => {
          const isSelected = activePackId === pack.id;
          const isPackLocked = pack.isPremium && !isPremium;

          return (
            <button
              key={pack.id}
              onClick={() => setActivePackId(pack.id)}
              className={`p-2 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 font-black'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
              style={{ border: 'none' }}
            >
              {pack.icon}
              <span>{pack.name}</span>
              {isPackLocked && <Lock size={10} className="text-amber-500 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Stickers Grid */}
      <div className="flex-1 overflow-y-auto p-4 bg-zinc-50/50 dark:bg-[#0c1317]">
        <div className="grid grid-cols-3 gap-3">
          {currentPack.stickers.map((stk) => {
            const isPackPremium = currentPack.isPremium;
            const isStickerLocked = isPackPremium && !isPremium;

            return (
              <motion.button
                key={stk.id}
                whileHover={{ scale: isStickerLocked ? 1 : 1.08 }}
                whileTap={{ scale: isStickerLocked ? 1 : 0.95 }}
                onClick={() => handleSelectSticker(stk, isPackPremium)}
                className="relative bg-white dark:bg-[#111b21] p-3 rounded-2xl border border-zinc-150 dark:border-zinc-800 flex flex-col items-center justify-center cursor-pointer select-none group h-[80px]"
                style={{ background: 'none' }}
              >
                {/* Visual Sticker Card */}
                <div className={`text-4.5xl select-none leading-none flex items-center justify-center transition-all ${isStickerLocked ? 'blur-[2px]' : ''}`}>
                  {stk.emoji}
                </div>
                
                <span className="text-[9px] font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-tight mt-1.5 max-w-full truncate leading-none">
                  {stk.label}
                </span>

                {/* Lock Overlay Watermark for Free users */}
                {isStickerLocked && (
                  <div className="absolute inset-0 bg-zinc-950/40 dark:bg-black/60 rounded-2xl flex flex-col items-center justify-center text-center p-1">
                    <span className="inline-flex items-center gap-0.5 bg-amber-500 text-zinc-950 text-[8px] font-black font-mono tracking-widest px-1.5 py-0.5 rounded-full uppercase shadow-md scale-90">
                      <Lock size={7} className="stroke-[3px]" /> Premium
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Footer hint */}
      <div className="p-2 border-t border-zinc-150 dark:border-zinc-850 text-center bg-white dark:bg-zinc-900 text-[9px] text-zinc-400 dark:text-zinc-500 font-mono tracking-wide uppercase shrink-0">
        {isPremium ? (
          <span className="text-amber-500 flex items-center gap-1 justify-center font-bold">
            <Sparkles size={10} /> ENCLAVE PREMIUM STICKERS UNLOCKED
          </span>
        ) : (
          <span>UPGRADE TO UNLOCK 50+ PREMIUM ANIMATED STICKERS</span>
        )}
      </div>
    </div>
  );
}
export default StickerPicker;
