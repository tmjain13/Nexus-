import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Check, 
  Upload, 
  Image as ImageIcon,
  CheckCircle2, 
  HelpCircle,
  FileCode,
  Globe
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { PremiumModal } from './PremiumModal';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { uploadFile } from '../services/storageService';

export interface AppIconOption {
  id: string;
  name: string;
  isPremium: boolean;
  color: string;
  svg: string;
}

const ICONS: AppIconOption[] = [
  {
    id: 'default',
    name: 'Default Dove',
    isPremium: false,
    color: '#00a884',
    svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.01 9.01 0 0 1-4.25-1.07l-4.14 1.07 1.03-4.04A9 9 0 1 1 12 21z" />`
  },
  {
    id: 'dark-dove',
    name: 'Dark Dove',
    isPremium: false,
    color: '#343a40',
    svg: `<path stroke-linecap="round" stroke-linejoin="round" fill="currentColor" d="M12 21a9.01 9.01 0 0 1-4.25-1.07l-4.14 1.07 1.03-4.04A9 9 0 1 1 12 21z" />`
  },
  {
    id: 'neon-vibe',
    name: 'Neon Pulse',
    isPremium: true,
    color: '#ff007f',
    svg: `<circle cx="12" cy="12" r="10"/><path d="m12 8-4 4 4 4 4-4-4-4z" fill="currentColor" fill-opacity="0.2"/>`
  },
  {
    id: 'minimalist',
    name: 'Minimal Dot',
    isPremium: true,
    color: '#1a1a1a',
    svg: `<circle cx="12" cy="12" r="6" fill="currentColor" fill-opacity="0.3"/>`
  },
  {
    id: 'royal-gold',
    name: 'Royal Gold',
    isPremium: true,
    color: '#f59e0b',
    svg: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" fill-opacity="0.25"/>`
  },
  {
    id: 'cyber',
    name: 'Cyber Enclave',
    isPremium: true,
    color: '#00f0ff',
    svg: `<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M21 12H3M12 3v18"/>`
  },
  {
    id: 'amber',
    name: 'Amber Flame',
    isPremium: true,
    color: '#f59e0b',
    svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.01 9.01 0 0 1-4.25-1.07l-4.14 1.07 1.03-4.04A9 9 0 1 1 12 21z" /><circle cx="12" cy="11" r="3" fill="currentColor" fill-opacity="0.2"/>`
  },
  {
    id: 'nature-moss',
    name: 'Nature Moss',
    isPremium: true,
    color: '#15803d',
    svg: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fill-opacity="0.15"/>`
  },
  {
    id: 'cosmic',
    name: 'Cosmic Nebula',
    isPremium: true,
    color: '#8b5cf6',
    svg: `<path d="M12 3v18M3 12h18M5 5l14 14M19 5L5 19" stroke-linecap="round"/>`
  },
  {
    id: 'retro-terminal',
    name: 'Retro Terminal',
    isPremium: true,
    color: '#00ff00',
    svg: `<polyline points="4 17 10 11 4 5" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="19" x2="20" y2="19" stroke-linecap="round"/>`
  },
  {
    id: 'bubble',
    name: 'Bubble Talk',
    isPremium: true,
    color: '#3b82f6',
    svg: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor" fill-opacity="0.15"/>`
  },
  {
    id: 'abstract',
    name: 'Abstract Ring',
    isPremium: true,
    color: '#a855f7',
    svg: `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor" fill-opacity="0.3"/>`
  }
];

