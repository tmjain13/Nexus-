import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, 
  Lock, 
  Sparkles, 
  LayoutGrid, 
  Maximize2, 
  Minimize2, 
  Image as ImageIcon,
  Check,
  ChevronDown
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { PremiumModal } from './PremiumModal';

export interface ChatFolder {
  id: string;
  name: string;
  isPremium: boolean;
}

export const WALLPAPERS = [
  { id: 'none', name: 'Default Plain', css: 'bg-[#111b21]' },
  { id: 'grad-amber', name: 'Amber Sunset', css: 'bg-gradient-to-tr from-amber-950/40 via-zinc-950 to-[#121214]' },
  { id: 'grad-cyber', name: 'Neon Abyss', css: 'bg-gradient-to-b from-[#0b001a] via-[#050010] to-[#010103]' },
  { id: 'grad-emerald', name: 'Forest Shadow', css: 'bg-gradient-to-tr from-[#021c12] via-[#060808] to-[#121214]' },
  { id: 'grad-nord', name: 'Polar Frost', css: 'bg-gradient-to-tr from-[#1a2332]/40 via-zinc-950 to-zinc-900' }
];

interface ChatFolderTabsProps {
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  density: 'compact' | 'default' | 'comfortable';
  setDensity: (density: 'compact' | 'default' | 'comfortable') => void;
  activeWallpaper: string;
  setActiveWallpaper: (wp: string) => void;
}

export function ChatFolderTabs({
  activeFolder,
  setActiveFolder,
  density,
  setDensity,
  activeWallpaper,
  setActiveWallpaper
}: ChatFolderTabsProps) {
  const { isPremium } = useSubscription();
  const [showUpsell, setShowUpsell] = useState(false);
  const [isWpMenuOpen, setIsWpMenuOpen] = useState(false);
  const [isDensityOpen, setIsDensityOpen] = useState(false);

  const folders: ChatFolder[] = [
    { id: 'all', name: 'All Chats', isPremium: false },
    { id: 'unread', name: 'Unread', isPremium: false },
    { id: 'groups', name: 'Groups', isPremium: true },
    { id: 'favorites', name: 'Favorites', isPremium: true },
    { id: 'channels', name: 'Channels', isPremium: false },
    { id: 'work', name: 'Work', isPremium: true },
    { id: 'personal', name: 'Personal', isPremium: true }
  ];

  const handleSelectFolder = (folder: ChatFolder) => {
    if (folder.isPremium && !isPremium) {
      setShowUpsell(true);
      return;
    }
    setActiveFolder(folder.id);
  };

  const handleSelectWallpaper = (wpId: string) => {
    if (wpId !== 'none' && !isPremium) {
      setShowUpsell(true);
      return;
    }
    setActiveWallpaper(wpId);
    setIsWpMenuOpen(false);
  };

  const handleSelectDensity = (d: 'compact' | 'default' | 'comfortable') => {
    setDensity(d);
    setIsDensityOpen(false);
  };

  return (
    <div className="space-y-3.5 px-4 pt-1 pb-3 border-b border-zinc-150 dark:border-zinc-850/70 bg-white/50 dark:bg-zinc-950/40 backdrop-blur-md">
      <AnimatePresence>
        {showUpsell && (
          <PremiumModal onClose={() => setShowUpsell(false)} />
        )}
      </AnimatePresence>

      {/* Main Folder Horizontal Scroll Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none no-scrollbar pb-1">
        {folders.map((folder) => {
          const isSelected = activeFolder === folder.id;
          const isLocked = folder.isPremium && !isPremium;

          return (
            <button
              key={folder.id}
              onClick={() => handleSelectFolder(folder)}
              className={`px-3.5 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-amber-500 text-zinc-950 font-black scale-[1.02] shadow-md shadow-amber-500/10'
                  : 'bg-zinc-50 dark:bg-[#111b21] text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 border border-zinc-150 dark:border-zinc-800'
              }`}
              style={{ border: 'none' }}
            >
              {folder.id === 'all' && <Folder size={11} />}
              <span>{folder.name}</span>
              {isLocked && <Lock size={10} className="text-amber-500 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Density & Wallpaper Settings Toolbar (Visible for Premium or with Free upsell locks) */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          {/* Chat List Density Control */}
          <div className="relative">
            <button
              onClick={() => setIsDensityOpen(!isDensityOpen)}
              className="p-1.5 px-3 bg-zinc-50 dark:bg-[#111b21] hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-150 dark:border-zinc-800 text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              style={{ border: 'none' }}
            >
              <LayoutGrid size={11} />
              <span className="capitalize">{density} List</span>
              <ChevronDown size={10} className={`transition-transform duration-200 ${isDensityOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDensityOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDensityOpen(false)} />
                <div className="absolute left-0 mt-1 w-32 bg-white dark:bg-[#1f2c34] border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 z-50 flex flex-col text-left">
                  {(['compact', 'default', 'comfortable'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => handleSelectDensity(d)}
                      className={`px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-lg text-left cursor-pointer flex items-center justify-between ${
                        density === d 
                          ? 'bg-amber-500/10 text-amber-500 font-bold' 
                          : 'text-zinc-500 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                      style={{ border: 'none' }}
                    >
                      {d}
                      {density === d && <Check size={10} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Wallpaper Selection Control */}
          <div className="relative">
            <button
              onClick={() => setIsWpMenuOpen(!isWpMenuOpen)}
              className="p-1.5 px-3 bg-zinc-50 dark:bg-[#111b21] hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-150 dark:border-zinc-800 text-[10px] font-mono font-bold text-zinc-500 dark:text-amber-400 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              style={{ border: 'none' }}
            >
              <ImageIcon size={11} className={isPremium ? 'text-amber-500 animate-pulse' : ''} />
              <span>Wallpapers</span>
              <ChevronDown size={10} className={`transition-transform duration-200 ${isWpMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isWpMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsWpMenuOpen(false)} />
                <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-[#1f2c34] border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-xl p-2 z-50 flex flex-col gap-1 text-left">
                  <p className="text-[8px] font-mono font-black text-zinc-400 uppercase tracking-widest px-1 py-0.5">Themes Wallpapers</p>
                  {WALLPAPERS.map((wp) => {
                    const isSelected = activeWallpaper === wp.id;
                    const isLocked = wp.id !== 'none' && !isPremium;

                    return (
                      <button
                        key={wp.id}
                        onClick={() => handleSelectWallpaper(wp.id)}
                        className={`px-2 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider text-left flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 text-amber-500 font-bold'
                            : 'text-zinc-600 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                        }`}
                        style={{ border: 'none' }}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/10 shrink-0 ${wp.css}`} />
                          {wp.name}
                        </span>
                        {isLocked ? (
                          <Lock size={8} className="text-amber-500 shrink-0" />
                        ) : isSelected ? (
                          <Check size={9} className="stroke-[2.5px]" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Premium Folder active indicator */}
        {isPremium && (
          <span className="text-[8px] font-mono font-black tracking-widest uppercase text-amber-500 flex items-center gap-1 shrink-0 animate-pulse bg-amber-500/10 px-2 py-0.5 rounded-md">
            <Sparkles size={9} /> Premium Folders
          </span>
        )}
      </div>
    </div>
  );
}
export default ChatFolderTabs;
