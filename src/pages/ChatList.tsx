import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NexusFeed from '../components/NexusFeed';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { 
  Search, 
  Plus, 
  X, 
  Users, 
  Star, 
  Pin, 
  PinOff, 
  Sparkles, 
  Archive, 
  ArchiveRestore, 
  Trash2, 
  QrCode, 
  Camera, 
  ShieldAlert, 
  Terminal, 
  Megaphone, 
  Compass, 
  Video, 
  Phone, 
  User, 
  Mic, 
  MicOff, 
  Lock, 
  Unlock, 
  Settings, 
  Grid, 
  List, 
  Layers, 
  Bell,
  Sparkle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow, isToday, format } from 'date-fns';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { subscribeToStatuses, postStatus, viewStatus } from '../services/statusService';
import { uploadFile } from '../services/storageService';
import { Html5Qrcode } from 'html5-qrcode';
import { ToneType, playNotificationSound } from '../lib/tones';
import { UnreadBadge } from '../components/UnreadBadge';
import { useDraftPreviews } from '../hooks/useDraftPreviews';
import { InviteBanner } from '../components/InviteBanner';
import { useSubscription } from '../hooks/useSubscription';
import { PremiumModal } from '../components/PremiumModal';
import CreateGroupModal from '../components/CreateGroupModal';
import { usePeaceMode } from '../hooks/usePeaceMode';
import PeaceModeBanner from '../components/PeaceModeBanner';
import { useChannels } from '../hooks/useChannels';
import { CreateChannelModal } from '../components/CreateChannelModal';
import { useChatSummary } from '../hooks/useChatSummary';
import ChatSummaryModal from '../components/ChatSummaryModal';

// Redesigned components
import NexusHeader from '../components/NexusHeader';
import FloatingSearch from '../components/FloatingSearch';
import SmartFolders from '../components/SmartFolders';
import EmptyState from '../components/EmptyState';
import PinnedChats from '../components/PinnedChats';
import StoriesStrip from '../components/StoriesStrip';
import { StatusCreationModal } from '../components/StatusCreationModal';
import QuickActionsFAB from '../components/QuickActionsFAB';
import ChatListItem from '../components/ChatListItem';
import AccessRequestModal from '../components/AccessRequestModal';
import { useChatListLayout, ChatListView, SortMode } from '../hooks/useChatListLayout';
import { UnifiedInbox } from '../components/email/UnifiedInbox';

