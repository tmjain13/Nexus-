import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, 
  Lock, 
  Sparkles, 
  Check, 
  Sliders, 
  ArrowLeft,
  X,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { usePremiumFeature } from '../hooks/usePremiumFeature';
import { PremiumModal } from './PremiumModal';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export interface Theme {
  id: string;
  name: string;
  category: 'dark' | 'light' | 'nature' | 'abstract';
  isPremium: boolean;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
  };
}

export const THEMES: Theme[] = [
  // Free Themes
  {
    id: 'default-dark',
    name: 'Default Dark',
    category: 'dark',
    isPremium: false,
    colors: { primary: '#00a884', secondary: '#53bdeb', background: '#0b141a', surface: '#111b21', text: '#e9edef' }
  },
  {
    id: 'default-light',
    name: 'Default Light',
    category: 'light',
    isPremium: false,
    colors: { primary: '#008069', secondary: '#027eb5', background: '#f0f2f5', surface: '#ffffff', text: '#111b21' }
  },
  {
    id: 'amber-glow',
    name: 'Amber Glow',
    category: 'dark',
    isPremium: false,
    colors: { primary: '#f59e0b', secondary: '#f59e0b', background: '#09090b', surface: '#121214', text: '#fafafa' }
  },
  // Premium Dark
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Noir',
    category: 'dark',
    isPremium: true,
    colors: { primary: '#ff007f', secondary: '#00f0ff', background: '#03001e', surface: '#0c002b', text: '#f3f4f6' }
  },
  {
    id: 'dracula',
    name: 'Dracula Vamp',
    category: 'dark',
    isPremium: true,
    colors: { primary: '#ff79c6', secondary: '#8be9fd', background: '#1e1f29', surface: '#282a36', text: '#f8f8f2' }
  },
  {
    id: 'nord-frost',
    name: 'Nord Frost',
    category: 'dark',
    isPremium: true,
    colors: { primary: '#88c0d0', secondary: '#81a1c1', background: '#2e3440', surface: '#3b4252', text: '#eceff4' }
  },
  {
    id: 'oceanic',
    name: 'Oceanic Depth',
    category: 'dark',
    isPremium: true,
    colors: { primary: '#00f5d4', secondary: '#00bbf9', background: '#011627', surface: '#0b2c4d', text: '#f1f5f9' }
  },
  {
    id: 'matrix',
    name: 'Digital Matrix',
    category: 'dark',
    isPremium: true,
    colors: { primary: '#00ff00', secondary: '#15803d', background: '#000000', surface: '#0a0a0a', text: '#22c55e' }
  },
  {
    id: 'space',
    name: 'Deep Space',
    category: 'dark',
    isPremium: true,
    colors: { primary: '#8b5cf6', secondary: '#3b82f6', background: '#020205', surface: '#090915', text: '#f5f3ff' }
  },
  {
    id: 'ruby',
    name: 'Ruby Crimson',
    category: 'dark',
    isPremium: true,
    colors: { primary: '#ef4444', secondary: '#f87171', background: '#180202', surface: '#280c0c', text: '#fee2e2' }
  },
  {
    id: 'emerald-abyss',
    name: 'Emerald Abyss',
    category: 'dark',
    isPremium: true,
    colors: { primary: '#10b981', secondary: '#34d399', background: '#021810', surface: '#062c1e', text: '#ecfdf5' }
  },
  // Premium Light
  {
    id: 'nord-light',
    name: 'Nord Alabaster',
    category: 'light',
    isPremium: true,
    colors: { primary: '#5e81ac', secondary: '#81a1c1', background: '#e5e9f0', surface: '#eceff4', text: '#2e3440' }
  },
  {
    id: 'solarized-light',
    name: 'Solarized Warm',
    category: 'light',
    isPremium: true,
    colors: { primary: '#b58900', secondary: '#2aa198', background: '#fdf6e3', surface: '#eee8d5', text: '#073642' }
  },
  {
    id: 'minimal-white',
    name: 'Absolute White',
    category: 'light',
    isPremium: true,
    colors: { primary: '#000000', secondary: '#4b5563', background: '#fafafa', surface: '#ffffff', text: '#000000' }
  },
  {
    id: 'lavender-breeze',
    name: 'Lavender Fields',
    category: 'light',
    isPremium: true,
    colors: { primary: '#7c3aed', secondary: '#a78bfa', background: '#f5f3ff', surface: '#ede9fe', text: '#1e1b4b' }
  },
  {
    id: 'sakura',
    name: 'Sakura Garden',
    category: 'light',
    isPremium: true,
    colors: { primary: '#db2777', secondary: '#f472b6', background: '#fff1f2', surface: '#ffe4e6', text: '#4c0519' }
  },
  // Premium Nature
  {
    id: 'forest',
    name: 'Mossy Forest',
    category: 'nature',
    isPremium: true,
    colors: { primary: '#15803d', secondary: '#166534', background: '#1c1f1a', surface: '#222920', text: '#f4fbf4' }
  },
  {
    id: 'safari',
    name: 'Safari Sand',
    category: 'nature',
    isPremium: true,
    colors: { primary: '#ca8a04', secondary: '#a16207', background: '#1c1917', surface: '#292524', text: '#fefcfb' }
  },
  {
    id: 'oasis',
    name: 'Desert Oasis',
    category: 'nature',
    isPremium: true,
    colors: { primary: '#0d9488', secondary: '#0f766e', background: '#fefae0', surface: '#e9edc9', text: '#283618' }
  },
  // Premium Abstract
  {
    id: 'cosmic-dust',
    name: 'Cosmic Nebula',
    category: 'abstract',
    isPremium: true,
    colors: { primary: '#a855f7', secondary: '#f43f5e', background: '#090514', surface: '#140c26', text: '#fdfaff' }
  },
  {
    id: 'sunset-gradient',
    name: 'Sunset Blvd',
    category: 'abstract',
    isPremium: true,
    colors: { primary: '#f97316', secondary: '#ec4899', background: '#1a0d0a', surface: '#2b140d', text: '#fff7ed' }
  }
];

