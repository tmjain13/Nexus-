import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Bell, 
  ShieldCheck, 
  Settings, 
  QrCode, 
  Star, 
  Compass, 
  Video, 
  Terminal, 
  Sparkles, 
  Layers, 
  LogOut, 
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface NexusHeaderProps {
  onSearchClick: () => void;
  onNotificationsClick?: () => void;
  onAvatarClick: () => void;
  onAvatarLongPressStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onAvatarLongPressEnd: (e: React.MouseEvent | React.TouchEvent) => void;
  hasUnreadNotifications?: boolean;
  isPeaceModeActive?: boolean;
  onQRClick?: () => void;
  onStarredClick?: () => void;
  onMapClick?: () => void;
  onReelsClick?: () => void;
  onWorkspaceClick?: () => void;
  onAdvanceChatClick?: () => void;
  onThemeToggle?: () => void;
  onLogoutClick?: () => void;
  onPermissionClick?: () => void;
}

export const NexusHeader: React.FC<NexusHeaderProps> = ({
  onSearchClick,
  onNotificationsClick,
  onAvatarClick,
  onAvatarLongPressStart,
  onAvatarLongPressEnd,
  hasUnreadNotifications = false,
  isPeaceModeActive = false,
  onQRClick,
  onStarredClick,
  onMapClick,
  onReelsClick,
  onWorkspaceClick,
  onAdvanceChatClick,
  onThemeToggle,
  onLogoutClick,
  onPermissionClick,
}) => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateGreeting = () => {
      const hours = new Date().getHours();
      if (hours < 12) setGreeting('Peaceful Morning');
      else if (hours < 18) setGreeting('Calm Afternoon');
      else setGreeting('Quiet Evening');
    };
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header 
      id="nexus_main_header" 
      className="sticky top-0 z-40 h-16 w-full flex items-center justify-between px-4 bg-bg-secondary/80 backdrop-blur-md select-none border-b border-border-subtle"
    >
      {/* Left: Nexus Logo and Wordmark */}
      <div className="flex items-center gap-2.5">
        <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-accent to-orange-500 flex items-center justify-center shadow-lg shadow-accent/10">
          <span className="font-black text-bg-primary text-base italic tracking-tighter">N</span>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-bg-primary animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-wide text-text-primary uppercase font-display">
            NEXUS
          </span>
          <span className="text-[10px] text-text-muted uppercase tracking-widest font-mono font-bold leading-none">
            MESSENGER
          </span>
        </div>
      </div>

      {/* Center: Dynamic Greeting */}
      <div className="hidden sm:flex flex-col items-center">
        <span className="text-xs font-semibold text-text-secondary font-sans">
          {greeting}
        </span>
        <span className="text-[9px] text-text-muted uppercase font-bold tracking-widest flex items-center gap-1 mt-0.5 font-mono">
          <ShieldCheck size={10} className="text-accent animate-pulse" />
          Quantum Sector Active
        </span>
      </div>

      {/* Right: Actions and Profile */}
      <div className="flex items-center gap-2">
        {/* Enclave Reels Link */}
        {onReelsClick && (
          <button 
            onClick={onReelsClick}
            className="p-1.5 text-text-secondary hover:text-text-primary transition-all rounded-xl cursor-pointer hidden md:flex"
            title="Enclave Reels"
          >
            <Video size={24} strokeWidth={1.5} />
          </button>
        )}

        {/* Enclave Map Link */}
        {onMapClick && (
          <button 
            onClick={onMapClick}
            className="p-1.5 text-text-secondary hover:text-text-primary transition-all rounded-xl cursor-pointer hidden md:flex"
            title="Enclave Map"
          >
            <Compass size={24} strokeWidth={1.5} />
          </button>
        )}

        {/* QR Sensor Scan */}
        {onQRClick && (
          <button 
            onClick={onQRClick}
            className="p-1.5 text-text-secondary hover:text-text-primary transition-all rounded-xl cursor-pointer"
            title="Scan Peer Matrix Key"
          >
            <QrCode size={24} strokeWidth={1.5} />
          </button>
        )}

        {/* Search Trigger */}
        <button 
          onClick={onSearchClick}
          className="p-1.5 text-text-secondary hover:text-text-primary transition-all rounded-xl cursor-pointer"
          title="Search"
        >
          <Search size={24} strokeWidth={1.5} />
        </button>

        {/* Menu Dropdown Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className={`p-1.5 text-text-secondary hover:text-accent transition-all rounded-xl cursor-pointer flex items-center gap-0.5 ${showDropdown ? 'text-accent' : ''}`}
            title="Quantum Controls"
          >
            <Settings size={24} strokeWidth={1.5} />
            <ChevronDown size={10} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2.5 w-56 bg-slate-950/95 border border-slate-800/80 rounded-2xl shadow-2xl p-2 backdrop-blur-xl z-50 select-none"
              >
                {/* Mobile-only shortcuts */}
                {onReelsClick && (
                  <button 
                    onClick={() => { onReelsClick(); setShowDropdown(false); }}
                    className="md:hidden w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-900/80 text-zinc-400 hover:text-white rounded-xl transition-colors text-left"
                  >
                    <Video size={14} className="text-amber-500" />
                    <span>Enclave Reels</span>
                  </button>
                )}
                {onMapClick && (
                  <button 
                    onClick={() => { onMapClick(); setShowDropdown(false); }}
                    className="md:hidden w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-900/80 text-zinc-400 hover:text-white rounded-xl transition-colors text-left"
                  >
                    <Compass size={14} className="text-amber-500" />
                    <span>Enclave Map</span>
                  </button>
                )}

                {onStarredClick && (
                  <button 
                    onClick={() => { onStarredClick(); setShowDropdown(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-900/80 text-zinc-400 hover:text-white rounded-xl transition-colors text-left"
                  >
                    <Star size={14} />
                    <span>Starred Messages</span>
                  </button>
                )}

                {onPermissionClick && (
                  <button 
                    onClick={() => { onPermissionClick(); setShowDropdown(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-900/80 text-zinc-400 hover:text-white rounded-xl transition-colors text-left"
                  >
                    <ShieldAlert size={14} />
                    <span>Sensory Clearances</span>
                  </button>
                )}

                {onWorkspaceClick && (
                  <button 
                    onClick={() => { onWorkspaceClick(); setShowDropdown(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-900/80 text-zinc-400 hover:text-white rounded-xl transition-colors text-left"
                  >
                    <Terminal size={14} />
                    <span>Workspace Code</span>
                  </button>
                )}

                {onAdvanceChatClick && (
                  <button 
                    onClick={() => { onAdvanceChatClick(); setShowDropdown(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-900/80 text-[#00a884] dark:text-emerald-400 font-bold rounded-xl transition-colors text-left"
                  >
                    <Sparkles size={14} className="animate-pulse" />
                    <span>Advance Chat Engine</span>
                  </button>
                )}

                {onThemeToggle && (
                  <button 
                    onClick={() => { onThemeToggle(); setShowDropdown(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-900/80 text-zinc-400 hover:text-white rounded-xl transition-colors text-left border-t border-slate-900/50 my-1 pt-2.5"
                  >
                    <Layers size={14} />
                    <span>Toggle Theme</span>
                  </button>
                )}

                {onLogoutClick && (
                  <button 
                    onClick={() => { onLogoutClick(); setShowDropdown(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-red-950/20 text-red-400 hover:text-red-350 rounded-xl transition-colors text-left border-t border-slate-900/50 mt-1 pt-2.5"
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Trigger with long press support */}
        <div className="relative">
          <motion.button
            onClick={onAvatarClick}
            onMouseDown={onAvatarLongPressStart}
            onMouseUp={onAvatarLongPressEnd}
            onTouchStart={onAvatarLongPressStart}
            onTouchEnd={onAvatarLongPressEnd}
            className={`relative w-9 h-9 rounded-full overflow-hidden cursor-pointer transition-all border ${
              isPeaceModeActive ? 'border-accent ring-2 ring-accent/20' : 'border-border-subtle hover:border-accent/40'
            }`}
            whileTap={{ scale: 0.94 }}
            title="Profile (Long press for Peace Mode)"
          >
            <img 
              src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'nexus'}`} 
              alt="Avatar" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.button>
          
          {/* Small Zen indicator if in Peace Mode */}
          {isPeaceModeActive && (
            <span className="absolute -bottom-1 -right-1 text-xs bg-slate-900 p-0.5 rounded-full border border-amber-500 shadow-sm leading-none">
              🧘
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default NexusHeader;
