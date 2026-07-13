import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Mail, Phone, Compass, Shield, User, 
  Menu, ChevronLeft, ChevronRight, Keyboard, Sparkles 
} from 'lucide-react';
import Tooltip from './Tooltip';

interface SideNavProps {
  collapsed: boolean;
  onToggle: () => void;
  onOpenShortcuts: () => void;
}

export function SideNav({ collapsed, onToggle, onOpenShortcuts }: SideNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { id: 'chats', label: 'Chats', path: '/chats', shortcut: '⌘1', icon: MessageSquare },
    { id: 'ai', label: 'Nexus AI', path: '/ai', shortcut: '⌘7', icon: Sparkles },
    { id: 'inbox', label: 'Inbox', path: '/inbox', shortcut: '⌘2', icon: Mail },
    { id: 'calls', label: 'Calls', path: '/calls', shortcut: '⌘3', icon: Phone },
    { id: 'reels', label: 'Reels', path: '/reels', shortcut: '⌘4', icon: Compass },
    { id: 'vault', label: 'Vault', path: '/vault', shortcut: '⌘5', icon: Shield },
    { id: 'profile', label: 'Profile', path: '/profile', shortcut: '⌘6', icon: User },
  ];

  return (
    <motion.div
      animate={{ width: collapsed ? 80 : 200 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="hidden md:flex flex-col h-full bg-zinc-950 border-r border-zinc-900 shrink-0 relative select-none"
      id="nexus-desktop-sidenav"
    >
      {/* Top Header Section with Vector Logo */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-900 h-16 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <svg viewBox="0 0 24 24" width="20" height="20" className="stroke-current fill-none">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.01 9.01 0 0 1-4.25-1.07l-4.14 1.07 1.03-4.04A9 9 0 1 1 12 21z" />
            </svg>
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs font-mono font-black tracking-widest text-zinc-100 uppercase"
            >
              NEXUS
            </motion.span>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={onToggle}
            className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 flex items-center justify-center text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer"
          >
            <ChevronLeft size={12} />
          </button>
        )}
      </div>

      {/* Main Navigation Row items */}
      <div className="flex-1 py-4 px-2 flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = currentPath.startsWith(item.path);
          const Icon = item.icon;

          const buttonContent = (
            <button
              id={`sidenav-item-${item.id}`}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all relative group cursor-pointer ${
                isActive
                  ? 'bg-amber-500/10 border-l-[3px] border-amber-500 text-amber-500 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-amber-500' : 'text-zinc-500 group-hover:text-zinc-300 transition-colors'} />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}

              {/* Collapsed label helper pill overlay */}
              {collapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-zinc-900 text-[10px] text-zinc-300 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-mono tracking-wider uppercase z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </button>
          );

          return collapsed ? (
            <Tooltip key={item.id} content={item.label} shortcut={item.shortcut} position="right">
              {buttonContent}
            </Tooltip>
          ) : (
            <React.Fragment key={item.id}>{buttonContent}</React.Fragment>
          );
        })}
      </div>

      {/* Footer Utility Row (Shortcuts button + expand toggle) */}
      <div className="p-3 border-t border-zinc-900 flex flex-col gap-2 shrink-0">
        {/* Help shortcuts widget */}
        <button
          onClick={onOpenShortcuts}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-900/60 text-zinc-400 hover:text-amber-500 text-xs font-medium cursor-pointer transition-all ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Keyboard Shortcuts (⌘/)"
        >
          <Keyboard size={16} />
          {!collapsed && <span className="font-sans font-semibold">Shortcuts help</span>}
        </button>

        {collapsed && (
          <button
            onClick={onToggle}
            className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 flex items-center justify-center text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer mx-auto"
            title="Expand Navigation"
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default SideNav;