export function AppIconPicker() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [activeIconId, setActiveIconId] = useState<string>('default');
  const [showUpsell, setShowUpsell] = useState(false);
  const [customIconUrl, setCustomIconUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read currently active app icon
    const storedIcon = localStorage.getItem('activeAppIconId') || 'default';
    setActiveIconId(storedIcon);
    if (storedIcon.startsWith('custom-upload:')) {
      setCustomIconUrl(storedIcon.replace('custom-upload:', ''));
    }
  }, []);

  const updateFavicon = (iconName: string, customUrl?: string) => {
    const link: any = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/svg+xml';
    link.rel = 'shortcut icon';

    if (customUrl) {
      link.type = 'image/png';
      link.href = customUrl;
    } else {
      const selected = ICONS.find(i => i.id === iconName) || ICONS[0];
      const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${selected.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`;
      const svgFooter = `</svg>`;
      const fullSvg = `${svgHeader}${selected.svg}${svgFooter}`;
      link.href = `data:image/svg+xml,${encodeURIComponent(fullSvg)}`;
    }
    
    document.getElementsByTagName('head')[0].appendChild(link);
  };

  const handleSelectIcon = async (iconId: string, customUrl?: string) => {
    const selected = ICONS.find(i => i.id === iconId);
    if (selected && selected.isPremium && !isPremium) {
      setShowUpsell(true);
      return;
    }

    if (iconId === 'custom' && !isPremium) {
      setShowUpsell(true);
      return;
    }

    const finalId = customUrl ? `custom-upload:${customUrl}` : iconId;
    setActiveIconId(finalId);
    localStorage.setItem('activeAppIconId', finalId);
    updateFavicon(iconId, customUrl);

    // Save to Firestore settings
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          'settings.appIcon': finalId
        });
      } catch (err) {
        console.warn("Failed to sync app icon choice:", err);
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!isPremium) {
      setShowUpsell(true);
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert("Please upload a PNG or JPEG image file.");
      return;
    }

    setIsUploading(true);
    try {
      const downloadUrl = await uploadFile(file, `app_icons/${user?.uid}_${Date.now()}`);
      setCustomIconUrl(downloadUrl);
      await handleSelectIcon('custom', downloadUrl);
    } catch (err) {
      console.error("Failed to upload custom app icon", err);
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and Drop implementation
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-amber-500', 'bg-amber-500/5');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-amber-500', 'bg-amber-500/5');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-amber-500', 'bg-amber-500/5');
    }
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <AnimatePresence>
        {showUpsell && (
          <PremiumModal onClose={() => setShowUpsell(false)} />
        )}
      </AnimatePresence>

      <div>
        <h4 className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Handcrafted App Icons</h4>
        
        {/* App Icon grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {ICONS.map((ico) => {
            const isSelected = activeIconId === ico.id;
            const isIconLocked = ico.isPremium && !isPremium;

            return (
              <button
                key={ico.id}
                onClick={() => handleSelectIcon(ico.id)}
                className={`p-3 border rounded-2xl flex flex-col items-center justify-center space-y-2 aspect-square relative transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111b21] hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
                style={{ background: 'none' }}
              >
                {/* Visual Icon */}
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center border text-white shadow-sm shrink-0"
                  style={{ backgroundColor: ico.color, borderColor: `${ico.color}40` }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    className="w-5 h-5"
                    dangerouslySetInnerHTML={{ __html: ico.svg }}
                  />
                </div>

                <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300 truncate w-full text-center">
                  {ico.name}
                </span>

                {isIconLocked ? (
                  <span className="absolute top-1.5 right-1.5 p-0.5 bg-amber-500/20 text-amber-500 rounded-md">
                    <Lock size={8} />
                  </span>
                ) : isSelected ? (
                  <span className="absolute top-1.5 right-1.5 p-0.5 bg-amber-500 text-zinc-950 rounded-full">
                    <Check size={8} className="stroke-[3px]" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Icon upload block (Locked for free) */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
          Dynamic Personal App Icon
          {!isPremium && <Lock size={10} className="text-amber-500 shrink-0" />}
        </h4>

        {customIconUrl ? (
          <div className="p-4 bg-zinc-50 dark:bg-[#202c33] rounded-3xl border border-zinc-150/40 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={customIconUrl} 
                alt="Custom App Icon" 
                className="w-12 h-12 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shadow-sm"
              />
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">Active Custom Logo</p>
                <p className="text-[9px] text-green-500 font-mono flex items-center gap-0.5 mt-0.5">
                  <CheckCircle2 size={10} /> CURRENTLY IN USE
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              className="p-2 px-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] font-mono font-bold uppercase rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all cursor-pointer flex items-center gap-1"
              style={{ border: 'none' }}
            >
              <Upload size={12} /> Replace
            </button>
          </div>
        ) : (
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (!isPremium) {
                setShowUpsell(true);
              } else if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
              !isPremium 
                ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30' 
                : 'border-zinc-300 dark:border-zinc-800 hover:border-amber-500 hover:bg-amber-500/5'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden" 
              accept="image/*"
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <svg className="animate-spin h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Encrypting and uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-400 dark:text-zinc-500">
                <ImageIcon className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Upload custom brand PNG</p>
                <p className="text-[9px] font-mono uppercase tracking-wider">Drag and drop or click to choose (Recommended: 512x512)</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default AppIconPicker;
