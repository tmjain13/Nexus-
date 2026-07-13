import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Command, Cpu, MessageSquare, Phone, Users, ShieldAlert, User, Moon, Sun, LogOut, ArrowRight, Layers, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../lib/firebase';
import { collection, query, getDocs, limit } from 'firebase/firestore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleNexusFeed?: () => void;
}

export default function CommandPalette({ isOpen, onClose, onToggleNexusFeed }: CommandPaletteProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [chatResults, setChatResults] = useState<any[]>([]);
  const [searchingChats, setSearchingChats] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Default modular navigation links
  const defaultCommands = [
    { id: 'nav-nexus', title: 'Open Workspace Nexus (Chats)', category: 'Navigation', icon: MessageSquare, action: () => navigate('/chats') },
    { id: 'nav-portal', title: 'Initialize Portal Transmissions (Calls)', category: 'Navigation', icon: Phone, action: () => navigate('/calls') },
    { id: 'nav-syndicate', title: 'Access Syndicate Spaces (Contacts)', category: 'Navigation', icon: Users, action: () => navigate('/contacts') },
    { id: 'nav-enclave', title: 'Verify Security Vault (Enclave)', category: 'Navigation', icon: ShieldAlert, action: () => navigate('/vault') },
    { id: 'nav-profile', title: 'Display Personnel Profile (User Settings)', category: 'Navigation', icon: User, action: () => navigate('/profile') },
    { id: 'action-theme', title: `Switch UX Theme (Current: ${theme === 'dark' ? 'Dark Mode' : 'Light Mode'})`, category: 'System Action', icon: theme === 'dark' ? Sun : Moon, action: () => { toggleTheme(); onClose(); } },
    { 
      id: 'action-nexus-feed', 
      title: 'Open Enclave Nexus Feed (Activity AI Summarizer)', 
      category: 'System Action', 
      icon: Layers, 
      action: () => { 
        if (onToggleNexusFeed) {
          onToggleNexusFeed();
        } else {
          // If no specific toggle is available, navigate to chats
          navigate('/chats');
        }
        onClose();
      } 
    },
    { id: 'action-logout', title: 'Secure Session Logout', category: 'Danger Zone', icon: LogOut, action: () => { logout(); onClose(); } }
  ];

  // Dynamic Chat query resolution
  useEffect(() => {
    if (!isOpen || !search.trim()) {
      setChatResults([]);
      return;
    }

    const delayQuery = setTimeout(async () => {
      setSearchingChats(true);
      try {
        const chatsRef = collection(db, 'chats');
        const snap = await getDocs(query(chatsRef, limit(30)));
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter locally by name
        const filtered = list.filter((c: any) => 
          c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.peerName?.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase())
        );
        setChatResults(filtered);
      } catch (err) {
        console.warn("Failed to query chats for palette:", err);
      } finally {
        setSearchingChats(false);
      }
    }, 150);

    return () => clearTimeout(delayQuery);
  }, [search, isOpen]);

  // Focus and Hotkey setup
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const combinedLength = filteredStaticCommands.length + chatResults.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % combinedLength);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + combinedLength) % combinedLength);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeSelected();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const executeSelected = () => {
    const filteredStatic = filteredStaticCommands;
    if (selectedIndex < filteredStatic.length) {
      filteredStatic[selectedIndex].action();
      onClose();
    } else {
      const chatIndex = selectedIndex - filteredStatic.length;
      const targetChat = chatResults[chatIndex];
      if (targetChat) {
        navigate(`/chats/${targetChat.id}`);
        onClose();
      }
    }
  };

  const filteredStaticCommands = defaultCommands.filter(cmd => 
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
        {/* Backdrop glass cover */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Floating palette modal frame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -10 }}
          className="w-full max-w-xl bg-[#090d10] border border-zinc-850 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Header search block */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-900 bg-[#06080b]/90 ring-1 ring-white/5">
            <Command size={18} className="text-zinc-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Type an action command or search chat rooms..."
              className="w-full bg-transparent text-zinc-150 placeholder:text-zinc-650 text-xs outline-none"
            />
            <div className="hidden sm:flex items-center gap-1 shrink-0 px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
              ESC TO CLOSE
            </div>
          </div>

          <div className="max-h-[350px] overflow-y-auto p-2 space-y-1 bg-[#040608]/95 custom-scroll">
            
            {/* System actions section */}
            {filteredStaticCommands.length > 0 && (
              <div className="space-y-0.5">
                <div className="px-3 py-1.5 text-[8.5px] font-mono font-black text-zinc-550 uppercase tracking-[0.2em]">Enclave Core Commands</div>
                
                {filteredStaticCommands.map((cmd, idx) => {
                  const Icon = cmd.icon;
                  const isCurrent = idx === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => { cmd.action(); onClose(); }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all border text-left ${
                        isCurrent 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon size={14} className={isCurrent ? 'text-emerald-400' : 'text-zinc-500'} />
                        <span className="text-xs font-medium truncate">{cmd.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[7.5px] font-mono uppercase font-bold text-zinc-500 border border-zinc-850 px-1 py-0.5 rounded">
                          {cmd.category}
                        </span>
                        {isCurrent && <ArrowRight size={11} className="text-emerald-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Chats dynamic searches ledger */}
            {chatResults.length > 0 && (
              <div className="space-y-0.5 mt-3">
                <div className="px-3 py-1.5 text-[8.5px] font-mono font-black text-zinc-550 uppercase tracking-[0.2em] flex justify-between">
                  <span>Contact Nodes Resolved</span>
                  {searchingChats && <span className="animate-pulse">Loading...</span>}
                </div>
                
                {chatResults.map((chat, idx) => {
                  const globalIdx = filteredStaticCommands.length + idx;
                  const isCurrent = globalIdx === selectedIndex;
                  return (
                    <button
                      key={chat.id}
                      onClick={() => { navigate(`/chats/${chat.id}`); onClose(); }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all border text-left ${
                        isCurrent 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <MessageSquare size={14} className={isCurrent ? 'text-emerald-400' : 'text-zinc-500'} />
                        <div className="min-w-0 flex flex-col">
                          <span className="text-xs font-medium truncate">{chat.name || chat.peerName || 'Direct Node'}</span>
                          {chat.description && <span className="text-[9px] font-mono text-zinc-500 truncate mt-0.5">{chat.description}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[7.5px] font-mono uppercase font-bold text-cyan-550 border border-cyan-950/20 px-1 py-0.5 rounded">
                          Chat Room
                        </span>
                        {isCurrent && <ArrowRight size={11} className="text-emerald-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* No match overlay */}
            {filteredStaticCommands.length === 0 && chatResults.length === 0 && (
              <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                <HelpCircle size={18} className="text-zinc-650" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">No active commands found in core directory</span>
              </div>
            )}
            
          </div>

          {/* Footer instruction block */}
          <div className="px-4 py-2 bg-[#050709] border-t border-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black">
              <span className="flex items-center gap-1">↑↓ select</span>
              <span className="flex items-center gap-1">⏎ ENTER execute</span>
            </div>
            
            <div className="flex items-center gap-1 font-mono text-[8px] text-zinc-600">
              BUILD v4.0.52 (STABLE)
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
