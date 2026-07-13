import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Play, 
  Pause, 
  Lock, 
  Check, 
  Upload, 
  Music, 
  CheckCircle2, 
  AlertTriangle,
  Volume2
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { PremiumModal } from './PremiumModal';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { uploadFile } from '../services/storageService';

export interface Ringtone {
  id: string;
  name: string;
  category: 'peaceful' | 'alert' | 'minimal' | 'nature' | 'retro';
  isPremium: boolean;
  url: string;
}

const RINGTONES: Ringtone[] = [
  // Free Tones
  {
    id: 'ring-peace-1',
    name: 'Zen Garden',
    category: 'peaceful',
    isPremium: false,
    url: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-200.wav'
  },
  {
    id: 'ring-alert-1',
    name: 'Pulse Core',
    category: 'alert',
    isPremium: false,
    url: 'https://assets.mixkit.co/active_storage/sfx/911/911-200.wav'
  },
  {
    id: 'ring-minimal-1',
    name: 'Click Minimal',
    category: 'minimal',
    isPremium: false,
    url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav'
  },
  // Premium Peaceful
  {
    id: 'ring-peace-2',
    name: 'Lotus Bloom',
    category: 'peaceful',
    isPremium: true,
    url: 'https://assets.mixkit.co/active_storage/sfx/1653/1653-200.wav'
  },
  {
    id: 'ring-peace-3',
    name: 'Deep Chime',
    category: 'peaceful',
    isPremium: true,
    url: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-200.wav'
  },
  // Premium Alert
  {
    id: 'ring-alert-2',
    name: 'Nexus Beacon',
    category: 'alert',
    isPremium: true,
    url: 'https://assets.mixkit.co/active_storage/sfx/1432/1432-200.wav'
  },
  {
    id: 'ring-alert-3',
    name: 'Hyper Warp',
    category: 'alert',
    isPremium: true,
    url: 'https://assets.mixkit.co/active_storage/sfx/1500/1500-200.wav'
  },
  // Premium Minimal
  {
    id: 'ring-minimal-2',
    name: 'Single Slate',
    category: 'minimal',
    isPremium: true,
    url: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-200.wav'
  },
  {
    id: 'ring-minimal-3',
    name: 'Tick Tock',
    category: 'minimal',
    isPremium: true,
    url: 'https://assets.mixkit.co/active_storage/sfx/2565/2565-200.wav'
  },
  // Premium Nature
  {
    id: 'ring-nature-1',
    name: 'Rain Drops',
    category: 'nature',
    isPremium: true,
    url: 'https://assets.mixkit.co/active_storage/sfx/2513/2513-200.wav'
  },
  {
    id: 'ring-nature-2',
    name: 'Forest Birds',
    category: 'nature',
    isPremium: true,
    url: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-200.wav'
  },
  {
    id: 'ring-nature-3',
    name: 'Ocean Whistle',
    category: 'nature',
    isPremium: true,
    url: 'https://assets.mixkit.co/active_storage/sfx/2438/2438-200.wav'
  },
  // Premium Retro
  {
    id: 'ring-retro-1',
    name: 'Retro Arcade',
    category: 'retro',
    isPremium: true,
    url: 'https://assets.mixkit.co/active_storage/sfx/1084/1084-200.wav'
  },
  {
    id: 'ring-retro-2',
    name: 'Chiptune Level',
    category: 'retro',
    isPremium: true,
    url: 'https://assets.mixkit.co/active_storage/sfx/1944/1944-200.wav'
  },
  {
    id: 'ring-retro-3',
    name: 'Analog Bell',
    category: 'retro',
    isPremium: true,
    url: 'https://assets.mixkit.co/active_storage/sfx/1103/1103-200.wav'
  }
];