export const WALLPAPERS_LIST = [
  { id: 'default', name: 'Theme Default', bg: 'bg-zinc-800', url: 'default' },
  { id: 'plain', name: 'None / Plain', bg: 'bg-zinc-950', url: 'none' },
  { id: 'leaves', name: 'Leaves Pattern', bg: 'bg-emerald-950', url: 'https://www.transparenttextures.com/patterns/leaves.png' },
  { id: 'cyber', name: 'Cyber Glow', bg: 'bg-violet-950', url: 'https://www.transparenttextures.com/patterns/cyber-glow.png' },
  { id: 'stardust', name: 'Stardust', bg: 'bg-indigo-950', url: 'https://www.transparenttextures.com/patterns/stardust.png' },
  { id: 'carbon', name: 'Carbon Fibre', bg: 'bg-neutral-900', url: 'https://www.transparenttextures.com/patterns/carbon-fibre.png' },
  { id: 'cubes', name: 'Cubes Grid', bg: 'bg-sky-950', url: 'https://www.transparenttextures.com/patterns/cubes.png' },
];

export function ThemePicker() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const { setPrimaryAccent, setThemeMode } = useTheme();
  const [activeCategory, setActiveCategory] = useState<'dark' | 'light' | 'nature' | 'abstract'>('dark');
  const [currentThemeId, setCurrentThemeId] = useState<string>('default-dark');
  const [showUpsell, setShowUpsell] = useState(false);
  
  // Custom Theme Builder State (Locked for Free)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [customPrimary, setCustomPrimary] = useState('#f59e0b');
  const [customBackground, setCustomBackground] = useState('#0a0a0a');
  const [customSurface, setCustomSurface] = useState('#121212');
  const [customText, setCustomText] = useState('#ffffff');

  const [globalWallpaper, setGlobalWallpaper] = useState<string>(() => {
    return localStorage.getItem('globalChatWallpaper') || 'default';
  });
  const [customWpUrl, setCustomWpUrl] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem('globalChatWallpaper') || 'default';
    setGlobalWallpaper(stored);
    const isPredefined = WALLPAPERS_LIST.some(w => w.url === stored) || stored === 'default';
    if (!isPredefined) {
      setCustomWpUrl(stored);
    }
  }, []);

  const handleSelectGlobalWallpaper = async (wpUrl: string) => {
    setGlobalWallpaper(wpUrl);
    localStorage.setItem('globalChatWallpaper', wpUrl);
    
    // Save to Firestore settings
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          'settings.globalWallpaper': wpUrl
        });
      } catch (err) {
        console.warn("Failed to sync global wallpaper setting to cloud:", err);
      }
    }
  };

  useEffect(() => {
    // Read currently active theme
    const storedTheme = localStorage.getItem('activeThemeId') || 'default-dark';
    setCurrentThemeId(storedTheme);
    
    if (storedTheme === 'custom') {
      const storedColors = localStorage.getItem('customThemeColors');
      if (storedColors) {
        try {
          const parsed = JSON.parse(storedColors);
          setCustomPrimary(parsed.primary);
          setCustomBackground(parsed.background);
          setCustomSurface(parsed.surface);
          setCustomText(parsed.text);
        } catch (e) {}
      }
    }
  }, []);

  const applyThemeColors = (themeColors: Theme['colors'], themeId: string) => {
    const root = window.document.documentElement;
    
    // Set custom theme CSS variables
    root.style.setProperty('--color-wa-primary', themeColors.primary);
    root.style.setProperty('--color-bg-custom', themeColors.background);
    root.style.setProperty('--color-surface-custom', themeColors.surface);
    root.style.setProperty('--color-text-custom', themeColors.text);

    // Compute RGB for glow
    try {
      const hex = themeColors.primary.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      root.style.setProperty('--color-wa-primary-glow', `rgba(${r}, ${g}, ${b}, 0.15)`);
      root.style.setProperty('--color-wa-primary-glow-strong', `rgba(${r}, ${g}, ${b}, 0.3)`);
      root.style.setProperty('--color-wa-primary-rgb', `${r}, ${g}, ${b}`);
    } catch (e) {}

    setPrimaryAccent(themeColors.primary);
    
    // Determine light/dark system switch
    const isThemeDark = ['dark', 'nature', 'abstract'].includes(
      THEMES.find(t => t.id === themeId)?.category || 'dark'
    ) || themeColors.background === '#000000' || themeColors.background.startsWith('#0') || themeColors.background.startsWith('#1');
    
    setThemeMode(isThemeDark ? 'dark' : 'light');

    localStorage.setItem('activeThemeId', themeId);
    if (themeId === 'custom') {
      localStorage.setItem('customThemeColors', JSON.stringify(themeColors));
    }
  };

  const handleSelectTheme = async (theme: Theme) => {
    if (theme.isPremium && !isPremium) {
      setShowUpsell(true);
      return;
    }

    setCurrentThemeId(theme.id);
    applyThemeColors(theme.colors, theme.id);

    // Save to Firestore settings
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          'settings.theme': {
            id: theme.id,
            isCustom: false,
            colors: theme.colors
          }
        });
      } catch (err) {
        console.warn("Failed to sync theme settings to cloud:", err);
      }
    }
  };

  const handleCustomBuilderSave = async () => {
    if (!isPremium) {
      setShowUpsell(true);
      return;
    }

    const customColors = {
      primary: customPrimary,
      secondary: customPrimary,
      background: customBackground,
      surface: customSurface,
      text: customText
    };

    setCurrentThemeId('custom');
    applyThemeColors(customColors, 'custom');
    setIsBuilderOpen(false);

    // Save custom settings to cloud
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          'settings.theme': {
            id: 'custom',
            isCustom: true,
            colors: customColors
          }
        });
      } catch (err) {
        console.warn("Failed to sync custom theme to cloud:", err);
      }
    }
  };

  const categories = [
    { id: 'dark', label: 'Dark Mode (10)' },
    { id: 'light', label: 'Light Mode (5)' },
    { id: 'nature', label: 'Nature (3)' },
    { id: 'abstract', label: 'Abstract (2)' }
  ];

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showUpsell && (
          <PremiumModal onClose={() => setShowUpsell(false)} />
        )}
      </AnimatePresence>

      {isBuilderOpen ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="p-5 bg-white dark:bg-[#111b21] rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-6 text-left"
        >
          <div className="flex justify-between items-center">
            <button
              onClick={() => setIsBuilderOpen(false)}
              className="p-1 px-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-[10px] font-mono font-bold uppercase hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-1"
              style={{ border: 'none' }}
            >
              <ArrowLeft size={12} /> Back
            </button>
            <h4 className="text-[11px] font-mono font-bold tracking-widest text-amber-500 uppercase flex items-center gap-1">
              <Sliders size={12} /> Theme Builder
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Primary Picker */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Accent / Primary</label>
              <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150/40 dark:border-zinc-850">
                <input 
                  type="color" 
                  value={customPrimary} 
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-300 uppercase font-bold">{customPrimary}</span>
              </div>
            </div>

            {/* Text Color Picker */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Text / Labels</label>
              <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150/40 dark:border-zinc-850">
                <input 
                  type="color" 
                  value={customText} 
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-300 uppercase font-bold">{customText}</span>
              </div>
            </div>

            {/* Background Picker */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">App Background</label>
              <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150/40 dark:border-zinc-850">
                <input 
                  type="color" 
                  value={customBackground} 
                  onChange={(e) => setCustomBackground(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-300 uppercase font-bold">{customBackground}</span>
              </div>
            </div>

            {/* Surface Picker */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">App Surface</label>
              <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150/40 dark:border-zinc-850">
                <input 
                  type="color" 
                  value={customSurface} 
                  onChange={(e) => setCustomSurface(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-300 uppercase font-bold">{customSurface}</span>
              </div>
            </div>
          </div>

          {/* Theme Preview Card */}
          <div className="p-4 rounded-2xl border transition-all text-center space-y-2.5" style={{ backgroundColor: customBackground, borderColor: customSurface }}>
            <span className="inline-block text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ backgroundColor: customPrimary + '20', color: customPrimary }}>
              LIVE PREVIEW
            </span>
            <p className="text-xs font-semibold leading-relaxed" style={{ color: customText }}>Secure Chat Sandbox Bubble</p>
            <div className="flex gap-2 justify-center">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: customPrimary }} />
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: customSurface }} />
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: customBackground }} />
            </div>
          </div>

          <button
            onClick={handleCustomBuilderSave}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold font-mono tracking-wider uppercase rounded-2xl transition-colors cursor-pointer"
            style={{ border: 'none' }}
          >
            Apply Bespoke Theme Settings
          </button>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {/* Top category selectors */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3.5 py-2.5 text-[10px] font-mono uppercase font-extrabold tracking-widest rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 font-black scale-[1.02]'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                }`}
                style={{ border: 'none' }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Theme custom builder trigger row */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-amber-600/5 dark:from-amber-500/10 dark:to-zinc-900 rounded-3xl border border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-zinc-950 rounded-xl">
                <Palette size={16} />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                  Custom Palette Builder
                  {!isPremium && <Lock size={10} className="text-amber-500 shrink-0" />}
                </h4>
                <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-mono font-medium">Bespoke background & accent choices</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (!isPremium) {
                  setShowUpsell(true);
                } else {
                  setIsBuilderOpen(true);
                }
              }}
              className="p-1.5 px-3.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-[9px] font-mono uppercase font-black tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              style={{ border: 'none' }}
            >
              <Sliders size={10} /> Build
            </button>
          </div>

          {/* Theme Grid */}
          <div className="grid grid-cols-2 gap-3">
            {THEMES.filter(t => t.category === activeCategory).map((theme) => {
              const isSelected = currentThemeId === theme.id;
              const isThemeLocked = theme.isPremium && !isPremium;
              
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-[100px] relative transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-amber-500 bg-amber-500/5 shadow-md shadow-amber-500/5' 
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111b21] hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                  style={{ background: 'none' }}
                >
                  <div className="w-full flex justify-between items-start">
                    <span className="text-[11px] font-semibold text-zinc-900 dark:text-white leading-tight pr-4">
                      {theme.name}
                    </span>
                    {isThemeLocked ? (
                      <span className="p-1 bg-amber-500/20 text-amber-500 rounded-lg shrink-0">
                        <Lock size={10} />
                      </span>
                    ) : isSelected ? (
                      <span className="p-0.5 bg-amber-500 text-zinc-950 rounded-full shrink-0">
                        <Check size={10} className="stroke-[3px]" />
                      </span>
                    ) : null}
                  </div>

                  {/* Colors visual deck */}
                  <div className="flex gap-1.5 mt-auto pt-2">
                    <span 
                      className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10 shrink-0" 
                      style={{ backgroundColor: theme.colors.primary }}
                      title="Accent"
                    />
                    <span 
                      className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10 shrink-0" 
                      style={{ backgroundColor: theme.colors.background }}
                      title="Background"
                    />
                    <span 
                      className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10 shrink-0" 
                      style={{ backgroundColor: theme.colors.surface }}
                      title="Surface"
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Wallpaper Selection Control */}
          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/15 text-amber-500 rounded-xl">
                <ImageIcon size={18} />
              </div>
              <div>
                <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-900 dark:text-white uppercase">Chat Wallpaper</h4>
                <p className="text-[9px] text-zinc-500 font-medium uppercase tracking-wide">Select default background pattern for all rooms</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {WALLPAPERS_LIST.map((wp) => {
                const isSelected = globalWallpaper === wp.url;
                return (
                  <button
                    key={wp.id}
                    onClick={() => handleSelectGlobalWallpaper(wp.url)}
                    className={`h-[60px] rounded-xl border flex flex-col justify-end p-1.5 transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected 
                        ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-500/5' 
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                    style={{ border: 'none' }}
                  >
                    {/* Pattern Overlay in the button */}
                    <div 
                      className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
                      style={{
                        backgroundColor: wp.url === 'none' ? '#000000' : undefined,
                        backgroundImage: wp.url !== 'default' && wp.url !== 'none' ? `url('${wp.url}')` : 'none',
                        backgroundRepeat: 'repeat',
                        backgroundSize: '40px'
                      }}
                    />
                    <span className="text-[8px] font-mono font-bold tracking-tight text-zinc-800 dark:text-zinc-200 truncate w-full z-10 select-none bg-white/80 dark:bg-zinc-950/80 px-1 py-0.5 rounded text-center">
                      {wp.name}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1 right-1 p-0.5 bg-amber-500 text-zinc-950 rounded-full z-20">
                        <Check size={8} className="stroke-[3px]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom URL Input */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Custom Wallpaper Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste direct link (e.g. https://example.com/bg.jpg)"
                  value={customWpUrl}
                  onChange={(e) => {
                    setCustomWpUrl(e.target.value);
                    if (e.target.value.trim()) {
                      handleSelectGlobalWallpaper(e.target.value.trim());
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 placeholder-zinc-500 border border-zinc-250 dark:border-zinc-800 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                {customWpUrl && (
                  <button
                    onClick={() => {
                      setCustomWpUrl('');
                      handleSelectGlobalWallpaper('default');
                    }}
                    className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-xl transition-all cursor-pointer"
                    title="Clear Custom URL"
                    style={{ border: 'none' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default ThemePicker;
