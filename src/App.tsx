/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeProvider } from './context/ThemeContext';
import { useEffect, useState } from 'react';
import { db } from './lib/firebase';
import { doc, updateDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import Layout from './components/Layout';
import Login from './pages/Login';
import { lazy, Suspense } from 'react';

const ChatList = lazy(() => import('./pages/ChatList'));
const Inbox = lazy(() => import('./pages/Inbox'));
const ChatRoom = lazy(() => import('./pages/ChatRoom'));
const Profile = lazy(() => import('./pages/Profile'));
const Contacts = lazy(() => import('./pages/Contacts'));
const Calls = lazy(() => import('./pages/Calls'));
const Vault = lazy(() => import('./pages/Vault'));
const Workspace = lazy(() => import('./pages/Workspace'));
const BroadcastLists = lazy(() => import('./pages/BroadcastLists'));
const ScheduledMessages = lazy(() => import('./pages/ScheduledMessages'));
const EnclaveMap = lazy(() => import('./components/EnclaveMap'));
const ReelsPage = lazy(() => import('./pages/Reels'));
const AdvanceChatEngine = lazy(() => import('./components/AdvanceChatEngine').then(module => ({ default: module.AdvanceChatEngine })));
const ActiveCall = lazy(() => import('./pages/ActiveCall'));
const ChannelDiscover = lazy(() => import('./components/ChannelDiscover'));
const ChannelChatRoom = lazy(() => import('./components/ChannelChatRoom'));
const NexusAIChat = lazy(() => import('./components/NexusAIChat'));

import { useBackgroundMessageScheduler } from './hooks/useScheduledMessages';
import IncomingCallModal from './components/IncomingCallModal';
import { useCallSignaling } from './hooks/useCallSignaling';
import NotificationToast from './components/NotificationToast';
import { UniversalSearchOverlay } from './components/UniversalSearchOverlay';

function InviteRedirectHandler() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      localStorage.setItem('enclave_referred_by_user', userId);
      if (referralCode) {
        localStorage.setItem('enclave_referral_code', referralCode);
      }

      // Increment click counter on the referrer's user document
      const referrerRef = doc(db, 'users', userId);
      updateDoc(referrerRef, {
        'inviteLink.clicks': increment(1)
      }).catch(err => {
        console.warn('Failed to increment invite clicks:', err);
      });
    }

    // Redirect to home/login
    navigate('/', { replace: true });
  }, [userId, referralCode, navigate]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-white font-mono text-[10px] uppercase tracking-widest">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-3 border-amber-500/10 border-t-amber-500 animate-spin" />
        <span className="animate-pulse">Loading secure connection...</span>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [slow, setSlow] = useState(false);
  const { incomingCall, clearIncomingCall } = useCallSignaling();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Activate background transmission worker
  useBackgroundMessageScheduler();

  // Listen for Cmd+K (Mac) or Ctrl+K (Windows/Linux) and 'open-universal-search' custom event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    const handleOpenSearch = () => {
      setIsSearchOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-universal-search', handleOpenSearch);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-universal-search', handleOpenSearch);
    };
  }, []);

  useEffect(() => {
    let t: any;
    if (loading) {
      t = setTimeout(() => setSlow(true), 4000);
    } else {
      setSlow(false);
    }
    return () => clearTimeout(t);
  }, [loading]);

  if (location.pathname.startsWith('/invite/')) {
    return (
      <Routes>
        <Route path="/invite/:userId" element={<InviteRedirectHandler />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0a0e1a] font-sans p-12">
      <div className="relative mb-8 text-amber-500">
        <svg viewBox="0 0 24 24" width="60" height="60" className="stroke-current fill-none animate-pulse">
          <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.01 9.01 0 0 1-4.25-1.07l-4.14 1.07 1.03-4.04A9 9 0 1 1 12 21z" />
          <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" d="M15.4 12.6c-.2-.1-.5-.2-.6-.3-.1-.1-.2-.1-.3-.1s-.2 0-.3.1c-.1.2-.4.5-.5.6-.1.1-.2.1-.4 0s-.8-.3-1.5-1c-.5-.5-.9-1.1-1-1.2-.2-.2 0-.3.1-.4.1-.1.2-.2.3-.3 0-.1.1-.2.1-.3s0-.3-.1-.4c-.1-.1-.3-.7-.4-.9-.1-.2-.2-.2-.3-.2s-.2 0-.3.1c-.2.1-.4.3-.5.6s-.1.7.1 1.0c.2.3.6.9 1.4 1.3.4.2.8.4 1 .5.3.1.6.1.8.1.3 0 .6-.2.8-.4.2-.2.2-.5.2-.6 0-.2-.1-.3-.2-.4z" />
        </svg>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <div className="w-10 h-10 rounded-full border-3 border-amber-500/10 border-t-amber-500 animate-spin" />
        {slow && <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-4 animate-pulse">Connecting peer node...</p>}
      </div>
    </div>
  );

  if (!user) return <Login />;

  if (location.pathname === '/advance-chat') {
    return (
      <AnimatePresence mode="wait" initial={false}>
        <div key={location.pathname} className="h-screen w-screen bg-[#060814] overflow-hidden">
          <Suspense fallback={
            <div className="h-screen flex items-center justify-center bg-[#060814]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"/>
            </div>
          }>
            <Routes location={location}>
              <Route path="/advance-chat" element={<AdvanceChatEngine />} />
            </Routes>
          </Suspense>
        </div>
      </AnimatePresence>
    );
  }

  if (location.pathname.startsWith('/call/')) {
    return (
      <AnimatePresence mode="wait" initial={false}>
        <div key={location.pathname} className="h-screen w-screen bg-[#0b141a] overflow-hidden">
          <Suspense fallback={
            <div className="h-screen flex items-center justify-center bg-[#0b141a]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"/>
            </div>
          }>
            <Routes location={location}>
              <Route path="/call/:callId" element={<ActiveCall />} />
            </Routes>
          </Suspense>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <>
      <AnimatePresence>
        {incomingCall && (
          <IncomingCallModal call={incomingCall} onDismiss={clearIncomingCall} />
        )}
      </AnimatePresence>

      <NotificationToast />

      <UniversalSearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <Layout>
        <AnimatePresence mode="wait" initial={false}>
          <div key={location.pathname} className="h-full w-full">
            <Suspense fallback={
              <div className="h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"/>
              </div>
            }>
              <Routes location={location}>
                <Route path="/" element={<Navigate to="/chats" replace />} />
                <Route path="/chats" element={<ChatList />} />
                <Route path="/ai" element={<NexusAIChat />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/chats/:chatId" element={<ChatRoom />} />
                <Route path="/discover-channels" element={<ChannelDiscover />} />
                <Route path="/channels/:channelId" element={<ChannelChatRoom />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/calls" element={<Calls />} />
                <Route path="/broadcasts" element={<BroadcastLists />} />
                <Route path="/broadcast/:broadcastId" element={<ChatRoom />} />
                <Route path="/scheduled" element={<ScheduledMessages />} />
                <Route path="/vault" element={<Vault />} />
                <Route path="/workspace" element={<Workspace />} />
                <Route path="/map" element={<EnclaveMap />} />
                <Route path="/reels" element={<ReelsPage />} />
                <Route path="/advance-chat" element={<AdvanceChatEngine />} />
                <Route path="*" element={<Navigate to="/chats" replace />} />
              </Routes>
            </Suspense>
          </div>
        </AnimatePresence>
      </Layout>
    </>
  );
}


function PresenceTracker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const presenceRef = doc(db, 'users', user.uid, 'presence', 'status');

    const setOnline = () => {
      updateDoc(userRef, {
        isOnline: true,
        lastSeen: serverTimestamp()
      }).catch(console.error);

      setDoc(presenceRef, {
        isOnline: true,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(console.error);
    };

    const setOffline = () => {
      updateDoc(userRef, {
        isOnline: false,
        lastSeen: serverTimestamp()
      }).catch(console.error);

      setDoc(presenceRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(console.error);
    };

    // Initial online status
    setOnline();

    // Heartbeat to keep lastSeen relatively fresh
    const heartbeat = setInterval(setOnline, 30000); // 30 second interval for presence freshness

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setOnline();
      } else {
        setOffline();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', setOffline);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', setOffline);
      setOffline();
    };
  }, [user]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PresenceTracker />
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