export function RingtonePicker() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [activeCategory, setActiveCategory] = useState<'peaceful' | 'alert' | 'minimal' | 'nature' | 'retro'>('peaceful');
  const [currentRingtoneId, setCurrentRingtoneId] = useState<string>('ring-peace-1');
  const [customRingtone, setCustomRingtone] = useState<{ name: string, url: string } | null>(null);
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load currently selected ringtone
    const storedRingtoneId = localStorage.getItem('activeRingtoneId') || 'ring-peace-1';
    setCurrentRingtoneId(storedRingtoneId);
    
    if (storedRingtoneId.startsWith('custom-upload:')) {
      const parts = storedRingtoneId.replace('custom-upload:', '').split('|||');
      if (parts.length === 2) {
        setCustomRingtone({ name: parts[0], url: parts[1] });
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const playPreview = (id: string, url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (isPlayingId === id) {
      setIsPlayingId(null);
      return;
    }

    setIsPlayingId(id);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(err => {
      console.warn("Failed to play audio preview:", err);
      setIsPlayingId(null);
    });

    // Preview for 3 seconds only
    const timeout = setTimeout(() => {
      if (audioRef.current === audio) {
        audio.pause();
        setIsPlayingId(null);
      }
    }, 3000);

    audio.onended = () => {
      clearTimeout(timeout);
      setIsPlayingId(null);
    };
  };

  const handleSelectRingtone = async (ringtoneId: string, name?: string, url?: string) => {
    const selected = RINGTONES.find(r => r.id === ringtoneId);
    if (selected && selected.isPremium && !isPremium) {
      setShowUpsell(true);
      return;
    }

    if (ringtoneId === 'custom' && !isPremium) {
      setShowUpsell(true);
      return;
    }

    let finalId = ringtoneId;
    if (ringtoneId === 'custom' && name && url) {
      finalId = `custom-upload:${name}|||${url}`;
    }

    setCurrentRingtoneId(finalId);
    localStorage.setItem('activeRingtoneId', finalId);

    // Save choice in cloud
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          'settings.ringtone': {
            id: ringtoneId,
            name: name || selected?.name || 'Default',
            url: url || selected?.url || '',
            isCustom: ringtoneId === 'custom'
          }
        });
      } catch (err) {
        console.warn("Failed to sync ringtone to cloud:", err);
      }
    }
  };

  const handleAudioUpload = async (file: File) => {
    if (!isPremium) {
      setShowUpsell(true);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("MP3 is too large. Maximum allowed size is 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const downloadUrl = await uploadFile(file, `ringtones/${user?.uid}_${Date.now()}`);
      const cleanName = file.name.replace(/\.[^/.]+$/, ""); // Strip file extension
      setCustomRingtone({ name: cleanName, url: downloadUrl });
      await handleSelectRingtone('custom', cleanName, downloadUrl);
    } catch (err) {
      console.error("Failed to upload custom audio", err);
    } finally {
      setIsUploading(false);
    }
  };

  const categories = [
    { id: 'peaceful', label: 'Peaceful' },
    { id: 'alert', label: 'Alert' },
    { id: 'minimal', label: 'Minimal' },
    { id: 'nature', label: 'Nature' },
    { id: 'retro', label: 'Retro' }
  ];

  return (
    <div className="space-y-6 text-left">
      <AnimatePresence>
        {showUpsell && (
          <PremiumModal onClose={() => setShowUpsell(false)} />
        )}
      </AnimatePresence>

      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`px-3.5 py-2.5 text-[10px] font-mono uppercase font-bold tracking-widest rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 font-black'
                : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
            }`}
            style={{ border: 'none' }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Ringtone List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {RINGTONES.filter(r => r.category === activeCategory).map((ring) => {
          const isSelected = currentRingtoneId === ring.id;
          const isToneLocked = ring.isPremium && !isPremium;
          const isPlaying = isPlayingId === ring.id;

          return (
            <div
              key={ring.id}
              className={`p-3 border rounded-2xl flex items-center justify-between transition-all ${
                isSelected
                  ? 'border-amber-500/50 bg-amber-500/5'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111b21]'
              }`}
            >
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => handleSelectRingtone(ring.id)}
              >
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-zinc-500">
                  <Volume2 size={16} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    {ring.name}
                    {isToneLocked && <Lock size={10} className="text-amber-500" />}
                  </h5>
                  <p className="text-[9px] text-zinc-400 uppercase font-mono tracking-wider">{ring.category}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Audio Previewer */}
                <button
                  onClick={() => playPreview(ring.id, ring.url)}
                  className={`p-2 rounded-xl border transition-all hover:scale-105 cursor-pointer ${
                    isPlaying 
                      ? 'bg-amber-500 text-zinc-950 border-amber-500' 
                      : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                  }`}
                  style={{ border: 'none' }}
                >
                  {isPlaying ? <Pause size={12} className="stroke-[3px]" /> : <Play size={12} />}
                </button>

                {isSelected && (
                  <span className="p-1 bg-amber-500 text-zinc-950 rounded-full">
                    <Check size={10} className="stroke-[3.5px]" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Ringtone Upload Box (Locked for free) */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
          Custom Tones upload
          {!isPremium && <Lock size={10} className="text-amber-500 shrink-0" />}
        </h4>

        {customRingtone ? (
          <div className="p-4 bg-zinc-50 dark:bg-[#202c33] rounded-3xl border border-zinc-150/40 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500 text-zinc-950 rounded-2xl">
                <Music size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[150px]">{customRingtone.name}</p>
                <p className="text-[9px] text-green-500 font-mono flex items-center gap-0.5 mt-0.5">
                  <CheckCircle2 size={10} /> DYNAMIC RING ACTIVE
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => playPreview('custom-tone', customRingtone.url)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isPlayingId === 'custom-tone' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-350'
                }`}
                style={{ border: 'none' }}
              >
                {isPlayingId === 'custom-tone' ? <Pause size={12} className="stroke-[3px]" /> : <Play size={12} />}
              </button>
              <button
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.click();
                }}
                className="p-1.5 px-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] font-mono font-bold uppercase rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                style={{ border: 'none' }}
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <div
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
                  handleAudioUpload(e.target.files[0]);
                }
              }}
              className="hidden" 
              accept="audio/*"
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <svg className="animate-spin h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Encrypting and uploading ringtone...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-400 dark:text-zinc-500">
                <Music className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Upload custom MP3 tone</p>
                <p className="text-[9px] font-mono uppercase tracking-wider">Drag & drop or click to upload (Max 5MB)</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default RingtonePicker;
