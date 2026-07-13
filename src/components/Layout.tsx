import React, { useState, useEffect, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { Shield, Lock } from 'lucide-react';
import ChatList from '../pages/ChatList';
import BottomNav from './BottomNav';
import ResponsiveLayout from './ResponsiveLayout';

// WhatsApp Welcome Screen
function WelcomeScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg-primary transition-colors duration-300 relative select-none">
      <div className="max-w-[460px] flex flex-col items-center select-none">
        {/* Nexus Vector Logo */}
        <div className="mb-8 p-6 bg-bg-card/40 rounded-full shadow-lg border border-border-subtle">
          <svg viewBox="0 0 24 24" width="80" height="80" className="text-accent stroke-current fill-none">
            <path strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.01 9.01 0 0 1-4.25-1.07l-4.14 1.07 1.03-4.04A9 9 0 1 1 12 21z" />
            <path strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" d="M15.4 12.6c-.2-.1-.5-.2-.6-.3-.1-.1-.2-.1-.3-.1s-.2 0-.3.1c-.1.2-.4.5-.5.6-.1.1-.2.1-.4 0s-.8-.3-1.5-1c-.5-.5-.9-1.1-1-1.2-.2-.2 0-.3.1-.4.1-.1.2-.2.3-.3 0-.1.1-.2.1-.3s0-.3-.1-.4c-.1-.1-.3-.7-.4-.9-.1-.2-.2-.2-.3-.2s-.2 0-.3.1c-.2.1-.4.3-.5.6s-.1.7.1 1c.2.3.6.9 1.4 1.3.4.2.8.4 1 .5.3.1.6.1.8.1.3 0 .6-.2.8-.4.2-.2.2-.5.2-.6 0-.2-.1-.3-.2-.4z" />
          </svg>
        </div>

        <h2 className="text-xl md:text-2xl font-display font-bold text-text-primary tracking-tight mb-3">
          Nexus Messenger for Web
        </h2>
        <p className="text-xs md:text-sm text-text-secondary leading-relaxed mb-6 font-normal">
          Send and receive end-to-end encrypted messages with our secure real-time network layer. 
          Keep your messaging connected across multiple clients in absolute peace.
        </p>
      </div>

      {/* E2EE Bottom Caption */}
      <div className="absolute bottom-20 left-0 right-0 flex items-center justify-center gap-1.5 text-text-muted text-xs font-mono font-medium tracking-widest uppercase">
        <Lock size={12} className="text-accent animate-pulse" />
        <span>End-to-End Encrypted</span>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  // Determine if viewing a specific chat room or channel stream
  const isChatView = (location.pathname.startsWith('/chats/') && location.pathname !== '/chats') ||
                     (location.pathname.startsWith('/channels/') && location.pathname !== '/channels') ||
                     location.pathname === '/discover-channels' ||
                     location.pathname === '/ai';

  const isFullPageWithoutNav = location.pathname.startsWith('/active-call') || location.pathname.startsWith('/login');

  // Left panel component rendering
  const renderLeftPanel = () => {
    if (location.pathname === '/chats' || location.pathname === '/') {
      return children;
    } else if (isChatView) {
      return (
        <Suspense fallback={
          <div className="h-full flex items-center justify-center bg-bg-primary">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        }>
          <ChatList />
        </Suspense>
      );
    } else {
      // For views like Contacts, Calls, Profile inside side-by-side
      return children;
    }
  };

  // Right panel component rendering
  const renderRightPanel = () => {
    if (isChatView) {
      return children;
    } else {
      return <WelcomeScreen />;
    }
  };

  return (
    <ResponsiveLayout
      leftPanel={renderLeftPanel()}
      rightPanel={renderRightPanel()}
      isChatView={isChatView}
      isFullPageWithoutNav={isFullPageWithoutNav}
    />
  );
}