// Web Speech API typescript helpers
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function ChatList() {
  const { user, logout } = useAuth();
  const { isEnabled: isPeaceModeActive, enable: enablePeaceMode, disable: disablePeaceMode } = usePeaceMode();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const showNexusFeed = searchParams.get('feed') === 'true';

  const setShowNexusFeed = (val: boolean) => {
    if (val) setSearchParams({ feed: 'true' });
    else setSearchParams({});
  };

  const { theme, messageLayout, bubbleColor, toggleTheme } = useTheme();
  const { isPremium } = useSubscription();
  const { layout, setLayout, sortMode, setSortMode } = useChatListLayout();
  
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [showPremiumUpsell, setShowPremiumUpsell] = useState(false);
  const drafts = useDraftPreviews();
  
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [typingChats, setTypingChats] = useState<Record<string, string[]>>({});
  const lastPlayedMessageIdsRef = useRef<Record<string, any>>({});
  const [statuses, setStatuses] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [userChatsSubCollection, setUserChatsSubCollection] = useState<Record<string, { pinned?: boolean }>>({});

  const { subscribedChannels, ownedChannels, loading: channelsLoading } = useChannels();
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  const [selectedChatForSummary, setSelectedChatForSummary] = useState<string | null>(null);
  const [isListSummaryOpen, setIsListSummaryOpen] = useState(false);
  const [listSummaryData, setListSummaryData] = useState<any>(null);
  const [listSummaryError, setListSummaryError] = useState<string | null>(null);
  const [listToast, setListToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [uploadingStatus, setUploadingStatus] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeStatusIndex, setActiveStatusIndex] = useState(0);

  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [showStarred, setShowStarred] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  // QR Code states
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isLowLight, setIsLowLight] = useState(false);
  const [recentScans, setRecentScans] = useState<{id: string, data: string, timestamp: number}[]>([]);
  const [scanWarning, setScanWarning] = useState<string | null>(null);
  const [cloudScanHistory, setCloudScanHistory] = useState<any[]>([]);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // Avatar Long Press States
  const avatarLongPressTimeoutRef = useRef<any>(null);
  const [avatarLongPressing, setAvatarLongPressing] = useState(false);

  // Auto-clear toast alert
  useEffect(() => {
    if (listToast) {
      const t = setTimeout(() => setListToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [listToast]);

  const { generateSummary, pinSummary, unpinSummary } = useChatSummary(selectedChatForSummary || '');

  // Handle avatar click logic with long press detection
  const handleAvatarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setAvatarLongPressing(false);
    avatarLongPressTimeoutRef.current = setTimeout(() => {
      setAvatarLongPressing(true);
      if (isPeaceModeActive) {
        disablePeaceMode();
        setListToast({ message: "Neural relays re-established. Alerts online.", type: 'success' });
      } else {
        enablePeaceMode();
        setListToast({ message: "Peace Mode engaged. Frequencies silenced.", type: 'info' });
      }
    }, 700);
  };

  const handleAvatarMouseUp = (e: React.MouseEvent) => {
    if (avatarLongPressTimeoutRef.current) {
      clearTimeout(avatarLongPressTimeoutRef.current);
    }
    if (!avatarLongPressing) {
      navigate('/profile');
    }
    setAvatarLongPressing(false);
  };

  const handleAvatarTouchStart = (e: React.TouchEvent) => {
    setAvatarLongPressing(false);
    avatarLongPressTimeoutRef.current = setTimeout(() => {
      setAvatarLongPressing(true);
      if (isPeaceModeActive) {
        disablePeaceMode();
        setListToast({ message: "Neural relays re-established. Alerts online.", type: 'success' });
      } else {
        enablePeaceMode();
        setListToast({ message: "Peace Mode engaged. Frequencies silenced.", type: 'info' });
      }
    }, 700);
  };

  const handleAvatarTouchEnd = (e: React.TouchEvent) => {
    if (avatarLongPressTimeoutRef.current) {
      clearTimeout(avatarLongPressTimeoutRef.current);
    }
    if (!avatarLongPressing) {
      navigate('/profile');
    }
    setAvatarLongPressing(false);
  };

  // Setup unread count snapshots
  useEffect(() => {
    if (!user || chats.length === 0) return;

    const unsubscribes: (() => void)[] = [];

    chats.forEach(chat => {
      const collectionName = chat.isGroup ? 'groupChat' : 'chats';
      const messagesRef = collection(db, collectionName, chat.id, 'messages');
      const q = query(messagesRef, where('status', '!=', 'read'));

      const unsub = onSnapshot(q, (snapshot) => {
        const undeliveredMsgs = snapshot.docs.filter(docSnap => {
          const data = docSnap.data();
          return data.senderId !== user.uid && data.status === 'sent';
        });

        if (undeliveredMsgs.length > 0) {
          const batch = writeBatch(db);
          undeliveredMsgs.forEach(docSnap => {
            batch.update(docSnap.ref, { status: 'delivered' });
          });
          batch.commit().catch(err => console.warn(`Failed to mark delivered for ${chat.id}:`, err));
        }

        const count = snapshot.docs.filter(docSnap => {
          const data = docSnap.data();
          let hasRead = false;
          if (data.readBy) {
            if (Array.isArray(data.readBy)) {
              hasRead = data.readBy.includes(user.uid);
            } else if (typeof data.readBy === 'object') {
              hasRead = user.uid in data.readBy;
            }
          }
          return data.senderId !== user.uid && !hasRead;
        }).length;
        
        setUnreadCounts(prev => ({ ...prev, [chat.id]: count }));
      }, (err) => {
        console.warn(`Unread subscription failed for ${chat.id}:`, err);
        setUnreadCounts(prev => ({ ...prev, [chat.id]: 0 }));
      });

      unsubscribes.push(unsub);

      // Listen to typing indicators
      const typingRef = collection(db, collectionName, chat.id, 'typing');
      const unsubTyping = onSnapshot(typingRef, (snapshot) => {
        const typers: string[] = [];
        const now = Date.now();
        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.isTyping && docSnap.id !== user.uid) {
            let isFresh = true;
            if (data.updatedAt) {
              const updatedAtMs = data.updatedAt.toDate
                ? data.updatedAt.toDate().getTime()
                : new Date(data.updatedAt).getTime();
              if (now - updatedAtMs > 10000) isFresh = false;
            }
            if (isFresh) typers.push(data.displayName || 'Someone');
          }
        });
        setTypingChats(prev => ({ ...prev, [chat.id]: typers }));
      }, (err) => {
        console.warn(`Typing subscription failed for ${chat.id}:`, err);
      });

      unsubscribes.push(unsubTyping);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [chats, user]);

  // Subscribe to current user profile settings
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
       if (docSnap.exists()) setUserData(docSnap.data());
    });
  }, [user]);

  // Subscribe to current user chats sub-collection for pinned field
  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, 'users', user.uid, 'chats'), (snapshot) => {
      const data: Record<string, { pinned?: boolean }> = {};
      snapshot.forEach((doc) => {
        data[doc.id] = doc.data() as { pinned?: boolean };
      });
      setUserChatsSubCollection(data);
    }, (error) => {
      console.error("Error subscribing to user chats subcollection:", error);
    });
  }, [user]);

  // Subscribe to chats and statuses list
  useEffect(() => {
    if (!user) return;

    // Fetch contacts
    const fetchContacts = async () => {
       const q = query(collection(db, 'users', user.uid, 'contacts'));
       const snap = await getDocs(q);
       setAvailableContacts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchContacts();

    // Personal chats
    const qPersonal = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessage.createdAt', 'desc'),
      limit(50)
    );

    // Group chats
    const qGroup = query(
      collection(db, 'groupChat'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessage.createdAt', 'desc'),
      limit(50)
    );

    let personalChats: any[] = [];
    let groupChats: any[] = [];

    const mergeAndSetChats = () => {
      const allChats = [...personalChats, ...groupChats];
      const seenIds = new Set();
      const uniqueChats = allChats.filter(chat => {
        if (seenIds.has(chat.id)) return false;
        seenIds.add(chat.id);
        return true;
      });

      // Sort by lastMessage.createdAt descending
      uniqueChats.sort((a, b) => {
        const timeA = a.lastMessage?.createdAt?.toMillis?.() || (a.lastMessage?.createdAt?.seconds * 1000) || 0;
        const timeB = b.lastMessage?.createdAt?.toMillis?.() || (b.lastMessage?.createdAt?.seconds * 1000) || 0;
        return timeB - timeA;
      });

      // Play sound for incoming unread messages if sound enabled
      uniqueChats.forEach(chat => {
        const lastMsg = chat.lastMessage;
        if (lastMsg && lastMsg.senderId !== user.uid && lastMsg.createdAt) {
          const timestampId = lastMsg.createdAt?.toMillis?.() || lastMsg.createdAt?.seconds;
          if (timestampId && lastPlayedMessageIdsRef.current[chat.id] !== timestampId) {
             const msgTime = lastMsg.createdAt?.toMillis?.() || (lastMsg.createdAt?.seconds * 1000);
             if (Date.now() - msgTime < 60000 && !isPeaceModeActive) {
               const tone = userData?.notificationSettings?.[chat.id]?.tone || userData?.notificationPreferences?.sound || 'Default';
               playNotificationSound(tone as ToneType);
             }
             lastPlayedMessageIdsRef.current[chat.id] = timestampId;
          }
        }
      });

      setChats(uniqueChats);
    };

    const unsubChats = onSnapshot(qPersonal, (snapshot) => {
      personalChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      mergeAndSetChats();
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'chats');
    });

    const unsubGroups = onSnapshot(qGroup, (snapshot) => {
      groupChats = snapshot.docs.map(doc => ({ id: doc.id, isGroup: true, ...doc.data() }));
      mergeAndSetChats();
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'groupChat');
    });

    const unsubStatuses = subscribeToStatuses((newStatuses) => {
      const filtered = newStatuses.filter(story => {
        if (story.userId === user?.uid) return true;
        if (!story.audience || story.audience === 'public') return true;
        if (story.audience === 'close-friends') {
          return Array.isArray(story.visibleTo) && story.visibleTo.includes(user?.uid);
        }
        return true;
      });
      setStatuses(filtered);
    });

    return () => {
      unsubChats();
      unsubGroups();
      unsubStatuses();
    };
  }, [user, isPeaceModeActive, userData]);

  // Handle post status
  const handlePostStatus = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setUploadingStatus(true);
      const url = await uploadFile(file, 'statuses');
      await postStatus(user.uid, user.displayName || 'Cadet', user.photoURL || '', 'image', url);
      setListToast({ message: "Status uploaded successfully", type: 'success' });
    } catch (err) {
      console.error("Status upload failed", err);
      setListToast({ message: "Upload failed. Verify signal.", type: 'error' });
    } finally {
      setUploadingStatus(false);
    }
  };

  const openStatus = (index: number) => {
    setActiveStatusIndex(index);
    setViewerOpen(true);
    if (user) {
      viewStatus(statuses[index].id, user.uid);
    }
  };

  const nextStatus = useCallback(() => {
    if (activeStatusIndex < statuses.length - 1) {
      const nextIdx = activeStatusIndex + 1;
      setActiveStatusIndex(nextIdx);
      if (user) viewStatus(statuses[nextIdx].id, user.uid);
    } else {
      setViewerOpen(false);
    }
  }, [activeStatusIndex, statuses, user]);

  const prevStatus = useCallback(() => {
    if (activeStatusIndex > 0) {
      setActiveStatusIndex(activeStatusIndex - 1);
    }
  }, [activeStatusIndex]);

  // Voice Search dictation with Web Speech API
  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setListToast({ message: "Voice protocol unsupported on this terminal.", type: 'info' });
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      setListToast({ message: "Listening... speak now", type: 'info' });
    };

    rec.onerror = (e: any) => {
      console.error("Speech error", e);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setSearchTerm(transcript);
      setListToast({ message: `Searching: "${transcript}"`, type: 'success' });
    };

    rec.start();
  };

  // QR Code Reader implementation
  const startQRScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode("chatlist-qr-reader");
      qrScannerRef.current = html5QrCode;
      const qrConfig = { fps: 10, qrbox: { width: 250, height: 250 } };
      await html5QrCode.start({ facingMode: "environment" }, qrConfig, onScanSuccess, () => {});
      if (isTorchOn) {
        await html5QrCode.applyVideoConstraints({ advanced: [{ torch: true } as any] });
      }
    } catch (err) {
      console.error("QR start failed", err);
      setShowQRScanner(false);
    }
  };

  const stopQRScanner = async () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current = null;
        setIsTorchOn(false);
      } catch (err) {
        console.error("QR stop failed", err);
      }
    }
  };

  const toggleTorch = async () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      try {
        const newState = !isTorchOn;
        await qrScannerRef.current.applyVideoConstraints({ advanced: [{ torch: newState } as any] });
        setIsTorchOn(newState);
      } catch (err) {
        console.warn("Torch failed:", err);
      }
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    try {
      await addDoc(collection(db, 'scanHistory'), {
        data: decodedText,
        userId: user?.uid,
        timestamp: serverTimestamp(),
        metadata: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          source: 'NexusChatList'
        }
      });

      const isTrusted = decodedText.startsWith('user:') || decodedText.startsWith('group:');
      if (isTrusted) {
        setShowSuccessFlash(true);
        setTimeout(() => setShowSuccessFlash(false), 800);
      }

      if (!isTrusted) {
        setScanWarning("Unrecognized Matrix Key: Compromised connection threat.");
        return;
      }

      setScanWarning(null);
      await stopQRScanner();
      setShowQRScanner(false);

      if (decodedText.startsWith('user:')) {
        const peerId = decodedText.split(':')[1];
        const chatId = [user?.uid, peerId].sort().join('_');
        navigate(`/chats/${chatId}`);
      } else if (decodedText.startsWith('group:')) {
        const gid = decodedText.split(':')[1];
        await updateDoc(doc(db, 'chats', gid), {
           participants: arrayUnion(user?.uid)
        });
        navigate(`/chats/${gid}`);
      }
    } catch (err) {
      console.error("QR processing error", err);
    }
  };

  useEffect(() => {
    if (showQRScanner) {
      startQRScanner();
    } else {
      stopQRScanner();
    }
    return () => { stopQRScanner(); };
  }, [showQRScanner]);

  // Filtering chats
  const filteredChats = useMemo(() => {
    if (!Array.isArray(chats)) return [];
    return chats.filter(chat => {
      if (!chat) return false;

      // Filter out blocked users
      if (userData?.blockedUsers && chat.participants && !chat.isGroup) {
        const peerId = chat.participants.find((p: string) => p !== user?.uid);
        if (peerId && Array.isArray(userData.blockedUsers) && userData.blockedUsers.includes(peerId)) {
          return false;
        }
      }

      const isArchived = Array.isArray(userData?.archivedChats) && userData.archivedChats.includes(chat.id);
      const isDeleted = Array.isArray(userData?.deletedChats) && userData.deletedChats.includes(chat.id);
      if (isDeleted) return false;

      // Smart Folder categorization
      if (activeFolder === 'unread') {
        const count = unreadCounts[chat.id] || 0;
        if (count === 0) return false;
      } else if (activeFolder === 'groups') {
        if (!(chat.isGroup || chat.type === 'group') || chat.isChannel || chat.isCommunity) return false;
      } else if (activeFolder === 'favorites') {
        const isFav = Array.isArray(userData?.favoriteChats) && userData.favoriteChats.includes(chat.id);
        if (!isFav) return false;
      } else if (activeFolder === 'work') {
        const isWork = Array.isArray(userData?.workChats) && userData.workChats.includes(chat.id);
        if (!isWork) return false;
      } else if (activeFolder === 'personal') {
        const isPersonal = Array.isArray(userData?.personalChats) && userData.personalChats.includes(chat.id);
        if (!isPersonal) return false;
      } else if (activeFolder === 'channels') {
        if (!chat.isChannel) return false;
      }

      // Search filters
      const searchLower = searchTerm.toLowerCase().trim();
      if (searchLower) {
        const nameMatch = (chat.groupName || chat.name || chat.peerName || '').toLowerCase().includes(searchLower);
        const msgMatch = (chat.lastMessage?.text || '').toLowerCase().includes(searchLower);
        return nameMatch || msgMatch;
      }

      return !isArchived;
    });
  }, [chats, userData, activeFolder, searchTerm, user?.uid, unreadCounts]);

  // Sorted list applying Pinned chats and Custom SortMode
  const sortedFinalChats = useMemo(() => {
    const finalDisplayChats = [...filteredChats];

    // AI Companion injecting if looking for all
    if (user && !finalDisplayChats.some(c => c?.id === `ai_companion_${user.uid}`) && activeFolder === 'all' && !searchTerm) {
      finalDisplayChats.unshift({
         id: `ai_companion_${user.uid}`,
         peerName: 'Peace AI',
         groupPhoto: 'https://images.unsplash.com/photo-1675271591211-126ad94e495d?q=80&w=200&auto=format&fit=crop',
         lastMessage: { text: 'Peace AI workspace sandbox active. Ask me anything.', createdAt: { toDate: () => new Date() } as any },
         isPinned: true
      });
    }

    return finalDisplayChats.sort((a, b) => {
      if (!a || !b) return 0;

      // Always float Peace AI to the top
      if (user) {
        if (a.id === `ai_companion_${user.uid}`) return -1;
        if (b.id === `ai_companion_${user.uid}`) return 1;
      }

      // 1. PINNED CHECK
      const isAPinned = userChatsSubCollection[a.id]?.pinned || (Array.isArray(userData?.pinnedChats) && userData.pinnedChats.includes(a.id)) || a.isPinned;
      const isBPinned = userChatsSubCollection[b.id]?.pinned || (Array.isArray(userData?.pinnedChats) && userData.pinnedChats.includes(b.id)) || b.isPinned;

      if (isAPinned && !isBPinned) return -1;
      if (!isAPinned && isBPinned) return 1;

      // 2. SORT MODES
      if (sortMode === 'unread') {
        const countA = unreadCounts[a.id] || 0;
        const countB = unreadCounts[b.id] || 0;
        if (countA !== countB) return countB - countA;
      } else if (sortMode === 'ai-priority') {
        // High priority: Unread first, followed by favorites, then timestamps
        const isAFav = Array.isArray(userData?.favoriteChats) && userData.favoriteChats.includes(a.id);
        const isBFav = Array.isArray(userData?.favoriteChats) && userData.favoriteChats.includes(b.id);
        const scoreA = (unreadCounts[a.id] ? 10 : 0) + (isAFav ? 5 : 0);
        const scoreB = (unreadCounts[b.id] ? 10 : 0) + (isBFav ? 5 : 0);
        if (scoreA !== scoreB) return scoreB - scoreA;
      }

      const dateA = a.lastMessage?.createdAt?.toDate ? a.lastMessage.createdAt.toDate() : new Date(0);
      const dateB = b.lastMessage?.createdAt?.toDate ? b.lastMessage.createdAt.toDate() : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredChats, userData, userChatsSubCollection, user, sortMode, unreadCounts, activeFolder, searchTerm]);

  // Extracts pinned chats specifically for our Pinned scroll component
  const pinnedChatsData = useMemo(() => {
    return chats
      .filter(chat => {
        const isPinned = userChatsSubCollection[chat.id]?.pinned || (Array.isArray(userData?.pinnedChats) && userData.pinnedChats.includes(chat.id)) || chat.isPinned;
        const isDeleted = Array.isArray(userData?.deletedChats) && userData.deletedChats.includes(chat.id);
        return isPinned && !isDeleted;
      })
      .map(chat => ({
        id: chat.id,
        name: chat.groupName || chat.peerName || 'Direct Node',
        avatar: chat.groupPhoto || chat.photoURL,
        isOnline: chat.isOnline,
        unreadCount: unreadCounts[chat.id] || 0,
      }));
  }, [chats, userData, userChatsSubCollection, unreadCounts]);

  const handleTogglePin = async (chatId: string, currentPinState: boolean) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userChatSubDocRef = doc(db, 'users', user.uid, 'chats', chatId);
      if (currentPinState) {
        await updateDoc(userRef, { pinnedChats: arrayRemove(chatId) });
        await setDoc(userChatSubDocRef, { pinned: false }, { merge: true });
        setListToast({ message: "Frequency unpinned.", type: 'success' });
      } else {
        await updateDoc(userRef, { pinnedChats: arrayUnion(chatId) });
        await setDoc(userChatSubDocRef, { pinned: true }, { merge: true });
        setListToast({ message: "Frequency pinned to dashboard.", type: 'success' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (chatId: string, isFav: boolean) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      if (isFav) {
        await updateDoc(userRef, { favoriteChats: arrayRemove(chatId) });
        setListToast({ message: "Removed from favorites.", type: 'success' });
      } else {
        await updateDoc(userRef, { favoriteChats: arrayUnion(chatId) });
        setListToast({ message: "Added to favorites enclave.", type: 'success' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleArchive = async (chatId: string, isArchived: boolean) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      if (isArchived) {
        await updateDoc(userRef, { archivedChats: arrayRemove(chatId) });
        setListToast({ message: "Restored frequency to active grid.", type: 'success' });
      } else {
        await updateDoc(userRef, { archivedChats: arrayUnion(chatId) });
        setListToast({ message: "Transmission archived.", type: 'success' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Chat Item Context Menu Click Handlers
  const [contextMenu, setContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);

  const handleItemLongPress = (chatId: string, x: number, y: number) => {
    if (chatId.startsWith('ai_companion_')) return;
    setContextMenu({ id: chatId, x, y });
  };

  // Custom greeting generation based on hour
  const getDynamicGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning, Cadet';
    if (hr < 18) return 'Clear communications, Agent';
    return 'Secure channel online, Sentinel';
  };

  // Layout Wallpaper presets
  const wallpaperClass = isPremium && userData?.settings?.wallpaper !== 'none'
    ? userData.settings.wallpaper === 'grad-amber' ? 'bg-gradient-to-tr from-amber-950/20 via-zinc-950 to-[#121214]'
      : userData.settings.wallpaper === 'grad-cyber' ? 'bg-gradient-to-b from-[#0a0214] via-[#05010a] to-[#010103]'
      : userData.settings.wallpaper === 'grad-emerald' ? 'bg-gradient-to-tr from-[#021810] via-zinc-950 to-zinc-900'
      : userData.settings.wallpaper === 'grad-nord' ? 'bg-gradient-to-tr from-[#141b26] via-zinc-950 to-zinc-900'
      : ''
    : '';

  if (showNexusFeed) {
    return <NexusFeed onClose={() => setShowNexusFeed(false)} />;
  }

  return (
    <div 
      className={cn(
        "flex flex-col h-full w-full overflow-hidden relative font-sans bg-bg-primary text-text-primary dark",
        wallpaperClass
      )}
      onClick={() => setContextMenu(null)}
    >
      {/* 1. LIQUID GLASS PREMIUM HEADER */}
      <NexusHeader
        onSearchClick={() => {
          const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
          if (input) input.focus();
        }}
        onAvatarClick={() => navigate('/profile')}
        onAvatarLongPressStart={handleAvatarMouseDown}
        onAvatarLongPressEnd={handleAvatarMouseUp}
        isPeaceModeActive={isPeaceModeActive}
        onQRClick={() => setShowQRScanner(true)}
        onStarredClick={() => setShowStarred(true)}
        onMapClick={() => navigate('/map')}
        onReelsClick={() => navigate('/reels')}
        onWorkspaceClick={() => navigate('/workspace')}
        onAdvanceChatClick={() => navigate('/advance-chat')}
        onThemeToggle={toggleTheme}
        onLogoutClick={logout}
        onPermissionClick={() => setIsAccessModalOpen(true)}
      />

      {/* 2. CAPSULE FLOATING SEARCH BAR & VIEW MODES */}
      <FloatingSearch
        value={searchTerm}
        onChange={setSearchTerm}
        viewMode={layout}
        onViewModeChange={(mode) => setLayout(mode)}
        sortMode={sortMode}
        onSortModeChange={(mode) => setSortMode(mode)}
        onVoiceSearchClick={handleVoiceSearch}
        isListening={isListening}
      />

      {/* 3. SMART FOLDERS CATEGORY TICKERS */}
      <SmartFolders
        activeFolder={activeFolder}
        onFolderChange={(folder) => {
          setActiveFolder(folder);
          if (folder === 'work' || folder === 'personal') {
            setListToast({ message: `${folder.charAt(0).toUpperCase() + folder.slice(1)} biometric enclave unlocked.`, type: 'success' });
          }
        }}
        isPremium={isPremium}
        onLockClick={() => setShowPremiumUpsell(true)}
        sortMode={sortMode}
        onSortModeChange={(mode) => setSortMode(mode)}
      />

      {activeFolder === 'inbox' ? (
        <div className="flex-1 overflow-hidden">
          <UnifiedInbox />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        
        {/* Peace mode alert indicator banner */}
        <PeaceModeBanner />

        {/* 4. QUANTUM RESONANCE STATUS / STORIES STRIP */}
        {activeFolder === 'all' && !searchTerm && (
          <StoriesStrip
            statuses={statuses}
            onStoryClick={openStatus}
            onUploadClick={() => setIsStatusModalOpen(true)}
            uploading={uploadingStatus}
          />
        )}

        {/* 5. NEURAL PINNED CHATS */}
        {activeFolder === 'all' && !searchTerm && (
          <PinnedChats
            pinnedChats={pinnedChatsData}
            onSelectChat={(id) => navigate(`/chats/${id}`)}
          />
        )}

        {/* 6. CHAT TRANMISSIONS LIST */}
        <div className="mt-2.5">
          <div className="px-5 mb-2 flex justify-between items-center select-none">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
              Frequencies Index ({sortedFinalChats.length})
            </span>
          </div>

          {sortedFinalChats.length === 0 ? (
            <EmptyState type={searchTerm ? 'no-search' : 'no-chats'} searchTerm={searchTerm} />
          ) : (
            <div className={cn(
              layout === 'grid' ? "grid grid-cols-2 gap-4 p-4" : "flex flex-col"
            )}>
              {sortedFinalChats.map((chat) => {
                const isPinned = userChatsSubCollection[chat.id]?.pinned || (Array.isArray(userData?.pinnedChats) && userData.pinnedChats.includes(chat.id)) || chat.isPinned;
                const isFav = Array.isArray(userData?.favoriteChats) && userData.favoriteChats.includes(chat.id);

                return (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    unreadCount={unreadCounts[chat.id]}
                    typers={typingChats[chat.id]}
                    draft={drafts[chat.id]?.text}
                    viewMode={layout}
                                        isPinned={isPinned}
                    isFavorite={isFav}
                    currentUserUid={user?.uid || ''}
                    onChatClick={(id) => navigate(`/chats/${id}`)}
                    onLongPress={(e, id) => handleItemLongPress(id, (e as React.MouseEvent).clientX, (e as React.MouseEvent).clientY)}
                    onSwipeSummarize={(id, title) => {}}
                    isSelectionMode={false}
                    isSelected={false}
                    density="default"
                    currentUserId={user?.uid || ''}
                    isUnread={unreadCounts[chat.id] > 0}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
      )}

      {/* QR Scanner Screen */}
      <AnimatePresence>
        {showQRScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 overflow-y-auto"
          >
             <div className="absolute top-6 right-6 flex gap-4">
                <button 
                  onClick={toggleTorch}
                  className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all cursor-pointer"
                  title="Toggle sensory light source"
                >
                  <Camera size={20} />
                </button>
                <button 
                  onClick={() => {
                     setShowQRScanner(false);
                     setScanWarning(null);
                  }}
                  className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all cursor-pointer"
                >
                   <X size={20} />
                </button>
             </div>

             <div className="w-full max-w-sm space-y-8 text-center pt-20 pb-10">
                <div className="space-y-2">
                   <h2 className="text-xl font-bold tracking-widest text-white uppercase">QR Sensor Scanner</h2>
                   <p className="text-xs text-zinc-400">Aim target at another peer's encrypted QR credential</p>
                </div>

                <div className="relative aspect-square w-full max-w-[280px] mx-auto rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950/80 flex items-center justify-center shadow-2xl shadow-emerald-500/10">
                   <div id="chatlist-qr-reader" className="w-full h-full" />
                   
                   {/* Scanning crosshairs */}
                   <div className="absolute inset-8 pointer-events-none border border-emerald-500/20 rounded-2xl">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-500" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-500" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-500" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-500" />
                   </div>

                   {/* Success flash overlay */}
                   <AnimatePresence>
                     {showSuccessFlash && (
                       <motion.div 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center backdrop-blur-sm"
                       >
                         <Sparkle size={48} className="text-emerald-400 animate-bounce" />
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>

                {isLowLight && (
                  <motion.p 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-amber-500 text-xs font-semibold animate-pulse flex items-center justify-center gap-1.5"
                  >
                     <span>💡 Low light environment detected. Activate camera flashlight?</span>
                  </motion.p>
                )}

                {scanWarning && (
                  <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-400 text-xs text-left leading-relaxed shadow-lg"
                  >
                     {scanWarning}
                  </motion.div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. QUICK ACTION RADIAL FAB MENU */}
      <QuickActionsFAB
        onNewChat={() => navigate('/contacts')}
        onNewGroup={() => setCreateGroupOpen(true)}
        onNewChannel={() => setCreateChannelOpen(true)}
      />

      {/* Sensory Clearance Modal */}
      <AccessRequestModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        onApply={(perms) => {
          setListToast({ message: "Quantum clearances verified and applied.", type: 'success' });
        }}
      />

      {/* Premium Modal & Group/Channel Builders */}
      <AnimatePresence>
        {showPremiumUpsell && (
          <PremiumModal onClose={() => setShowPremiumUpsell(false)} />
        )}
      </AnimatePresence>

      <CreateGroupModal
        isOpen={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onSuccess={(newChatId) => {
          setCreateGroupOpen(false);
          navigate(`/chats/${newChatId}`);
        }}
      />

      {createChannelOpen && (
        <CreateChannelModal
          onClose={() => setCreateChannelOpen(false)}
          onCreated={(cid) => {
            setCreateChannelOpen(false);
            navigate(`/channels/${cid}`);
          }}
        />
      )}

      {/* Status Stories View Overlay */}
      <AnimatePresence>
        {viewerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <StatusViewer 
              statuses={statuses} 
              activeIndex={activeStatusIndex} 
              onClose={() => setViewerOpen(false)}
              onNext={nextStatus}
              onPrev={prevStatus}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Creation Modal Overlay */}
      <AnimatePresence>
        {isStatusModalOpen && (
          <StatusCreationModal
            isOpen={isStatusModalOpen}
            onClose={() => setIsStatusModalOpen(false)}
            onSuccess={(msg) => setListToast({ message: msg, type: 'success' })}
          />
        )}
      </AnimatePresence>

      {/* Chat Item Contextual Menu Panel */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed z-50 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 min-w-[180px]"
              style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
            >
              {[
                { 
                  label: 'Pin / Unpin', 
                  icon: <Pin size={12} />, 
                  onClick: () => {
                    const isPinned = userChatsSubCollection[contextMenu.id]?.pinned || (Array.isArray(userData?.pinnedChats) && userData.pinnedChats.includes(contextMenu.id));
                    handleTogglePin(contextMenu.id, isPinned);
                  }
                },
                { 
                  label: 'Favorite Matrix', 
                  icon: <Star size={12} />, 
                  onClick: () => {
                    const isFav = Array.isArray(userData?.favoriteChats) && userData.favoriteChats.includes(contextMenu.id);
                    handleToggleFavorite(contextMenu.id, isFav);
                  }
                },
                { 
                  label: 'Archive Transmission', 
                  icon: <Archive size={12} />, 
                  onClick: () => {
                    const isArchived = Array.isArray(userData?.archivedChats) && userData.archivedChats.includes(contextMenu.id);
                    handleToggleArchive(contextMenu.id, isArchived);
                  }
                },
              ].map((act) => (
                <button
                  key={act.label}
                  onClick={() => {
                    act.onClick();
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-800 text-zinc-350 hover:text-white rounded-lg transition-colors text-left"
                >
                  {act.icon}
                  <span>{act.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global alert toast */}
      <AnimatePresence>
        {listToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              "fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl font-bold font-mono text-[10px] uppercase tracking-wider shadow-lg flex items-center gap-2",
              listToast.type === 'success' ? "bg-emerald-500 text-slate-950" : listToast.type === 'error' ? "bg-red-500 text-white" : "bg-amber-500 text-slate-950"
            )}
          >
            <span>{listToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Internal reusable components we defined above in main module or from file
const StatusViewer = ({ statuses, activeIndex, onClose, onNext, onPrev }: any) => {
  const currentStatus = statuses[activeIndex];
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const duration = currentStatus?.type === 'video' ? 30000 : 5000;
    const interval = 50;
    const step = (interval / duration) * 100;
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          clearInterval(timer);
          onNext();
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [activeIndex, onNext, currentStatus]);

  if (!currentStatus) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col select-none">
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-3">
          <img src={currentStatus.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentStatus.userId}`} className="w-10 h-10 rounded-full border-2 border-white object-cover" />
          <div className="text-white">
            <h4 className="text-sm font-bold">{currentStatus.userName}</h4>
            <span className="text-[10px] opacity-80 uppercase tracking-widest font-mono">
              {currentStatus.createdAt?.toDate ? formatDistanceToNow(currentStatus.createdAt.toDate()) : 'just now'}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-white/80 hover:text-white cursor-pointer">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        <div className="absolute inset-y-0 left-0 w-1/4 z-10 cursor-pointer" onClick={onPrev}></div>
        <div className="absolute inset-y-0 right-0 w-1/4 z-10 cursor-pointer" onClick={onNext}></div>
        
        {currentStatus.type === 'image' ? (
          <img src={currentStatus.mediaUrl} className="max-w-full max-h-full object-contain" />
        ) : currentStatus.type === 'video' ? (
          <video src={currentStatus.mediaUrl} className="max-w-full max-h-full object-contain" autoPlay playsInline onEnded={onNext} />
        ) : (
          <div className="p-12 text-center text-white text-2xl font-bold italic leading-relaxed">
            {currentStatus.text}
          </div>
        )}
      </div>

      {/* View count */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center text-white/60 items-center gap-2">
         <span className="text-xs font-bold">{currentStatus.views?.length || 0} views</span>
      </div>

      {/* Progress indicators */}
      <div className="absolute top-2 left-4 right-4 flex gap-1 z-30">
        {statuses.map((_: any, i: number) => (
          <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full bg-white",
                i < activeIndex ? "w-full" : i === activeIndex ? "" : "w-0" 
              )}
              style={i === activeIndex ? { width: `${progress}%` } : {}}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
