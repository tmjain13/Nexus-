import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove, collection, addDoc, serverTimestamp, orderBy, query, deleteDoc } from 'firebase/firestore';
import { Edit2, Camera, Check, X, MapPin, Link as LinkIcon, Calendar, UserPlus, MessageCircle, MoreHorizontal, ShieldOff, Shield, BadgeCheck, Settings as SettingsIcon, Key, Lock, List, Radio, Bell, Database, Accessibility, Globe, HelpCircle, Users, Image as ImageIcon, ArrowLeft, Search, ScanLine, Bookmark, Star, EyeOff, LayoutGrid, Sparkles, Crown, Loader2, Trash2, Grid2x2, Heart, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { messaging } from '../lib/firebase';
import { getToken } from 'firebase/messaging';
import { QRCodeCanvas } from 'qrcode.react';
import { Share2, QrCode as QrCodeIcon, Eye as EyeIcon, Copy, Gift } from 'lucide-react';
import { useInviteLink } from '../hooks/useInviteLink';
import { QRCodeDisplay } from '../components/QRCodeDisplay';

import { useTheme } from '../context/ThemeContext';

import { NOTIFICATION_TONES, ToneType, playNotificationSound } from '../lib/tones';

// Enclave OS Premium Integrations
import { useSubscription } from '../hooks/useSubscription';
import { usePremiumFeature } from '../hooks/usePremiumFeature';
import { PremiumBadge } from '../components/PremiumBadge';
import { PremiumModal } from '../components/PremiumModal';
import { ThemePicker } from '../components/ThemePicker';
import { AppIconPicker } from '../components/AppIconPicker';
import { RingtonePicker } from '../components/RingtonePicker';

import { PeaceModeSettings } from '../components/PeaceModeSettings';
import { useComposeSettings } from '../hooks/useComposeSettings';
import { CloseFriendsManager } from '../components/CloseFriendsManager';
import { useCloseFriends } from '../hooks/useCloseFriends';
import { TakeABreath } from '../components/TakeABreath';
import { FocusTimer } from '../components/FocusTimer';
import { DailyReport } from '../components/DailyReport';
import SummaryHistory from '../components/SummaryHistory';
import { EmailAccountSetup } from '../components/email/EmailAccountSetup';
import { CalendarConnect } from '../components/CalendarConnect';
import { CalendarReminders } from '../components/CalendarReminders';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Profile() {
  const { userId: paramUserId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { settings: composeSettings, updateSettings: updateComposeSettings } = useComposeSettings();
  
  const { theme, themeMode, setThemeMode, toggleTheme, messageLayout, setMessageLayout, bubbleColor, setBubbleColor, primaryAccent, setPrimaryAccent } = useTheme();
  
  // Enclave OS Premium state
  const { isPremium, subscription, daysLeft, upgrade, cancel, loading: subLoading } = useSubscription();
  
  const targetUserId = paramUserId || currentUser?.uid;
  const isOwnProfile = targetUserId === currentUser?.uid;
  const { isCloseFriend, list: ownCloseFriendsList } = useCloseFriends();

  const [profile, setProfile] = useState<any>(null);

  // Compute mutual close friends if viewing someone else's profile
  const ownCloseFriendsIds = (ownCloseFriendsList || []).map(f => f.userId);
  const targetCloseFriends = profile?.closeFriends || [];
  const targetCloseFriendsIds = targetCloseFriends.map((f: any) => f.userId || f);
  
  const mutualCloseFriendIds = targetCloseFriendsIds.filter((id: string) => ownCloseFriendsIds.includes(id));
  const mutualCloseFriendsDetails = mutualCloseFriendIds.map((id: string) => {
    const found = allUsers.find(u => u.id === id);
    return found || { displayName: "Cadet", username: "unknown" };
  });

  const isBirthdayToday = React.useMemo(() => {
    if (!profile?.birthday) return false;
    try {
      const bDate = new Date(profile.birthday + 'T00:00:00');
      const today = new Date();
      return bDate.getMonth() === today.getMonth() && bDate.getDate() === today.getDate();
    } catch (e) {
      return false;
    }
  }, [profile?.birthday]);

  const isBirthdaySoon = React.useMemo(() => {
    if (!profile?.birthday || isBirthdayToday) return false;
    try {
      const bDate = new Date(profile.birthday + 'T00:00:00');
      const today = new Date();
      bDate.setFullYear(today.getFullYear());
      const diffTime = bDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 7;
    } catch (e) {
      return false;
    }
  }, [profile?.birthday, isBirthdayToday]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const bioTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { inviteLink, referrals, loading: inviteLoading, copyLink, shareLink } = useInviteLink();
  const [copiedLink, setCopiedLink] = useState(false);

  const [previewVisibility, setPreviewVisibility] = useState<'everyone' | 'contacts'>('everyone');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showShareQr, setShowShareQr] = useState(false);

  const adjustBioHeight = () => {
    if (bioTextareaRef.current) {
      bioTextareaRef.current.style.height = 'auto';
      bioTextareaRef.current.style.height = `${Math.min(bioTextareaRef.current.scrollHeight, 150)}px`;
    }
  };
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [activeSetting, setActiveSetting] = useState<string | null>(null);
  const [peaceSubTab, setPeaceSubTab] = useState<'settings' | 'breathing' | 'focus' | 'stats'>('settings');
  const [activeTab, setActiveTab] = useState<'gallery' | 'vault'>('gallery');
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultPasswordInput, setVaultPasswordInput] = useState('');
  const [showVaultPinPrompt, setShowVaultPinPrompt] = useState(false);
  const [lastVaultActivity, setLastVaultActivity] = useState(Date.now());
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllUsers(usersList);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!vaultUnlocked || activeTab !== 'vault') return;

    const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes inactivity
    
    const interval = setInterval(() => {
      if (Date.now() - lastVaultActivity > INACTIVITY_TIMEOUT) {
        setVaultUnlocked(false);
        setVaultPasswordInput('');
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [vaultUnlocked, lastVaultActivity, activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to quick-hide vault
      if (e.key === 'Escape' && vaultUnlocked && activeTab === 'vault') {
        setVaultUnlocked(false);
        setVaultPasswordInput('');
        setToast({ message: "Vault quick-hidden", type: 'success' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [vaultUnlocked, activeTab]);

  const recordVaultActivity = () => {
    if (activeTab === 'vault' && vaultUnlocked) {
      setLastVaultActivity(Date.now());
    }
  };

  const simulateBiometric = async () => {
    setIsBiometricScanning(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsBiometricScanning(false);
    setVaultUnlocked(true);
  };
  
  const [newVaultPin, setNewVaultPin] = useState('');
  const [confirmVaultPin, setConfirmVaultPin] = useState('');
  
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);
  const [showAddVaultModal, setShowAddVaultModal] = useState(false);
  const [vaultSearch, setVaultSearch] = useState('');
  const [newVaultItem, setNewVaultItem] = useState({ title: '', content: '', type: 'note' });
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    if (!vaultUnlocked || !currentUser) return;
    setLoadingVault(true);
    const q = query(
      collection(db, 'users', currentUser.uid, 'vault'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setVaultItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingVault(false);
    }, (err) => {
      console.error("Vault snapshot failure:", err);
      setLoadingVault(false);
    });
    return () => unsub();
  }, [vaultUnlocked, currentUser]);

  const handleAddVaultItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newVaultItem.title) return;
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'vault'), {
        ...newVaultItem,
        createdAt: serverTimestamp(),
      });
      setNewVaultItem({ title: '', content: '', type: 'note' });
      setShowAddVaultModal(false);
      setToast({ message: "Item deposited securely", type: 'success' });
    } catch (err) {
      console.error("Vault insertion failed", err);
      setToast({ message: "Could not add to vault", type: 'error' });
    }
  };

  const handleDeleteVaultItem = async (itemId: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'vault', itemId));
      setToast({ message: "Item purged from vault", type: 'success' });
    } catch (err) {
      console.error("Vault deletion failed", err);
    }
  };
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'vault') {
      setActiveTab('vault');
    }
  }, []);

  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    username: '',
    phone: '',
    about: '',
    vibe: '',
    customVibe: '',
    isVerified: false,
    birthday: '',
    privacySettings: {
      hideOnlineStatus: false,
      hideLastSeen: false,
      readReceiptsEnabled: true,
      profileVisibility: 'everyone',
    },
    peaceMode: {
      enabled: false,
      autoReplyText: "I'm in Peace Mode. I'll respond later.",
    },
    vaultPin: '',
  });

  useEffect(() => {
    if (isEditing) {
      setTimeout(adjustBioHeight, 0);
    }
  }, [isEditing, editForm?.bio]);

  useEffect(() => {
    if (!targetUserId) return;
    const unsub = onSnapshot(doc(db, 'users', targetUserId), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        setEditForm({
          displayName: data.displayName || '',
          bio: data.bio || '',
          username: data.username || '',
          phone: data.phone || '',
          about: data.about || '',
          vibe: data.vibe || '',
          customVibe: data.customVibe || '',
          isVerified: data.isVerified || false,
          birthday: data.birthday || '',
          privacySettings: data.privacySettings || {
            hideOnlineStatus: false,
            hideLastSeen: false,
            readReceiptsEnabled: true,
            profileVisibility: 'everyone',
          },
          peaceMode: data.peaceMode || {
            enabled: false,
            autoReplyText: "I'm in Peace Mode. I'll respond later.",
          },
          vaultPin: data.vaultPin || '',
        });
      } else {
        console.warn("No such user!");
        if (isOwnProfile && currentUser) {
          try {
            const userRef = doc(db, 'users', currentUser.uid);
            const pubKeyStr = localStorage.getItem(`e2ee_pub_${currentUser.uid}`) || '';
            const rawName = currentUser.displayName || 'Anonymous';
            const safeDisplayName = rawName.length >= 2 ? rawName : `${rawName}_Anon`;
            await setDoc(userRef, {
              displayName: safeDisplayName,
              username: currentUser.email?.split('@')[0] || currentUser.uid.slice(0, 8),
              email: currentUser.email || `${currentUser.uid.slice(0, 10)}@enclave.os`,
              photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid.slice(0, 8)}`,
              bio: '',
              followersCount: 0,
              followingCount: 0,
              publicKey: pubKeyStr,
              createdAt: serverTimestamp(),
            });
          } catch (err) {
            console.warn("Auto-creation of user failed in Profile page:", err);
          }
        }
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${targetUserId}`);
    });

    return unsub;
  }, [targetUserId, isOwnProfile, currentUser]);

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    try {
      const updateData = {
        ...editForm,
        vibe: editForm.customVibe || editForm.vibe,
        updatedAt: new Date(),
      };
      await updateDoc(doc(db, 'users', currentUser.uid), updateData);
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const handleUpdatePrivacy = async (key: string, value: any) => {
    if (!currentUser) return;
    try {
      const newSettings = { ...editForm.privacySettings, [key]: value };
      await updateDoc(doc(db, 'users', currentUser.uid), {
        privacySettings: newSettings
      });
      setEditForm(prev => ({ ...prev, privacySettings: newSettings }));
    } catch (err) {
      console.error("Privacy update failed", err);
    }
  };

  const handleUpdateVaultPin = async () => {
    if (!currentUser) return;
    if (newVaultPin.length !== 4) {
      alert('PIN must be 4 digits.');
      return;
    }
    if (newVaultPin !== confirmVaultPin) {
      alert('PINs do not match.');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { vaultPin: newVaultPin });
      setEditForm(prev => ({ ...prev, vaultPin: newVaultPin }));
      setNewVaultPin('');
      setConfirmVaultPin('');
      alert('Vault PIN updated successfully.');
    } catch (err) {
      console.error("Vault PIN update failed", err);
    }
  };

  const checkVaultUnlock = () => {
    if (vaultPasswordInput === profile?.vaultPin) {
      setVaultUnlocked(true);
      setShowVaultPinPrompt(false);
      setVaultPasswordInput('');
    } else {
      alert('Incorrect PIN');
    }
  };

  const handleBlockUser = async () => {
    if (!currentUser || !profile) return;
    try {
      const isBlocked = currentUserProfile?.blockedUsers?.includes(targetUserId);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        blockedUsers: isBlocked ? arrayRemove(targetUserId) : arrayUnion(targetUserId)
      });
    } catch (err) {
      console.error("Failed to block/unblock", err);
    }
  };

  const requestPushPermission = async (enable: boolean) => {
    if (!currentUser) return;
    try {
      if (enable && messaging) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // get token (requires vapid key in a real app, this will likely fail locally without one)
          const token = await getToken(messaging, { vapidKey: (import.meta as any).env.VITE_VAPID_KEY as string }).catch((err) => {
             console.error("FCM Token fetch failed:", err);
             return null;
          });
          
          const updates: any = { 'notificationPreferences.push': true };
          if (token) {
            updates.fcmToken = token;
          }
          await updateDoc(doc(db, 'users', currentUser.uid), updates);
        } else {
          alert('Notification permission denied.');
        }
      } else {
        await updateDoc(doc(db, 'users', currentUser.uid), { 'notificationPreferences.push': false });
      }
    } catch (err) {
      console.error(err);
      await updateDoc(doc(db, 'users', currentUser.uid), { 'notificationPreferences.push': enable }); // fallback
    }
  };

  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) setCurrentUserProfile(docSnap.data());
    });
    return unsub;
  }, [currentUser]);

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-[#f4f4f5]">
       <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-3"></div>
       <div className="text-zinc-400 font-mono text-[10px] uppercase font-bold tracking-widest">Initialising Profile...</div>
    </div>
  );

  if (!profile) return <div className="p-8 text-center text-red-500 font-mono font-bold text-[10px] uppercase tracking-widest pt-20 flex flex-col items-center justify-center h-full bg-[#f4f4f5] dark:bg-zinc-950">User not found in Directory</div>;

  if (profile?.blockedUsers?.includes(currentUser?.uid) || currentUserProfile?.blockedUsers?.includes(targetUserId)) {
    return (
      <div className="flex flex-col h-full bg-white font-sans overflow-hidden">
      <header className="px-5 pt-8 pb-4 sticky top-0 bg-wa-primary dark:bg-wa-primary-dark z-10 shadow-sm flex items-center justify-between">
         <div className="flex items-center gap-4 text-white">
            <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors active:scale-95">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold tracking-tight">Contact info</h1>
         </div>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#f4f4f5] dark:bg-zinc-950">
        <ShieldOff size={48} className="text-zinc-300 dark:text-zinc-800 mb-4" />
        <div className="text-zinc-500 font-mono text-xs uppercase font-bold tracking-widest text-center">
          Connection Refused.<br/>Profile inaccessible.
        </div>
        {currentUserProfile?.blockedUsers?.includes(targetUserId) && (
          <button 
            onClick={handleBlockUser}
            className="mt-6 px-4 py-2 bg-zinc-900 text-white rounded-full text-[11px] font-bold font-mono tracking-widest uppercase hover:bg-zinc-800 transition-colors"
          >
            Unblock User
          </button>
        )}
      </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="bg-[#f4f4f5] min-h-full font-sans pb-20 relative overflow-hidden"
    >
      <AnimatePresence>
        {showPremiumModal && (
          <PremiumModal onClose={() => setShowPremiumModal(false)} />
        )}
        {showShareQr && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setShowShareQr(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-wa-primary" />
              
              <div className="p-10 text-center">
                <div className="flex flex-col items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-wa-primary/10 rounded-2xl flex items-center justify-center text-wa-primary">
                     <QrCodeIcon size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Share Contact</h3>
                    <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-1">Direct Signal Link</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-inner border-4 border-zinc-50 flex items-center justify-center mb-8">
                  <QRCodeCanvas 
                    value={`https://ais-dev-xr7k2hfx2cn37am5w732kz-710497365939.asia-southeast1.run.app/profile/${targetUserId}`}
                    size={200}
                    level="H"
                    includeMargin={true}
                    fgColor="#000000"
                  />
                </div>

                <div className="space-y-4">
                  <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Your Identity ID</p>
                    <p className="text-zinc-900 dark:text-white font-mono text-xs break-all">{targetUserId}</p>
                  </div>
                  
                  <button 
                    onClick={() => setShowShareQr(false)}
                    className="w-full py-4 bg-zinc-950 text-white rounded-2xl font-mono font-bold text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
                 <p className="text-[9px] font-mono font-black text-zinc-400 uppercase tracking-[0.3em]">Encrypted Connection Key</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

      <header className="px-4 pt-4 pb-3 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0 flex items-center justify-between bg-white dark:bg-[#202c33] z-20">
        <div className="flex items-center gap-3.5">
          <button 
            onClick={() => navigate('/chats')}
            className="p-1 -ml-1 text-[#54656f] dark:text-[#aebac1] hover:text-wa-primary transition-colors cursor-pointer"
            title="Back to chats"
            style={{ border: 'none', background: 'none' }}
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <h1 className="text-[19px] font-medium text-zinc-900 dark:text-[#e9edef]">{isOwnProfile ? 'Settings / Profile' : 'Contact Info'}</h1>
        </div>
        
        {isOwnProfile && (
          <button 
            onClick={() => setShowPrivacySettings(true)}
            className="p-1.5 px-2.5 hover:bg-zinc-100 dark:hover:bg-[#2a3942] rounded-lg transition-colors text-[#54656f] dark:text-[#aebac1] flex items-center gap-1.5 cursor-pointer"
            style={{ border: 'none', background: 'none' }}
          >
            <SettingsIcon size={16} />
            <span className="text-[11px] font-medium hidden sm:inline">Settings</span>
          </button>
        )}
      </header>

      {/* Banner */}
      <motion.div 
        variants={itemVariants}
        className="h-32 bg-zinc-900 overflow-hidden relative"
      >
        <img 
          src={`https://images.unsplash.com/photo-1614850523296-d8c1af03d400?q=80&w=2070&auto=format&fit=crop`} 
          className="w-full h-full object-cover opacity-60 mix-blend-overlay grayscale"
          alt="Banner"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
      </motion.div>

      <div className="px-4 -mt-14 pb-4 relative z-10">
        {/* Settings Modal */}
        <AnimatePresence>
           {showPrivacySettings && isOwnProfile && (
              <motion.div 
                 initial={{ opacity: 0, y: '100%' }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: '100%' }}
                 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                 className="fixed inset-0 z-[100] bg-[#f4f4f5] flex flex-col font-sans overflow-hidden"
              >
                  {/* Header */}
                  <header className="flex items-center gap-3 p-3 border-b border-zinc-200 bg-white/90 backdrop-blur-xl z-20 shrink-0 shadow-sm relative">
                    <button onClick={() => activeSetting ? setActiveSetting(null) : setShowPrivacySettings(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-all">
                      <ArrowLeft size={20} className="text-zinc-600" />
                    </button>
                    <h1 className="text-[14px] font-mono font-bold tracking-widest uppercase text-zinc-900 flex-1">
                      {activeSetting ? activeSetting : 'Configuration'}
                    </h1>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                          isPreviewMode ? "bg-wa-primary text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                        )}
                      >
                        <EyeIcon size={14} />
                        {isPreviewMode ? "Exit Preview" : "Preview Privacy"}
                      </button>
                      <button className="p-2 hover:bg-zinc-100 rounded-full transition-all">
                         <Search size={20} className="text-zinc-600" />
                      </button>
                    </div>
                  </header>

                  {isPreviewMode && (
                    <div className="bg-wa-primary/10 border-b border-wa-primary/20 px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield size={16} className="text-wa-primary" />
                        <span className="text-[11px] font-mono font-bold text-wa-primary uppercase tracking-widest">Profiling Mode: Seeing as {previewVisibility}</span>
                      </div>
                      <div className="flex gap-2">
                        {['everyone', 'contacts'].map((v: any) => (
                          <button
                            key={v}
                            onClick={() => setPreviewVisibility(v)}
                            className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest transition-all",
                              previewVisibility === v ? "bg-wa-primary text-white" : "bg-white text-wa-primary border border-wa-primary/30"
                            )}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto pb-20 relative overflow-x-hidden">
                     <AnimatePresence mode="wait">
                       {!activeSetting ? (
                         <motion.div 
                           key="main-settings"
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           transition={{ duration: 0.2 }}
                         >
                           {/* Mini Profile Section inside Settings */}
                           <div className="flex items-center gap-4 p-5 border-b border-zinc-200 cursor-pointer hover:bg-white transition-colors bg-white/50 m-4 rounded-2xl shadow-sm" onClick={() => setShowPrivacySettings(false)}>
                              <img
                                src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                                alt={profile.displayName}
                                className="w-14 h-14 rounded-full object-cover border border-zinc-200 shadow-sm bg-white"
                              />
                              <div className="flex-1">
                                 <h2 className="text-[15px] font-bold text-zinc-900 flex items-center gap-2">
                                   {profile.displayName}
                                 </h2>
                                 <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest truncate max-w-[200px] mt-0.5">
                                   {(isPreviewMode && previewVisibility === 'contacts' && profile.privacySettings?.profileVisibility === 'contacts' && !currentUserProfile?.contacts?.includes(targetUserId)) 
                                     ? "Privacy Restricted" 
                                     : (profile.bio || "Available")}
                                 </p>
                              </div>
                              <div className="p-2 text-zinc-400">
                                 <ScanLine size={18} />
                              </div>
                           </div>

                             <div className="flex flex-col py-2 px-4 space-y-1">
                               {[
                                 { icon: Crown, title: 'Enclave OS Premium', subtitle: isPremium ? '★ Premium tier active' : 'Unlock 12 exclusive protocols', action: 'premium_membership', badge: isPremium ? 'active' : 'premium' },
                                 { icon: Mail, title: 'Email Accounts', subtitle: 'Link your Gmail, Outlook, Yahoo or IMAP inboxes', action: 'email_accounts' },
                                 { icon: Calendar, title: 'Calendar Connection', subtitle: 'Connect Google, Outlook or Apple accounts', action: 'calendar_integration' },
                                 { icon: Bell, title: 'Calendar Notifications', subtitle: 'Push alerts & daily agenda briefing digest', action: 'calendar_notifications' },
                                 { icon: Grid2x2, title: 'Custom App Icon', subtitle: 'Choose from 12 styles & uploads', action: 'app_icon_select', badge: isPremium ? null : 'premium' },
                                 { icon: Globe, title: 'Themes & Palette', subtitle: '20+ themes & custom customizer', action: 'theme_select', badge: null },
                                 { icon: Sparkles, title: 'Peace Mode', subtitle: 'Digital wellness & focus mode', action: 'peace_mode' },
                                 { icon: Heart, title: 'Close Friends', subtitle: 'Manage close friends list & settings', action: 'close_friends' },
                                 { icon: Sparkles, title: 'AI Chat Summaries', subtitle: 'View past summaries & key topic digests', action: 'ai_summaries' },
                                 { icon: LayoutGrid, title: 'Appearance', subtitle: 'Layout, chat bubbles', action: 'appearance' },
                                 { icon: Star, title: 'Starred messages', subtitle: 'View saved important messages', action: 'starred' },
                                 { icon: Key, title: 'Security', subtitle: 'Vault, security notifications', action: 'account' },
                                 { icon: Lock, title: 'Privacy', subtitle: 'Blocked accounts, disappearing messages', action: 'privacy' },
                                 { icon: ImageIcon, title: 'Avatar', subtitle: 'Create, edit, profile photo', action: 'avatar' },
                                 { icon: List, title: 'Lists', subtitle: 'Manage people and groups', action: 'lists' },
                                 { icon: MessageCircle, title: 'Chats', subtitle: 'Theme, wallpapers, chat history', action: 'chats' },
                                 { icon: Bell, title: 'Notifications & Ringtones', subtitle: '15 exclusive custom audio tones', action: 'notifications' },
                                 { icon: Database, title: 'Storage and data', subtitle: 'Network usage, auto-download', action: 'storage' },
                                 { icon: Accessibility, title: 'Accessibility', subtitle: 'Increase contrast, animation', action: 'accessibility' },
                                 { icon: Globe, title: 'App language', subtitle: "English (device's language)", action: 'language' },
                                 { icon: HelpCircle, title: 'Help and feedback', subtitle: 'Help centre, contact us, privacy policy', action: 'help' },
                                 { icon: Users, title: 'Invite a friend', subtitle: '', action: 'invite' },
                              ].map((item, idx) => (
                                 <div key={idx} onClick={() => {
                                    setActiveSetting(item.action);
                                  }} className="flex gap-4 items-center px-4 py-3 bg-white dark:bg-[#111b21] hover:bg-zinc-50 dark:hover:bg-[#1f2c34] border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 cursor-pointer transition-all group rounded-xl">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors shrink-0">
                                       <item.icon size={16} strokeWidth={2} className={item.action === 'premium_membership' && isPremium ? 'text-amber-500' : ''} />
                                    </div>
                                    <div className="flex-1">
                                       <h3 className="text-[13px] font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                                         {item.title}
                                         {item.badge === 'active' && <span className="text-[8px] font-mono font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-md">Active</span>}
                                         {item.badge === 'premium' && <span className="text-[8px] font-mono font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-md">🔒 Premium</span>}
                                       </h3>
                                       {item.subtitle && <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5 tracking-wide">{item.subtitle}</p>}
                                    </div>
                                 </div>
                              ))}
                           </div>
                         </motion.div>
                       ) : (
                         <motion.div
                           key="sub-setting"
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: 20 }}
                           transition={{ duration: 0.2 }}
                           className="p-4"
                         >
                           {activeSetting === 'theme_select' ? (
                               <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm space-y-6 text-left">
                                 <div className="flex justify-between items-center mb-4">
                                   <div className="flex items-center gap-3">
                                     <div className="p-2.5 bg-amber-500/15 text-amber-500 rounded-xl">
                                       <Globe size={18} />
                                     </div>
                                     <div>
                                       <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-900 dark:text-white uppercase">Theme Customizer</h4>
                                       <p className="text-[9px] text-zinc-500 font-medium uppercase tracking-wide">Configure layout & accents</p>
                                     </div>
                                   </div>
                                   <button 
                                     onClick={() => setActiveSetting(null)} 
                                     className="p-1 px-3 bg-white dark:bg-zinc-850 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-850 rounded-xl text-[10px] font-mono uppercase font-bold hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors cursor-pointer flex items-center gap-2"
                                     style={{ border: 'none' }}
                                   >
                                     <ArrowLeft size={10} /> Back
                                   </button>
                                 </div>
                                 <ThemePicker />
                               </div>
                           ) : activeSetting === 'app_icon_select' ? (
                               <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm space-y-6 text-left">
                                 <div className="flex justify-between items-center mb-4">
                                   <div className="flex items-center gap-3">
                                     <div className="p-2.5 bg-amber-500/15 text-amber-500 rounded-xl">
                                       <Grid2x2 size={18} />
                                     </div>
                                     <div>
                                       <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-900 dark:text-white uppercase font-sans">App Icon Picker</h4>
                                       <p className="text-[9px] text-zinc-500 font-medium uppercase tracking-wide">Choose Launcher Appearance</p>
                                     </div>
                                   </div>
                                   <button 
                                     onClick={() => setActiveSetting(null)} 
                                     className="p-1 px-3 bg-white dark:bg-zinc-850 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-850 rounded-xl text-[10px] font-mono uppercase font-bold hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors cursor-pointer flex items-center gap-2"
                                     style={{ border: 'none' }}
                                   >
                                     <ArrowLeft size={10} /> Back
                                   </button>
                                 </div>
                                 <AppIconPicker />
                               </div>
                           ) : activeSetting === 'peace_mode' ? (
                             <div className="space-y-6 text-left">
                               <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                                 <div className="flex items-center gap-2.5">
                                   <div className="w-1.5 h-6 bg-amber-500 rounded-full animate-pulse" />
                                   <div>
                                     <h3 className="text-base font-black font-mono tracking-wider text-zinc-100 uppercase">Enclave Wellness Protocols</h3>
                                     <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">Somatic & Boundary Systems</p>
                                   </div>
                                 </div>
                                 <button 
                                   onClick={() => setActiveSetting(null)} 
                                   className="p-1.5 px-3 bg-zinc-850 text-zinc-300 border border-zinc-800 rounded-xl text-[10px] font-mono uppercase font-bold hover:bg-zinc-850/50 transition-colors cursor-pointer flex items-center gap-2 border-none"
                                   style={{ border: 'none' }}
                                 >
                                   <ArrowLeft size={10} /> Back
                                 </button>
                               </div>

                               {/* Tab Controls */}
                               <div className="grid grid-cols-4 gap-1 bg-zinc-900/60 p-1.5 rounded-2xl border border-zinc-850">
                                 {([
                                   { id: 'settings', label: 'Limits' },
                                   { id: 'breathing', label: 'Breathing' },
                                   { id: 'focus', label: 'Focus' },
                                   { id: 'stats', label: 'Stats' }
                                 ] as const).map((tab) => (
                                   <button
                                     key={tab.id}
                                     onClick={() => setPeaceSubTab(tab.id)}
                                     className={cn(
                                       "py-2 text-center rounded-xl transition-all border-none cursor-pointer flex flex-col items-center justify-center gap-0.5",
                                       peaceSubTab === tab.id 
                                         ? "bg-amber-500 text-zinc-950 shadow-lg font-bold" 
                                         : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50"
                                     )}
                                     style={{ border: 'none' }}
                                   >
                                     <span className="text-[10px] font-mono uppercase tracking-wider">{tab.label}</span>
                                   </button>
                                 ))}
                               </div>

                               <div className="mt-4 animate-in fade-in duration-300">
                                 {peaceSubTab === 'settings' && <PeaceModeSettings />}
                                 {peaceSubTab === 'breathing' && <TakeABreath />}
                                 {peaceSubTab === 'focus' && <FocusTimer />}
                                 {peaceSubTab === 'stats' && <DailyReport />}
                                </div>
                             </div>
                           ) : activeSetting === 'calendar_integration' ? (
                              <div className="space-y-6 text-left">
                                <CalendarConnect onClose={() => setActiveSetting(null)} />
                              </div>
                            ) : activeSetting === 'calendar_notifications' ? (
                              <div className="space-y-6 text-left">
                                <CalendarReminders onClose={() => setActiveSetting(null)} />
                              </div>
                            ) : activeSetting === 'email_accounts' ? (
                             <div className="space-y-6 text-left">
                               <EmailAccountSetup onClose={() => setActiveSetting(null)} />
                             </div>
                           ) : activeSetting === 'close_friends' ? (
                             <div className="space-y-6 text-left">
                               <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                                 <div className="flex items-center gap-2.5">
                                   <div className="w-1.5 h-6 bg-emerald-500 rounded-full animate-pulse" />
                                   <div>
                                     <h3 className="text-base font-black font-mono tracking-wider text-zinc-100 uppercase">Close Friends Protocol</h3>
                                     <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">Enclave Identity Management</p>
                                   </div>
                                 </div>
                                 <button 
                                   onClick={() => setActiveSetting(null)} 
                                   className="p-1.5 px-3 bg-zinc-850 text-zinc-300 border border-zinc-800 rounded-xl text-[10px] font-mono uppercase font-bold hover:bg-zinc-850/50 transition-colors cursor-pointer flex items-center gap-2 border-none"
                                   style={{ border: 'none' }}
                                 >
                                   <ArrowLeft size={10} /> Back
                                 </button>
                               </div>
                               <div className="mt-4 animate-in fade-in duration-300">
                                 <CloseFriendsManager />
                               </div>
                             </div>
                           ) : activeSetting === 'premium_membership' ? (
                                <div className="p-6 bg-gradient-to-br from-[#1c1917] to-[#0c0a09] border border-amber-500/20 rounded-3xl shadow-2xl space-y-6 text-left text-white relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                    <Crown size={180} className="text-amber-500 animate-pulse" />
                                  </div>
                                  
                                  <div className="flex justify-between items-center relative z-10">
                                    <div className="flex items-center gap-3">
                                      <div className="p-3 bg-amber-500 rounded-2xl text-zinc-950 shadow-md shadow-amber-500/25">
                                        <Crown size={20} className="scale-110" />
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-black font-mono tracking-widest text-amber-500 uppercase">ENCLAVE PREMIUM</h4>
                                        <p className="text-[10px] text-zinc-400 font-medium">Subscription Protocols</p>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => setActiveSetting(null)} 
                                      className="p-1 px-3 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-xl text-[10px] font-mono uppercase font-bold hover:bg-zinc-700 transition-colors cursor-pointer flex items-center gap-2"
                                      style={{ border: 'none' }}
                                    >
                                      <ArrowLeft size={10} /> Back
                                    </button>
                                  </div>

                                  {/* Subscription Status Card */}
                                  <div className="p-5 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-inner relative z-10 space-y-4">
                                    {isPremium ? (
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                          <div>
                                            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-500">Tier Status</span>
                                            <h5 className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                                              ★ Premium Protocol Active <PremiumBadge size="md" />
                                            </h5>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400">Plan</span>
                                            <p className="text-xs font-bold text-white capitalize mt-0.5">{subscription?.plan || 'monthly'}</p>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-left">
                                          <div>
                                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Started On</span>
                                            <p className="text-xs font-bold mt-0.5">
                                              {subscription?.startedAt ? new Date(subscription.startedAt.seconds * 1000).toLocaleDateString() : 'Active'}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Renew/Expiry</span>
                                            <p className="text-xs font-bold mt-0.5">
                                              {subscription?.expiresAt ? new Date(subscription.expiresAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                            </p>
                                          </div>
                                        </div>

                                        {daysLeft !== null && (
                                          <div className="bg-amber-500/10 text-amber-500 text-[10px] font-mono font-bold uppercase tracking-widest p-2 rounded-xl text-center border border-amber-500/20">
                                            ⌛ {daysLeft} Days remaining in premium trial
                                          </div>
                                        )}

                                        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-4">
                                          <button
                                            onClick={async () => {
                                              if (window.confirm("Are you sure you want to cancel your Premium benefits?")) {
                                                await cancel();
                                                alert("Subscription set to cancel.");
                                              }
                                            }}
                                            className="text-[9px] font-mono text-zinc-400 hover:text-red-400 underline uppercase cursor-pointer"
                                            style={{ background: 'none', border: 'none' }}
                                          >
                                            Downgrade (Sandbox sandbox)
                                          </button>
                                          <span className="text-[9px] font-mono text-green-500 uppercase font-black">
                                            ✓ AUTO RENEW ACTIVE
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-4 text-center">
                                        <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto font-medium">
                                          Your current tier is <strong>Free</strong>. Unlock 12 premium protocols, custom themes, PNG app icons, custom notifications, and up to 10 pinned chats.
                                        </p>
                                        
                                        {daysLeft !== null && daysLeft <= 0 && (
                                          <div className="p-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider">
                                            ⌛ Free Trial expired. Upgrade to restore access.
                                          </div>
                                        )}

                                        <button
                                          onClick={() => setShowPremiumModal(true)}
                                          className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-2xl text-[10px] font-mono uppercase tracking-[0.15em] shadow-lg shadow-amber-500/10 transition-all active:scale-95 cursor-pointer w-full max-w-xs block mx-auto border border-amber-500"
                                          style={{ border: 'none' }}
                                        >
                                          Activate Premium — ₹79/mo
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Feature highlights */}
                                  <div className="space-y-3 relative z-10">
                                    <h5 className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                                      <Sparkles size={11} /> Exclusive Entitlements
                                    </h5>
                                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                      {[
                                        { title: "20+ Customized Themes", desc: "Select from exclusive preset themes or build custom palette variables." },
                                        { title: "Custom Favicon & Icon Uploads", desc: "Change launcher logo, browser tab titles, and upload customized PNGs." },
                                        { title: "15 Custom Audio Ringtones", desc: "Access 15 soundscapes in alerts or upload custom MP3s up to 5MB." },
                                        { title: "Exclusive Animated Stickers", desc: "Send Pepe Memes, Space Cadet elements, and Crypto-themed reactions." },
                                        { title: "Upgraded Chat List & Folders", desc: "Filter contacts using Work, Groups, or Favorites folders, and pin 10 chats." }
                                      ].map((item, i) => (
                                        <div key={i} className="p-4 bg-zinc-900/50 border border-zinc-850/60 rounded-2xl flex items-start gap-3">
                                          <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-xl shrink-0 mt-0.5">
                                            <Crown size={12} />
                                          </div>
                                          <div>
                                            <h6 className="text-xs font-bold text-white">{item.title}</h6>
                                            <p className="text-[10px] text-zinc-400 leading-normal mt-1">{item.desc}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                            ) : activeSetting === 'starred' ? (
                              <div className="p-4 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
                                <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-2">Starred Messages</h4>
                                {currentUserProfile?.starredMessages && currentUserProfile.starredMessages.length > 0 ? (
                                  <div className="space-y-2">
                                    {currentUserProfile.starredMessages.map((msg: any) => (
                                      <div key={msg.messageId} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex justify-between items-start">
                                         <div className="flex-1 min-w-0 pr-4">
                                            <p className="text-zinc-800 dark:text-zinc-200 text-sm font-medium whitespace-pre-wrap truncate">{msg.text}</p>
                                         </div>
                                         <Star size={16} fill="currentColor" className="text-yellow-500 shrink-0" />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center p-8 text-zinc-400 text-xs font-mono font-bold uppercase tracking-widest">
                                    No starred messages
                                  </div>
                                )}
                              </div>
                           ) : activeSetting === 'appearance' ? (
                              <div className="p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm space-y-8">
                                <div>
                                  {/* Tactical Color Customizer */}
                                  <div className="mb-6">
                                    <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-3">Enclave Color Tone</h4>
                                    <p className="text-[10px] font-mono text-zinc-500 mb-5 leading-relaxed font-semibold">
                                      Select a tactical color-tone override to apply across all layouts and menus:
                                    </p>
                                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mb-6">
                                      {[
                                        { name: 'Emerald', color: '#10b981', label: 'Emerald Signal' },
                                        { name: 'Azure', color: '#0ea5e9', label: 'Ocean Drift' },
                                        { name: 'Amethyst', color: '#8b5cf6', label: 'Cosmic Amethyst' },
                                        { name: 'Amber', color: '#f59e0b', label: 'Solar Flare' },
                                        { name: 'Rose', color: '#f43f5e', label: 'Crimson Protocol' },
                                        { name: 'Teal', color: '#14b8a6', label: 'Cypher Teal' },
                                        { name: 'Obsidian', color: '#6366f1', label: 'Indigo Wave' }
                                      ].map((tone) => {
                                        const isSelected = primaryAccent === tone.color;
                                        return (
                                          <button
                                            key={tone.name}
                                            onClick={() => setPrimaryAccent(tone.color)}
                                            className={cn(
                                              "relative flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all hover:scale-105 cursor-pointer",
                                              isSelected
                                                ? "bg-wa-primary/10 border-wa-primary text-zinc-950 dark:text-white"
                                                : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/80 text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
                                            )}
                                            title={tone.label}
                                          >
                                            <div 
                                              className="w-6 h-6 rounded-full shadow-inner flex items-center justify-center shrink-0 border border-black/10"
                                              style={{ backgroundColor: tone.color }}
                                            >
                                              {isSelected && (
                                                <Check size={12} className="text-white drop-shadow" strokeWidth={3} />
                                              )}
                                            </div>
                                            <span className="text-[9px] font-mono font-semibold tracking-tighter truncate w-full text-center">{tone.name}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-6">Message Display</h4>
                                  <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <span className="text-[13px] font-bold text-zinc-900 dark:text-white transition-colors">Chat Layout</span>
                                        <p className="text-[10px] font-mono text-zinc-500 mt-0.5 whitespace-pre-wrap">Toggle between spacing styles</p>
                                      </div>
                                      <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                                        {(['expanded', 'compact'] as const).map(l => (
                                          <button
                                            key={l}
                                            onClick={() => setMessageLayout(l)}
                                            className={cn(
                                              "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-all",
                                              messageLayout === l ? "bg-white dark:bg-zinc-700 text-wa-primary shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                                            )}
                                          >
                                            {l}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <span className="text-[13px] font-bold text-zinc-900 dark:text-white transition-colors">Custom Bubbles</span>
                                        <p className="text-[10px] font-mono text-zinc-500 mt-0.5 whitespace-pre-line">Manual chromatic override for {"\n"}outgoing transmissions</p>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        {bubbleColor && (
                                          <button onClick={() => setBubbleColor(null)} className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-[0.2em] hover:text-wa-primary leading-none">Reset</button>
                                        )}
                                        <div className="relative group/color">
                                          <input 
                                            type="color" 
                                            value={bubbleColor || primaryAccent} 
                                            onChange={(e) => setBubbleColor(e.target.value)}
                                            className="w-10 h-10 rounded-xl border-4 border-white dark:border-zinc-800 shadow-xl cursor-pointer bg-transparent overflow-hidden" 
                                          />
                                          {!bubbleColor && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[8px] font-black text-black/20 uppercase tracking-tighter">OFF</div>}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
                                   <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-3 text-center">Live Preview</p>
                                   <div className={cn(
                                     "max-w-[180px] rounded-2xl p-3 shadow-md mx-auto relative",
                                     messageLayout === 'compact' ? "rounded-tr-none px-2 py-0.5 text-[13px]" : "rounded-tr-none px-4 py-2 text-[15px]"
                                   )} style={{ backgroundColor: bubbleColor || primaryAccent, color: (parseInt((bubbleColor || primaryAccent || '#000').replace('#', ''), 16) > 0xffffff / 1.5 ? '#000' : '#fff') }}>
                                      This is a preview of your global chat bubble settings.
                                      <div className="text-[9px] opacity-50 mt-1 text-right">10:45 AM</div>
                                   </div>
                                </div>
                              </div>
                           ) : activeSetting === 'privacy' ? (
                              <div className="p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm">
                                 <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-6">Visibility Controls</h4>
                                 <div className="space-y-6">
                                    <label className="flex items-center justify-between cursor-pointer group">
                                       <div className="flex-1">
                                          <span className="text-[13px] font-bold text-zinc-900 dark:text-white transition-colors">Read Receipts</span>
                                          <p className="text-[10px] font-mono text-zinc-500 mt-0.5 tracking-wide">If turned off, you won't send or receive Read Receipts. Read receipts are always sent for group chats.</p>
                                       </div>
                                       <input 
                                         type="checkbox" 
                                         checked={profile.privacySettings?.readReceiptsEnabled !== false} 
                                         onChange={(e) => handleUpdatePrivacy('readReceiptsEnabled', e.target.checked)}
                                         className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 shrink-0 ml-4 bg-zinc-100" 
                                       />
                                    </label>

                                    <label className="flex items-center justify-between cursor-pointer group">
                                       <div className="flex-1">
                                          <span className="text-[13px] font-bold text-zinc-900 dark:text-white transition-colors">Disappearing Messages</span>
                                          <p className="text-[10px] font-mono text-zinc-500 mt-0.5 tracking-wide">Automatically remove messages after a set duration.</p>
                                       </div>
                                       <input 
                                         type="checkbox" 
                                         checked={profile.privacySettings?.disappearingMessagesEnabled || false} 
                                         onChange={(e) => handleUpdatePrivacy('disappearingMessagesEnabled', e.target.checked)}
                                         className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 shrink-0 ml-4 bg-zinc-100" 
                                       />
                                    </label>

                                    <label className="flex items-center justify-between cursor-pointer group">
                                       <div className="flex-1">
                                          <span className="text-[13px] font-bold text-zinc-900 dark:text-white transition-colors">Contacts Only Status</span>
                                          <p className="text-[10px] font-mono text-zinc-500 mt-0.5 tracking-wide">Restricts visibility of your My Messenger Status to users in your address book.</p>
                                       </div>
                                       <input 
                                         type="checkbox" 
                                         checked={profile.contactOnlyStatus || false} 
                                         onChange={(e) => updateDoc(doc(db, 'users', currentUser.uid), { contactOnlyStatus: e.target.checked })}
                                         className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 shrink-0 ml-4 bg-zinc-100" 
                                       />
                                    </label>

                                    <label className="flex items-center justify-between cursor-pointer group">
                                       <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                             <span className="text-[13px] font-bold text-zinc-900 dark:text-white transition-colors">Verified (Demo)</span>
                                             <BadgeCheck size={14} className={profile.isVerified ? "text-zinc-900 dark:text-white" : "text-zinc-300"} />
                                          </div>
                                          <p className="text-[10px] font-mono text-zinc-500 mt-0.5 tracking-wide">Show a verification badge on your profile (For demo purposes).</p>
                                       </div>
                                       <input 
                                         type="checkbox" 
                                         checked={profile.isVerified || false} 
                                         onChange={(e) => updateDoc(doc(db, 'users', currentUser.uid), { isVerified: e.target.checked })}
                                         className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 shrink-0 ml-4 bg-zinc-100" 
                                       />
                                    </label>

                                    <label className="flex items-center justify-between cursor-pointer group">
                                       <div className="flex-1">
                                          <span className="text-[13px] font-bold text-zinc-900 dark:text-white transition-colors">AI Call Summaries</span>
                                          <p className="text-[10px] font-mono text-zinc-500 mt-0.5 tracking-wide">Enable AI-powered summaries for your calls.</p>
                                       </div>
                                       <input 
                                         type="checkbox" 
                                         checked={profile.privacySettings?.aiSummaryEnabled !== false} 
                                         onChange={(e) => handleUpdatePrivacy('aiSummaryEnabled', e.target.checked)}
                                         className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 shrink-0 ml-4 bg-zinc-100" 
                                       />
                                    </label>

                                    <label className="flex items-center justify-between cursor-pointer group">
                                       <div className="flex-1">
                                          <span className="text-[13px] font-bold text-zinc-900 dark:text-white transition-colors">Google Calendar Sync</span>
                                          <p className="text-[10px] font-mono text-zinc-500 mt-0.5 tracking-wide">Sync scheduled calls to your Google Calendar.</p>
                                       </div>
                                       <input 
                                         type="checkbox" 
                                         checked={profile.privacySettings?.calendarSyncEnabled || false} 
                                         onChange={(e) => handleUpdatePrivacy('calendarSyncEnabled', e.target.checked)}
                                         className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 shrink-0 ml-4 bg-zinc-100" 
                                       />
                                    </label>

                                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/60 mt-4 space-y-4 text-left">
                                       <h5 className="text-[11px] font-mono font-bold tracking-widest text-amber-500 uppercase">AI Smart Compose & Replies</h5>
                                       
                                       <label className="flex items-center justify-between cursor-pointer group">
                                          <div className="flex-1">
                                             <span className="text-[13px] font-bold text-zinc-900 dark:text-white transition-colors">AI Smart Compose</span>
                                             <p className="text-[10px] font-mono text-zinc-500 mt-0.5 tracking-wide">Get dynamic autocompletions as you write.</p>
                                          </div>
                                          <input 
                                            type="checkbox" 
                                            checked={composeSettings.enabled} 
                                            onChange={(e) => updateComposeSettings({ enabled: e.target.checked })}
                                            className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 shrink-0 ml-4 bg-zinc-100 cursor-pointer" 
                                          />
                                       </label>

                                       <label className="flex items-center justify-between cursor-pointer group">
                                          <div className="flex-1">
                                             <span className="text-[13px] font-bold text-zinc-900 dark:text-white transition-colors">AI Smart Replies</span>
                                             <p className="text-[10px] font-mono text-zinc-500 mt-0.5 tracking-wide">Show context-aware quick replies above keyboard.</p>
                                          </div>
                                          <input 
                                            type="checkbox" 
                                            checked={composeSettings.smartReplies} 
                                            onChange={(e) => updateComposeSettings({ smartReplies: e.target.checked })}
                                            className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 shrink-0 ml-4 bg-zinc-100 cursor-pointer" 
                                          />
                                       </label>

                                       <label className="flex items-center justify-between cursor-pointer group">
                                          <div className="flex-1">
                                             <span className="text-[13px] font-bold text-zinc-900 dark:text-white transition-colors">Personalize Writing Style</span>
                                             <p className="text-[10px] font-mono text-zinc-500 mt-0.5 tracking-wide">Analyze your sent messages locally for custom suggestions.</p>
                                          </div>
                                          <input 
                                            type="checkbox" 
                                            checked={composeSettings.learnStyle} 
                                            onChange={(e) => updateComposeSettings({ learnStyle: e.target.checked })}
                                            className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 shrink-0 ml-4 bg-zinc-100 cursor-pointer" 
                                          />
                                       </label>

                                       <div className="flex items-center justify-between group">
                                          <div className="flex-1">
                                             <span className="text-[13px] font-bold text-zinc-900 dark:text-white transition-colors">Apply Suggestions To</span>
                                             <p className="text-[10px] font-mono text-zinc-500 mt-0.5 tracking-wide">Filter autocomplete by chat categories.</p>
                                          </div>
                                          <select
                                            value={composeSettings.applyTo}
                                            onChange={(e) => updateComposeSettings({ applyTo: e.target.value as any })}
                                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg p-1.5 focus:ring-amber-500 focus:border-amber-500 cursor-pointer"
                                          >
                                            <option value="all">All Chats</option>
                                            <option value="work">Work Only</option>
                                            <option value="personal">Personal Only</option>
                                          </select>
                                        </div>
                                    </div>
                                 </div>
                              </div>
                           ) : activeSetting === 'invite' ? (
                               <div className="p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111b21] rounded-3xl shadow-sm space-y-6 text-left">
                                  <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                                        <Gift size={18} />
                                      </div>
                                      <div>
                                        <h4 className="text-xs font-mono font-bold tracking-widest text-zinc-900 dark:text-white uppercase font-sans">Invite friends</h4>
                                        <p className="text-[9px] text-zinc-500 font-medium font-sans uppercase tracking-wide">Share Enclave OS invitation</p>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => setActiveSetting(null)} 
                                      className="p-1 px-3 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[10px] font-mono uppercase font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer flex items-center gap-2"
                                      style={{ border: 'none', background: 'none' }}
                                    >
                                      <ArrowLeft size={10} /> Back
                                    </button>
                                  </div>

                                  <div className="p-4 bg-zinc-50 dark:bg-[#202c33] rounded-2xl border border-zinc-150/50 dark:border-zinc-800 space-y-6 flex flex-col items-center">
                                    {inviteLoading ? (
                                      <div className="h-40 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                                      </div>
                                    ) : inviteLink ? (
                                      <>
                                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-zinc-100">
                                          <QRCodeDisplay userId={currentUser.uid} referralCode={inviteLink.code} />
                                        </div>
                                        
                                        <div className="w-full space-y-2">
                                          <label className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block px-1">Your invite URL</label>
                                          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-150/40 dark:border-zinc-800">
                                            <span className="text-[11px] font-mono text-amber-500 truncate flex-1 leading-tight select-all">
                                              {inviteLink.url}
                                            </span>
                                            <button
                                              onClick={async () => {
                                                const success = await copyLink();
                                                if (success) {
                                                  setCopiedLink(true);
                                                  setToast({ message: "Invite link copied!", type: "success" });
                                                  setTimeout(() => setCopiedLink(false), 2000);
                                                }
                                              }}
                                              className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all cursor-pointer text-zinc-600 dark:text-zinc-300"
                                              style={{ border: 'none' }}
                                            >
                                              {copiedLink ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                            </button>
                                            <button
                                              onClick={async () => {
                                                const success = await shareLink();
                                                if (success && !navigator.share) {
                                                  setToast({ message: "Link copied to clipboard!", type: "success" });
                                                }
                                              }}
                                              className="p-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl transition-all cursor-pointer"
                                              style={{ border: 'none' }}
                                            >
                                              <Share2 size={14} />
                                            </button>
                                          </div>
                                        </div>

                                        <div className="w-full grid grid-cols-2 gap-2 text-center pt-2">
                                          <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-150/40 dark:border-zinc-800">
                                            <p className="text-lg font-bold text-amber-500 font-mono">
                                              {inviteLink.clicks || 0}
                                            </p>
                                            <p className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                                              Link Clicks
                                            </p>
                                          </div>
                                          <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-150/40 dark:border-zinc-800">
                                            <p className="text-lg font-bold text-amber-500 font-mono">
                                              {referrals?.referredUsers?.length || 0}
                                            </p>
                                            <p className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                                              Joined Friends
                                            </p>
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      <p className="text-xs text-zinc-500 font-mono">Failed to initialize invitation system.</p>
                                    )}
                                  </div>
                               </div>
                            ) : activeSetting === 'notifications' ? (
                              <div className="p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm space-y-8">
                                 <div>
                                   <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-6">Alerts</h4>
                                   <div className="space-y-6">
                                      <label className="flex items-center justify-between cursor-pointer group">
                                         <div className="flex-1">
                                            <span className="text-[13px] font-bold text-zinc-900 dark:text-white">Push Notifications</span>
                                            <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Alert for new messages</p>
                                         </div>
                                         <input type="checkbox" checked={profile.notificationPreferences?.push || false} onChange={(e) => requestPushPermission(e.target.checked)} className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 ml-4 bg-zinc-100" />
                                      </label>
                                      <label className="flex items-center justify-between cursor-pointer group">
                                         <div className="flex-1">
                                            <span className="text-[13px] font-bold text-zinc-900 dark:text-white">Call Alerts</span>
                                            <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Ring on incoming calls</p>
                                         </div>
                                         <input type="checkbox" checked={profile.notificationPreferences?.calls || false} onChange={(e) => updateDoc(doc(db, 'users', currentUser.uid), { 'notificationPreferences.calls': e.target.checked })} className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 ml-4 bg-zinc-100" />
                                      </label>
                                      <label className="flex items-center justify-between cursor-pointer group">
                                         <div className="flex-1">
                                            <span className="text-[13px] font-bold text-zinc-900 dark:text-white">Mentions</span>
                                            <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Alert when mentioned in groups</p>
                                         </div>
                                         <input type="checkbox" checked={profile.notificationPreferences?.mentions || false} onChange={(e) => updateDoc(doc(db, 'users', currentUser.uid), { 'notificationPreferences.mentions': e.target.checked })} className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 ml-4 bg-zinc-100" />
                                      </label>
                                   </div>
                                 </div>
                                 <div>
                                   <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-6">Device Feedback</h4>
                                   <div className="space-y-6">
                                      <label className="flex items-center justify-between cursor-pointer group">
                                         <div className="flex-1">
                                            <span className="text-[13px] font-bold text-zinc-900 dark:text-white">Vibration</span>
                                            <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Default pattern</p>
                                         </div>
                                         <input type="checkbox" checked={profile.notificationPreferences?.vibration || false} onChange={(e) => updateDoc(doc(db, 'users', currentUser.uid), { 'notificationPreferences.vibration': e.target.checked })} className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 ml-4 bg-zinc-100" />
                                      </label>
                                      <div className="flex items-center justify-between">
                                         <div className="flex-1">
                                            <span className="text-[13px] font-bold text-zinc-900 dark:text-white">Notification Sound</span>
                                            <p className="text-[10px] font-mono text-zinc-500 mt-0.5">My Messenger Default Tone</p>
                                         </div>
                                         <select 
                                           value={profile.notificationPreferences?.sound || 'Default'} 
                                           onChange={(e) => {
                                             const newTone = e.target.value;
                                             updateDoc(doc(db, 'users', currentUser.uid), { 'notificationPreferences.sound': newTone });
                                             playNotificationSound(newTone as ToneType);
                                           }}
                                           className="text-[11px] font-mono font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 outline-none uppercase tracking-widest text-zinc-900 dark:text-white"
                                         >
                                            {Object.keys(NOTIFICATION_TONES).map(tone => (
                                              <option key={tone} value={tone} className="bg-white dark:bg-zinc-900">{tone}</option>
                                            ))}
                                            <option value="Silent" className="bg-white dark:bg-zinc-900">Silent</option>
                                         </select>
                                      </div>
                                   </div>
                                 </div>
                              </div>
                           ) : activeSetting === 'ai_summaries' ? (
                               <SummaryHistory onBack={() => setActiveSetting(null)} />
                           ) : (
                               <div className="flex flex-col items-center justify-center p-12 text-zinc-400 mt-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm border-dashed">
                                 <SettingsIcon size={32} className="animate-spin mb-4 text-zinc-300" style={{ animationDuration: '3s' }} />
                                 <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-center text-zinc-500">
                                   {activeSetting} settings<br/>module offline
                                 </p>
                               </div>
                           )}
                         </motion.div>
                       )}
                     </AnimatePresence>
                  </div>
              </motion.div>
           )}
        </AnimatePresence>

        {/* Avatar and Main Actions */}
        <div className="flex flex-col items-center">
          <motion.div 
            variants={itemVariants}
            className="relative group mb-4"
          >
            <div className="relative">
               <div className="absolute inset-0 bg-white blur-xl opacity-50 rounded-full group-hover:opacity-100 transition-opacity" />
               <img
                src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                alt={profile.displayName}
                className="w-32 h-32 rounded-full border-[6px] border-[#f4f4f5] shadow-lg object-cover bg-white relative z-10"
              />
            </div>
            {isEditing && isOwnProfile && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 rounded-full cursor-pointer transition-opacity backdrop-blur-[2px]">
                <Camera className="text-white" size={24} />
              </div>
            )}
          </motion.div>

          <motion.div variants={itemVariants} className="text-center mb-6">
            {isEditing ? (
              <div className="space-y-4 max-w-sm mx-auto">
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  placeholder="Display Name"
                  className="w-full text-2xl font-bold tracking-tight text-center bg-white border border-zinc-200 rounded-xl px-4 py-2 focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 outline-none"
                />
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  placeholder="username"
                  className="w-full text-[11px] font-mono font-bold text-zinc-500 tracking-widest uppercase text-center border-none focus:ring-0 outline-none bg-transparent"
                />
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                       { label: '🌿 relaxed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                       { label: '☕ focused', color: 'bg-amber-100 text-amber-800 border-amber-200' },
                       { label: '🌊 flow', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
                       { label: '⚡ hyper', color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200' },
                    ].map((v) => (
                      <button
                        key={v.label}
                        onClick={() => setEditForm({ ...editForm, vibe: v.label, customVibe: '' })}
                        className={cn(
                          "text-[10px] font-mono font-bold px-3 py-1.5 rounded-full border transition-all transform",
                          v.color,
                          editForm.vibe === v.label && !editForm.customVibe ? "scale-105 shadow-md ring-2 ring-zinc-900 ring-offset-2" : "opacity-60 hover:opacity-100"
                        )}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 max-w-[200px] mx-auto mt-2">
                    <input
                      type="text"
                      value={editForm.customVibe}
                      onChange={(e) => setEditForm({ ...editForm, customVibe: e.target.value, vibe: '' })}
                      placeholder="Custom vibe..."
                      className="w-full text-[10px] font-mono py-1 px-3 border border-zinc-200 rounded-full focus:ring-1 outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1 flex items-center justify-center gap-2">
                  {profile.displayName}
                  {profile.isVerified && <BadgeCheck className="text-wa-primary mt-0.5" size={18} />}
                  {!isOwnProfile && isCloseFriend(targetUserId) && (
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1" title="Close Friend">
                      <Heart size={10} className="fill-emerald-500 text-emerald-500 animate-pulse" /> Enclave CF
                    </span>
                  )}
                </h2>
                <div className="flex flex-col items-center justify-center gap-2 mt-1">
                  <p className="text-zinc-500 font-mono font-bold text-[10px] uppercase tracking-widest px-3 py-1 bg-white rounded-full border border-zinc-200 shadow-sm">
                    @{profile.username}
                  </p>
                  {profile.vibe && (
                    <div className="flex flex-col items-center mt-2 group">
                       <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-[0.2em] mb-1 opacity-0 group-hover:opacity-100 transition-opacity">vibe status</span>
                       <div className="flex items-center gap-2">
                         <span className="text-[10px] font-mono font-bold px-4 py-1.5 rounded-full shadow-sm bg-white border border-zinc-200 uppercase tracking-widest flex items-center gap-2 hover:border-zinc-400 transition-colors cursor-default">
                            <span className="w-1.5 h-1.5 bg-wa-primary rounded-full animate-pulse" />
                            {profile.vibe}
                         </span>
                         <span className={cn(
                           "text-[10px] font-mono font-bold px-4 py-1.5 rounded-full shadow-sm bg-white border border-zinc-200 uppercase tracking-widest flex items-center gap-2 hover:border-zinc-400 transition-colors cursor-default",
                           profile.isOnline ? "text-wa-primary" : "text-zinc-500"
                         )}>
                           <span className={cn(
                             "w-1.5 h-1.5 rounded-full",
                             profile.isOnline ? "bg-wa-primary animate-pulse" : "bg-zinc-300"
                           )} />
                           {profile.isOnline ? 'Online' : (profile.lastSeen ? formatDistanceToNow(profile.lastSeen.toDate(), { addSuffix: true }) : 'Offline')}
                         </span>
                       </div>
                    </div>
                  )}
                  {!isOwnProfile && mutualCloseFriendIds.length > 0 && (
                    <div className="mt-4 px-4 py-2.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center max-w-sm mx-auto">
                      <p className="text-[10px] font-mono text-emerald-400 font-bold flex items-center justify-center gap-1.5 uppercase tracking-wider">
                        <Heart size={10} className="fill-emerald-500 text-emerald-500 animate-pulse" />
                        {mutualCloseFriendIds.length} mutual close {mutualCloseFriendIds.length === 1 ? 'friend' : 'friends'}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-500 mt-1 leading-normal">
                        You and {profile.displayName} both have{' '}
                        <span className="text-zinc-300 font-semibold">
                          {mutualCloseFriendsDetails.map(d => d.displayName).join(', ')}
                        </span>{' '}
                        in your Close Friends lists.
                      </p>
                    </div>
                  )}
                  {!isOwnProfile && isCloseFriend(targetUserId) && (isBirthdayToday || isBirthdaySoon) && (
                    <div className={cn(
                      "mt-4 px-4 py-3 rounded-2xl text-center max-w-sm mx-auto border",
                      isBirthdayToday 
                        ? "bg-pink-500/10 border-pink-500/20 text-pink-700" 
                        : "bg-amber-500/10 border-amber-500/20 text-amber-700"
                    )}>
                      <p className="text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 uppercase tracking-widest">
                        <Gift size={12} className={isBirthdayToday ? "text-pink-500 animate-bounce" : "text-amber-500"} />
                        {isBirthdayToday ? "🎂 Today is their birthday!" : "🎁 Birthday approaching!"}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-500 mt-1 leading-normal">
                        {isBirthdayToday 
                          ? `Celebrate with ${profile.displayName}! Send your close friend a warm greeting.` 
                          : `${profile.displayName}'s birthday is coming up soon. Be ready to celebrate!`}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="flex justify-center mb-10">
          {isOwnProfile ? (
            isEditing ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 rounded-full bg-white border border-zinc-200 text-zinc-500 font-mono font-bold text-[10px] shadow-sm uppercase tracking-widest hover:bg-zinc-50 hover:text-zinc-900 transition-all active:scale-95"
                >
                  Discard
                </button>
                <button
                  onClick={handleUpdateProfile}
                  className="px-6 py-2.5 bg-zinc-950 text-white rounded-full border border-zinc-950 font-mono font-bold text-[10px] uppercase tracking-widest shadow-md hover:bg-zinc-800 transition-all active:scale-95"
                >
                  Synchronize
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-zinc-950 text-white rounded-full border border-zinc-950 font-mono font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-md active:scale-95"
                >
                  <Edit2 size={12} />
                  Adjust Profile
                </button>
                <button 
                  onClick={() => setShowShareQr(true)}
                  className="p-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-full hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 transition-all shadow-sm active:scale-95"
                  title="Share Contact"
                >
                  <Share2 size={16} />
                </button>
                <button 
                  onClick={() => setShowPrivacySettings(prev => !prev)}
                  className="p-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-full hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 transition-all shadow-sm active:scale-95"
                  title="Config"
                >
                  <SettingsIcon size={16} />
                </button>
              </div>
            )
          ) : (
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-6 py-2.5 bg-zinc-950 text-white rounded-full border border-zinc-950 font-mono font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-md active:scale-95">
                <UserPlus size={12} />
                Connect
              </button>
              <button className="p-2.5 flex items-center justify-center bg-white border border-zinc-200 text-zinc-600 rounded-full hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 transition-all shadow-sm active:scale-95">
                <MessageCircle size={16} />
              </button>
              <button 
                onClick={handleBlockUser}
                className={cn(
                  "p-2.5 flex items-center justify-center rounded-full transition-all active:scale-95 border",
                  currentUserProfile?.blockedUsers?.includes(targetUserId)
                    ? "bg-red-500 border-red-600 text-white shadow-md"
                    : "bg-white border-zinc-200 text-zinc-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 shadow-sm"
                )}
                title="Isolate"
              >
                <ShieldOff size={16} />
              </button>
            </div>
          )}
        </motion.div>

        {/* Dynamic Grid Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* Bio Section */}
          <motion.section variants={itemVariants} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-[10px] font-mono font-bold text-zinc-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-zinc-950 rounded-full" />
                Transmission Protocol
              </h3>
              {isEditing ? (
                <textarea
                  ref={bioTextareaRef}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Bio..."
                  className="w-full bg-zinc-50 p-4 rounded-xl border border-zinc-200 focus:ring-1 focus:border-zinc-400 focus:ring-zinc-400 outline-none min-h-[100px] max-h-[150px] overflow-y-auto resize-none text-[13px] font-medium leading-relaxed"
                />
              ) : (
                <p className="text-zinc-700 text-[14px] leading-relaxed font-medium italic">
                  {(isPreviewMode && previewVisibility === 'contacts' && profile.privacySettings?.profileVisibility === 'contacts' && !currentUserProfile?.contacts?.includes(targetUserId)) 
                    ? "Content Restricted: Profile set to Contacts Only." 
                    : `"${profile.bio || "Searching for connections in the digital void."}"`}
                </p>
              )}
            </div>
          </motion.section>

          {/* Activity / Stats Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
             <motion.div variants={itemVariants} className="bg-zinc-950 p-5 rounded-3xl text-white flex flex-col justify-between shadow-xl">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">Followers</span>
                <span className="text-3xl font-bold tracking-tight mt-4 text-white">{profile.followersCount || 0}</span>
             </motion.div>
             <motion.div variants={itemVariants} className="bg-white p-5 rounded-3xl text-zinc-900 flex flex-col justify-between shadow-sm border border-zinc-200">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">Following</span>
                <span className="text-3xl font-bold tracking-tight mt-4">{profile.followingCount || 0}</span>
             </motion.div>
             <motion.div variants={itemVariants} className="bg-white p-5 rounded-3xl text-zinc-900 flex flex-col justify-between col-span-2 border border-zinc-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">Synchronized On</span>
                    <p className="text-lg font-bold tracking-tight mt-1">
                      {profile.createdAt ? format(profile.createdAt.toDate(), 'MMM yyyy') : 'Recently'}
                    </p>
                  </div>
                  <Calendar className="text-zinc-300" size={20} />
                </div>
             </motion.div>
          </div>
        </div>

        {/* Info Grid Enhancements */}
        <motion.section variants={itemVariants} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
           <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors">
              <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-700 shadow-inner border border-zinc-200">
                <MapPin size={16} />
              </div>
              <div className="flex-1">
                <span className="block text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Location</span>
                <span className="text-[13px] font-bold text-zinc-900">San Francisco, CA</span>
              </div>
           </div>
           <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors">
              <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-700 shadow-inner border border-zinc-200">
                <LinkIcon size={16} />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+1 234 567 890"
                    className="w-full bg-zinc-50 border border-zinc-200 px-2 py-1 rounded focus:ring-1 text-[13px] font-bold text-zinc-900 outline-none"
                  />
                ) : (
                  <>
                    <span className="block text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Phone Number</span>
                    <span className="text-[13px] font-bold text-zinc-900">{profile.phone || "Not linked"}</span>
                  </>
                )}
              </div>
           </div>
           <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors md:col-span-2">
              <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-700 shadow-inner border border-zinc-200">
                <Edit2 size={16} />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.about}
                    onChange={(e) => setEditForm({ ...editForm, about: e.target.value })}
                    placeholder="Set your status (e.g. Available, At Work)"
                    className="w-full bg-zinc-50 border border-zinc-200 px-2 py-1 rounded focus:ring-1 text-[13px] font-bold text-zinc-900 outline-none"
                  />
                ) : (
                  <>
                    <span className="block text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Device Status</span>
                    <span className="text-[13px] font-bold text-zinc-900">{profile.about || "Available"}</span>
                  </>
                )}
              </div>
           </div>
           <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors md:col-span-2">
              <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-700 shadow-inner border border-zinc-200">
                <Gift size={16} className="text-pink-500" />
              </div>
              <div className="flex-1 text-left">
                {isEditing ? (
                  <div className="flex flex-col gap-1 w-full text-left">
                    <span className="block text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Configure Birthday</span>
                    <input
                      type="date"
                      value={editForm.birthday || ''}
                      onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 px-2 py-1 rounded focus:ring-1 text-[13px] font-bold text-zinc-900 outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <span className="block text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Birthday</span>
                    <span className="text-[13px] font-bold text-zinc-900">
                      {profile.birthday 
                        ? format(new Date(profile.birthday + 'T00:00:00'), 'MMMM dd, yyyy') 
                        : "Not set"}
                    </span>
                  </>
                )}
              </div>
           </div>
        </motion.section>

        {/* Tabs and Grid */}
        <motion.div variants={itemVariants} className="mt-12 max-w-2xl mx-auto">
          <div className="flex justify-center gap-8 mb-6 border-b border-zinc-200">
            <button 
                onClick={() => setActiveTab('gallery')}
                className={`${activeTab === 'gallery' ? 'border-zinc-950 text-zinc-950' : 'border-transparent text-zinc-400'} pb-3 border-b-2 font-mono font-bold text-[10px] uppercase tracking-[0.1em] transition-all`}>
              Media
            </button>
            <button 
                onClick={() => setActiveTab('vault')}
                className={`${activeTab === 'vault' ? 'border-zinc-950 text-zinc-950' : 'border-transparent text-zinc-400 hover:text-zinc-600'} pb-3 border-b-2 font-mono font-bold text-[10px] uppercase tracking-[0.1em] transition-all`}>
              Vault
            </button>
          </div>

          <motion.div 
             variants={containerVariants}
             className={activeTab === 'gallery' ? "grid grid-cols-3 gap-1 sm:gap-2" : "flex flex-col gap-3"}
          >
            {activeTab === 'gallery' ? (
               [1, 2, 3, 4, 5, 6].map((i) => (
                 <motion.div 
                   key={i}
                   variants={itemVariants}
                   whileHover={{ scale: 1.02 }}
                   className="aspect-square bg-zinc-100 rounded-xl border border-zinc-200 shadow-sm overflow-hidden relative group cursor-pointer"
                 >
                   <img 
                     src={`https://picsum.photos/seed/nexus${i}/500`} 
                     className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                     alt="Post"
                   />
                   <div className="absolute inset-0 bg-zinc-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-zinc-900 scale-90 group-hover:scale-100 transition-transform">
                         <ImageIcon size={16} />
                      </div>
                   </div>
                 </motion.div>
               ))
            ) : (
                <div 
                  onMouseMove={recordVaultActivity}
                  onClick={recordVaultActivity}
                  onKeyDown={recordVaultActivity}
                  onDoubleClick={() => {
                    if (vaultUnlocked) {
                      setVaultUnlocked(false);
                      setVaultPasswordInput('');
                      setToast({ message: "Vault secured via gesture", type: 'success' });
                    }
                  }}
                  className="bg-[#fbf7f3] border border-zinc-200 rounded-2xl p-4 shadow-sm relative overflow-hidden min-h-[300px] flex flex-col items-center justify-center cursor-default"
                >
                   <AnimatePresence mode="wait">
                     {!vaultUnlocked && isOwnProfile ? (
                       <motion.div 
                         initial={{ opacity: 0, scale: 0.9 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.9 }}
                         className="flex flex-col items-center gap-4 p-8 relative z-10 w-full"
                       >
                          <div className="relative">
                            <Lock className={cn("text-wa-primary w-12 h-12 transition-transform duration-500", isBiometricScanning && "scale-110 animate-pulse")} />
                            {isBiometricScanning && (
                              <motion.div 
                                initial={{ top: 0 }}
                                animate={{ top: '100%' }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                className="absolute left-0 right-0 h-0.5 bg-wa-primary shadow-[0_0_10px_#25D366]"
                              />
                            )}
                          </div>
                          <div className="text-center">
                             <h4 className="text-[14px] font-bold text-zinc-900">Vault Encrypted</h4>
                             <p className="text-[10px] font-mono text-zinc-500 uppercase mt-1 tracking-widest">
                               {isBiometricScanning ? "Scanning Biometrics..." : "Authentication Required"}
                             </p>
                          </div>
                          
                          <div className="flex flex-col gap-3 w-full max-w-[200px]">
                            <div className="space-y-2">
                              <input 
                                type="password"
                                maxLength={4}
                                value={vaultPasswordInput}
                                onChange={(e) => setVaultPasswordInput(e.target.value)}
                                placeholder="ENTER PIN"
                                className="w-full text-center py-3 px-3 bg-white border border-zinc-200 rounded-2xl font-mono text-lg tracking-[0.5em] shadow-inner outline-none focus:ring-1 focus:ring-wa-primary transition-all"
                              />
                              <button 
                                onClick={checkVaultUnlock}
                                disabled={isBiometricScanning}
                                className="w-full py-3 bg-zinc-900 text-white rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
                              >
                                Manual Unlock
                              </button>
                            </div>

                            <div className="flex items-center gap-2 py-2">
                              <div className="flex-1 h-px bg-zinc-200" />
                              <span className="text-[8px] font-mono font-black text-zinc-400 uppercase tracking-tighter">OR</span>
                              <div className="flex-1 h-px bg-zinc-200" />
                            </div>

                            <button 
                              onClick={simulateBiometric}
                              disabled={isBiometricScanning}
                              className="w-full py-3 bg-white border border-wa-primary text-wa-primary rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-wa-primary/5 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-sm"
                            >
                              <ScanLine size={14} />
                              Biometric Scan
                            </button>
                          </div>
                       </motion.div>
                     ) : (
                       <motion.div
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         className="w-full h-full"
                       >
                          <div className="flex justify-between items-center mb-6 px-2">
                             <div className="relative flex-1 mr-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                                <input type="text" placeholder="Search Vault..." className="w-full bg-white/70 backdrop-blur border border-zinc-200 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:ring-1 focus:ring-zinc-400 outline-none shadow-sm" />
                             </div>
                             <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => {
                                    setVaultUnlocked(false);
                                    setVaultPasswordInput('');
                                    setToast({ message: "Vault quick-hidden", type: 'success' });
                                  }}
                                  className="px-4 py-2 bg-red-500/10 text-red-600 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-2"
                                  title="Quick Hide (ESC)"
                                >
                                   <EyeOff size={14} />
                                   Quick Hide
                                </button>
                                <button 
                                  onClick={() => setVaultUnlocked(false)}
                                  className="p-2.5 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-zinc-600 transition-colors"
                                  title="Lock Vault"
                                >
                                   <Lock size={16} />
                                </button>
                             </div>
                          </div>
                          <div className="flex flex-col items-center justify-center min-h-[220px]">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-zinc-100 mb-4">
                               <Bookmark className="text-zinc-300 w-8 h-8" />
                            </div>
                                                         <div className="overflow-y-auto max-h-[250px] w-full px-2 space-y-3 scrollbar-none">
                             {loadingVault ? (
                               <div className="flex justify-center items-center py-12 text-zinc-400 gap-2 font-mono">
                                 <Loader2 className="animate-spin text-zinc-500" size={16} />
                                 <span>Unlocking Vault...</span>
                               </div>
                             ) : vaultItems.filter(item => 
                               item.title?.toLowerCase().includes(vaultSearch.toLowerCase()) || 
                               item.content?.toLowerCase().includes(vaultSearch.toLowerCase())
                             ).length > 0 ? (
                               vaultItems.filter(item => 
                                 item.title?.toLowerCase().includes(vaultSearch.toLowerCase()) || 
                                 item.content?.toLowerCase().includes(vaultSearch.toLowerCase())
                               ).map((item) => (
                                 <div key={item.id} className="p-4 bg-white border border-zinc-100 rounded-xl flex items-center justify-between shadow-sm hover:border-zinc-200 transition-all text-left">
                                   <div className="flex items-start gap-3">
											  <div className="p-2.5 bg-zinc-50 rounded-xl text-zinc-500 border border-zinc-100 flex-shrink-0 mt-0.5">
												{item.type === 'password' ? <Key size={14} /> : item.type === 'media' ? <ImageIcon size={14} /> : <Bookmark size={14} />}
											  </div>
											  <div className="text-left flex-1 min-w-0">
												<div className="flex items-center gap-2">
												  <h5 className="text-[12px] font-bold text-zinc-900 truncate">{item.title}</h5>
												  <span className="px-1.5 py-0.5 bg-zinc-100 rounded text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-wider">{item.type}</span>
												</div>
												{item.type === 'media' ? (
												  <div className="mt-2 relative group w-40 h-24 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-950 cursor-pointer shadow-sm active:scale-95 transition-all" onClick={() => setLightboxImage(item.content)}>
													<img src={item.content} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="vault media" referrerPolicy="no-referrer" />
													<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1 px-2 flex justify-between items-center z-10">
													  <span className="text-[8px] font-mono font-bold text-white uppercase tracking-wider">Decrypt File</span>
													  <ScanLine size={10} className="text-zinc-400 group-hover:text-emerald-400 animate-pulse" />
													</div>
													<div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-100 group-hover:opacity-0 transition-opacity">
													  <Lock size={12} className="text-white/80" />
													</div>
												  </div>
												) : (
												  <p className="text-[11px] text-zinc-600 font-sans mt-0.5 whitespace-pre-wrap break-all">{item.content}</p>
												)}
											  </div>
											</div>
                                   <button 
                                     onClick={() => handleDeleteVaultItem(item.id)}
                                     className="p-2 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                                     title="Purged Item"
                                   >
                                     <Trash2 size={14} />
                                   </button>
                                 </div>
                               ))
                             ) : (
                               <div className="flex flex-col items-center justify-center py-12">
                                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-zinc-100 mb-4">
                                    <Bookmark className="text-zinc-300 w-6 h-6" />
                                 </div>
                                 <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-zinc-400">Vault Empty</p>
                                 <p className="text-[10px] text-zinc-500 mt-2 text-center max-w-[200px] font-medium leading-relaxed">Your encrypted vault is currently silent. Secure cards or notes here.</p>
                               </div>
                             )}
                           </div>

                           <div className="mt-6 flex items-center justify-center gap-2">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              <span className="text-[8px] font-mono font-bold text-emerald-600 uppercase tracking-[0.2em]">Auto-locking active</span>
                           </div>

                           <AnimatePresence>
                             {showAddVaultModal && (
                               <motion.div 
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 exit={{ opacity: 0 }}
                                 className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                               >
                                 <motion.div 
                                   initial={{ scale: 0.95, y: 15 }}
                                   animate={{ scale: 1, y: 0 }}
                                   exit={{ scale: 0.95, y: 15 }}
                                   className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xl w-full max-w-sm text-left relative z-[120]"
                                 >
                                   <div className="flex justify-between items-center mb-4">
                                     <div className="flex items-center gap-2">
                                       <Lock className="text-zinc-900" size={16} />
                                       <h4 className="text-sm font-bold text-zinc-900 font-mono uppercase tracking-wider">Deposit Item</h4>
                                     </div>
                                     <button onClick={() => setShowAddVaultModal(false)} className="p-1 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-650 cursor-pointer">
                                       <X size={16} />
                                     </button>
                                   </div>
                                   
                                   <form onSubmit={handleAddVaultItem} className="space-y-4">
                                     <div>
                                       <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1">Title</label>
                                       <input 
                                         type="text" 
                                         required 
                                         value={newVaultItem.title} 
                                         onChange={(e) => setNewVaultItem(prev => ({ ...prev, title: e.target.value }))}
                                         placeholder="e.g. Encryption PIN"
                                         className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-zinc-400"
                                       />
                                     </div>
                                     <div>
                                       <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1">Type</label>
                                       <select 
                                         value={newVaultItem.type} 
                                         onChange={(e) => setNewVaultItem(prev => ({ ...prev, type: e.target.value, content: '' }))}
                                         className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-zinc-400"
                                       >
                                         <option value="note">Secure Note</option>
                                         <option value="password">Password/PIN</option>
                                         <option value="key">Cryptographic Key</option>
                                         <option value="media">Secure Media (Photo/Video File)</option>
                                       </select>
                                     </div>
                                     <div>
                                       <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1">Content</label>
                                       {newVaultItem.type === 'media' ? (
										  <div className="flex flex-col gap-2">
											{/* Preset Grid */}
											<div className="grid grid-cols-3 gap-1.5 mb-2">
											  {[
												{ name: 'Quantum Core', url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=150&auto=format&fit=crop&q=60' },
												{ name: 'Stealth drone', url: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=150&auto=format&fit=crop&q=60' },
												{ name: 'Node Key', url: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=150&auto=format&fit=crop&q=60' }
											  ].map(preset => (
												<button
												  type="button"
												  key={preset.name}
												  onClick={() => setNewVaultItem(prev => ({ ...prev, url: preset.url, content: preset.url }))}
												  className={cn(
													"p-1.5 border rounded-lg text-[8px] font-mono font-black uppercase text-center truncate hover:bg-zinc-50 cursor-pointer",
													newVaultItem.content === preset.url ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-zinc-200 text-zinc-500"
												  )}
												>
												  {preset.name}
												</button>
											  ))}
											</div>
											
											{/* File uploader */}
											<div className="relative border-2 border-dashed border-zinc-200 hover:border-zinc-300 rounded-xl p-4 text-center cursor-pointer transition-all">
											  <input 
												type="file" 
												accept="image/*,video/*"
												className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
												onChange={(e) => {
												  const file = e.target.files?.[0];
												  if (file) {
													const reader = new FileReader();
													reader.onloadend = () => {
													  const dataUrl = reader.result as string;
													  setNewVaultItem(prev => ({ ...prev, content: dataUrl, url: dataUrl }));
													  setToast({ message: "Media encrypted in secure enclave", type: 'success' });
													};
													reader.readAsDataURL(file);
												  }
												}}
											  />
											  <div className="flex flex-col items-center gap-1">
												<div className="p-2 bg-zinc-50 rounded-full text-zinc-400">
												  <Camera size={16} />
												</div>
												<span className="text-[10px] font-bold text-zinc-600">Click or drag to secure media</span>
												<span className="text-[8px] text-zinc-400 font-mono">Real-time local sandbox encryption</span>
											  </div>
											</div>

											{newVaultItem.content && (
											  <div className="relative border border-zinc-200 rounded-lg overflow-hidden h-14 bg-zinc-50 flex items-center justify-between p-1.5 mt-1">
												<div className="flex items-center gap-2">
												  <img src={newVaultItem.content} className="w-10 h-10 object-cover rounded shadow" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
												  <span className="text-[9px] font-mono text-zinc-500 truncate max-w-[150px]">Enclave Media Encrypted</span>
												</div>
												<button 
												  type="button" 
												  onClick={() => setNewVaultItem(prev => ({ ...prev, content: '' }))}
												  className="p-1 hover:bg-zinc-200 rounded-md text-red-500 cursor-pointer"
												>
												  <X size={12} />
												</button>
											  </div>
											)}
										  </div>
										) : (
										  <textarea 
											required 
											rows={3}
											value={newVaultItem.content} 
											onChange={(e) => setNewVaultItem(prev => ({ ...prev, content: e.target.value }))}
											placeholder="Enter vault details..."
											className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-zinc-400 resize-none font-sans"
										  />
										)}
                                     </div>
                                     <button 
                                       type="submit"
                                       className="w-full py-3 bg-zinc-950 text-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
                                     >
                                        Deposit Item
                                     </button>
                                   </form>
                                 </motion.div>
                               </motion.div>
                             )}
                           </AnimatePresence>
                            
                            <div className="mt-8 flex items-center gap-2">
                               <div className="w-1.5 h-1.5 bg-wa-primary rounded-full animate-pulse" />
                               
                            </div>
                          </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                   {/* Background pattern for vault */}
                   <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Biometric Enclave Image Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-4"
          >
            {/* Holographic Glowing Border Container */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-black/80 border border-emerald-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(16,185,129,0.2)] max-w-lg w-full flex flex-col items-center relative"
            >
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-2 bg-zinc-900 border border-zinc-805 rounded-full text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Secure Scanning HUD header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[10px] font-mono font-black text-emerald-400 tracking-widest uppercase">Biometric Vault - Enclave Media Sandboxed</span>
              </div>

              {/* Interactive scanning container */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                <img
                  src={lightboxImage}
                  alt="Vault decrypted"
                  className="max-w-full max-h-full object-contain filter brightness-110 saturate-110 select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                />

                {/* Laser scan line overlay */}
                <motion.div
                  initial={{ top: '0%' }}
                  animate={{ top: '100%' }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80 shadow-[0_0_12px_rgba(52,211,153,1)] pointer-events-none"
                />

                {/* Dynamic grid HUD overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_94%,rgba(16,185,129,0.15)_95%),linear-gradient(90deg,rgba(18,18,18,0)_94%,rgba(16,185,129,0.15)_95%)] bg-[size:20px_20px] pointer-events-none opacity-40" />
              </div>

              <div className="mt-4 flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Sandbox-Protected Decryption</span>
                <p className="text-[10px] text-zinc-400 text-center max-w-[320px]">This asset is decrypted in volatile memory only and is completely isolated from persistent browser cookies or caching systems.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
