import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft,
  Shield, Lock, Unlock, Camera, Trash2, Key, Send, Flame, RefreshCcw, Eye, EyeOff, 
  Sparkles, CheckCircle2, CloudLightning, Cpu, Grid, LayoutGrid, Terminal, Trash, Zap,
  ChevronLeft, FolderOpen, Fingerprint, Image as ImageIcon, Video, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { secureFetch } from '../lib/secureFetch';
import { DocumentManager } from '../components/DocumentManager';

interface EncryptedVaultMedia {
  id: string;
  title: string;
  type: 'image' | 'video';
  dataUrl: string;
  createdAt: number;
}

interface VaultMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  burnDuration?: number; // in seconds
  burnTimeLeft?: number;
  isBurning?: boolean;
}

export default function Vault() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Auth & Pin States
  const [hasPasscode, setHasPasscode] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [errorText, setErrorText] = useState('');
  
  // Biometric States
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const [biometricProgress, setBiometricProgress] = useState(0);
  const [biometricStatus, setBiometricStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');

  // New Passcode setup states
  const [setupPasscode, setSetupPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [setupStep, setSetupStep] = useState(1);

  // Active section inside the vault
  const [activeSubTab, setActiveSubTab] = useState<'gallery' | 'chat' | 'documents'>('gallery');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const folders = [
    {
      id: "blueprints",
      label: "Operational Schematics",
      desc: "Tension diagrams, load matrices & architectural blueprints.",
      cover: "https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=600&auto=format&fit=crop&q=80",
      tag: "STEM FOLDER",
      color: "border-emerald-500/20"
    },
    {
      id: "field_diagnostics",
      label: "Tactical Recon Logs",
      desc: "Raw system environment dumps & network coordinate caches.",
      cover: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&auto=format&fit=crop&q=80",
      tag: "SECURE FILES",
      color: "border-teal-500/20"
    },
    {
      id: "decentralized_personal",
      label: "Encrypted Attachments",
      desc: "Decrypted volatile media elements & user sourced snapshots.",
      cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      tag: "VOLATILE MEDIA",
      color: "border-blue-500/20"
    }
  ];

  const getItemsForFolder = (folderId: string) => {
    return mediaList.filter(item => {
      const titleLower = item.title.toLowerCase();
      if (folderId === 'blueprints') {
        return titleLower.includes('blueprint') || item.id === 'seed-1';
      }
      if (folderId === 'field_diagnostics') {
        return titleLower.includes('tactical') || titleLower.includes('recon') || item.id === 'seed-2';
      }
      return !titleLower.includes('blueprint') && !titleLower.includes('tactical') && !titleLower.includes('recon') && item.id !== 'seed-1' && item.id !== 'seed-2';
    });
  };

  // Encryption content list
  const [mediaList, setMediaList] = useState<EncryptedVaultMedia[]>([]);
  const [vaultChats, setVaultChats] = useState<VaultMessage[]>([]);
  
  // Inputs
  const [chatInput, setChatInput] = useState('');
  const [burnTimer, setBurnTimer] = useState<number>(0); // 0 = no burn, or 5, 10, 30
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);

  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load passcode and saved vault items from local storage
  useEffect(() => {
    if (!user) return;
    const storedPasscode = localStorage.getItem(`aero_vault_passcode_${user.uid}`);
    if (storedPasscode) {
      setHasPasscode(true);
      setPasscode(storedPasscode);
    } else {
      setHasPasscode(false);
    }

    // Load encrypted gallery
    const storedMedia = localStorage.getItem(`aero_vault_media_${user.uid}`);
    if (storedMedia) {
      try {
        setMediaList(JSON.parse(storedMedia));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed preset items
      const seedData: EncryptedVaultMedia[] = [
        {
          id: 'seed-1',
          title: 'Holographic Node Blueprint.enc',
          type: 'image',
          dataUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&auto=format&fit=crop&q=80',
          createdAt: Date.now() - 3600000,
        },
        {
          id: 'seed-2',
          title: 'Tactical Workspace Node.enc',
          type: 'image',
          dataUrl: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=600&auto=format&fit=crop&q=80',
          createdAt: Date.now() - 7200000,
        }
      ];
      setMediaList(seedData);
      localStorage.setItem(`aero_vault_media_${user.uid}`, JSON.stringify(seedData));
    }

    // Load encrypted chats
    const storedChats = localStorage.getItem(`aero_vault_chats_${user.uid}`);
    if (storedChats) {
      try {
        setVaultChats(JSON.parse(storedChats));
      } catch (e) {
        console.error(e);
      }
    } else {
      const seedChats: VaultMessage[] = [
        {
          id: 'msg-seed-1',
          sender: 'assistant',
          text: 'Welcome to your Enclave Vault Chat. All conversation here is encrypted in local volatile storage and ignores all external indexing streams. Self-destruction protocols can be enabled using the burning flame controls below.',
          timestamp: Date.now() - 100000,
        }
      ];
      setVaultChats(seedChats);
      localStorage.setItem(`aero_vault_chats_${user.uid}`, JSON.stringify(seedChats));
    }
  }, [user]);

  // Handle auto-burning messages count down
  useEffect(() => {
    const timer = setInterval(() => {
      setVaultChats((prevChats) => {
        let changed = false;
        const updated = prevChats.map((msg) => {
          if (msg.burnDuration && msg.burnTimeLeft !== undefined && msg.burnTimeLeft > 0) {
            changed = true;
            return { ...msg, burnTimeLeft: msg.burnTimeLeft - 1 };
          }
          return msg;
        }).filter((msg) => {
          // If expired, let's filter out (burn complete)
          const isExpired = msg.burnTimeLeft !== undefined && msg.burnTimeLeft <= 0;
          if (isExpired) changed = true;
          return !isExpired;
        });

        if (changed && user) {
          localStorage.setItem(`aero_vault_chats_${user.uid}`, JSON.stringify(updated));
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user]);

  // Scroll chats
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [vaultChats, isAiTyping]);

  // Code entry handle
  const handleKeypadPress = (num: string) => {
    setErrorText('');
    if (passcodeInput.length < 4) {
      const updated = passcodeInput + num;
      setPasscodeInput(updated);
      
      if (updated.length === 4) {
        if (updated === passcode) {
          setIsUnlocked(true);
          setPasscodeInput('');
          setErrorText('');
        } else {
          setErrorText('INVALID SECURITY CODE. ACCESS DENIED.');
          setPasscodeInput('');
        }
      }
    }
  };

  const handleKeypadDelete = () => {
    setPasscodeInput(prev => prev.slice(0, -1));
  };

  // Setup pin process
  const startSetupPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPasscode.length !== 4 || isNaN(Number(setupPasscode))) {
      setErrorText('Passcode must be exactly 4 digits');
      return;
    }
    setErrorText('');
    setSetupStep(2);
  };

  const completeSetupPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmPasscode !== setupPasscode) {
      setErrorText('Passcodes do not match. Please restart setup.');
      setSetupStep(1);
      setSetupPasscode('');
      setConfirmPasscode('');
      return;
    }

    if (user) {
      localStorage.setItem(`aero_vault_passcode_${user.uid}`, setupPasscode);
      setPasscode(setupPasscode);
      setHasPasscode(true);
      setIsUnlocked(true);
      setErrorText('');
    }
  };

  // Biometric Mock Scanning
  const handleStartBiometricScan = () => {
    if (!hasPasscode) {
      setErrorText('Please set up a backup passcode first.');
      return;
    }
    setIsBiometricScanning(true);
    setBiometricStatus('scanning');
    setBiometricProgress(0);
    setErrorText('');

    let progressVal = 0;
    scanIntervalRef.current = setInterval(() => {
      progressVal += 10;
      setBiometricProgress(progressVal);
      if (progressVal >= 100) {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        setBiometricStatus('success');
        setTimeout(() => {
          setIsUnlocked(true);
          setIsBiometricScanning(false);
          setBiometricStatus('idle');
          setBiometricProgress(0);
        }, 1000);
      }
    }, 120);
  };

  const handleStopBiometricScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    setIsBiometricScanning(false);
    setBiometricStatus('idle');
    setBiometricProgress(0);
  };

  // Upload encrypted Media file locally
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        let suffix = '';
        if (selectedFolder === 'blueprints') {
          suffix = ' Blueprint';
        } else if (selectedFolder === 'field_diagnostics') {
          suffix = ' Tactical';
        }

        let newTitle = file.name;
        if (newTitle.toLowerCase().endsWith('.enc')) {
          newTitle = newTitle.slice(0, -4) + suffix + '.enc';
        } else {
          newTitle = newTitle + suffix + '.enc';
        }

        const newMedia: EncryptedVaultMedia = {
          id: `media-${Date.now()}`,
          title: newTitle,
          type: file.type.startsWith('video') ? 'video' : 'image',
          dataUrl: reader.result,
          createdAt: Date.now()
        };

        const updatedList = [newMedia, ...mediaList];
        setMediaList(updatedList);
        if (user) {
          localStorage.setItem(`aero_vault_media_${user.uid}`, JSON.stringify(updatedList));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete media item
  const deleteMedia = (id: string) => {
    if (!window.confirm("Permanently purge this encrypted asset? This action is irreversible.")) return;
    const filtered = mediaList.filter(item => item.id !== id);
    setMediaList(filtered);
    setSelectedMediaIds(prev => prev.filter(selectedId => selectedId !== id));
    if (user) {
      localStorage.setItem(`aero_vault_media_${user.uid}`, JSON.stringify(filtered));
    }
  };

  // Toggle multi-select media
  const toggleSelectMedia = (id: string) => {
    setSelectedMediaIds(prev => 
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  // Delete all selected media items
  const deleteSelectedMedia = () => {
    if (selectedMediaIds.length === 0) return;
    if (!window.confirm(`Permanently purge the ${selectedMediaIds.length} selected encrypted assets? This action is irreversible.`)) return;
    const filtered = mediaList.filter(item => !selectedMediaIds.includes(item.id));
    setMediaList(filtered);
    setSelectedMediaIds([]);
    if (user) {
      localStorage.setItem(`aero_vault_media_${user.uid}`, JSON.stringify(filtered));
    }
  };

  // Save secure local chats with custom burning algorithm
  const handleSendSecureMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;

    const newUserMsg: VaultMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: chatInput,
      timestamp: Date.now(),
      burnDuration: burnTimer > 0 ? burnTimer : undefined,
      burnTimeLeft: burnTimer > 0 ? burnTimer : undefined,
    };

    const updated = [...vaultChats, newUserMsg];
    setVaultChats(updated);
    localStorage.setItem(`aero_vault_chats_${user.uid}`, JSON.stringify(updated));
    const userPrompt = chatInput;
    setChatInput('');

    // Trigger Peace AI response in isolation
    setIsAiTyping(true);
    try {
      // Fetch responses from Peace in local isolation
      const res = await secureFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: `Enclave isolation query: "${userPrompt}". Provide security-vetted response as Peace Enclave Bot. Tell the user in a highly technical, tactical agent manner how you processed their encrypted sandbox request. Give actual, practical answers directly. Do not exceed 3-4 sentences.`,
        }),
      });
      const data = await res.json();
      const botText = data.text || "Enclave local feedback online. Standard parameters checked. Vetting approved.";

      const aiMsg: VaultMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'assistant',
        text: botText,
        timestamp: Date.now(),
        burnDuration: burnTimer > 0 ? burnTimer : undefined,
        burnTimeLeft: burnTimer > 0 ? burnTimer : undefined,
      };

      setVaultChats(prev => {
        const next = [...prev, aiMsg];
        localStorage.setItem(`aero_vault_chats_${user.uid}`, JSON.stringify(next));
        return next;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Lock Vault
  const handleLockVault = () => {
    setIsUnlocked(false);
    setPasscodeInput('');
    setErrorText('');
  };

  return (
    <div className="flex-1 overflow-hidden h-full flex flex-col bg-white dark:bg-[#111B21] text-zinc-900 dark:text-[#E9EDEF] font-sans relative">
      {/* 1. PRIMARY VAULT CONTROL BAR */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-150 dark:border-[#202C33] bg-white dark:bg-[#202c33] flex justify-between items-center z-20">
        <div className="flex items-center gap-3.5">
          <button 
            onClick={() => navigate('/chats')}
            className="p-1 -ml-1 text-[#54656f] dark:text-[#aebac1] hover:text-wa-primary transition-colors cursor-pointer"
            title="Back to chats"
            style={{ border: 'none', background: 'none' }}
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-450 shrink-0">
              <Shield size={18} />
            </div>
            <div>
              <h1 className="text-[15px] font-medium tracking-wide text-zinc-900 dark:text-[#E9EDEF]">Enclave Vault</h1>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-[#00a884] tracking-wider block mt-0.5 leading-none">
                {isUnlocked ? 'SECURE VAULT SANDBOX' : 'LOCKED ENCRYPTED GALLERY'}
              </span>
            </div>
          </div>
        </div>

        {isUnlocked && (
          <button 
            onClick={handleLockVault}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-105 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700 rounded-full text-xs font-medium text-red-500 cursor-pointer transition-all uppercase tracking-wider"
            style={{ border: 'none' }}
          >
            <Lock size={12} />
            Lock Vault
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.div 
            key="lock-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden"
          >
            {/* Ambient Blurred Stories Backdrop mimicking Snap/WhatsApp natural background context */}
            <div className="absolute inset-0 filter blur-3xl opacity-20 dark:opacity-10 select-none pointer-events-none grid grid-cols-3 gap-4 p-8 z-0">
              <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl h-full w-full" />
              <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-3xl h-full w-full" />
              <div className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-3xl h-full w-full" />
            </div>

            {/* Setup passcode if no code exists */}
            {!hasPasscode ? (
              <div className="max-w-md w-full bg-white/70 dark:bg-zinc-900/60 border border-white/40 dark:border-zinc-805/40 backdrop-blur-3xl rounded-3xl p-8 shadow-2xl relative z-10">
                <div className="flex flex-col items-center text-center gap-2 mb-6">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 mb-2">
                    <Key size={28} />
                  </div>
                  <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">Passcode Setup</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Create a secure 4-digit backup PIN to encrypt and isolate your private field pictures, videos, and private chats.</p>
                </div>

                {setupStep === 1 ? (
                  <form onSubmit={startSetupPin} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 text-center">New 4-Digit PIN</label>
                      <input 
                        type="password" 
                        maxLength={4} 
                        placeholder="••••"
                        value={setupPasscode}
                        onChange={(e) => setSetupPasscode(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 rounded-2xl px-4 py-3 text-center text-xl tracking-[10px] text-zinc-800 dark:text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500/35"
                      />
                    </div>
                    {errorText && <div className="text-[10px] text-red-500 text-center uppercase tracking-widest">{errorText}</div>}
                    <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-555 rounded-2xl text-xs font-medium uppercase text-white cursor-pointer active:scale-98 transition-all tracking-wide">
                      Continue PIN Setup
                    </button>
                  </form>
                ) : (
                  <form onSubmit={completeSetupPin} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 text-center">Re-Enter PIN</label>
                      <input 
                        type="password" 
                        maxLength={4} 
                        placeholder="••••"
                        value={confirmPasscode}
                        onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-855 rounded-2xl px-4 py-3 text-center text-xl tracking-[10px] text-zinc-800 dark:text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500/35"
                      />
                    </div>
                    {errorText && <div className="text-[10px] text-red-500 text-center uppercase tracking-widest">{errorText}</div>}
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => { setSetupStep(1); setErrorText(''); }} 
                        className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-2xl text-xs font-semibold cursor-pointer dark:text-white"
                      >
                        Back
                      </button>
                      <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-555 rounded-2xl text-xs font-medium uppercase text-white cursor-pointer active:scale-98 transition-all tracking-wide">
                        Confirm PIN
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* GLASSMORPHIC PIN & BIOMETRIC DECK OVERLAY */
              <div className="w-full max-w-md bg-white/40 dark:bg-zinc-900/40 border border-white/50 dark:border-zinc-800/35 backdrop-blur-[35px] rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl z-10">
                <div className="mb-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-450 mx-auto mb-3">
                    <Lock size={20} />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight">Unlock Private Gallery</h3>
                  <p className="text-xs text-zinc-500 dark:text-[#8696A0] mt-1">Authenticate to decrypt custom file indexes</p>
                  
                  {/* Dots representing passcode feedback */}
                  <div className="mt-5 flex justify-center gap-3">
                    {[0, 1, 2, 3].map((index) => {
                      const hasDigit = passcodeInput.length > index;
                      return (
                        <motion.div
                          key={index}
                          animate={hasDigit ? { scale: [1, 1.25, 1], backgroundColor: '#10b981' } : { scale: 1 }}
                          className={cn(
                            "w-3 h-3 rounded-full border transition-all duration-150",
                            hasDigit ? "border-emerald-500 bg-emerald-500" : "border-zinc-350 dark:border-zinc-700 bg-zinc-200/50 dark:bg-zinc-955/50"
                          )}
                        />
                      );
                    })}
                  </div>
                </div>

                {errorText && (
                  <div className="text-[10px] font-semibold text-red-500 uppercase tracking-wider text-center h-4 mb-3 animate-pulse">
                    {errorText}
                  </div>
                )}

                {/* Cyber Grid Keypad: Round styled keys with thin border */}
                <div className="grid grid-cols-3 gap-x-5 gap-y-4 max-w-[260px] w-full font-mono mt-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleKeypadPress(num)}
                      className="w-14 h-14 rounded-full border border-zinc-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-250 hover:border-emerald-500/20 active:scale-90 flex items-center justify-center font-sans text-lg font-normal cursor-pointer transition-all shadow-sm"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={handleKeypadDelete}
                    className="w-14 h-14 rounded-full border border-transparent bg-transparent hover:bg-neutral-100 dark:hover:bg-zinc-850 text-zinc-550 hover:text-red-500 active:scale-90 flex items-center justify-center font-sans text-xs font-normal tracking-wide cursor-pointer transition-all"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleKeypadPress('0')}
                    className="w-14 h-14 rounded-full border border-zinc-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-250 active:scale-95 flex items-center justify-center font-sans text-lg font-normal cursor-pointer transition-all shadow-sm"
                  >
                    0
                  </button>
                  
                  {/* Subtle Fingerprint Scanning Button in lower keypad slot */}
                  <button
                    onMouseDown={handleStartBiometricScan}
                    onMouseUp={handleStopBiometricScan}
                    onMouseLeave={handleStopBiometricScan}
                    onTouchStart={handleStartBiometricScan}
                    onTouchEnd={handleStopBiometricScan}
                    className={cn(
                      "w-14 h-14 rounded-full border border-zinc-200 dark:border-zinc-850/60 bg-white/60 dark:bg-zinc-905 flex items-center justify-center transition-all cursor-pointer relative overflow-hidden active:scale-90 shadow-sm",
                      biometricStatus === 'scanning' ? 'border-emerald-500 bg-emerald-500/10 font-bold' : 
                      biometricStatus === 'success' ? 'border-green-400 bg-green-500/25' :
                      'hover:border-emerald-500 hover:text-emerald-500 text-zinc-650'
                    )}
                    title="Press and hold to biometric scan"
                  >
                    {/* Sweep scanner line */}
                    {biometricStatus === 'scanning' && (
                      <motion.div 
                        className="absolute inset-x-0 h-0.5 bg-emerald-400"
                        initial={{ top: '-10%' }}
                        animate={{ top: '110%' }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      />
                    )}
                    <Fingerprint size={20} className={cn(
                      biometricStatus === 'scanning' ? 'text-emerald-500 animate-pulse' :
                      biometricStatus === 'success' ? 'text-green-500' :
                      'text-zinc-650 dark:text-zinc-400'
                    )} />
                  </button>
                </div>

                <div className="mt-6 text-center flex flex-col gap-1 select-none">
                  <span className="text-[10px] font-sans font-medium tracking-widest text-[#8696A0] uppercase">
                    {biometricStatus === 'idle' && 'HOLD BIOMETRIC SCANNER TO UNLOCK'}
                    {biometricStatus === 'scanning' && `CONFIRMING BIOMETRICS... ${biometricProgress}%`}
                    {biometricStatus === 'success' && 'ACCESS UNLOCKED'}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* UNLOCKED ENCLAVE GALLERY & TEXT SECURE COMPONENT */
          <motion.div 
            key="unlocked-dashboard"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            {/* Minimal Sub tab navigation */}
            <div className="flex border-b border-zinc-150 dark:border-[#202C33] bg-white dark:bg-[#111B21] p-2 gap-2 shrink-0 z-10 justify-center">
              <button 
                onClick={() => setActiveSubTab('gallery')}
                className={cn(
                  "flex-1 max-w-[240px] flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-semibold tracking-wide transition-all cursor-pointer border",
                  activeSubTab === 'gallery' 
                    ? 'bg-neutral-100 dark:bg-zinc-800 border-zinc-250 dark:border-transparent text-zinc-900 dark:text-white font-medium' 
                    : 'bg-transparent text-[#54656f] border-transparent dark:text-[#8696A0] hover:bg-neutral-50 dark:hover:bg-zinc-800/40 font-normal'
                )}
              >
                <LayoutGrid size={13} />
                Gallery Storage
              </button>
              <button 
                onClick={() => setActiveSubTab('chat')}
                className={cn(
                  "flex-1 max-w-[240px] flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-semibold tracking-wide transition-all cursor-pointer border",
                  activeSubTab === 'chat' 
                    ? 'bg-neutral-100 dark:bg-zinc-800 border-zinc-250 dark:border-transparent text-zinc-900 dark:text-white font-medium' 
                    : 'bg-transparent text-[#54656f] border-transparent dark:text-[#8696A0] hover:bg-neutral-50 dark:hover:bg-zinc-800/40 font-normal'
                )}
              >
                <Terminal size={13} />
                Secure Terminal
              </button>
              <button 
                onClick={() => setActiveSubTab('documents')}
                className={cn(
                  "flex-1 max-w-[240px] flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-semibold tracking-wide transition-all cursor-pointer border",
                  activeSubTab === 'documents' 
                    ? 'bg-neutral-100 dark:bg-zinc-800 border-zinc-250 dark:border-transparent text-zinc-900 dark:text-white font-medium' 
                    : 'bg-transparent text-[#54656f] border-transparent dark:text-[#8696A0] hover:bg-neutral-50 dark:hover:bg-zinc-800/40 font-normal'
                )}
              >
                <FolderOpen size={13} />
                Document Vault
              </button>
            </div>

            {/* Sub viewport */}
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                {activeSubTab === 'gallery' ? (
                  <motion.div 
                    key="sub-gallery"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="h-full overflow-y-auto p-6 flex flex-col gap-6"
                  >
                    {/* Clean Simple Notice */}
                    <div className="p-4 bg-emerald-550/5 border border-emerald-500/10 rounded-2xl flex items-start gap-3">
                      <Shield size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Private Obfuscation Vault</h4>
                        <p className="text-[11px] text-[#667781] dark:text-[#8696A0] leading-relaxed mt-1">
                          Media buffers are isolated in clientside secure indexed arrays and completely hidden from general phone storage directories.
                        </p>
                      </div>
                    </div>

                    {selectedFolder === null ? (
                      /* DIRECTORY ALBUM GRID */
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center px-1">
                          <h4 className="text-[11px] font-semibold text-[#54656F] dark:text-[#8696A0] uppercase tracking-wider">Storage Folders</h4>
                          <span className="text-[10px] text-emerald-600 dark:text-[#00A884]">Local Decrypted View</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                          {folders.map((folder) => {
                            const folderItems = getItemsForFolder(folder.id);
                            return (
                              <motion.div
                                key={folder.id}
                                whileHover={{ scale: 1.01, y: -1 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setSelectedFolder(folder.id)}
                                className="relative h-60 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-900 cursor-pointer group shadow-sm hover:shadow-md transition-all"
                              >
                                {/* Folder cover image with natural darkening */}
                                <div className="absolute inset-0">
                                  <img 
                                    src={folder.cover} 
                                    alt={folder.label} 
                                    className="w-full h-full object-cover opacity-25 group-hover:opacity-35 saturate-[0.4] filter group-hover:scale-102 transition-all duration-500" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 via-zinc-50/70 dark:via-zinc-950/70 to-transparent" />
                                </div>

                                {/* Folder Card Details */}
                                <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                                  <div className="flex justify-between items-start">
                                    <span className="px-2 py-0.5 bg-[#f0f2f5] dark:bg-[#202C33] text-[9px] font-medium text-zinc-500 dark:text-zinc-400 lowercase tracking-tight rounded-full">
                                      {folder.tag}
                                    </span>
                                    <FolderOpen size={16} className="text-[#54656F] group-hover:text-emerald-500 transition-colors" />
                                  </div>

                                  <div>
                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wide">
                                      {folder.label}
                                    </h3>
                                    <p className="text-[11px] text-[#667781] dark:text-[#8696A0] leading-normal mt-1 mb-2">
                                      {folder.desc}
                                    </p>
                                    <div className="text-[10px] font-semibold text-emerald-600 dark:text-[#00A884]">
                                      {folderItems.length} {folderItems.length === 1 ? 'FILE RESOURCE' : 'FILES STORED'}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* ACTIVE DIRECTORY PREVIEW GATE */
                      <div className="flex flex-col gap-5">
                        {/* Folder Header Breadcrumb */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-neutral-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl">
                          <button
                            onClick={() => { setSelectedFolder(null); setSelectedMediaIds([]); }}
                            className="flex items-center gap-2 self-start px-3.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-full text-xs font-medium text-[#54656F] dark:text-[#8696A0] hover:text-zinc-800 dark:hover:text-white cursor-pointer transition-all"
                          >
                            <ChevronLeft size={13} />
                            Back to Folders
                          </button>
                          
                          <div className="text-xs font-semibold text-[#54656F] dark:text-[#8696A0]">
                            Active: <span className="text-emerald-600 dark:text-[#00A884] ml-1">{folders.find(f => f.id === selectedFolder)?.label}</span>
                          </div>
                        </div>

                        {/* Drag and Drop Upload within folder */}
                        <div className="relative border border-dashed border-zinc-300 dark:border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-6 text-center cursor-pointer transition-all bg-neutral-50/50 dark:bg-zinc-955/10 group">
                          <input 
                            type="file" 
                            accept="image/*,video/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={handleMediaUpload}
                          />
                          <div className="flex flex-col items-center gap-2">
                            <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 group-hover:text-emerald-550 transition-colors rounded-full">
                              <Camera size={16} />
                            </div>
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Encrypt Volatile Media</span>
                            <span className="text-[10px] text-zinc-400">Add custom asset directly into encrypted browser memory</span>
                          </div>
                        </div>

                        {/* BEAUTIFUL MULTI COLUMN MEDIA GRID (BORDER RADIUS: 12px) */}
                        <div className="flex flex-col gap-3">
                          <h4 className="text-xs font-semibold text-[#54656F] dark:text-[#8696A0] tracking-wide uppercase px-1">
                            Gallery Assets ({getItemsForFolder(selectedFolder).length})
                          </h4>

                          {getItemsForFolder(selectedFolder).length === 0 ? (
                            <div className="p-10 border border-zinc-200 dark:border-zinc-810 rounded-2xl bg-neutral-50/40 dark:bg-zinc-955/10 text-center flex flex-col items-center gap-2">
                              <FolderOpen size={20} className="text-zinc-300 dark:text-zinc-700" />
                              <span className="text-[11px] text-zinc-455">Zero documents in folder sandbox index</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                              {getItemsForFolder(selectedFolder).map((item) => {
                                const isSelected = selectedMediaIds.includes(item.id);
                                return (
                                  <motion.div 
                                    key={item.id}
                                    layout
                                    className={cn(
                                      "bg-white dark:bg-zinc-900/60 border border-zinc-150 dark:border-zinc-800 rounded-[12px] p-2 relative group overflow-hidden transition-all duration-300",
                                      isSelected && "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-500/5"
                                    )}
                                  >
                                    <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-955 rounded-[10px] overflow-hidden border border-zinc-200/40 dark:border-zinc-900 flex items-center justify-center">
                                      {item.type === 'video' ? (
                                        <video src={item.dataUrl} className="w-full h-full object-cover filter blur-[2px] group-hover:blur-0 transition-all duration-300" muted playsInline />
                                      ) : (
                                        <img src={item.dataUrl} className="w-full h-full object-cover filter blur-[1px] group-hover:blur-0 transition-all duration-300" alt="encrypted file asset" referrerPolicy="no-referrer" />
                                      )}
                                      
                                      {/* Integrated Media Type Badge (Lucide Icons overlayed) */}
                                      <div className="absolute top-2 right-2 bg-black/45 backdrop-blur-md rounded-full px-1.5 py-0.5 text-white flex items-center justify-center z-10 text-[9px] gap-1 shrink-0">
                                        {item.type === 'video' ? (
                                          <>
                                            <Video size={10} />
                                            <span>0:05</span>
                                          </>
                                        ) : (
                                          <>
                                            <ImageIcon size={10} />
                                            <span>img</span>
                                          </>
                                        )}
                                      </div>

                                      {/* Snapchat style selection circle in top left */}
                                      <div 
                                        onClick={(e) => { e.stopPropagation(); toggleSelectMedia(item.id); }}
                                        className={cn(
                                          "absolute top-2 left-2 w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer transition-all z-20",
                                          isSelected 
                                            ? "bg-[#00a884] border-[#00a884] text-white" 
                                            : "border-white/60 bg-black/35 hover:border-[#00a884] hover:bg-[#00a884]/20"
                                        )}
                                      >
                                        {isSelected && <Check size={11} strokeWidth={4} />}
                                      </div>

                                      {/* Clickable Hover Decrypt release lightbox */}
                                      <div 
                                        onClick={() => setLightboxImg(item.dataUrl)}
                                        className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 cursor-pointer transition-opacity duration-200 z-10"
                                      >
                                        <Unlock size={14} className="text-white animate-bounce" />
                                        <span className="text-[9px] font-medium tracking-wide text-white bg-black/60 px-2 py-0.5 rounded-full">Decrypt Preview</span>
                                      </div>
                                    </div>

                                    {/* Name and release action */}
                                    <div className="mt-2.5 flex items-center justify-between gap-1.5 px-0.5">
                                      <span className="text-[11px] text-zinc-700 dark:text-[#E9EDEF] truncate flex-1 font-sans font-medium" title={item.title}>
                                        {item.title}
                                      </span>
                                      <button 
                                        onClick={() => deleteMedia(item.id)}
                                        className="p-1.5 bg-neutral-100 hover:bg-neutral-200/80 dark:bg-zinc-955 dark:hover:bg-red-955/20 text-[#54656F] dark:text-zinc-550 hover:text-red-500 dark:hover:text-red-400 rounded-lg cursor-pointer transition-colors"
                                        title="Release permanently"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* MINIMAL FLOATING MULTI-SELECT ACTION BAR AT THE FOOTER IN GALLERY */}
                    <AnimatePresence>
                      {selectedMediaIds.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 30, x: "-50%" }}
                          animate={{ opacity: 1, y: 0, x: "-50%" }}
                          exit={{ opacity: 0, y: 30, x: "-50%" }}
                          className="fixed bottom-20 left-1/2 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/90 dark:border-zinc-800 backdrop-blur-xl rounded-full px-5 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.15)] flex items-center justify-between gap-6 z-40 max-w-sm w-[90%]"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-zinc-900 dark:text-white font-sans">{selectedMediaIds.length} Selected</span>
                            <span className="text-[9px] text-[#667781] dark:text-[#8696A0]">Volatile Storage Cache</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => setSelectedMediaIds([])} 
                              className="text-xs text-[#54656F] dark:text-[#8696A0] hover:text-zinc-900 dark:hover:text-white font-medium px-2 py-1 transition-colors"
                            >
                              Clear
                            </button>
                            <button 
                              onClick={deleteSelectedMedia}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-500 hover:bg-red-650 text-white rounded-full text-xs font-semibold cursor-pointer active:scale-95 transition-all shadow-sm"
                            >
                              <Trash2 size={12} />
                              Delete Selected
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  /* SECURE CHAT INTERFACE SECTION */
                  <motion.div 
                    key="sub-chat"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="h-full flex flex-col min-h-0 relative bg-neutral-50 dark:bg-[#0b141a]"
                  >
                    {/* Disappearing timer header selectors */}
                    <div className="p-3 bg-white dark:bg-[#111B21] border-b border-zinc-150 dark:border-[#202C33] flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2.5">
                        <Flame size={14} className="text-red-500" />
                        <span className="text-xs font-semibold text-zinc-700 dark:text-[#8696A0]">Auto Burn:</span>
                        <div className="flex gap-1">
                          {[
                            { label: 'Off', value: 0 },
                            { label: '5s', value: 5 },
                            { label: '10s', value: 10 },
                            { label: '30s', value: 30 }
                          ].map(t => (
                            <button
                              key={t.value}
                              onClick={() => setBurnTimer(t.value)}
                              className={cn(
                                "px-2 py-0.5 text-[10px] font-medium rounded-full cursor-pointer transition-all",
                                burnTimer === t.value 
                                  ? 'bg-red-500 text-white font-semibold' 
                                  : 'bg-neutral-100 dark:bg-[#202C33] text-[#54656F] dark:text-[#8696A0] hover:bg-neutral-200 hover:text-zinc-900'
                              )}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <span className="text-[10px] text-emerald-600 dark:text-[#00A884] font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                        Volatile Stream
                      </span>
                    </div>

                    {/* Chat log viewport */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
                      {vaultChats.map((msg) => {
                        const isAssistant = msg.sender === 'assistant';
                        return (
                          <div 
                            key={msg.id}
                            className={cn(
                              "flex flex-col max-w-[80%] rounded-2xl p-3 relative",
                              isAssistant 
                                ? "bg-white dark:bg-[#202C33] border border-zinc-150 dark:border-[#202C33] self-start text-[#111b21] dark:text-[#E9EDEF]" 
                                : "bg-emerald-100 dark:bg-[#005c4b]/30 border border-emerald-200 dark:border-[#005c4b]/15 self-end text-[#111b21] dark:text-[#E9EDEF]"
                            )}
                          >
                            <span className="text-[9px] font-mono text-[#667781] dark:text-[#8696A0] uppercase mb-0.5">
                              {isAssistant ? 'Enclave Node Support' : 'Isolator Sandbox'}
                            </span>
                            <p className="text-xs leading-relaxed font-sans">{msg.text}</p>
                            
                            {/* Flame countdown indicator */}
                            {msg.burnDuration && msg.burnTimeLeft !== undefined && (
                              <div className="mt-2 flex items-center justify-end gap-1 text-red-500">
                                <Flame size={12} className="animate-pulse" />
                                <span className="text-[9px] font-bold tracking-wider uppercase">
                                  BURNING IN {msg.burnTimeLeft}s
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {isAiTyping && (
                        <div className="bg-white dark:bg-[#202C33] border border-zinc-150 dark:border-[#202C33] rounded-2xl p-3 self-start max-w-[80%] flex items-center gap-2">
                          <span className="text-[10px] text-emerald-600 dark:text-[#00A884] animate-pulse tracking-wide font-medium">DECRYPTING INCOMING VECTOR...</span>
                          <RefreshCcw size={10} className="animate-spin text-emerald-500" />
                        </div>
                      )}

                      <div ref={chatEndRef} />
                    </div>

                    {/* Dynamic bottom secure composer */}
                    <form onSubmit={handleSendSecureMessage} className="p-3 bg-white dark:bg-[#111B21] border-t border-zinc-150 dark:border-[#202C33] shrink-0 flex gap-2">
                      <input 
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={burnTimer > 0 ? `Private self-destruct prompt (${burnTimer}s)...` : "Isolated prompt..."}
                        className="flex-1 bg-neutral-100 dark:bg-[#2a3942] border border-transparent focus:border-zinc-300 dark:focus:border-transparent rounded-full px-4 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-emerald-500/10"
                      />
                      <button 
                        type="submit" 
                        disabled={!chatInput.trim() || isAiTyping}
                        className="p-3 bg-emerald-600 hover:bg-emerald-555 active:scale-95 text-white rounded-full transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center shrink-0"
                      >
                        <Send size={12} />
                      </button>
                    </form>
                  </motion.div>
                )}
                {activeSubTab === 'documents' && (
                  <motion.div
                    key="sub-documents"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="h-full overflow-y-auto"
                  >
                    <DocumentManager />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Futuristic Enclave Lightbox view */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl max-w-lg w-full flex flex-col items-center relative"
            >
              <button
                onClick={() => setLightboxImg(null)}
                className="absolute top-4 right-4 p-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-752 border border-zinc-200 dark:border-zinc-705 rounded-full text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
              </button>

              <div className="flex items-center gap-2 mb-4 select-none">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-[#00A884]">Decrypted Secure Asset Frame</span>
              </div>

              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-150 dark:border-zinc-950 bg-black/5 dark:bg-zinc-955 flex items-center justify-center select-none">
                <img
                  src={lightboxImg}
                  alt="de-obfuscated content"
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="mt-4 flex flex-col items-center text-center gap-1 select-none">
                <span className="text-[8px] font-mono text-[#8696A0] uppercase font-semibold">SANDBOX RENDERING CACHE STREAM</span>
                <p className="text-[10px] text-zinc-450 max-w-[280px]">Released immediately from clientside cache memory upon released modal action.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
