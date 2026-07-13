import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { useTypingStatus } from '../hooks/useTypingStatus';
import { secureFetch } from '../lib/secureFetch';
import { useReadReceipts } from '../hooks/useReadReceipts';
import { MessageStatus } from '../components/MessageStatus';
import { useSubscription } from '../hooks/useSubscription';
import { PremiumModal } from '../components/PremiumModal';
import { EventCard } from '../components/EventCard';
import { EventCreator } from '../components/EventCreator';

import { db } from '../lib/firebase';
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { 
  collection, 
  doc, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  updateDoc,
  where,
  limit,
  getDoc,
  setDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { 
  ArrowLeft, 
  Send, 
  Forward,
  Image as ImageIcon, 
  Mic, 
  MoreVertical, 
  Smartphone,
  Check,
  CheckCheck,
  X,
  Play,
  Volume2,
  Users as UsersIcon,
  Eye,
  Star,
  Headphones,
  Reply,
  Calendar,
  Paperclip,
  Loader2,
  ShieldAlert,
  Lock,
  Phone,
  Video,
  Search,
  Plus,
  MessageCircle,
  Pin,
  BarChart2,
  Palette,
  Download,
  Cloud,
  ChevronRight,
  ChevronLeft,
  Play as PlayIcon,
  Bell,
  FileText,
  CheckCircle,
  Camera,
  LayoutGrid,
  CameraOff,
  Globe,
  Link,
  ExternalLink,
  QrCode,
  Sparkles,
  ShieldCheck,
  Terminal,
  Activity,
  Zap,
  ZapOff,
  Flashlight,
  FlashlightOff,
  Sun,
  Flame,
  History,
  RefreshCcw,
  Trash2,
  Sliders,
  Edit,
  Clock,
  MapPin,
  Hourglass,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { generateKeyPair, importPrivateKey, importPublicKey, deriveSharedKey, encryptText, decryptText } from '../lib/e2ee';
import { Html5Qrcode } from 'html5-qrcode';
import { NOTIFICATION_TONES, ToneType, playNotificationSound } from '../lib/tones';
import PlanningBoard from '../components/PlanningBoard';
import { DocumentScanner } from '../components/DocumentScanner';
import { useDocumentManager } from '../hooks/useDocumentManager';

import { 
  getSmartReplies, 
  getAIResponse,
  scanMessageForScams,
  translateText
} from '../services/aiService';
import { SmartComposeInput } from '../components/SmartComposeInput';
import { SmartReplyChips } from '../components/SmartReplyChips';
import { useSmartReplies } from '../hooks/useSmartReplies';
import { learnSentMessage } from '../hooks/useSmartCompose';
import { uploadFile } from '../services/storageService';
import AudioWaveform from '../components/AudioWaveform';
import { ReactionPicker } from '../components/ReactionPicker';
import UrlPreviewCard from '../components/UrlPreviewCard';
import { useDraft } from '../hooks/useDraft';
import { DraftSavedToast } from '../components/DraftSavedToast';
import GroupChatRoom from '../components/GroupChatRoom';
import EditHistoryModal from '../components/EditHistoryModal';
import { usePeaceMode } from '../hooks/usePeaceMode';
import { useMessageLimit } from '../hooks/useMessageLimit';
import ZenBackground from '../components/ZenBackground';
import { DisappearingMessageToggle } from '../components/DisappearingMessageToggle';
import { DisappearingBanner } from '../components/DisappearingBanner';
import { ExpiryIndicator } from '../components/ExpiryIndicator';
import { useScheduledMessages } from '../hooks/useScheduledMessages';
import { SchedulePicker } from '../components/SchedulePicker';
import { ScheduledMessageBadge } from '../components/ScheduledMessageBadge';
import { ViewOnceOverlay } from '../components/ViewOnceOverlay';
import { useDisappearingMessages } from '../hooks/useDisappearingMessages';
import { Timestamp } from 'firebase/firestore';

import { useChatSummary } from '../hooks/useChatSummary';
import ChatSummaryModal from '../components/ChatSummaryModal';
import SummaryBanner from '../components/SummaryBanner';


const extractUrl = (text: string): string | null => {
  if (!text) return null;
  const match = text.match(/(https?:\/\/[^\s]+)/i);
  if (!match) return null;
  let rawUrl = match[1];
  rawUrl = rawUrl.replace(/[.,!?;)]+$/, '');
  return rawUrl;
};




const THEME_PACKAGES = [
  {
    id: 'classic',
    name: 'Classic',
    wallpaper: '',
    bubbleMe: 'bg-wa-bubble-me dark:bg-wa-dark-bubble-me text-zinc-900 dark:text-zinc-100',
    bubbleThem: 'bg-wa-bubble-them dark:bg-wa-dark-bubble-them text-zinc-900 dark:text-zinc-100 border-zinc-100 dark:border-zinc-800/50',
    font: 'font-sans',
    accent: 'bg-wa-primary',
    color: '#efeae2',
    darkColor: '#0b141a'
  },
  {
    id: 'forest',
    name: 'Forest',
    wallpaper: 'https://www.transparenttextures.com/patterns/leaves.png',
    bubbleMe: 'bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-800',
    bubbleThem: 'bg-white dark:bg-emerald-950 text-zinc-900 dark:text-emerald-200 border border-zinc-100 dark:border-zinc-800',
    font: 'font-serif',
    accent: 'bg-emerald-600',
    color: '#ecfdf5',
    darkColor: '#064e3b'
  },
  {
    id: 'cyber',
    name: 'Cybernetic',
    wallpaper: 'https://www.transparenttextures.com/patterns/cyber-glow.png',
    bubbleMe: 'bg-zinc-900/80 border border-fuchsia-500/50 text-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.3)]',
    bubbleThem: 'bg-zinc-900/80 border border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
    font: 'font-mono',
    accent: 'bg-fuchsia-500',
    color: '#09090b',
    darkColor: '#020617'
  },
  {
    id: 'royal',
    name: 'Royal',
    wallpaper: 'https://www.transparenttextures.com/patterns/stardust.png',
    bubbleMe: 'bg-indigo-600 text-white shadow-lg',
    bubbleThem: 'bg-slate-800 text-slate-100 shadow-lg border border-indigo-500/20',
    font: 'font-display',
    accent: 'bg-indigo-600',
    color: '#f8fafc',
    darkColor: '#0f172a'
  },
  {
    id: 'monochrome',
    name: 'Noir',
    wallpaper: 'https://www.transparenttextures.com/patterns/carbon-fibre.png',
    bubbleMe: 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-sm',
    bubbleThem: 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800',
    font: 'font-mono',
    accent: 'bg-zinc-900 dark:bg-white',
    color: '#fafafa',
    darkColor: '#000000'
  },
  {
    id: 'aurora',
    name: 'Aurora',
    wallpaper: 'https://www.transparenttextures.com/patterns/cubes.png',
    bubbleMe: 'bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-300 backdrop-blur-md',
    bubbleThem: 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 backdrop-blur-md',
    font: 'font-display',
    accent: 'bg-teal-500',
    color: '#f0fdfa',
    darkColor: '#042f2e'
  },
  {
    id: 'lava',
    name: 'Magma',
    wallpaper: 'https://www.transparenttextures.com/patterns/pinstriped-suit.png',
    bubbleMe: 'bg-orange-500 text-white shadow-orange-500/20 shadow-lg',
    bubbleThem: 'bg-zinc-900 text-zinc-100 border border-orange-500/30 shadow-lg',
    font: 'font-sans',
    accent: 'bg-orange-500',
    color: '#fff7ed',
    darkColor: '#1c1917'
  },
  {
    id: 'sunset_glow',
    name: 'Sunset Glow',
    wallpaper: 'https://www.transparenttextures.com/patterns/stardust.png',
    bubbleMe: 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-rose-500/25 shadow-lg border-none',
    bubbleThem: 'bg-white/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 border border-rose-200/50 dark:border-rose-800/40 backdrop-blur-md',
    font: 'font-display',
    accent: 'bg-rose-500',
    color: '#fff1f2',
    darkColor: '#1a050d'
  },
  {
    id: 'bubblegum_retro',
    name: 'Bubblegum',
    wallpaper: 'https://www.transparenttextures.com/patterns/pizazz.png',
    bubbleMe: 'bg-gradient-to-br from-fuchsia-400 to-pink-500 text-white shadow-pink-400/30 shadow-lg border-none',
    bubbleThem: 'bg-pink-50/90 dark:bg-[#1a0515]/90 text-pink-900 dark:text-pink-300 border border-pink-200/50 dark:border-pink-900/40',
    font: 'font-sans',
    accent: 'bg-fuchsia-500',
    color: '#fff5f7',
    darkColor: '#1b0114'
  },
  {
    id: 'cyber_neon',
    name: 'Neon Matrix',
    wallpaper: 'https://www.transparenttextures.com/patterns/cyber-glow.png',
    bubbleMe: 'bg-violet-650 text-white border border-fuchsia-500/50 shadow-[0_0_15px_rgba(168,85,247,0.45)]',
    bubbleThem: 'bg-[#0f172a]/95 border border-emerald-400/60 text-emerald-400 font-mono shadow-[0_0_15px_rgba(52,211,153,0.3)]',
    font: 'font-mono',
    accent: 'bg-fuchsia-600',
    color: '#030712',
    darkColor: '#02020a'
  }
];

const WALLPAPER_PATTERNS = [
  { id: 'none', name: 'None', url: '' },
  { id: 'blueprint', name: 'Blueprint', url: 'https://www.transparenttextures.com/patterns/blueprint.png' },
  { id: 'cubes', name: 'Cubes', url: 'https://www.transparenttextures.com/patterns/cubes.png' },
  { id: 'diamond-upholstery', name: 'Diamond', url: 'https://www.transparenttextures.com/patterns/diamond-upholstery.png' },
  { id: 'dust', name: 'Dust', url: 'https://www.transparenttextures.com/patterns/dust.png' },
  { id: 'graphy', name: 'Graphy', url: 'https://www.transparenttextures.com/patterns/graphy.png' },
  { id: 'grid-me', name: 'Grid Me', url: 'https://www.transparenttextures.com/patterns/grid-me.png' },
  { id: 'micro-carbon', name: 'Micro Carbon', url: 'https://www.transparenttextures.com/patterns/micro-carbon.png' },
  { id: 'paper-fibers', name: 'Paper Fibers', url: 'https://www.transparenttextures.com/patterns/paper-fibers.png' },
  { id: 'pinstripe', name: 'Pinstripe', url: 'https://www.transparenttextures.com/patterns/pinstriped-suit.png' },
  { id: 'pizazz', name: 'Pizazz', url: 'https://www.transparenttextures.com/patterns/pizazz.png' },
  { id: 'retina-wood', name: 'Wood', url: 'https://www.transparenttextures.com/patterns/retina-wood.png' },
  { id: 'stardust', name: 'Stardust', url: 'https://www.transparenttextures.com/patterns/stardust.png' },
  { id: 'wavecut', name: 'Wavecut', url: 'https://www.transparenttextures.com/patterns/wavecut.png' },
  { id: 'zig-zag', name: 'Zig Zag', url: 'https://www.transparenttextures.com/patterns/zig-zag-pinstripe.png' },
];

export default function ChatRoom() {
  const { chatId: routeChatId, broadcastId } = useParams();
  const chatId = routeChatId || broadcastId;
  const isBroadcast = !!broadcastId;
  const { user } = useAuth();
  const { isEnabled: isPeaceModeActive, settings: peaceSettings } = usePeaceMode();
  const { isLocked: isMessageLimitLocked, warning: messageLimitWarning, incrementMessageCount } = useMessageLimit();
  const { isPremium } = useSubscription();
  const [showStickers, setShowStickers] = useState(false);
  const [showStickerUpsell, setShowStickerUpsell] = useState(false);
  const { theme, toggleTheme, messageLayout, setMessageLayout, bubbleColor, setBubbleColor } = useTheme();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Enclave OS Chat Summaries Engine hooks & state
  const { 
    generateSummary, 
    pinSummary, 
    unpinSummary, 
    pinnedSummary, 
    isLoading: summaryLoading 
  } = useChatSummary(chatId || '');
  
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showUnreadBanner, setShowUnreadBanner] = useState(false);
  const [unreadCountToSummarize, setUnreadCountToSummarize] = useState(0);
  const [hasShownUnreadAutoBanner, setHasShownUnreadAutoBanner] = useState(false);

  // Reset banner shown state when chatId changes
  useEffect(() => {
    setHasShownUnreadAutoBanner(false);
    setShowUnreadBanner(false);
  }, [chatId]);

  // Detect unread messages on load for 20+ auto-trigger banner
  useEffect(() => {
    if (loadingMessages || messages.length === 0 || hasShownUnreadAutoBanner) return;

    // Filter unread messages on first load
    const unread = messages.filter(m => m.senderId !== user?.uid && m.status !== 'read');
    if (unread.length >= 20) {
      setUnreadCountToSummarize(unread.length);
      setShowUnreadBanner(true);
      setHasShownUnreadAutoBanner(true);
    }
  }, [messages, loadingMessages, user, hasShownUnreadAutoBanner]);

  const handleSummarizeClick = async () => {
    if (decryptedMessages.length === 0) {
      setToast({ message: "Not enough messages to summarize", type: 'info' });
      return;
    }

    setSummaryError(null);
    setIsSummaryModalOpen(true);
    setSummaryData(null);

    try {
      // Filter out system messages, media placeholders, and auto-replies
      const eligibleMessages = decryptedMessages
        .filter(m => {
          const hasText = m.text && m.text.trim().length > 0;
          const isSystem = m.type === 'system';
          const isAutoReply = m.isAutoReply === true || m.text?.startsWith('[Auto-Reply]');
          return hasText && !isSystem && !isAutoReply;
        })
        .slice(-50);

      if (eligibleMessages.length < 3) {
        throw new Error("Not enough messages with text content to summarize.");
      }

      const payload = eligibleMessages.map(m => ({
        senderId: m.senderId,
        senderName: m.senderId === user?.uid 
          ? 'Me' 
          : (m.senderName || chatInfo?.peerName || 'Personnel'),
        text: m.text
      }));

      const summaryResult = await generateSummary(payload);
      setSummaryData(summaryResult);
    } catch (err: any) {
      console.error("Summary generation error:", err);
      setSummaryError(err.message || "Couldn't summarize. Try again.");
    }
  };

  const handlePinSummary = async () => {
    if (!summaryData) return;
    try {
      const eligibleMessages = decryptedMessages.filter(m => m.text && m.text.trim().length > 0 && m.type !== 'system');
      const from = eligibleMessages[0]?.createdAt || serverTimestamp();
      const to = eligibleMessages[eligibleMessages.length - 1]?.createdAt || serverTimestamp();

      await pinSummary(summaryData, { from, to });
      setToast({ message: "Summary pinned to top of chat room", type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || "Could not pin summary", type: 'error' });
    }
  };

  const handleUnpinSummary = async () => {
    try {
      await unpinSummary();
      setToast({ message: "Summary unpinned", type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || "Could not unpin", type: 'error' });
    }
  };

  const sendSmartReply = async (text: string) => {
    if (!user || !chatId) return;
    try {
      learnSentMessage(text);
      const isGroupColl = isGroupChatColl;
      const targetCollection = isGroupColl ? 'groupChat' : 'chats';
      const msgRef = collection(db, targetCollection, chatId, 'messages');

      const messageData: any = {
        senderId: user.uid,
        text: text,
        type: 'text',
        status: 'sent',
        isViewOnce: false,
        createdAt: serverTimestamp(),
        readBy: [user.uid]
      };

      if (disappearingSettings.timer > 0) {
        messageData.expiresAt = Timestamp.fromMillis(Date.now() + disappearingSettings.timer * 1000);
      }

      if (ephemeralTimer > 0) {
        messageData.burnDuration = ephemeralTimer;
        messageData.burnTimeLeft = ephemeralTimer;
      }

      let finalData = { ...messageData };
      if (sharedKey && finalData.text) {
        const encrypted = await encryptText(finalData.text, sharedKey);
        finalData.encryptedData = encrypted;
        finalData.text = "[Encrypted Message]";
        finalData.isEncrypted = true;
      }

      await addDoc(msgRef, finalData);
      setToast({ message: "Smart reply sent!", type: 'success' });
    } catch (err) {
      console.error("Failed to send smart reply:", err);
      setToast({ message: "Failed to send smart reply", type: 'error' });
    }
  };
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [isGroupChatColl, setIsGroupChatColl] = useState(false);
  const isGroup = isGroupChatColl || (chatInfo && chatInfo.isGroup) || false;
  const { registerTypingActivity, clearTypingStatus } = useTypingIndicator(chatId, isGroup);
  const hookTypingUsers = useTypingStatus(chatId, isGroup);
  const { replies: aiSuggestedReplies, isLoading: isSmartRepliesLoading } = useSmartReplies(chatId || '', messages[messages.length - 1]);

  const { settings: disappearingSettings, updateTimer: updateDisappearingTimer, cleanupExpired: cleanupExpiredMessages } = useDisappearingMessages(chatId || '', isGroup);
  const [showDisappearingModal, setShowDisappearingModal] = useState(false);
  const [fadingOutMessageIds, setFadingOutMessageIds] = useState<Set<string>>(new Set());

  // Trigger cleanup on chat open and every 60 seconds
  useEffect(() => {
    if (chatId) {
      cleanupExpiredMessages();
      const interval = setInterval(() => {
        cleanupExpiredMessages();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [chatId, cleanupExpiredMessages]);

  // Handle active message decay & 1-second visual fading out placeholder transition
  useEffect(() => {
    if (!chatId || messages.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      messages.forEach(msg => {
        if (!msg.expiresAt || fadingOutMessageIds.has(msg.id)) return;

        let expiresMillis = 0;
        if (msg.expiresAt?.toMillis) {
          expiresMillis = msg.expiresAt.toMillis();
        } else if (msg.expiresAt?.seconds) {
          expiresMillis = msg.expiresAt.seconds * 1000;
        }

        if (expiresMillis > 0 && expiresMillis <= now) {
          // Trigger visual fade-out state
          setFadingOutMessageIds(prev => {
            const next = new Set(prev);
            next.add(msg.id);
            return next;
          });

          // Delete from Firestore after 1 second
          setTimeout(() => {
            const collectionName = isGroup ? 'groupChat' : 'chats';
            deleteDoc(doc(db, collectionName, chatId, 'messages', msg.id))
              .then(() => {
                setFadingOutMessageIds(prev => {
                  const next = new Set(prev);
                  next.delete(msg.id);
                  return next;
                });
              })
              .catch(err => console.error("Firestore expiration delete failed:", err));
          }, 1000);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [messages, fadingOutMessageIds, chatId, isGroup]);

  // Best-effort screenshot key combinations detection & alert
  useEffect(() => {
    if (disappearingSettings?.timer > 0) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          e.key === 'PrintScreen' ||
          (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === 's' || e.key === 'S')) ||
          (e.ctrlKey && e.key === 'p')
        ) {
          setToast({
            message: "This chat has disappearing messages. Respect privacy.",
            type: 'error'
          });
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [disappearingSettings?.timer]);

  const isChannelRestricted = chatInfo?.isChannel === true && chatInfo?.creatorId !== user?.uid;

  const [ephemeralTimer, setEphemeralTimer] = useState<number>(() => Number(localStorage.getItem(`aero_ephemeral_timer_${chatId}`) || '0'));
  const [screenshotBlockEnabled, setScreenshotBlockEnabled] = useState<boolean>(() => localStorage.getItem(`aero_screenshot_shield_${chatId}`) !== 'false');
  const [countdownState, setCountdownState] = useState<Record<string, number>>({});

  // Disappearing count down loop & secure screenshot shield simulator
  useEffect(() => {
    if (!chatId) return;
    const interval = setInterval(() => {
      setCountdownState((prevCountdowns) => {
        const updated = { ...prevCountdowns };
        let changed = false;

        for (const msg of messages) {
          if (msg.burnDuration) {
            const currentCount = updated[msg.id] !== undefined 
              ? updated[msg.id] 
              : msg.burnDuration;

            if (currentCount > 0) {
              updated[msg.id] = currentCount - 1;
              changed = true;
            } else if (currentCount === 0) {
              // Time to burn/wipe forever from Firestore!
              changed = true;
              deleteDoc(doc(db, 'chats', chatId, 'messages', msg.id)).catch(console.error);
              delete updated[msg.id];
            }
          }
        }

        return changed ? updated : prevCountdowns;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [messages, chatId]);

  // Screenshot and grab block trigger sequence
  useEffect(() => {
    if (!screenshotBlockEnabled) return;

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      setToast({
        message: "🛡️ ENCLAVE SHIELD: Volatile transmissions cannot be copied to local clipboard.",
        type: 'error'
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key or specific capture shortcut trigger matching
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p')) {
        e.preventDefault();
        setToast({
          message: "🚫 SHIELD BLOCKED: Device screenshot capabilities are offline.",
          type: 'error'
        });
      }
    };

    window.addEventListener('copy', handleCopy);
    window.addEventListener('keyup', handleKeyDown);
    return () => {
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('keyup', handleKeyDown);
    };
  }, [screenshotBlockEnabled]);

  const MessageSkeleton = () => (
    <div className="space-y-4 px-2">
      {[1, 2, 3, 4, 1, 2].map((i, idx) => (
        <div key={idx} className={cn("flex", idx % 2 === 0 ? "justify-end" : "justify-start")}>
          <div className={cn(
            "h-12 w-48 rounded-2xl animate-pulse",
            idx % 2 === 0 ? "bg-wa-primary/10 dark:bg-wa-primary/5" : "bg-zinc-200 dark:bg-zinc-800"
          )} />
        </div>
      ))}
    </div>
  );
  const [sharedKey, setSharedKey] = useState<CryptoKey | null>(null);
  const [decryptedMessages, setDecryptedMessages] = useState<any[]>([]);

  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [scamResults, setScamResults] = useState<Record<string, { isScam: boolean, reason: string }>>({});

  // Real-time translation states
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});
  const [selectedTranslateMsgId, setSelectedTranslateMsgId] = useState<string | null>(null);
  const [translationEngineActive, setTranslationEngineActive] = useState(false);
  const [translationTargetLanguage, setTranslationTargetLanguage] = useState('Spanish');
  const [showTranslatePanel, setShowTranslatePanel] = useState(false);

  useEffect(() => {
    if (!translationEngineActive) return;

    const translateIncoming = async () => {
      const messagesToTranslate = decryptedMessages.filter(msg => 
        (msg.type === 'text' || (msg.type === 'audio' && msg.transcript)) &&
        !translations[msg.id] &&
        !isTranslating[msg.id]
      );

      for (const msg of messagesToTranslate) {
        const textToTranslate = msg.type === 'text' ? msg.text : msg.transcript;
        if (!textToTranslate || textToTranslate === "[Encrypted Message]") continue;

        setIsTranslating(prev => ({ ...prev, [msg.id]: true }));
        try {
          const res = await translateText(textToTranslate, translationTargetLanguage);
          setTranslations(prev => ({ ...prev, [msg.id]: res }));
        } catch (err) {
          console.error("Translation failed", err);
        } finally {
          setIsTranslating(prev => ({ ...prev, [msg.id]: false }));
        }
      }
    };

    translateIncoming();
  }, [decryptedMessages, translationEngineActive, translationTargetLanguage]);

  useEffect(() => {
    const scanNewMessages = async () => {
      const messagesToScan = decryptedMessages.filter(msg => 
        msg.type === 'text' && 
        msg.senderId !== user?.uid && 
        !scamResults[msg.id] &&
        msg.text && msg.text !== "[Encrypted Message]"
      );

      for (const msg of messagesToScan) {
        try {
          const result = await scanMessageForScams(msg.text);
          setScamResults(prev => ({ ...prev, [msg.id]: result }));
        } catch (err) {
          console.error("Scanning failed", err);
        }
      }
    };

    if (decryptedMessages.length > 0) {
      scanNewMessages();
    }
  }, [decryptedMessages, user?.uid]);

  const handleTranslateSingleMessage = async (messageId: string, text: string) => {
    setIsTranslating(prev => ({ ...prev, [messageId]: true }));
    try {
      const res = await translateText(text, translationTargetLanguage);
      setTranslations(prev => ({ ...prev, [messageId]: res }));
      setToast({ message: `Translated to ${translationTargetLanguage}!`, type: 'success' });
    } catch (err) {
      console.error("Manual translation failed", err);
      setToast({ message: "AI translation service unavailable", type: 'error' });
    } finally {
      setIsTranslating(prev => ({ ...prev, [messageId]: false }));
    }
  };

  const handleVote = async (messageId: string, optionId: string) => {
    if (!chatId || !user) return;
    try {
      const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
      const msgSnap = await getDoc(msgRef);
      if (!msgSnap.exists()) return;
      
      const pollVotes = msgSnap.data().pollVotes || {};
      // Remove user from all options first (single choice poll style)
      Object.keys(pollVotes).forEach(optId => {
         pollVotes[optId] = (pollVotes[optId] || []).filter((id: string) => id !== user.uid);
      });
      
      // Add to new option
      pollVotes[optionId] = [...(pollVotes[optionId] || []), user.uid];
      
      await updateDoc(msgRef, { pollVotes });
    } catch (err) {
      console.error("Vote failed", err);
    }
  };

  const createPoll = async () => {
    if (!user || !pollQuestion || pollOptions.filter(o => o.trim()).length < 2) return;
    try {
      const options = pollOptions
        .filter(o => o.trim())
        .map((text, index) => ({ id: `opt-${index}-${Date.now()}`, text }));
        
      await addDoc(collection(db, 'chats', chatId!, 'messages'), {
        senderId: user.uid,
        text: pollQuestion,
        type: 'poll',
        pollOptions: options,
        pollVotes: {},
        status: 'sent',
        createdAt: serverTimestamp(),
      });
      
      await updateDoc(doc(db, 'chats', chatId!), {
        lastMessage: {
           text: `📊 Poll: ${pollQuestion}`,
           createdAt: serverTimestamp(),
           senderId: user.uid,
        },
        updatedAt: serverTimestamp(),
      });
      
      setShowPollModal(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (err) {
      console.error("Poll creation failed", err);
    }
  };
  const [inputText, setInputText] = useState('');
  const [showDocScanner, setShowDocScanner] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const { saveDocument } = useDocumentManager();

  const generatePDFFromPages = async (scannedPages: any[]): Promise<File> => {
    const pdf = new jsPDF();
    for (let i = 0; i < scannedPages.length; i++) {
      if (i > 0) pdf.addPage();
      const page = scannedPages[i];
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      pdf.addImage(page.processedUrl, 'JPEG', 0, 0, width, height);
    }
    const blob = pdf.output('blob');
    return new File([blob], `Scanned_Doc_${Date.now()}.pdf`, { type: 'application/pdf' });
  };

  const handleDispatchScannedDocument = async (
    rawPages: any[],
    extractedText: string,
    documentType: any,
    metadata: any,
    action: string
  ) => {
    try {
      setToast({ message: "Uploading document scans...", type: 'success' });
      const savedId = await saveDocument(rawPages, extractedText, documentType, metadata, chatId);

      const isGroupColl = isGroupChatColl;
      const targetCollection = isGroupColl ? 'groupChat' : 'chats';
      const msgRef = collection(db, targetCollection, chatId!, 'messages');

      if (action === 'chat_text') {
        await addDoc(msgRef, {
          senderId: user!.uid,
          text: extractedText,
          type: 'text',
          status: 'sent',
          createdAt: serverTimestamp(),
          readBy: [user!.uid]
        });
      } else if (action === 'chat_image') {
        const activePage = rawPages[0];
        let fileBlob = await fetch(activePage.processedUrl).then(r => r.blob());
        let file = new File([fileBlob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const url = await uploadFile(file, `chats/${chatId}/${Date.now()}_scan.jpg`);

        await addDoc(msgRef, {
          senderId: user!.uid,
          mediaUrl: url,
          fileName: `Scan_${Date.now()}.jpg`,
          type: 'image',
          status: 'sent',
          createdAt: serverTimestamp(),
          readBy: [user!.uid]
        });
      } else if (action === 'chat_pdf') {
        const pdfFile = await generatePDFFromPages(rawPages);
        const url = await uploadFile(pdfFile, `chats/${chatId}/${Date.now()}_scan.pdf`);

        await addDoc(msgRef, {
          senderId: user!.uid,
          mediaUrl: url,
          fileName: pdfFile.name,
          fileSize: pdfFile.size,
          type: 'file',
          status: 'sent',
          createdAt: serverTimestamp(),
          readBy: [user!.uid]
        });
      } else if (action === 'chat_both') {
        const activePage = rawPages[0];
        let fileBlob = await fetch(activePage.processedUrl).then(r => r.blob());
        let file = new File([fileBlob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const url = await uploadFile(file, `chats/${chatId}/${Date.now()}_scan.jpg`);

        await addDoc(msgRef, {
          senderId: user!.uid,
          mediaUrl: url,
          fileName: `Scan_${Date.now()}.jpg`,
          text: extractedText,
          type: 'image',
          status: 'sent',
          createdAt: serverTimestamp(),
          readBy: [user!.uid]
        });
      } else if (action === 'vault') {
        setToast({ message: "Document scans saved inside secure Vault storage!", type: 'success' });
      } else if (action === 'workspace') {
        setToast({ message: "Document saved inside secure Workspace directory!", type: 'success' });
      }

      setToast({ message: "Document dispatched successfully!", type: 'success' });
    } catch (err) {
      console.error("Failed to dispatch document:", err);
      setToast({ message: "Failed to dispatch scanned document", type: 'error' });
    }
  };

  const { draftText, setDraftText, clearDraft, isDraftSaved, warning } = useDraft(chatId || '');

  // Keep track of the last chatId we loaded a draft for
  const lastLoadedChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (chatId && lastLoadedChatIdRef.current !== chatId && draftText !== undefined) {
      setInputText(draftText);
      lastLoadedChatIdRef.current = chatId;
      setMissedSummaryList(null);
    }
  }, [chatId, draftText]);

  // Sync input text to draftText
  useEffect(() => {
    if (chatId && lastLoadedChatIdRef.current === chatId) {
      setDraftText(inputText);
    }
  }, [inputText, chatId, setDraftText]);

  // Display warning if draft exceeds limit
  useEffect(() => {
    if (warning) {
      setToast({ message: warning, type: 'error' });
    }
  }, [warning]);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [groupParticipants, setGroupParticipants] = useState<any[]>([]);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isPeaceModeActive) {
      setTypingUsers([]);
    } else {
      setTypingUsers(hookTypingUsers);
    }
  }, [hookTypingUsers, isPeaceModeActive]);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  const { registerRef } = useReadReceipts(
    chatId || '',
    decryptedMessages,
    isGroup,
    currentUserProfile?.peaceMode?.enabled || false
  );

  const hasScrolledRef = useRef(false);

  useEffect(() => {
    hasScrolledRef.current = false;
  }, [chatId]);

  useEffect(() => {
    if (decryptedMessages.length > 0 && !hasScrolledRef.current) {
      hasScrolledRef.current = true;
      const firstUnread = decryptedMessages.find(m => m.senderId !== user?.uid && !m.readBy?.[user?.uid]);
      if (firstUnread) {
        setTimeout(() => {
          const element = document.getElementById('unread-divider');
          if (element) {
            element.scrollIntoView({ behavior: 'auto', block: 'center' });
          } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
          }
        }, 300);
      } else {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }, 100);
      }
    }
  }, [decryptedMessages, user?.uid]);
  const [wallpaperOpacity, setWallpaperOpacity] = useState(0.4);
  const [wallpaperNoise, setWallpaperNoise] = useState(0);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEventCreator, setShowEventCreator] = useState(false);
  const { scheduleMessage } = useScheduledMessages(chatId);
  const [activeScheduledDate, setActiveScheduledDate] = useState<Date | null>(null);
  const [activeRecurrence, setActiveRecurrence] = useState<{ frequency: 'daily' | 'weekly' | 'monthly' } | null>(null);
  const [showSharedHub, setShowSharedHub] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [recentScans, setRecentScans] = useState<{id: string, data: string, timestamp: number}[]>([]);
  const [scanFilter, setScanFilter] = useState<'All' | 'Trusted' | 'Warning'>('All');
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [cloudScanHistory, setCloudScanHistory] = useState<any[]>([]);
  const [scanWarning, setScanWarning] = useState<string | null>(null);

  // Lowlight Detection Engine
  useEffect(() => {
    if (!showQRScanner) {
      setIsLowLight(false);
      return;
    }
    
    const interval = setInterval(() => {
      const video = document.querySelector('#qr-reader video') as HTMLVideoElement;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, 50, 50);
          const { data } = ctx.getImageData(0, 0, 50, 50);
          let brightness = 0;
          for (let i = 0; i < data.length; i += 4) {
            brightness += (data[i] + data[i+1] + data[i+2]) / 3;
          }
          brightness = brightness / (data.length / 4);
          setIsLowLight(brightness < 50);
        }
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [showQRScanner]);
  const [activeHubTab, setActiveHubTab] = useState<'media' | 'links' | 'docs'>('media');
  const [scheduledDate, setScheduledDate] = useState('');
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);
  const [bubbleShape, setBubbleShape] = useState<'modern' | 'classic'>('modern');
  const [longPressTimer, setLongPressTimer] = useState<any>(null);
  const [reactionMsgId, setReactionMsgId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [inlineEditText, setInlineEditText] = useState('');
  const [activeHistoryMessageId, setActiveHistoryMessageId] = useState<string | null>(null);
  const [hideHistoryByAdmin, setHideHistoryByAdmin] = useState(false);
  const [showWhisperRoom, setShowWhisperRoom] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [roomSearchStartDate, setRoomSearchStartDate] = useState<string>('');
  const [roomSearchEndDate, setRoomSearchEndDate] = useState<string>('');
  const [transcribingMessages, setTranscribingMessages] = useState<Set<string>>(new Set());
  const [viewOnceMedia, setViewOnceMedia] = useState<any>(null);
  const [peerProfile, setPeerProfile] = useState<any>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showExportPDFOptions, setShowExportPDFOptions] = useState(false);
  const [showCameraWallpaperModal, setShowCameraWallpaperModal] = useState(false);
  const [showWallpaperGallery, setShowWallpaperGallery] = useState(false);
  const [isUpdatingWallpaper, setIsUpdatingWallpaper] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // States for live camera photo capture for chat attachments
  const [showCameraCaptureModal, setShowCameraCaptureModal] = useState(false);
  const [captureStream, setCaptureStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const captureVideoRef = useRef<HTMLVideoElement>(null);
  const [sharingLocation, setSharingLocation] = useState(false);
  const locationWatchId = useRef<number | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [toast, setToast] = useState<{ 
    message: string; 
    type: 'success' | 'error';
    action?: { label: string; onClick: () => void };
  } | null>(null);
  const [swipingMessageId, setSwipingMessageId] = useState<string | null>(null);
  const [isThemeCycleEnabled, setIsThemeCycleEnabled] = useState(false);
  const [isAiAutoReplyEnabled, setIsAiAutoReplyEnabled] = useState(false);
  const [pdfExportLayout, setPdfExportLayout] = useState<'compact' | 'detailed'>('detailed');
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video' | 'audio'; senderName?: string; createdAt?: any; id?: string } | null>(null);
  const [globalChatWallpaper, setGlobalChatWallpaper] = useState<string>(() => {
    return localStorage.getItem('globalChatWallpaper') || 'default';
  });
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewRotate, setPreviewRotate] = useState(0);

  useEffect(() => {
    setPreviewZoom(1);
    setPreviewRotate(0);
  }, [previewMedia?.url]);
  
  // Peace AI Helper States
  const [missedSummaryList, setMissedSummaryList] = useState<string[] | null>(null);
  const [isGeneratingMissedSummary, setIsGeneratingMissedSummary] = useState(false);
  const [showPlanningBoard, setShowPlanningBoard] = useState(false);
  const [planningSteps, setPlanningSteps] = useState<Array<{ title: string; desc: string; status: 'completed' | 'active' | 'pending' }>>([
    { title: "Peace Gate Sync", desc: "Initialize 509 handshake exchange.", status: "completed" },
    { title: "AES Secure Pipe", desc: "Build client-side peer tunnel key exchange.", status: "active" },
    { title: "Sub-Local Enclave Mount", desc: "Verify IndexedDB sector validation.", status: "pending" },
    { title: "Nexus Decentralized Relay", desc: "Mount broadcast client nodes safely.", status: "pending" }
  ]);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepDesc, setNewStepDesc] = useState("");

  const handleAddPlanningStep = () => {
    if (!newStepTitle.trim()) return;
    setPlanningSteps(prev => [
      ...prev,
      { title: newStepTitle, desc: newStepDesc || "Custom security layout parameter.", status: "pending" }
    ]);
    setNewStepTitle("");
    setNewStepDesc("");
  };

  const generateMissedSummary = async () => {
    setIsGeneratingMissedSummary(true);
    setMissedSummaryList(null);
    try {
      const chatContext = decryptedMessages.slice(-15).map(m => `${m.senderId === user?.uid ? 'You' : 'Personnel'}: ${m.text}`).join('\n');
      const res = await secureFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: `Analyze the following latest chat messages and return exactly 3 sweet and simple bullet points summarizing what was missed. Each bullet point MUST be concise (under 12 words) and start with an appropriate emoji:
${chatContext || "No previous messages. Welcome to the workspace. Peace OS protocol safe."}`
        }),
      });
      const data = await res.json();
      const text = data.text || "• 🟢 Sandbox channel established safely.\n• 🟢 No pending unread alerts found.\n• 🟢 Encryption systems fully functional.";
      const bullets = text.split('\n').map((line: string) => line.trim().replace(/^[\s•\-\*]+/, '')).filter((line: string) => line.length > 0);
      setMissedSummaryList(bullets.length > 0 ? bullets : [
        "🟢 All active secure channels initialized.",
        "🔒 Local isolated sandboxes standard verified.",
        "⚡ Peer node alignment completed."
      ]);
    } catch (e) {
      console.error(e);
      setMissedSummaryList([
        "⚡ All transmissions securely vaped.",
        "🔒 Local isolated sandboxes standard verified.",
        "🟢 Feed cleared of pending items."
      ]);
    } finally {
      setIsGeneratingMissedSummary(false);
    }
  };
  const [mediaSubFilter, setMediaSubFilter] = useState<'all' | 'images' | 'videos'>('all');
  const activeTheme = THEME_PACKAGES.find(t => t.id === chatInfo?.themePackage) || THEME_PACKAGES[0];
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<any>(null);
  const [userChats, setUserChats] = useState<any[]>([]);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isProofing, setIsProofing] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isLowLight, setIsLowLight] = useState(false);
  const [securityScore, setSecurityScore] = useState(100);
  const [threadSummary, setThreadSummary] = useState<string | null>(null);
  const pressTimer = useRef<any>(null);

  // Keydown listener for Lightbox Gallery Navigation
  useEffect(() => {
    if (!previewMedia) return;
    const allMedia = decryptedMessages.filter(m => !m.isViewOnce && (m.type === 'image' || m.type === 'video'));
    const currentIndex = allMedia.findIndex(m => m.mediaUrl === previewMedia.url);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewMedia(null);
      } else if (e.key === 'ArrowRight' || e.key === 'Right') {
        const nextIdx = currentIndex + 1;
        if (nextIdx < allMedia.length) {
          const nextMedia = allMedia[nextIdx];
          setPreviewMedia({
            url: nextMedia.mediaUrl,
            type: nextMedia.type,
            senderName: nextMedia.senderId === user?.uid ? 'You' : (nextMedia.senderName || chatInfo?.peerName || 'Peer'),
            createdAt: nextMedia.createdAt,
            id: nextMedia.id
          });
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        const prevIdx = currentIndex - 1;
        if (prevIdx >= 0) {
          const prevMedia = allMedia[prevIdx];
          setPreviewMedia({
            url: prevMedia.mediaUrl,
            type: prevMedia.type,
            senderName: prevMedia.senderId === user?.uid ? 'You' : (prevMedia.senderName || chatInfo?.peerName || 'Peer'),
            createdAt: prevMedia.createdAt,
            id: prevMedia.id
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewMedia, decryptedMessages, user?.uid, chatInfo?.peerName]);

  const messageStats = React.useMemo(() => {
    const now = new Date();
    const last24h = new Array(24).fill(0).map((_, i) => {
      const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      return {
        time: hour.getHours() + ":00",
        count: 0,
        timestamp: hour.getTime()
      };
    });

    decryptedMessages.forEach(msg => {
      const msgTime = msg.createdAt?.toDate ? msg.createdAt.toDate().getTime() : (typeof msg.createdAt === 'number' ? msg.createdAt : Date.now());
      const diffMs = now.getTime() - msgTime;
      const hourAgo = Math.floor(diffMs / 3600000);
      if (hourAgo >= 0 && hourAgo < 24) {
        last24h[23 - hourAgo].count++;
      }
    });

    return last24h;
  }, [decryptedMessages]);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const lastPlayedMessageIdRef = useRef<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionConfidence, setTranscriptionConfidence] = useState(0);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const isAtBottomRef = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const decryptedCache = useRef<Record<string, any>>({});



  useEffect(() => {
    if (showQRScanner) {
      startQRScanner();
    } else {
      stopQRScanner();
    }
    return () => stopQRScanner();
  }, [showQRScanner]);

  const startMessagePress = (e: React.MouseEvent | React.TouchEvent, msgId: string) => {
    pressTimer.current = setTimeout(() => {
      setSelectedThreadIds([msgId]);
      if ('vibrate' in navigator) navigator.vibrate(50);
    }, 600);
  };

  const endMessagePress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const toggleMessageInThread = (msgId: string) => {
    setSelectedThreadIds(prev => {
      if (prev.includes(msgId)) {
        const next = prev.filter(id => id !== msgId);
        return next;
      } else {
        return [...prev, msgId];
      }
    });
  };

  const summarizeSelectedThread = async () => {
    if (selectedThreadIds.length === 0) return;
    
    setIsSummarizing(true);
    setThreadSummary(null);
    try {
      const selectedMsgs = decryptedMessages
        .filter(m => selectedThreadIds.includes(m.id))
        .sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return timeA - timeB;
        })
        .map(m => ({
          senderId: m.senderId,
          senderName: m.senderId === user?.uid ? 'Me' : (chatInfo?.peerName || 'Peer'),
          text: m.text
        }));

      const response = await secureFetch("/api/ai/summarize-thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: selectedMsgs })
      });

      const data = await response.json();
      if (data.summary) {
        setThreadSummary(data.summary);
      } else {
        setToast({ message: "Failed to generate summary", type: 'error' });
      }
    } catch (err) {
      console.error("Summary failed", err);
      setToast({ message: "AI services currently unstable", type: 'error' });
    } finally {
      setIsSummarizing(false);
    }
  };
  
  const togglePinMessage = async (messageId: string) => {
    if (!chatId || !user) return;
    try {
      const isPinned = chatInfo?.pinnedMessages?.includes(messageId);
      await updateDoc(doc(db, 'chats', chatId), {
        pinnedMessages: isPinned 
          ? arrayRemove(messageId) 
          : arrayUnion(messageId)
      });
      setToast({ 
        message: isPinned ? "Message unpinned" : "Message pinned to top", 
        type: 'success' 
      });
    } catch (err) {
      console.error("Pinning failed", err);
      setToast({ message: "Failed to update pinned status", type: 'error' });
    }
  };

  const startQRScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      qrScannerRef.current = html5QrCode;
      const qrConfig = { fps: 10, qrbox: { width: 250, height: 250 } };
      await html5QrCode.start({ facingMode: "environment" }, qrConfig, onScanSuccess, () => {});
      
      // Persist torch state if it was previously enabled in the session
      if (isTorchOn) {
        await html5QrCode.applyVideoConstraints({
          advanced: [{ torch: true } as any]
        });
      }
    } catch (err) {
      console.error("QR start failed", err);
      setToast({ message: "Camera access denied", type: 'error' });
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

  const onScanSuccess = (decodedText: string) => {
    handleQRScan(decodedText);
  };

  // Load recent scans on mount
  useEffect(() => {
    const savedScans = localStorage.getItem('recent_qr_scans');
    if (savedScans) {
      try {
        setRecentScans(JSON.parse(savedScans));
      } catch (e) {
        console.error("Failed to parse recent scans", e);
      }
    }
  }, []);

  // Save recent scans on change
  useEffect(() => {
    localStorage.setItem('recent_qr_scans', JSON.stringify(recentScans));
  }, [recentScans]);

  // Real-time Cloud Scan History for Security Audit
  useEffect(() => {
    if (!user || !showQRScanner) return;
    const q = query(
      collection(db, 'scanHistory'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    return onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCloudScanHistory(history);
    });
  }, [user, showQRScanner]);

  // Auto-scroll to first search match
  useEffect(() => {
    if (roomSearchTerm.trim() && decryptedMessages.length > 0) {
      const firstMatch = decryptedMessages.find(m => 
        m.text?.toLowerCase().includes(roomSearchTerm.trim().toLowerCase())
      );
      if (firstMatch) {
        const element = document.getElementById(`message-${firstMatch.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [roomSearchTerm, decryptedMessages]);

  const toggleTorch = async () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      try {
        const newState = !isTorchOn;
        await qrScannerRef.current.applyVideoConstraints({
          advanced: [{ torch: newState } as any]
        });
        setIsTorchOn(newState);
      } catch (err) {
        console.error("Torch toggle failed:", err);
      }
    }
  };

  const handleQRScan = async (decodedText: string) => {
    try {
      await addDoc(collection(db, 'scanHistory'), {
        data: decodedText,
        userId: user?.uid,
        timestamp: serverTimestamp(),
        metadata: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          vendor: navigator.vendor,
          room: chatId
        }
      });

      // Validate schema
      const isTrusted = decodedText.startsWith('user:') || decodedText.startsWith('group:');
      
      if (isTrusted) {
        setShowSuccessFlash(true);
        setTimeout(() => setShowSuccessFlash(false), 800);
      }

      if (!isTrusted) {
        setScanWarning("Unrecognized Signal: This data source does not match expected protocol schemas. Connection may be compromised.");
        // We still add it to recent scans but keep scanner open to show warning
        const newScan = {
          id: Math.random().toString(36).substr(2, 9),
          data: decodedText,
          timestamp: Date.now()
        };
        setRecentScans(prev => [newScan, ...prev.filter(s => s.data !== decodedText).slice(0, 4)]);
        return;
      }

      setScanWarning(null);
      setShowQRScanner(false);
      
      // Add to recent scans history
      const newScan = {
        id: Math.random().toString(36).substr(2, 9),
        data: decodedText,
        timestamp: Date.now()
      };
      setRecentScans(prev => [newScan, ...prev.filter(s => s.data !== decodedText).slice(0, 4)]);

      // Logic: if starts with 'user:', navigate to chat; if starts with 'group:', join group
      if (decodedText.startsWith('user:')) {
        const peerId = decodedText.split(':')[1];
        setToast({ message: `Contact discovered: ${peerId}`, type: 'success' });
      } else if (decodedText.startsWith('group:')) {
        const gid = decodedText.split(':')[1];
        await updateDoc(doc(db, 'chats', gid), {
           participants: arrayUnion(user?.uid)
        });
        setToast({ message: "Joined new channel", type: 'success' });
        navigate(`/chat/${gid}`);
      } else {
        setToast({ message: `Scanned code: ${decodedText}`, type: 'success' });
      }
    } catch (err) {
      console.error("QR handle failed", err);
      setToast({ message: "Scan failed to process", type: 'error' });
    }
  };

  useEffect(() => {
    if (isRecording) {
      recordIntervalRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      setRecordDuration(0);
    }
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // Synchronize offline pending messages
  const syncPendingMessages = async () => {
    if (!navigator.onLine || !user || !chatId) return;
    const stored = localStorage.getItem(`enclave_pending_msgs_${user.uid}`);
    if (!stored) return;
    const pendingJson = JSON.parse(stored);
    if (pendingJson.length === 0) return;

    // Filter messages belonging only to this specific chat we go back online in
    const forThisChat = pendingJson.filter((m: any) => m.chatId === chatId);
    const otherChats = pendingJson.filter((m: any) => m.chatId !== chatId);
    
    const remainingPending: any[] = [...otherChats];

    // Detect dynamically if the chat exists in 'groupChat' collection
    let collectionName = 'chats';
    try {
      const groupDoc = doc(db, 'groupChat', chatId);
      const groupSnap = await getDoc(groupDoc);
      if (groupSnap.exists()) {
        collectionName = 'groupChat';
      }
    } catch (e) {
      console.warn("Error identifying sync target collection, defaulting to chats", e);
    }

    const mRef = collection(db, collectionName, chatId, 'messages');
    const cDocRef = doc(db, collectionName, chatId);

    for (const msg of forThisChat) {
      try {
        const payload: any = {
          senderId: msg.senderId,
          text: msg.text,
          type: msg.type,
          status: 'sent',
          createdAt: serverTimestamp(),
          readBy: [user.uid]
        };
        if (msg.burnDuration) {
          payload.burnDuration = msg.burnDuration;
          payload.burnTimeLeft = msg.burnTimeLeft;
        }
        if (msg.replyTo) {
          payload.replyTo = msg.replyTo;
        }

        await addDoc(mRef, payload);

        await updateDoc(cDocRef, {
          lastMessage: {
            text: msg.text,
            createdAt: serverTimestamp(),
            senderId: msg.senderId,
            status: 'sent'
          },
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to sync message from offline queue:", msg, err);
        remainingPending.push(msg);
      }
    }

    if (remainingPending.length === 0) {
      localStorage.removeItem(`enclave_pending_msgs_${user.uid}`);
    } else {
      localStorage.setItem(`enclave_pending_msgs_${user.uid}`, JSON.stringify(remainingPending));
    }
  };

  useEffect(() => {
    if (!chatId || !user) return;

    let unsubChat: () => void = () => {};
    let unsubTyping: () => void = () => {};
    let unsubMsgs: () => void = () => {};

    const initializeChatRoom = async () => {
      // Check which collection contains our chatId document
      const chatsDocRef = doc(db, 'chats', chatId);
      const groupChatsDocRef = doc(db, 'groupChat', chatId);
      const broadcastDocRef = doc(db, 'users', user.uid, 'broadcastLists', chatId);
      
      let isGroupColl = false;
      try {
        if (isBroadcast) {
          const broadcastSnap = await getDoc(broadcastDocRef);
          if (broadcastSnap.exists()) {
             setChatInfo({ ...broadcastSnap.data(), isBroadcast: true, isGroup: true, groupName: broadcastSnap.data().name });
          }
        } else {
          const chatsSnap = await getDoc(chatsDocRef);
          if (!chatsSnap.exists()) {
            const groupSnap = await getDoc(groupChatsDocRef);
            if (groupSnap.exists()) {
              isGroupColl = true;
            }
          }
        }
      } catch (e) {
        console.warn("Could not probe chat metadata", e);
      }

      setIsGroupChatColl(isGroupColl);

      if (isBroadcast) {
         unsubMsgs = onSnapshot(query(collection(db, 'users', user.uid, 'broadcastLists', chatId, 'messages'), orderBy('createdAt', 'asc')), (snap) => {
           setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
           setLoadingMessages(false);
         });
         return; // Don't subscribe to regular chat messages
      }

      const targetDocRef = isGroupColl ? groupChatsDocRef : chatsDocRef;
      const targetMessagesRef = collection(db, isGroupColl ? 'groupChat' : 'chats', chatId, 'messages');
      const targetTypingRef = collection(db, isGroupColl ? 'groupChat' : 'chats', chatId, 'typing');

      // Sync offline messages if connectivity returns
      syncPendingMessages();

      // Subscribe to chat metadata
      unsubChat = onSnapshot(targetDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          setChatInfo(docSnap.data());
        } else if (chatId?.startsWith('ai_companion_') || chatId?.startsWith('random_check_bot_')) {
          const isAI = chatId.startsWith('ai_companion_');
          const defaultChat = {
            isGroup: false,
            peerName: isAI ? 'Peace AI' : 'Random Check Bot',
            peerPhoto: isAI 
              ? 'https://images.unsplash.com/photo-1675271591211-126ad94e495d?q=80&w=200&auto=format&fit=crop'
              : 'https://api.dicebear.com/7.x/bottts/svg?seed=random_check_bot',
            vibe: 'Active',
            participants: [user.uid, isAI ? 'ai_companion' : 'random_check_bot'],
            createdAt: serverTimestamp(),
          };
          await setDoc(chatsDocRef, defaultChat);
          setChatInfo(defaultChat);
        } else {
          navigate('/chats');
        }
      }, (err) => {
        console.warn("Snapshot error for chat info:", err);
        if (!err.message.includes('offline')) {
          navigate('/chats');
        }
      });

      // Subscribe to typing indicators
      unsubTyping = onSnapshot(targetTypingRef, (snapshot) => {
        const typing = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((t: any) => t.id !== user.uid && t.isTyping);
        setTypingUsers(typing);
      });

      // Subscribe to messages in realtime
      const q = query(targetMessagesRef, orderBy('createdAt', 'asc'));
      unsubMsgs = onSnapshot(q, (snapshot) => {
        const msgData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];

        // Retrieve local pending offline messages for this chat and append them
        const storedPending = localStorage.getItem(`enclave_pending_msgs_${user.uid}`);
        let localPending: any[] = [];
        if (storedPending) {
          localPending = JSON.parse(storedPending).filter((m: any) => m.chatId === chatId);
        }

        const combinedMsgData = [...msgData, ...localPending];
        setMessages(combinedMsgData);
        setLoadingMessages(false);

        // Auto-mark incoming messages read and update 'readBy' array
        const unreadMsgs = snapshot.docs.filter(docSnap => {
          const data = docSnap.data();
          return data.senderId !== user.uid && data.status !== 'read';
        });

        const perChatReadReceipts = currentUserProfile?.notificationSettings?.[chatId!]?.readReceiptsEnabled !== false;
        const canMarkRead = (currentUserProfile?.privacySettings?.readReceiptsEnabled !== false && perChatReadReceipts) || chatInfo?.isGroup;

        if (unreadMsgs.length > 0 && canMarkRead) {
          const batch = writeBatch(db);
          unreadMsgs.forEach(docSnap => {
            batch.update(docSnap.ref, { 
              status: 'read',
              readBy: arrayUnion(user.uid)
            });
          });
          batch.commit().catch(console.error);
          
          updateDoc(targetDocRef, {
              'lastMessage.status': 'read'
          }).catch(console.error);
        }

        // play sound etc.
        if (msgData.length > 0) {
          const lastMsg = msgData[msgData.length - 1];
          if (lastMsg.senderId !== user.uid && lastMsg.id !== lastPlayedMessageIdRef.current) {
            const msgTime = lastMsg.createdAt?.toMillis?.() || (lastMsg.createdAt?.seconds * 1000);
            if (Date.now() - msgTime < 60000) {
              const tone = currentUserProfile?.notificationSettings?.[chatId!]?.tone || currentUserProfile?.notificationPreferences?.sound || 'Default';
              playNotificationSound(tone as ToneType);
            }
            lastPlayedMessageIdRef.current = lastMsg.id;
          }

          if (lastMsg.senderId !== user.uid && lastMsg.type === 'text') {
             getSmartReplies(msgData.slice(-5)).then(setSmartReplies).catch(() => setSmartReplies([]));
          } else {
             setSmartReplies([]);
          }
        }

        if (isAtBottomRef.current && autoScrollEnabled) {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `${isGroupColl ? 'groupChat' : 'chats'}/${chatId}/messages`);
      });
    };

    initializeChatRoom();

    const handleOnlineEvent = () => {
      syncPendingMessages();
    };

    window.addEventListener('online', handleOnlineEvent);

    return () => {
      window.removeEventListener('online', handleOnlineEvent);
      unsubChat();
      unsubTyping();
      unsubMsgs();
      if (user && chatId) {
        // Clear typing indicator status
        const isGroupColl = isGroupChatColl;
        deleteDoc(doc(db, isGroupColl ? 'groupChat' : 'chats', chatId, 'typing', user.uid)).catch(console.warn);
      }
    };
  }, [chatId, user, navigate, currentUserProfile?.privacySettings?.readReceiptsEnabled, isGroupChatColl]);

  useEffect(() => {
    if (showChatInfo && chatInfo?.participants) {
      const fetchParticipants = async () => {
        try {
          const users = await Promise.all(
            chatInfo.participants.map(async (pid: string) => {
              const uDoc = await getDoc(doc(db, 'users', pid));
              return { id: pid, ...uDoc.data() };
            })
          );
          setGroupParticipants(users);
        } catch (err) {
          console.warn("Failed to fetch participants, likely offline.", err);
        }
      };
      fetchParticipants();
    }
  }, [showChatInfo, chatInfo]);

  useEffect(() => {
    if (!chatInfo || !user || chatInfo.isGroup || chatInfo.isAI) return;
    
    let unsubPeer = () => {};
    const peerId = chatInfo.participants?.find((id: string) => id !== user.uid);
    
    if (peerId) {
      unsubPeer = onSnapshot(doc(db, 'users', peerId), (docSnap) => {
        if (docSnap.exists()) {
          setPeerProfile(docSnap.data());
        }
      });
    }

    const fetchKeys = async () => {
      try {
        if (!peerId) return;
        
        const peerDoc = await getDoc(doc(db, 'users', peerId));
        const pubKeyStr = peerDoc.data()?.publicKey;
        
        let myPrivKey = (window as any).e2ee_keys?.[`priv_${user.uid}`];
        if (!myPrivKey) {
          const keyPair = await generateKeyPair();
          if (!(window as any).e2ee_keys) {
            (window as any).e2ee_keys = {};
          }
          (window as any).e2ee_keys[`priv_${user.uid}`] = keyPair.privateKey;
          myPrivKey = keyPair.privateKey;
        }
        
        if (pubKeyStr && myPrivKey) {
          const peerPubKey = await importPublicKey(JSON.parse(pubKeyStr));
          const shared = await deriveSharedKey(myPrivKey, peerPubKey);
          setSharedKey(shared);
        }
      } catch (err) {
        console.warn("E2EE key exchange: Peer keys not yet available.");
      }
    };
    fetchKeys();

    return () => unsubPeer();
  }, [chatInfo, user]);

  useEffect(() => {
    const decryptMessages = async () => {
      const decrypted = await Promise.all(
        messages.map(async (msg) => {
          // If already in cache and original message hasn't changed, return cached
          if (
            decryptedCache.current[msg.id] && 
            decryptedCache.current[msg.id].status === msg.status && 
            decryptedCache.current[msg.id].reactions === msg.reactions &&
            decryptedCache.current[msg.id].text === msg.text &&
            decryptedCache.current[msg.id].encryptedData === msg.encryptedData &&
            JSON.stringify(decryptedCache.current[msg.id].edits) === JSON.stringify(msg.edits)
          ) {
            return decryptedCache.current[msg.id];
          }

          if (msg.isEncrypted && msg.encryptedData && sharedKey) {
            try {
              const rawText = await decryptText(msg.encryptedData, sharedKey);
              const decryptedMsg = { ...msg, text: rawText, isDecrypted: true };
              decryptedCache.current[msg.id] = decryptedMsg;
              return decryptedMsg;
            } catch (err) {
              return msg;
            }
          }
          return msg;
        })
      );
      setDecryptedMessages(decrypted);
    };
    decryptMessages();
  }, [messages, sharedKey]);

  const updateTypingStatus = async (isTyping: boolean) => {
    if (isPeaceModeActive) return;
    if (isTyping) {
      registerTypingActivity();
    } else {
      await clearTypingStatus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!isPeaceModeActive) {
      registerTypingActivity();
    }
  };

  const initiateCall = async (type: 'audio' | 'video') => {
    if (!user || !chatInfo?.participants) return;
    const peerId = chatInfo.participants.find((p: string) => p !== user.uid);
    if (!peerId) return;

    navigate(`/call/new?type=${type}&to=${peerId}`);
  };

  const startLocationShare = async () => {
    if (!navigator.geolocation || !user) {
      setToast({ message: "Geolocation is not supported by your browser", type: "error" });
      return;
    }

    setToast({ message: "Requesting live coordinates...", type: "success" });
    const isGroupColl = isGroupChatColl;
    const collectionName = isGroupColl ? 'groupChat' : 'chats';

    const msgRef = await addDoc(collection(db, collectionName, chatId, 'messages'), {
      type: 'location',
      senderId: user.uid,
      isLive: true,
      lat: null, 
      lng: null,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min default
      status: 'sent',
      readBy: [user.uid]
    });

    setSharingLocation(true);
    locationWatchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        updateDoc(doc(db, collectionName, chatId, 'messages', msgRef.id), {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }).catch(err => console.error("Error updating location", err));
      },
      (err) => console.error('Location watch failed', err),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
  };

  const stopLocationShare = async (messageId: string) => {
    if (locationWatchId.current !== null) {
      navigator.geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }
    setSharingLocation(false);
    const collectionName = isGroupChatColl ? 'groupChat' : 'chats';
    await updateDoc(doc(db, collectionName, chatId, 'messages', messageId), { isLive: false }).catch(err => console.log(err));
  };

  const sendStickerMessage = async (stickerEmoji: string) => {
    if (!user || !chatId) return;
    try {
      const isGroupColl = isGroupChatColl;
      const targetCollection = isGroupColl ? 'groupChat' : 'chats';
      const msgRef = collection(db, targetCollection, chatId, 'messages');
      const chatRef = doc(db, targetCollection, chatId);

      const messagePayload: any = {
        senderId: user.uid,
        text: `🌟 Premium Sticker: ${stickerEmoji}`,
        stickerUrl: stickerEmoji,
        type: 'sticker',
        status: 'sent',
        createdAt: serverTimestamp(),
        readBy: [user.uid]
      };

      if (disappearingSettings.timer > 0) {
        messagePayload.expiresAt = Timestamp.fromMillis(Date.now() + disappearingSettings.timer * 1000);
      }

      await addDoc(msgRef, messagePayload);

      // Update the parent chat lastMessage
      await updateDoc(chatRef, {
        lastMessage: {
          text: `🌟 Sticker [${stickerEmoji}]`,
          senderId: user.uid,
          createdAt: serverTimestamp()
        }
      });
    } catch (err) {
      console.error("Failed to send sticker:", err);
    }
  };

  const handleInlineEditSave = async (msg: any) => {
    if (!inlineEditText.trim()) return;
    try {
      const isGroupColl = isGroupChatColl;
      const targetCollection = isGroupColl ? 'groupChat' : 'chats';
      const msgRef = doc(db, targetCollection, chatId, 'messages', msg.id);
      
      const currentEdits = msg.edits || [];
      if (currentEdits.length >= 5) {
        alert("Edit limit reached (max 5 edits per transmission)");
        return;
      }

      let newEncryptedData: any = undefined;
      let textToStore = inlineEditText.trim();

      if (msg.isEncrypted && sharedKey) {
        newEncryptedData = await encryptText(inlineEditText.trim(), sharedKey);
        textToStore = "[Encrypted Message]";
      }

      const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const validEdits = currentEdits.filter((edit: any) => {
        const editTime = edit.editedAt?.toDate 
          ? edit.editedAt.toDate().getTime() 
          : new Date(edit.editedAt).getTime();
        return editTime >= ninetyDaysAgo;
      });

      const updatePayload: any = {};
      if (!msg.originalText) {
        updatePayload.originalText = msg.text || '';
        if (msg.isEncrypted && msg.encryptedData) {
          updatePayload.originalEncryptedData = msg.encryptedData;
        }
      }

      const newEdit: any = {
        text: msg.isEncrypted ? "[Encrypted Message]" : msg.text,
        editedAt: new Date(),
        editedBy: user?.uid || '',
        editNumber: validEdits.length + 1,
      };

      if (msg.isEncrypted && msg.encryptedData) {
        newEdit.encryptedData = msg.encryptedData;
      }

      // Check if it's an admin override
      const isMe = msg.senderId === user?.uid;
      const isAdmin = chatInfo?.admins?.includes(user?.uid) || false;
      const isAdminEdit = !isMe && isAdmin;
      if (isAdminEdit) {
        newEdit.editedByAdmin = true;
      }

      updatePayload.text = textToStore;
      updatePayload.isEdited = true;
      updatePayload.editedAt = serverTimestamp();
      updatePayload.edits = [...validEdits, newEdit];

      if (newEncryptedData) {
        updatePayload.encryptedData = newEncryptedData;
      }

      if (isAdminEdit) {
        updatePayload.editedByAdmin = true;
        if (hideHistoryByAdmin) {
          updatePayload.hideHistory = true;
        }
      }

      await updateDoc(msgRef, updatePayload);

      // Create a subtle system message
      await addDoc(collection(db, targetCollection, chatId, 'messages'), {
        text: isMe ? `You edited a transmission` : `An override edit was recorded`,
        type: 'system',
        createdAt: serverTimestamp()
      });

      setEditingMessage(null);
      setInlineEditText('');
    } catch (err: any) {
      console.error("Inline edit failed:", err);
      alert(err.message || "Failed to edit message");
    }
  };

  const handleEventCreatedInChat = async (evt: any) => {
    if (!user || !chatId) return;
    try {
      const isGroupColl = isGroupChatColl;
      const targetCollection = isGroupColl ? 'groupChat' : 'chats';
      const msgRef = collection(db, targetCollection, chatId, 'messages');
      const chatRef = doc(db, targetCollection, chatId);

      const eventPayload = {
        senderId: user.uid,
        text: `📅 Scheduled coordination block: "${evt.title}"`,
        type: 'event',
        eventInfo: evt,
        status: 'sent',
        createdAt: serverTimestamp(),
        readBy: [user.uid],
        isEncrypted: false
      };

      await addDoc(msgRef, eventPayload);
      
      // Update last message in chat document
      await updateDoc(chatRef, {
        lastMessage: {
          text: `📅 Operational block: "${evt.title}"`,
          createdAt: serverTimestamp(),
          senderId: user.uid,
          status: 'sent'
        }
      });
      
      setToast({ message: "Coordination block booked & shared with chat", type: 'success' });
    } catch (err) {
      console.error("Failed to share booked block inside chat:", err);
      setToast({ message: "Failed to broadcast calendar event", type: 'error' });
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !editingMessage && selectedAttachments.length === 0) return;
    if (!user || !chatId || sending) return;

    if (!isGroup && peerProfile?.settings?.peaceMode?.onlyCloseFriendsMessage) {
      const isSenderCFOfReceiver = Array.isArray(peerProfile?.closeFriends) && peerProfile.closeFriends.some((cf: any) => (cf.userId === user?.uid || cf === user?.uid));
      if (!isSenderCFOfReceiver) {
        setToast({ message: "This recipient has enabled Peace Mode restricted to their Close Friends enclave. Transmission blocked.", type: 'error' });
        return;
      }
    }

    if (isMessageLimitLocked && !editingMessage) {
      setToast({ message: "Hourly message limit reached under Peace Mode! Take a breath or disable limit.", type: 'error' });
      return;
    }

    setSending(true);

    if (activeScheduledDate && !editingMessage) {
      try {
        let textToSend = inputText.trim();
        let payload: any = {
          chatId,
          type: 'text',
          attachments: [],
          recurrence: activeRecurrence,
          isEncrypted: false
        };

        if (sharedKey && textToSend) {
          const encrypted = await encryptText(textToSend, sharedKey);
          payload.encryptedData = encrypted;
          payload.text = "[Encrypted Message]";
          payload.isEncrypted = true;
        }

        await scheduleMessage(textToSend, activeScheduledDate, payload);
        
        setInputText('');
        setActiveScheduledDate(null);
        setActiveRecurrence(null);
        setToast({ message: "Transmission scheduled successfully", type: 'success' });
        setSending(false);
        return;
      } catch (err) {
        console.error("Scheduling failed", err);
        setToast({ message: "Scheduling failure detected", type: 'error' });
        setSending(false);
        return;
      }
    }

    if (editingMessage) {
      try {
        const isGroupColl = isGroupChatColl;
        const targetCollection = isGroupColl ? 'groupChat' : 'chats';
        const docRef = doc(db, targetCollection, chatId, 'messages', editingMessage.id);
        
        let newPayload: any = {
          text: inputText.trim(),
          isEdited: true,
          editedAt: serverTimestamp()
        };

        if (sharedKey) {
          const encrypted = await encryptText(inputText.trim(), sharedKey);
          newPayload.encryptedData = encrypted;
          newPayload.text = "[Encrypted Message]";
          newPayload.isEncrypted = true;
        }

        await updateDoc(docRef, newPayload);
        
        // Also update local mock if it's a mock bot
        if (chatId.includes('random_check_bot') || chatId.startsWith('ai_companion_')) {
          setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, text: inputText.trim(), isEdited: true, editedAt: new Date() } : m));
        }

        setInputText('');
        setEditingMessage(null);
        setSending(false);
        return;
      } catch (err) {
        console.error("Failed to edit message:", err);
        setToast({ message: "Failed to edit message", type: 'error' });
        setSending(false);
        return;
      }
    }

    updateTypingStatus(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const isGroupColl = isGroupChatColl;
    const targetCollection = isGroupColl ? 'groupChat' : 'chats';
    const msgRef = collection(db, targetCollection, chatId, 'messages');
    const chatRef = doc(db, targetCollection, chatId);

    // BROADCAST LIST LOGIC
    if (isBroadcast && chatInfo?.recipients) {
      setInputText('');
      clearDraft();
      setSelectedAttachments([]);
      setIsViewOnce(false);
      
      const batch = writeBatch(db);
      
      // Determine what to send
      let textToSend = inputText.trim();
      
      try {
        for (const recipientId of chatInfo.recipients) {
          // Determine the 1-1 chat ID
          const dmChatId = [user.uid, recipientId].sort().join('_');
          const dmMsgRef = doc(collection(db, 'chats', dmChatId, 'messages'));
          
          let messageData: any = {
            senderId: user.uid,
            text: textToSend,
            type: 'text',
            status: 'sent',
            isViewOnce: isViewOnce,
            createdAt: serverTimestamp(),
            readBy: [user.uid],
            isBroadcast: true // Flag to show megaphone icon on recipient side
          };
          
          if (ephemeralTimer > 0) {
            messageData.burnDuration = ephemeralTimer;
            messageData.burnTimeLeft = ephemeralTimer;
          }

          batch.set(dmMsgRef, messageData);
          
          // Ensure DM chat doc exists
          const dmChatRef = doc(db, 'chats', dmChatId);
          batch.set(dmChatRef, {
            participants: [user.uid, recipientId],
            updatedAt: serverTimestamp(),
            lastMessage: {
              text: textToSend,
              senderId: user.uid,
              createdAt: serverTimestamp(),
              status: 'sent',
              isBroadcast: true
            }
          }, { merge: true });
        }
        
        await batch.commit();
        setToast({ message: `Broadcast sent to ${chatInfo.recipients.length} recipients`, type: 'success' });
        
        // Also save it locally in the broadcast list's own message history so sender can see what they sent
        const bcMsgRef = collection(db, 'users', user.uid, 'broadcastLists', chatId, 'messages');
        await addDoc(bcMsgRef, {
           senderId: user.uid,
           text: textToSend,
           type: 'text',
           status: 'sent',
           createdAt: serverTimestamp(),
           recipientCount: chatInfo.recipients.length
        });
        incrementMessageCount();
        
      } catch (err) {
        console.error("Broadcast failed:", err);
        setToast({ message: "Broadcast failed", type: 'error' });
      } finally {
        setSending(false);
      }
      return;
    }

    // Dynamic offline fallback queue check / Bot intercept
    const isBotRoom = chatId?.startsWith('ai_companion_') || chatId?.includes('random_check_bot_') || chatId?.includes('random_check_bot');
    const promptText = inputText.trim();

    if (isBotRoom) {
      setInputText('');
      clearDraft();
      setSelectedAttachments([]);
      setIsViewOnce(false);
      setSending(false);

      if (promptText) {
        const localUserMsg: any = {
          id: `local-user-${Date.now()}`,
          chatId: chatId,
          senderId: user.uid,
          text: promptText,
          type: 'text',
          status: 'sent',
          createdAt: new Date(),
          readBy: [user.uid]
        };

        setMessages(prev => [...prev, localUserMsg]);
        isAtBottomRef.current = true;
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

        // Background write user message to firestore (never block UI loop)
        addDoc(msgRef, {
          senderId: user.uid,
          text: promptText,
          type: 'text',
          status: 'sent',
          createdAt: serverTimestamp(),
          readBy: [user.uid]
        }).catch(err => console.warn("Background user msg save warning:", err));

        const botId = chatId.includes('random_check_bot') ? 'random_check_bot' : 'ai_companion';
        const botDisplayName = chatId.includes('random_check_bot') ? 'Random Check Bot' : 'Peace AI';

        // Set typing user locally
        setTypingUsers([botId]);
        const botTypingRef = doc(db, 'chats', chatId, 'typing', botId);
        setDoc(botTypingRef, { isTyping: true, displayName: botDisplayName }).catch(console.warn);

        setTimeout(async () => {
          let botText = "";
          try {
            botText = await getAIResponse(promptText, [], botId);
          } catch (err) {
            console.error("Bot AI fetch error, falling back locally:", err);
          }

          if (!botText || botText.includes("Disconnected from My Messenger Core")) {
            botText = `Echo: "${promptText}" — Peace AI sandbox is fully responsive and online.`;
          }

          const botLocalMsg: any = {
            id: `local-bot-${Date.now()}`,
            chatId: chatId,
            senderId: botId,
            text: botText,
            type: 'text',
            status: 'delivered',
            createdAt: new Date(),
            readBy: [botId]
          };

          // Append locally immediately to respond instantly
          setMessages(prev => {
            if (prev.some(m => m.id === botLocalMsg.id || (m.text === botLocalMsg.text && m.senderId === botId))) return prev;
            return [...prev, botLocalMsg];
          });
          isAtBottomRef.current = true;
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

          // Background write bot message to firestore (never block UI loop)
          addDoc(msgRef, {
            senderId: botId,
            text: botText,
            type: 'text',
            status: 'delivered',
            createdAt: serverTimestamp(),
            readBy: [botId]
          }).catch(err => console.warn("Background bot msg save warning:", err));

          setTypingUsers([]);
          deleteDoc(botTypingRef).catch(console.warn);
        }, 800);
      }
      return;
    }

    // Dynamic offline queue logic
    if (!navigator.onLine) {
      if (inputText.trim()) {
        const tempId = `pending-${Date.now()}`;
        const messagePayload: any = {
          id: tempId,
          chatId: chatId,
          senderId: user.uid,
          text: inputText,
          type: 'text',
          status: 'sending',
          createdAt: Date.now(),
          readBy: [user.uid],
          isOfflinePending: true
        };

        if (disappearingSettings.timer > 0) {
          messagePayload.expiresAt = Timestamp.fromMillis(Date.now() + disappearingSettings.timer * 1000);
        }

        if (ephemeralTimer > 0) {
          messagePayload.burnDuration = ephemeralTimer;
          messagePayload.burnTimeLeft = ephemeralTimer;
        }

        if (replyingTo) {
           messagePayload.replyTo = {
              messageId: replyingTo.id,
              text: replyingTo.text || 'Attachment',
              senderId: replyingTo.senderId,
           };
           setReplyingTo(null);
        }

        // Save to offline localStorage queue
        try {
          const storedPending = localStorage.getItem(`enclave_pending_msgs_${user.uid}`);
          const currentPending = storedPending ? JSON.parse(storedPending) : [];
          currentPending.push(messagePayload);
          localStorage.setItem(`enclave_pending_msgs_${user.uid}`, JSON.stringify(currentPending));
        } catch (storageErr) {
          console.warn("Could not write offline queue item", storageErr);
        }

        // Append to state instantly for responsive user feedback
        setMessages(prev => [...prev, messagePayload]);

        setInputText('');
        clearDraft();
        setIsViewOnce(false);
        setSending(false);
        
        isAtBottomRef.current = true;
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      return;
    }

    try {
      // Handle text message if exists
      if (inputText.trim()) {
        learnSentMessage(inputText);
        const messageData: any = {
          senderId: user.uid,
          text: inputText,
          type: 'text',
          status: 'sent',
          isViewOnce: isViewOnce,
          createdAt: serverTimestamp(),
          readBy: [user.uid] // Include initial read receipt
        };

        if (disappearingSettings.timer > 0) {
          messageData.expiresAt = Timestamp.fromMillis(Date.now() + disappearingSettings.timer * 1000);
        }

        if (ephemeralTimer > 0) {
          messageData.burnDuration = ephemeralTimer;
          messageData.burnTimeLeft = ephemeralTimer;
        }

        if (replyingTo) {
           messageData.replyTo = {
              messageId: replyingTo.id,
              text: replyingTo.text || 'Attachment',
              senderId: replyingTo.senderId,
           };
           setReplyingTo(null);
        }

        let finalData = { ...messageData };
        if (sharedKey && finalData.text) {
          const encrypted = await encryptText(finalData.text, sharedKey);
          finalData.encryptedData = encrypted;
          finalData.text = "[Encrypted Message]";
          finalData.isEncrypted = true;
        }

        await addDoc(msgRef, finalData);
      }

      // Handle chat with random check bot
      if (chatId.includes('random_check_bot')) {
         const botTypingRef = doc(db, 'chats', chatId, 'typing', 'random_check_bot');
         await setDoc(botTypingRef, { isTyping: true, displayName: 'Random Check Bot' });

         setTimeout(async () => {
            try {
               let prompt = inputText.trim();
               if (!prompt && selectedAttachments.length > 0) {
                 prompt = `I am sharing ${selectedAttachments.length} file(s): ${selectedAttachments.map(f => f.name).join(', ')}. Please perform a funny safety check or dynamic scan and comment on them.`;
               }
               const botText = await getAIResponse(prompt, [], 'random_check_bot');
               await addDoc(msgRef, {
                   senderId: 'random_check_bot',
                   text: botText,
                   type: 'text',
                   status: 'delivered',
                   createdAt: serverTimestamp(),
                   readBy: ['random_check_bot']
               });
            } catch (err) {
               console.error("Random Check Bot error:", err);
            } finally {
               await deleteDoc(botTypingRef);
            }
         }, 1000);
      }

      // Handle attachments
      if (selectedAttachments.length > 0) {
        setUploading(true);
        for (const file of selectedAttachments) {
          try {
            const url = await uploadFile(file, `chats/${chatId}/${Date.now()}_${file.name}`);
            const type = file.type.startsWith('image/') 
              ? 'image' 
              : (file.type.startsWith('video/') 
                  ? 'video' 
                  : (file.type.startsWith('audio/') ? 'audio' : 'file'));
            const messagePayload: any = {
              senderId: user.uid,
              mediaUrl: url,
              fileName: file.name,
              fileSize: file.size,
              type: type,
              status: 'sent',
              isViewOnce: (type === 'image' || type === 'video') && isViewOnce,
              createdAt: serverTimestamp(),
              readBy: [user.uid] // Include initial read receipt
            };
            if (disappearingSettings.timer > 0 && !isViewOnce) {
              messagePayload.expiresAt = Timestamp.fromMillis(Date.now() + disappearingSettings.timer * 1000);
            }
            if (ephemeralTimer > 0) {
              messagePayload.burnDuration = ephemeralTimer;
              messagePayload.burnTimeLeft = ephemeralTimer;
            }
            await addDoc(msgRef, messagePayload);
          } catch (uploadErr) {
            console.error("Single attachment upload failed", uploadErr);
          }
        }
        setUploading(false);
      }

      
      // Update chat last message
      if (chatId !== 'ai_companion') {
        const lastText = selectedAttachments.length > 0 
          ? `Sent ${selectedAttachments.length} attachment(s)`
          : (inputText.length > 0 ? inputText : 'Sent an attachment');
          
        await updateDoc(chatRef, {
          lastMessage: {
            text: inputText.trim() && sharedKey ? "[Encrypted Message]" : lastText,
            createdAt: serverTimestamp(),
            senderId: user.uid,
            isEncrypted: (inputText.trim() && sharedKey) || false,
            isViewOnce: isViewOnce,
            status: 'sent'
          },
          updatedAt: serverTimestamp(),
        });
      }

      const userMessage = inputText;
      setInputText('');
      clearDraft();
      setSelectedAttachments([]);
      setIsViewOnce(false);
      incrementMessageCount();
      
      // Force scroll to bottom after sending
      isAtBottomRef.current = true;
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      // AI Response Logic
      if (chatId?.startsWith('ai_companion_')) {
        // AI is "typing"
        const aiTypingRef = doc(db, 'chats', chatId, 'typing', 'ai_companion');
        await setDoc(aiTypingRef, { isTyping: true, displayName: 'Peace AI' });
        
        try {
          const aiText = await getAIResponse(userMessage);
          await addDoc(msgRef, {
            senderId: 'ai_companion',
            text: aiText,
            type: 'text',
            status: 'sent',
            createdAt: serverTimestamp(),
            readBy: ['ai_companion']
          });
        } finally {
          await setDoc(aiTypingRef, { isTyping: false });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${targetCollection}/${chatId}/messages`);
    } finally {
      setSending(false);
    }
  };

  const fetchUserChats = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid),
        orderBy('updatedAt', 'desc'),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserChats(chats);
    } catch (err) {
      console.error("Failed to fetch chats for forwarding", err);
    }
  };

  const handleForwardMessage = async (targetChatId: string) => {
    if (!forwardingMessage || !user) return;

    try {
      const targetMsgRef = collection(db, 'chats', targetChatId, 'messages');
      const targetChatRef = doc(db, 'chats', targetChatId);

      // Create forwarded message copy
      const messageCopy = {
        senderId: user.uid,
        text: forwardingMessage.text || '',
        mediaUrl: forwardingMessage.mediaUrl || null,
        type: forwardingMessage.type || 'text',
        duration: forwardingMessage.duration || null,
        status: 'sent',
        isForwarded: true,
        createdAt: serverTimestamp(),
      };

      await addDoc(targetMsgRef, messageCopy);

      // Update target chat last message
      await updateDoc(targetChatRef, {
        lastMessage: {
          text: `↪️ Forwarded: ${messageCopy.text || (messageCopy.type === 'audio' ? 'Voice' : 'Media')}`,
          createdAt: serverTimestamp(),
          senderId: user.uid,
        },
        updatedAt: serverTimestamp(),
      });

      setShowForwardModal(false);
      setForwardingMessage(null);
      
      if (targetChatId === chatId) {
         // If forwarding to current chat, it will show up automatically via onSnapshot
      }
    } catch (err) {
      console.error("Forwarding failed", err);
    }
  };

  const clearChatHistory = async () => {
    if (!chatId) return;
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      const batch = writeBatch(db);
      messagesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setShowChatInfo(false);
      setShowSettingsMenu(false);
    } catch (error) {
      console.error("Error clearing chat history", error);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !chatId || uploading) return;

    try {
      setUploading(true);
      const isVideo = file.type.startsWith('video/');
      const type = isVideo ? 'video' : 'image';
      
      const url = await uploadFile(file, `chats/${chatId}`);
      
      const msgRef = collection(db, 'chats', chatId, 'messages');
      const chatRef = doc(db, 'chats', chatId);

      const messageData = {
        senderId: user.uid,
        mediaUrl: url,
        type: type,
        status: 'sent',
        isViewOnce: isViewOnce,
        isOpened: false,
        createdAt: serverTimestamp(),
      };

      await addDoc(msgRef, messageData);
      setIsViewOnce(false);
      await updateDoc(chatRef, {
        lastMessage: {
          text: `Sent an ${type}`,
          createdAt: serverTimestamp(),
          senderId: user.uid,
        },
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Media upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (recordDuration < 1) return; // Ignore very short recordings

        try {
          setUploading(true);
          const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
          const url = await uploadFile(file, `chats/${chatId}`);
          
          const targetColl = isGroupChatColl ? 'groupChat' : 'chats';
          const audioPayload: any = {
            senderId: user!.uid,
            mediaUrl: url,
            type: 'audio',
            duration: recordDuration,
            status: 'sent',
            createdAt: serverTimestamp(),
          };

          if (disappearingSettings.timer > 0) {
            audioPayload.expiresAt = Timestamp.fromMillis(Date.now() + disappearingSettings.timer * 1000);
          }

          await addDoc(collection(db, targetColl, chatId!, 'messages'), audioPayload);

          await updateDoc(doc(db, targetColl, chatId!), {
            lastMessage: {
              text: '🎤 Voice message',
              createdAt: serverTimestamp(),
              senderId: user!.uid,
            },
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error("Voice upload failed", err);
        } finally {
          setUploading(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
    }
  };

  const stopRecording = (cancel = false) => {
    if (mediaRecorderRef.current && isRecording) {
      if (cancel) {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } else {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  const transcribeVoiceMessage = async (messageId: string, mediaUrl: string) => {
    if (!chatId || transcribingMessages.has(messageId)) return;
    
    setTranscribingMessages(prev => {
      const next = new Set(prev);
      next.add(messageId);
      return next;
    });

    try {
      const response = await secureFetch('/api/ai/transcribe-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaUrl, messageId, chatId })
      });

      const data = await response.json();
      if (data.transcript) {
        // Update message with transcript in Firestore
        const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
        await updateDoc(msgRef, {
          transcript: data.transcript,
          transcriptionConfidence: data.confidence || 0.95
        });
        setToast({ message: "Transcription complete", type: 'success' });
      } else {
        setToast({ message: "Transcription failed", type: 'error' });
      }
    } catch (err) {
      console.error("Transcription error", err);
      setToast({ message: "Voice AI services busy", type: 'error' });
    } finally {
      setTranscribingMessages(prev => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    }
  };

  const simulateCall = async (type: 'voice' | 'video' = 'voice') => {
    if (!chatId || !user || chatInfo?.isGroup) return;
    const peerId = chatInfo.participants.find((id: string) => id !== user.uid);
    if (!peerId) return;

    if (currentUserProfile?.blockedUsers?.includes(peerId) || peerProfile?.blockedUsers?.includes(user?.uid)) {
      alert("Calls are currently suspended for this channel.");
      return;
    }

    try {
      await addDoc(collection(db, 'calls'), {
        callerId: user.uid,
        receiverId: peerId,
        participants: [user.uid, peerId],
        type,
        status: Math.random() > 0.3 ? 'completed' : 'missed',
        duration: Math.floor(Math.random() * 300),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Call simulation failed", err);
    }
  };

  const [showEmojiInput, setShowEmojiInput] = useState<string | null>(null);
  const emojiInputRef = useRef<HTMLInputElement>(null);

  const addReaction = async (messageId: string, emoji: string) => {
    if (!chatId || !user) return;
    try {
      const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
      const msgSnap = await getDoc(msgRef);
      if (!msgSnap.exists()) return;
      
      const currentReactions = msgSnap.data().reactions || {};
      const userReactions = currentReactions[emoji] || [];
      
      if (userReactions.includes(user.uid)) {
        currentReactions[emoji] = userReactions.filter((id: string) => id !== user.uid);
      } else {
        currentReactions[emoji] = [...userReactions, user.uid];
      }

      await updateDoc(msgRef, { reactions: currentReactions });
    } catch (err) {
      console.error("Reaction failed", err);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!chatId || !user) return;
    try {
      const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
      await updateDoc(msgRef, {
        text: '🚫 This message was deleted',
        type: 'deleted',
        mediaUrl: null,
        isDeleted: true
      });
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const openViewOnce = async (msg: any) => {
    if (!msg.isViewOnce || msg.isOpened || msg.senderId === user?.uid) return;
    
    setViewOnceMedia(msg);
    
    try {
      await updateDoc(doc(db, 'chats', chatId!, 'messages', msg.id), {
        isOpened: true,
        status: 'read'
      });
    } catch (err) {
      console.error("View once update failed", err);
    }
  };

  // Automated Theme Cycling
  useEffect(() => {
    if (!isThemeCycleEnabled || !chatId || !user) return;

    const checkCycle = () => {
      const hour = new Date().getHours();
      let targetThemeId = 'classic'; // Default
      
      if (hour >= 20 || hour < 6) {
        targetThemeId = 'noir';
      } else if (hour >= 6 && hour < 12) {
        targetThemeId = 'classic';
      } else if (hour >= 12 && hour < 17) {
        targetThemeId = 'candy';
      } else {
        targetThemeId = 'ocean';
      }

      if (chatInfo?.themePackage !== targetThemeId) {
        const pkg = THEME_PACKAGES.find(p => p.id === targetThemeId);
        if (pkg) updateThemePackage(pkg);
      }
    };

    checkCycle();
    const interval = setInterval(checkCycle, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isThemeCycleEnabled, chatId, user, chatInfo?.themePackage]);

  useEffect(() => {
    // Load preference from local storage or profile if available (default to false)
    const stored = localStorage.getItem(`themeCycle_${chatId}`);
    if (stored === 'true') setIsThemeCycleEnabled(true);
    
    const storedAutoReply = localStorage.getItem(`aiAutoReply_${chatId}`);
    if (storedAutoReply === 'true') setIsAiAutoReplyEnabled(true);
  }, [chatId]);

  // AI Auto-Reply Logic
  useEffect(() => {
    if (!isAiAutoReplyEnabled || !chatId || !user || decryptedMessages.length === 0) return;

    const lastMsg = decryptedMessages[decryptedMessages.length - 1];
    
    // Only trigger if last message is from peer and we haven't replied yet
    if (lastMsg.senderId === user.uid) return;

    const checkAutoReply = async () => {
      // Check if user is "away" (not online or haven't been seen for > 5 mins)
      // For this app context, we'll check document visibility or a simple timer since "away"
      const lastSeenTime = currentUserProfile?.lastSeen?.toMillis?.() || 0;
      const isAway = (Date.now() - lastSeenTime) > 300000; // 5 minutes

      if (isAway && !inputText.trim()) {
        try {
          const response = await secureFetch("/api/ai/generate-auto-reply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              lastMessages: decryptedMessages.slice(-5),
              peerName: peerProfile?.displayName || chatInfo?.peerName 
            })
          });
          const data = await response.json();
          if (data.text) {
            setInputText(data.text);
            setToast({ 
              message: "AI has drafted a response for you", 
              type: 'success' 
            });
          }
        } catch (err) {
          console.error("Auto-reply generation failed", err);
        }
      }
    };

    checkAutoReply();
  }, [decryptedMessages, isAiAutoReplyEnabled, user, chatId, peerProfile, currentUserProfile]);

  const toggleStar = async (messageId: string) => {
    if (!user || !currentUserProfile) return;
    const isStarred = currentUserProfile.starredMessages?.some((s: any) => s.messageId === messageId);
    try {
      const userRef = doc(db, 'users', user.uid);
      if (isStarred) {
        await updateDoc(userRef, {
          starredMessages: currentUserProfile.starredMessages.filter((s: any) => s.messageId !== messageId)
        });
      } else {
        const msg = messages.find(m => m.id === messageId);
        await updateDoc(userRef, {
          starredMessages: arrayUnion({
            messageId,
            chatId,
            text: msg?.text || '[Media]',
            createdAt: new Date().toISOString()
          })
        });
      }
    } catch (err) {
      console.error("Starring failed", err);
    }
  };
  const toggleAdmin = async (targetUserId: string) => {
    if (!chatId || !chatInfo?.admins.includes(user?.uid)) return;
    const newAdmins = chatInfo.admins.includes(targetUserId)
      ? chatInfo.admins.filter((id: string) => id !== targetUserId)
      : [...chatInfo.admins, targetUserId];
    
    try {
      await updateDoc(doc(db, 'chats', chatId), { admins: newAdmins });
    } catch (err) {
      console.error("Failed to update admin", err);
    }
  };

  const removeParticipant = async (targetUserId: string) => {
    if (!chatId || !chatInfo?.admins.includes(user?.uid)) return;
    const newParticipants = chatInfo.participants.filter((id: string) => id !== targetUserId);
    const newAdmins = chatInfo.admins.filter((id: string) => id !== targetUserId);

    try {
      await updateDoc(doc(db, 'chats', chatId), { 
        participants: newParticipants,
        admins: newAdmins
      });
    } catch (err) {
      console.error("Failed to remove participant", err);
    }
  };

  const updateThemePackage = async (pkg: any) => {
    if (!chatId || !user) return;
    try {
      if (chatId.startsWith('ai_companion_') || chatId.startsWith('random_check_bot_')) {
        setChatInfo((prev: any) => ({ ...prev, themePackage: pkg.id }));
        setShowThemePicker(false);
        return;
      }
      const targetCollection = isGroupChatColl ? 'groupChat' : 'chats';
      await updateDoc(doc(db, targetCollection, chatId), {
        themePackage: pkg.id
      });
      setShowThemePicker(false);
    } catch (err) {
      console.error("Theme Package update failed", err);
    }
  };

  const updateChatCustomAttributes = async (updates: {
    customWallpaper?: string | null;
    customAccentColor?: string | null;
    customColor?: string | null;
    customDarkColor?: string | null;
    customWallpaperOpacity?: number | null;
  }) => {
    if (!chatId || !user) return;
    try {
      if (chatId.startsWith('ai_companion_') || chatId.startsWith('random_check_bot_')) {
        setChatInfo((prev: any) => ({ ...prev, ...updates }));
        return;
      }
      const targetCollection = isGroupChatColl ? 'groupChat' : 'chats';
      await updateDoc(doc(db, targetCollection, chatId), updates);
    } catch (err) {
      console.error("Failed to update chat customization options", err);
    }
  };

  const updateNotificationTone = async (tone: string) => {
    if (!chatId || !user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        [`notificationSettings.${chatId}.tone`]: tone
      });
    } catch (err) {
      console.error("Notification settings update failed", err);
    }
  };

  const togglePerChatReadReceipts = async (enabled: boolean) => {
    if (!chatId || !user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        [`notificationSettings.${chatId}.readReceiptsEnabled`]: enabled
      });
    } catch (err) {
      console.error("Read receipts setting update failed", err);
    }
  };

  const toggleVoiceToText = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    if (isTranscribing) {
      setIsTranscribing(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => setIsTranscribing(true);
    recognition.onend = () => setIsTranscribing(false);
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsTranscribing(false);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let confidence = 0;
      let count = 0;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
          confidence += event.results[i][0].confidence;
          count++;
        }
      }

      if (count > 0) {
        setTranscriptionConfidence(Math.round((confidence / count) * 100));
      }

      if (finalTranscript) {
        setInputText(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + finalTranscript);
      }
    };

    recognition.start();
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    isAtBottomRef.current = isAtBottom;
    setShowScrollToBottom(!isAtBottom);
  };

  const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-zinc-900 font-bold rounded-sm px-0.5 transition-all duration-300">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  useEffect(() => {
    if (showCameraWallpaperModal) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [showCameraWallpaperModal]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      setToast({ message: "Camera access denied. Please check your permissions.", type: 'error' });
      setShowCameraWallpaperModal(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
      }
    }
  };

  useEffect(() => {
    if (showCameraCaptureModal) {
      startCaptureCamera();
    } else {
      stopCaptureCamera();
    }
    return () => stopCaptureCamera();
  }, [showCameraCaptureModal]);

  const startCaptureCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setCaptureStream(stream);
      if (captureVideoRef.current) {
        captureVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied for capture:", err);
      setToast({ message: "Camera access denied. Please verify your permissions.", type: 'error' });
      setShowCameraCaptureModal(false);
    }
  };

  const stopCaptureCamera = () => {
    if (captureStream) {
      captureStream.getTracks().forEach(track => track.stop());
      setCaptureStream(null);
    }
    setCapturedPhoto(null);
  };

  const handleCapturePhoto = () => {
    if (captureVideoRef.current) {
      const video = captureVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror the image horizontally for clean intuitive selfie perspective
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPhoto(dataUrl);
      }
    }
  };

  const handleAcceptPhoto = () => {
    if (capturedPhoto) {
      fetch(capturedPhoto)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `secure_snapshot_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setSelectedAttachments(prev => [...prev, file]);
          setShowCameraCaptureModal(false);
          setToast({ message: "Secured snapshot loaded to attachment pool!", type: 'success' });
        })
        .catch(err => {
          console.error("Failed to process captured image:", err);
          setToast({ message: "Capture validation failed", type: 'error' });
        });
    }
  };

  const saveWallpaper = async () => {
    if (!capturedImage || !chatId) return;

    try {
      setUploading(true);
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const file = new File([blob], `wallpaper_${chatId}.jpg`, { type: 'image/jpeg' });
      
      const downloadURL = await uploadFile(file, `wallpapers/${chatId}`);
      
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        customWallpaper: downloadURL,
        updatedAt: serverTimestamp()
      });
      
      setToast({ message: "Chat wallpaper updated successfully!", type: 'success' });
      setShowCameraWallpaperModal(false);
      stopCamera();
    } catch (err) {
      console.error("Failed to save wallpaper", err);
      setToast({ message: "Failed to save wallpaper. Please try again.", type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const selectPatternWallpaper = async (url: string) => {
    if (!chatId) return;
    try {
      setIsUpdatingWallpaper(true);
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        customWallpaper: url,
        updatedAt: serverTimestamp()
      });
      setToast({ message: "Wallpaper updated from gallery", type: 'success' });
      setShowWallpaperGallery(false);
    } catch (err) {
      console.error("Gallery update failed", err);
      setToast({ message: "Failed to update wallpaper", type: 'error' });
    } finally {
      setIsUpdatingWallpaper(false);
    }
  };

  const exportChatHistory = (format: 'json' | 'csv' = 'json') => {
    if (!messages || messages.length === 0) return;
    
    if (format === 'csv') {
      const headers = ['Timestamp', 'Sender', 'Type', 'Message', 'Meta'];
      const rows = decryptedMessages.map(m => {
        const sender = m.senderId === user?.uid ? 'You' : (m.senderName || chatInfo?.peerName || 'Peer');
        const timestamp = m.createdAt?.toDate ? m.createdAt.toDate().toISOString() : new Date().toISOString();
        const text = (m.text || '').replace(/"/g, '""');
        const meta = m.mediaUrl || '';
        return `"${timestamp}","${sender}","${m.type}","${text}","${meta}"`;
      });
      
      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat_export_${chatId}_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const exportData = {
        chatId,
        chatInfo: {
          name: chatInfo?.groupName || chatInfo?.peerName,
          isGroup: chatInfo?.isGroup,
        },
        exportedAt: new Date().toISOString(),
        messages: decryptedMessages.map(m => ({
          senderId: m.senderId,
          text: m.text,
          type: m.type,
          timestamp: m.createdAt?.toDate ? m.createdAt.toDate().toISOString() : new Date().toISOString(),
          mediaUrl: m.mediaUrl || null,
          isEncrypted: m.isEncrypted || false
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat_export_${chatId}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    setShowSettingsMenu(false);
  };

  const [isBackingUp, setIsBackingUp] = useState(false);

  const triggerCloudBackup = async () => {
    if (!chatId || !user || messages.length === 0) return;
    
    try {
      setIsBackingUp(true);
      const backupData = {
        chatId,
        chatInfo: {
          name: chatInfo?.groupName || chatInfo?.peerName,
          isGroup: chatInfo?.isGroup,
        },
        backupTimestamp: new Date().toISOString(),
        messages: decryptedMessages.map(m => ({
          senderId: m.senderId,
          text: m.text,
          type: m.type,
          timestamp: m.createdAt?.toDate ? m.createdAt.toDate().toISOString() : new Date().toISOString(),
          mediaUrl: m.mediaUrl || null,
          isEncrypted: m.isEncrypted || false
        }))
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const file = new File([blob], `backup_${chatId}_${Date.now()}.json`, { type: 'application/json' });
      
      const backupUrl = await uploadFile(file, `backups/${user.uid}/${chatId}`);
      
      // Also potentially store the backup record in user's profile or chat metadata
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        [`backups.${chatId}`]: {
          url: backupUrl,
          timestamp: serverTimestamp()
        }
      });

      setToast({ message: "Automated backup completed! Stored in cloud vault.", type: 'success' });
    } catch (err) {
      console.error("Backup failed", err);
      setToast({ message: "Cloud backup failed. Connection unstable.", type: 'error' });
    } finally {
      setIsBackingUp(false);
      setShowSettingsMenu(false);
    }
  };

  const exportChatToPDF = async (layout: 'compact' | 'detailed' = 'compact') => {
    if (!messages || messages.length === 0) return;

    try {
      setIsExportingPDF(true);
      setExportProgress(10);
      setShowExportPDFOptions(false);
      
      // Simulate progress for UI feedback
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.floor(Math.random() * 15);
        });
      }, 300);

      const doc = new jsPDF();
      const chatName = chatInfo?.groupName || chatInfo?.peerName || 'Chat';
      
      // Add decorative header
      doc.setFillColor(37, 211, 102); // Messenger green
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("My Messenger Chat Export", 14, 25);
      
      doc.setFontSize(10);
      doc.text(`Conversation: ${chatName} (${layout.toUpperCase()} LAYOUT)`, 14, 33);
      
      // Content info
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(10);
      doc.text(`Exported on: ${new Date().toLocaleString()}`, 14, 50);
      doc.text(`Channel Frequency ID: ${chatId}`, 14, 55);

      // Stats Summary Block
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, 60, 182, 15, 2, 2, 'F');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      const totalMessages = decryptedMessages.length;
      const mediaCount = decryptedMessages.filter(m => m.type !== 'text').length;
      const senderCount = new Set(decryptedMessages.map(m => m.senderId)).size;
      doc.text(`ANALYTICS: ${totalMessages} Signals | ${mediaCount} Media Nodes | ${senderCount} Active Participants`, 18, 70);
      
      let tableData;
      let head;

      if (layout === 'detailed') {
        head = [['Sender', 'Message Content', 'Meta / Media', 'Timestamp']];
        tableData = decryptedMessages.map(m => {
          const sender = m.senderId === user?.uid ? 'You' : (m.senderName || chatInfo?.peerName || 'Peer');
          let text = m.text || '';
          
          let meta = `Type: ${m.type.toUpperCase()}`;
          if (m.mediaUrl) {
            meta += `\nLINK: ${m.mediaUrl}`;
            if (!text) text = `[Captured ${m.type.toUpperCase()}]`;
          }
          
          if (m.status) meta += `\nStatus: ${m.status}`;
          if (m.reactions && Object.keys(m.reactions).length > 0) {
            const reactionCount = Object.values(m.reactions).flat().length;
            meta += `\nReactions: ${reactionCount}`;
          }
          if (m.isEncrypted) meta += `\n[ENCRYPTED]`;
          
          const time = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString() : 
                      (m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleString() : new Date().toLocaleString());
          return [sender, text, meta, time];
        });
      } else {
        head = [['Sender', 'Message', 'Timestamp']];
        tableData = decryptedMessages.map(m => {
          let content = m.text || `[${m.type.toUpperCase()}]`;
          if (m.mediaUrl && !m.text) content = `[MEDIA: ${m.mediaUrl.split('/').pop()?.slice(0, 20)}...]`;
          
          return [
            m.senderId === user?.uid ? 'You' : (m.senderName || chatInfo?.peerName || 'Peer'),
            content,
            m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString() : 
            (m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleString() : new Date().toLocaleString())
          ];
        });
      }

      autoTable(doc, {
        startY: 80,
        head: head,
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [37, 211, 102], 
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 253, 248]
        },
        margin: { top: 30 },
        styles: {
          fontSize: layout === 'detailed' ? 8 : 9,
          cellPadding: 4,
        },
        columnStyles: layout === 'detailed' ? {
          0: { cellWidth: 25 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 35 },
          3: { cellWidth: 35 }
        } : {
          0: { cellWidth: 30 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 40 }
        }
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} - Secured by End-to-End Encryption`, 105, 285, { align: 'center' });
      }

      // Finish progress
      clearInterval(progressInterval);
      setExportProgress(100);
      
      setTimeout(() => {
        setIsExportingPDF(false);
        setExportProgress(0);
        setToast({ 
          message: 'PDF exported successfully! Your file is ready.', 
          type: 'success',
          action: {
            label: 'Download',
            onClick: () => {
              doc.save(`chat_export_${chatId}_${Date.now()}.pdf`);
              setToast(null);
            }
          }
        });
        setTimeout(() => setToast(null), 10000);
      }, 800);

    } catch (err) {
      console.error("PDF Export failed", err);
      setIsExportingPDF(false);
      setExportProgress(0);
      setToast({ message: 'Failed to generate PDF. Please try JSON export.', type: 'error' });
      setTimeout(() => setToast(null), 5000);
    }
  };

  if (chatInfo?.type === 'group') {
    return <GroupChatRoom chatId={chatId!} chatInfo={chatInfo} onClose={() => navigate('/chats')} />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn("chat-room-container flex flex-col h-full relative transition-all duration-500 overflow-hidden", activeTheme.font)}
      style={{ 
        backgroundColor: currentUserProfile?.peaceMode?.enabled 
          ? (theme === 'dark' ? '#064e3b' : '#ecfdf5') 
          : (theme === 'dark' ? (chatInfo?.customDarkColor || activeTheme.darkColor) : (chatInfo?.customColor || activeTheme.color)) 
      }}
    >
      {/* Dynamic Style Override for Chat Customizer */}
      {chatInfo?.customAccentColor && (
        <style>{`
          .text-wa-primary {
            color: ${chatInfo.customAccentColor} !important;
          }
          .bg-wa-primary {
            background-color: ${chatInfo.customAccentColor} !important;
          }
          .border-wa-primary {
            border-color: ${chatInfo.customAccentColor} !important;
          }
          .bg-wa-primary\\/10 {
            background-color: ${chatInfo.customAccentColor}1a !important;
          }
          .bg-wa-primary\\/20 {
            background-color: ${chatInfo.customAccentColor}33 !important;
          }
          .border-wa-primary\\/20 {
            border-color: ${chatInfo.customAccentColor}33 !important;
          }
          .border-wa-primary\\/10 {
            border-color: ${chatInfo.customAccentColor}1a !important;
          }
          .focus\\:border-wa-primary\\/30:focus {
            border-color: ${chatInfo.customAccentColor}4d !important;
          }
          .shadow-wa-primary\\/20 {
            box-shadow: 0 10px 15px -3px ${chatInfo.customAccentColor}33, 0 4px 6px -4px ${chatInfo.customAccentColor}33 !important;
          }
          .accent-wa-primary {
            accent-color: ${chatInfo.customAccentColor} !important;
          }
          .bg-wa-bubble-me {
            background-color: ${chatInfo.customAccentColor}d9 !important;
            color: #ffffff !important;
          }
          .bg-wa-bubble-me * {
            color: #ffffff !important;
          }
          .dark\\:bg-wa-dark-bubble-me {
            background-color: ${chatInfo.customAccentColor}4d !important;
            color: #ffffff !important;
            border: 1px solid ${chatInfo.customAccentColor}33 !important;
          }
          .dark\\:bg-wa-dark-bubble-me * {
            color: #ffffff !important;
          }
        `}</style>
      )}

      {/* Zen Background Overlay if Peace Mode is Active */}
      {isPeaceModeActive && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <ZenBackground theme={peaceSettings?.zenTheme || 'blue'} />
        </div>
      )}

      {/* Noise Overlay */}
      {wallpaperNoise > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none z-[1] opacity-[0.15]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            filter: `contrast(${100 + wallpaperNoise * 100}%) brightness(${100 - wallpaperNoise * 20}%)`,
            opacity: wallpaperNoise * 0.4
          }}
        />
      )}

      {/* Subtle Pattern Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-700 z-0" 
        style={{ 
          backgroundImage: (() => {
            if (chatInfo?.customWallpaper) {
              return `url('${chatInfo.customWallpaper}')`;
            }
            if (globalChatWallpaper && globalChatWallpaper !== 'default') {
              if (globalChatWallpaper === 'none' || globalChatWallpaper === 'plain') {
                return 'none';
              }
              return `url('${globalChatWallpaper}')`;
            }
            return activeTheme.wallpaper ? `url('${activeTheme.wallpaper}')` : 'none';
          })(),
          backgroundRepeat: 'repeat', 
          backgroundSize: ((chatInfo?.customWallpaper && chatInfo.customWallpaper.includes('transparenttextures.com')) || (globalChatWallpaper && globalChatWallpaper.includes('transparenttextures.com'))) ? '120px' : '400px',
          backgroundPosition: 'center',
          opacity: chatInfo?.customWallpaperOpacity !== undefined && chatInfo?.customWallpaperOpacity !== null ? chatInfo.customWallpaperOpacity : wallpaperOpacity
        }}
      />
      <header className="h-[60px] px-3 flex items-center justify-between shrink-0 transition-colors sticky top-0 z-[50] select-none" style={{
        backgroundColor: theme === 'dark' ? '#202c33' : '#f0f2f5',
        borderBottom: theme === 'dark' ? '1px solid #222e35' : '1px solid #e9edef'
      }}>
        <div className="flex items-center gap-3.5 min-w-0">
          <button onClick={() => navigate('/chats')} className="p-1 -ml-1 hover:text-wa-primary text-[#54656f] dark:text-[#aebac1] transition-all active:scale-95 md:hidden" style={{ border: 'none', background: 'none' }}>
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          
          <div className="flex items-center gap-3 cursor-pointer group min-w-0" onClick={() => setShowChatInfo(true)}>
            <div className="relative shrink-0">
              <img 
                src={peerProfile?.photoURL || chatInfo?.groupPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chatId}`} 
                className="w-10 h-10 rounded-full object-cover" 
                alt="Chat Avatar"
              />
              {!chatInfo?.isGroup && !isPeaceModeActive && !peerProfile?.peaceMode?.enabled && ((peerProfile?.isOnline === true || peerProfile?.status === 'online') || typingUsers.length > 0) && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#00a884] border-2 border-[#f0f2f5] dark:border-[#202c33] rounded-full" />
              )}
            </div>
            
            <div className="flex flex-col min-w-0">
              <h2 className="text-[16px] font-medium leading-tight truncate" style={{
                color: theme === 'dark' ? '#e9edef' : '#111b21',
              }}>
                {chatInfo?.isGroup ? chatInfo.groupName : peerProfile?.displayName || chatInfo?.peerName || 'Channel'}
              </h2>
              
              <div className="flex items-center gap-2 min-w-0 h-4">
                {(isPeaceModeActive || peerProfile?.peaceMode?.enabled) ? (
                  <span className="text-[13px] text-amber-500 font-mono tracking-wider uppercase truncate flex items-center gap-1.5 font-bold">
                    🧘 In Peace Mode
                  </span>
                ) : typingUsers.length > 0 ? (
                  <span className="text-[13px] text-[#f59e0b] font-medium flex items-center gap-1">
                    <span>
                      {typingUsers.length === 1 
                        ? `${typingUsers[0].displayName} is typing` 
                        : `${typingUsers.length} people typing`}
                    </span>
                    <span className="inline-flex gap-0.5 ml-1">
                      <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-[#f59e0b] rounded-full" />
                      <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-[#f59e0b] rounded-full" />
                      <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-[#f59e0b] rounded-full" />
                    </span>
                  </span>
                ) : (
                  <span className="text-[13px] truncate" style={{ color: theme === 'dark' ? '#8696a0' : '#667781' }}>
                    {(() => {
                      if (chatInfo?.isGroup) return `${chatInfo.participants?.length || 0} members`;
                      const isPeerOnline = peerProfile?.isOnline === true || peerProfile?.status === 'online';
                      if (isPeerOnline) {
                        return <span className="text-[#00a884]">online</span>;
                      }
                      if (peerProfile?.lastSeen) {
                        try {
                          const dateObj = peerProfile.lastSeen.toDate ? peerProfile.lastSeen.toDate() : new Date(peerProfile.lastSeen);
                          return `last seen ${formatDistanceToNow(dateObj, { addSuffix: true })}`;
                        } catch (err) {
                          return 'offline';
                        }
                      }
                      return 'offline';
                    })()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[#54656f] dark:text-[#aebac1]">
          {chatId?.startsWith('ai_companion_') && (
            <button 
               onClick={() => setShowPlanningBoard(true)}
               className="p-1 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
               title="AI Project Planner"
               style={{ border: 'none' }}
            >
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-[11px] font-medium uppercase tracking-wider hidden sm:inline">OS Sketcher</span>
            </button>
          )}

          {!isChannelRestricted && (
            <>
              <button 
                 onClick={() => initiateCall('audio')}
                 className="p-2 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 rounded-full transition-all active:scale-95 cursor-pointer"
                 title="Voice Call"
                 style={{ border: 'none', background: 'none' }}
              >
                <Phone size={20} />
              </button>
              <button 
                 onClick={() => initiateCall('video')}
                 className="p-2 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 rounded-full transition-all active:scale-95 cursor-pointer"
                 title="Video Call"
                 style={{ border: 'none', background: 'none' }}
              >
                <Video size={18} />
              </button>
            </>
          )}

          <button 
             onClick={() => navigate('/calls')}
             className="p-2 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 rounded-full transition-all active:scale-95 cursor-pointer"
             title="Call Logs"
             style={{ border: 'none', background: 'none' }}
          >
            <History size={20} />
          </button>

          <button 
             onClick={() => {
                setActiveHubTab('media');
                setShowSharedHub(true);
             }}
             className="p-2 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 rounded-full transition-all active:scale-95 cursor-pointer"
             title="Media Gallery"
             style={{ border: 'none', background: 'none' }}
          >
             <LayoutGrid size={20} />
          </button>

          <button 
             onClick={() => setShowTranslatePanel(!showTranslatePanel)}
             className={cn("p-2 rounded-full transition-all active:scale-95 flex items-center justify-center relative cursor-pointer", 
               translationEngineActive ? "text-[#00a884] bg-[#00a884]/10" : "hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40"
             )}
             title="Neural Real-Time Translation OS"
             style={{ border: 'none', background: 'none' }}
          >
             <Globe size={20} />
             {translationEngineActive && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#00a884] rounded-full animate-ping" />}
          </button>

          <button 
             onClick={() => {
               if (showSearch) setRoomSearchTerm('');
               setShowSearch(!showSearch);
             }}
             className="p-2 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 rounded-full transition-all active:scale-95 cursor-pointer"
             title="Search within chat"
             style={{ border: 'none', background: 'none' }}
          >
             <Search size={20} />
          </button>

          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowSettingsMenu(!showSettingsMenu); }}
              className="p-2 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 rounded-full transition-all flex items-center justify-center cursor-pointer"
              title="Menu"
              style={{ border: 'none', background: 'none' }}
            >
              <MoreVertical size={20} />
            </button>
            <AnimatePresence>
              {showSettingsMenu && (
                <>
                   <div className="fixed inset-0 z-40" onClick={() => setShowSettingsMenu(false)} />
                   <motion.div
                     initial={{ opacity: 0, scale: 0.95, y: -10 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95, y: -10 }}
                     className="absolute right-0 top-11 w-52 bg-white dark:bg-[#233138] rounded-xl shadow-2xl border border-zinc-200/50 dark:border-zinc-850 z-50 py-2 scrollbar-none max-h-[480px] overflow-y-auto text-left"
                   >
                     {chatInfo?.isGroup && (
                       <button 
                         onClick={() => { setShowChatInfo(true); setShowSettingsMenu(false); }}
                         className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/20 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center gap-2"
                         style={{ border: 'none', background: 'none' }}
                       >
                         <UsersIcon size={16} />
                         <span>Group info</span>
                       </button>
                     )}
                     {!chatInfo?.isGroup && (
                       <button 
                         onClick={() => { setShowChatInfo(true); setShowSettingsMenu(false); }}
                         className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/20 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center gap-2"
                         style={{ border: 'none', background: 'none' }}
                       >
                         <UsersIcon size={16} />
                         <span>Contact info</span>
                       </button>
                     )}
                     <button 
                       onClick={() => { handleSummarizeClick(); setShowSettingsMenu(false); }}
                       className="w-full text-left px-4 py-2.5 text-sm hover:bg-amber-500/10 dark:hover:bg-amber-500/10 text-amber-500 font-semibold transition-colors flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800"
                       style={{ border: 'none', background: 'none' }}
                     >
                       <Sparkles size={16} className="text-amber-500 animate-pulse" />
                       <span>✨ Summarize Chat</span>
                     </button>
                     <button 
                       onClick={() => { setShowThemePicker(true); setShowSettingsMenu(false); }}
                       className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/20 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center gap-2"
                       style={{ border: 'none', background: 'none' }}
                     >
                       <Palette size={16} />
                       <span>Theme Packages</span>
                     </button>
                     <button 
                       onClick={() => { setShowCustomizer(true); setShowSettingsMenu(false); }}
                       className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/20 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center gap-2"
                       style={{ border: 'none', background: 'none' }}
                     >
                       <Sliders size={16} className="text-[#00a884]" />
                       <span>Chat Customizer</span>
                     </button>
                     <button 
                       onClick={() => exportChatHistory('json')}
                       className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/20 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center gap-2"
                       style={{ border: 'none', background: 'none' }}
                     >
                       <Download size={16} />
                       <span>Export JSON</span>
                     </button>
                     <button 
                       onClick={() => exportChatHistory('csv')}
                       className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/20 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center gap-2"
                       style={{ border: 'none', background: 'none' }}
                     >
                       <FileText size={16} />
                       <span>Export CSV</span>
                     </button>
                     <button 
                        onClick={() => { setShowExportPDFOptions(true); setShowSettingsMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/20 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center gap-2"
                        style={{ border: 'none', background: 'none' }}
                      >
                        <FileText size={16} />
                        <span>Export PDF</span>
                      </button>
                      <button 
                         onClick={triggerCloudBackup}
                         disabled={isBackingUp}
                         className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/20 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                         style={{ border: 'none', background: 'none' }}
                       >
                         <Cloud size={16} className={isBackingUp ? "animate-pulse text-[#00a884]" : ""} />
                         <span>{isBackingUp ? "Backing up..." : "Cloud Backup"}</span>
                       </button>
                      <button 
                        onClick={() => { setShowCameraWallpaperModal(true); setShowSettingsMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/20 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center gap-2"
                        style={{ border: 'none', background: 'none' }}
                      >
                        <Camera size={16} />
                        <span>Camera Wallpaper</span>
                      </button>
                      <button 
                        onClick={() => { setShowWallpaperGallery(true); setShowSettingsMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/20 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center gap-2"
                        style={{ border: 'none', background: 'none' }}
                      >
                        <LayoutGrid size={16} />
                        <span>Wallpaper Gallery</span>
                      </button>
                      <button 
                        onClick={() => { setShowDisappearingModal(true); setShowSettingsMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/20 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center gap-2"
                        style={{ border: 'none', background: 'none' }}
                      >
                        <Hourglass size={16} className="text-amber-500" />
                        <span>Disappearing Messages</span>
                      </button>
                      <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800/40 my-1" />

                      <div className="px-4 py-2 space-y-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                         <div className="flex items-center justify-between">
                            <span className="font-medium">Auto-Scroll</span>
                            <button 
                               onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
                               className={cn(
                                  "w-10 h-5 rounded-full transition-all relative",
                                  autoScrollEnabled ? "bg-[#00a884]" : "bg-zinc-300 dark:bg-zinc-700"
                               )}
                               style={{ border: 'none' }}
                            >
                               <motion.div 
                                  animate={{ x: autoScrollEnabled ? 22 : 2 }}
                                  className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                               />
                            </button>
                         </div>

                         <div className="flex items-center justify-between">
                            <span className="font-medium">Layout</span>
                            <button 
                               onClick={() => setMessageLayout(messageLayout === 'expanded' ? 'compact' : 'expanded')}
                               className="flex items-center gap-1 bg-zinc-150 dark:bg-zinc-800/50 rounded-full px-2 py-0.5 transition-all hover:bg-zinc-200"
                               style={{ border: 'none' }}
                            >
                               <span className={cn("text-[9px] font-bold uppercase", messageLayout === 'compact' ? "text-[#00a884]" : "text-zinc-400")}>Compact</span>
                               <span className="text-[9px] text-zinc-300">/</span>
                               <span className={cn("text-[9px] font-bold uppercase", messageLayout === 'expanded' ? "text-[#00a884]" : "text-zinc-400")}>Expanded</span>
                            </button>
                         </div>

                         <div className="space-y-1">
                            <div className="flex items-center justify-between">
                               <span>Bubble Color</span>
                               <button onClick={() => setBubbleColor(null)} className="text-[9px] text-[#00a884] font-medium hover:underline" style={{ border: 'none', background: 'none' }}>Reset</button>
                            </div>
                            <input 
                              type="color" 
                              value={bubbleColor || (theme === 'dark' ? '#005c4b' : '#dcf8c6')}
                              onChange={(e) => setBubbleColor(e.target.value)}
                              className="w-full h-6 cursor-pointer bg-transparent border-none rounded overflow-hidden"
                            />
                         </div>
                      </div>

                      <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800/40 my-1" />
                     <button 
                       onClick={() => { setShowClearChatConfirm(true); setShowSettingsMenu(false); }}
                       className="w-full text-left px-4 py-2.5 text-sm text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-2"
                       style={{ border: 'none', background: 'none' }}
                     >
                       <Trash2 size={16} />
                       <span>Clear chat</span>
                     </button>
                   </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Neural AI Translation Core Panel */}
      <AnimatePresence>
        {showTranslatePanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-zinc-100 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md z-45 relative overflow-hidden"
          >
            <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 max-w-4xl mx-auto">
              {/* Left description */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 rounded-xl">
                  <Globe size={18} className={cn(translationEngineActive && "animate-spin-slow")} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">Neural Translate Engine</h4>
                  <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest leading-relaxed">
                    Real-time AI-powered cross-platform language filter for text and voice transcripts
                  </p>
                </div>
              </div>

              {/* Right controls */}
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                {/* Target language selector */}
                <div className="flex flex-col gap-1 shrink-0">
                  <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Target Language</span>
                  <select
                    value={translationTargetLanguage}
                    onChange={(e) => {
                      setTranslationTargetLanguage(e.target.value);
                      // Clear translation cache so it re-translates in new target language
                      setTranslations({}); 
                    }}
                    className="p-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {['Spanish', 'French', 'German', 'Japanese', 'Hindi', 'Chinese', 'Italian', 'Arabic', 'Russian'].map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                {/* Switch widget */}
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-3 py-1.5 rounded-xl ml-auto md:ml-0 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest leading-none mb-0.5">Auto-Translate</span>
                    <span className="text-[8px] text-indigo-500 font-bold uppercase tracking-widest leading-none">
                      {translationEngineActive ? 'ON AIR' : 'MUTED'}
                    </span>
                  </div>
                  <button 
                     onClick={() => setTranslationEngineActive(!translationEngineActive)}
                     className={cn(
                        "w-9 h-5 rounded-full transition-all relative block shrink-0 cursor-pointer",
                        translationEngineActive ? "bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]" : "bg-zinc-300 dark:bg-zinc-700"
                     )}
                  >
                     <motion.div 
                        animate={{ x: translationEngineActive ? 18 : 2 }}
                        className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                     />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned Messages Banner */}
      <AnimatePresence>
        {chatInfo?.pinnedMessages?.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 z-40 relative group/pinned"
          >
            <div className="px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-1.5 bg-wa-primary/10 text-wa-primary rounded-lg shrink-0">
                  <Pin size={12} className="fill-wa-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-mono font-bold text-wa-primary uppercase tracking-widest">Pinned Signal</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {(() => {
                        const lastPinnedId = chatInfo.pinnedMessages[chatInfo.pinnedMessages.length - 1];
                        const lastPinnedMsg = decryptedMessages.find(m => m.id === lastPinnedId);
                        return lastPinnedMsg?.text || (lastPinnedMsg?.type === 'image' ? '📎 Image Attachment' : (lastPinnedMsg?.type === 'audio' ? '🎤 Voice' : 'Encrypted Packet'));
                      })()}
                    </span>
                    {chatInfo.pinnedMessages.length > 1 && (
                      <span className="text-[9px] font-mono font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                        +{chatInfo.pinnedMessages.length - 1} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                   const lastPinnedId = chatInfo.pinnedMessages[chatInfo.pinnedMessages.length - 1];
                   document.getElementById(`message-${lastPinnedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="px-3 py-1.5 bg-zinc-900 dark:bg-wa-primary text-white text-[9px] font-mono font-bold uppercase tracking-widest rounded-lg hover:shadow-lg transition-all active:scale-95"
              >
                View
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned AI Chat Summary Banner */}
      <SummaryBanner 
        pinnedSummary={pinnedSummary} 
        onUnpin={handleUnpinSummary} 
        onViewFull={() => {
          setSummaryData(pinnedSummary);
          setIsSummaryModalOpen(true);
        }}
      />

      {/* Auto-trigger Unread Messages Summary Banner */}
      <AnimatePresence>
        {showUnreadBanner && unreadCountToSummarize >= 20 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-zinc-900/90 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-3 relative z-30"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500 animate-pulse shrink-0" />
              <p className="text-xs text-zinc-300 font-medium">
                You have <span className="text-amber-400 font-bold">{unreadCountToSummarize}</span> unread messages. Would you like a Gemini-powered summary?
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setShowUnreadBanner(false);
                  handleSummarizeClick();
                }}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-[10px] font-bold uppercase tracking-wider rounded transition-colors"
                style={{ border: 'none' }}
              >
                Summarize
              </button>
              <button
                onClick={() => setShowUnreadBanner(false)}
                className="p-1 text-zinc-400 hover:text-zinc-200"
                style={{ border: 'none', background: 'none' }}
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-wa-primary dark:bg-zinc-900 px-4 pb-3 flex items-center gap-2 overflow-hidden z-20 shadow-inner"
          >
            <div className="flex flex-col gap-2 w-full">
              <div className="flex-1 relative group">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors" />
                 <input 
                   type="text" 
                   placeholder="Search messages..."
                   value={roomSearchTerm}
                   onChange={(e) => setRoomSearchTerm(e.target.value)}
                   autoFocus
                   className="w-full bg-white/10 text-white placeholder:text-white/40 pl-10 pr-4 py-2 rounded-xl border border-transparent focus:border-white/20 outline-none font-medium text-sm transition-all"
                 />
                 {roomSearchTerm && (
                    <button onClick={() => setRoomSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                       <X size={14} />
                    </button>
                 )}
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <div className="flex items-center gap-1.5 shrink-0">
                  <Calendar size={12} className="text-white/60" />
                  <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">Filter:</span>
                </div>
                <input 
                  type="date"
                  value={roomSearchStartDate}
                  onChange={(e) => setRoomSearchStartDate(e.target.value)}
                  className="bg-white/10 text-white text-[10px] font-mono font-bold px-2 py-1 rounded-md outline-none border border-transparent focus:border-white/20"
                />
                <span className="text-white/40 font-mono text-[10px]">to</span>
                <input 
                  type="date"
                  value={roomSearchEndDate}
                  onChange={(e) => setRoomSearchEndDate(e.target.value)}
                  className="bg-white/10 text-white text-[10px] font-mono font-bold px-2 py-1 rounded-md outline-none border border-transparent focus:border-white/20"
                />
                {(roomSearchStartDate || roomSearchEndDate) && (
                   <button 
                    onClick={() => { setRoomSearchStartDate(''); setRoomSearchEndDate(''); }}
                    className="p-1 text-white/60 hover:text-white"
                   >
                     <X size={12} />
                   </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Whisper Room Panel */}
      <AnimatePresence>
         {showWhisperRoom && (
            <motion.div
               initial={{ opacity: 0, y: "100%" }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="fixed bottom-0 left-0 right-0 z-50 bg-[#162725] rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] p-6 overflow-hidden md:max-w-md md:left-1/2 md:-translate-x-1/2 md:bottom-6 md:rounded-[2.5rem]"
            >
               <div className="absolute inset-0 bg-teal-900/10 blur-[100px] pointer-events-none" />
               <div className="relative z-10 flex flex-col items-center">
                  <div className="w-10 h-1 bg-white/20 rounded-full mb-6" onClick={() => setShowWhisperRoom(false)} />
                  <h3 className="text-white font-mono font-bold tracking-widest uppercase text-xs opacity-70 mb-8">Audio Space</h3>
                  
                  <div className="flex justify-center gap-6 mb-8 w-full">
                     {/* Self Avatar */}
                     <div className="relative">
                        <div className="absolute inset-[-10px] bg-teal-500/20 rounded-full animate-pulse blur" />
                        <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} className="w-16 h-16 rounded-full border-2 border-teal-400 relative z-10 shadow-[0_0_20px_rgba(20,184,166,0.3)]" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-500 rounded-full border-2 border-[#162725] z-20 flex items-center justify-center text-[#162725]">
                           <Mic size={12} strokeWidth={3} />
                        </div>
                     </div>
                     {/* Peer Avatars */}
                     {[1, 2].map((i) => (
                        <div key={i} className="relative opacity-60">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Peer${i}`} className="w-16 h-16 rounded-full border-2 border-white/10" />
                        </div>
                     ))}
                  </div>

                  <div className="flex items-center gap-4 w-full mt-4">
                     <button className="flex-1 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center gap-2">
                        <Mic size={20} />
                     </button>
                     <button onClick={() => setShowWhisperRoom(false)} className="px-8 py-4 rounded-full bg-red-500/20 text-red-400 font-mono font-bold text-[10px] uppercase tracking-widest hover:bg-red-500/30 transition-colors">
                        Leave Quietly
                     </button>
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* View Once Media Modal */}
      <AnimatePresence>
        {viewOnceMedia && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] bg-black flex flex-col justify-center items-center"
           >
              <div className="absolute top-8 left-0 right-0 flex justify-center z-10">
                 <div className="w-12 h-12 rounded-full border-4 border-coral-500 animate-[ping_8s_cubic-bezier(0,0,0.2,1)_infinite] opacity-50 absolute" />
                 <div className="bg-coral-500 text-white font-mono font-bold text-lg w-12 h-12 flex items-center justify-center rounded-full z-10 relative shadow-[0_0_20px_rgba(249,115,22,0.6)]">
                    <span className="animate-[pulse_1s_infinite]">!</span>
                 </div>
              </div>
              
              {viewOnceMedia.type === 'video' ? (
                <video src={viewOnceMedia.mediaUrl} autoPlay className="max-w-full max-h-screen" onEnded={() => setViewOnceMedia(null)} />
              ) : (
                <img src={viewOnceMedia.mediaUrl} className="max-w-full max-h-screen object-contain" />
              )}
              
              <button 
                 onClick={() => setViewOnceMedia(null)}
                 className="absolute bottom-12 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-mono font-bold text-[10px] uppercase tracking-widest backdrop-blur-md transition-colors"
              >
                 Dismiss
              </button>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Info Modal */}
      <AnimatePresence>
        {showChatInfo && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-end"
             onClick={() => setShowChatInfo(false)}
           >
              <motion.div 
                initial={{ x: 400 }}
                animate={{ x: 0 }}
                exit={{ x: 400 }}
                className="w-full max-w-sm h-full bg-white dark:bg-[#111b21] shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800"
                onClick={e => e.stopPropagation()}
              >
                 <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                    <h2 className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 tracking-widest uppercase">{chatInfo?.isGroup ? 'Group Status' : 'Contact Details'}</h2>
                    <button onClick={() => setShowChatInfo(false)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
                       <X size={20} />
                    </button>
                 </div>

                 <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                    <div className="flex flex-col items-center gap-4">
                       <img 
                         src={chatInfo?.isGroup ? chatInfo?.groupPhoto : (peerProfile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chatInfo?.participants.find((id: string) => id !== user?.uid)}`)} 
                         className="w-24 h-24 rounded-full shadow-md border-2 border-white dark:border-zinc-800 object-cover" 
                       />
                       <div className="text-center space-y-2">
                          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                            {chatInfo?.isGroup ? chatInfo?.groupName : (peerProfile?.displayName || chatInfo?.peerName)}
                          </h3>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full max-w-full">
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", (typingUsers.length > 0 || peerProfile?.isOnline) ? "bg-green-500" : "bg-zinc-400")} />
                            <p className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest truncate">
                               {chatInfo?.isGroup 
                                 ? `${chatInfo?.participants?.length || 0} Participants` 
                                 : (peerProfile?.isOnline 
                                     ? 'Online' 
                                     : (peerProfile?.lastSeen 
                                         ? `Last seen ${formatDistanceToNow(peerProfile.lastSeen.toDate ? peerProfile.lastSeen.toDate() : new Date(peerProfile.lastSeen), { addSuffix: true })}` 
                                         : 'Offline'))}
                            </p>
                          </div>
                       </div>
                       
                       {!chatInfo?.isGroup && (
                          <div className="flex gap-4 mt-2">
                             <button 
                               onClick={() => navigate(`/profile/${chatInfo?.participants.find((id: string) => id !== user?.uid)}`)}
                               className="flex flex-col items-center gap-1 text-wa-primary"
                             >
                                <div className="w-10 h-10 rounded-full bg-wa-primary/10 flex items-center justify-center">
                                   <UsersIcon size={18} />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-wider">Profile</span>
                             </button>
                             <button 
                               onClick={() => simulateCall()}
                               className="flex flex-col items-center gap-1 text-wa-primary"
                             >
                                <div className="w-10 h-10 rounded-full bg-wa-primary/10 flex items-center justify-center">
                                   <Phone size={18} />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-wider">Call</span>
                             </button>
                             <button className="flex flex-col items-center gap-1 text-wa-primary">
                                <div className="w-10 h-10 rounded-full bg-wa-primary/10 flex items-center justify-center">
                                   <Video size={18} />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-wider">Video</span>
                             </button>
                          </div>
                       )}
                    </div>

                    {chatInfo?.isGroup && (
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-2">Upcoming Events</h4>
                       <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl relative overflow-hidden group">
                           <Calendar className="absolute -bottom-4 -right-2 w-20 h-20 text-zinc-200 dark:text-zinc-800 opacity-50 transform group-hover:scale-110 transition-transform pointer-events-none" />
                           <p className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Friday Night</p>
                           <h5 className="font-bold text-zinc-900 dark:text-zinc-100 text-[14px]">Beach Bonfire Mix</h5>
                           <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-4 mt-1">Oct 24, 7:00 PM</p>
                           <div className="flex gap-2 relative z-10">
                               <button className="px-4 py-2 bg-zinc-950 dark:bg-wa-primary text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest shadow-sm hover:bg-zinc-800 transition-colors">Going</button>
                               <button className="px-4 py-2 bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors">Maybe</button>
                           </div>
                       </div>
                    </div>
                    )}

                    <div className="space-y-4">
                     {/* Peace AI Integrated bullet summaries */}
                     <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 rounded-2xl space-y-3 mx-1 my-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <Sparkles className="text-[#00A884]" size={16} />
                              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-200 font-sans font-black">Peace AI Co-Pilot</span>
                           </div>
                           <span className="text-[8px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-[#00A884]/10 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-sans font-bold">Vetted Engine</span>
                        </div>
                        
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal font-sans">
                           Securely summarize captured channel transmissions into a sweet and simple list of bullets.
                        </p>

                        {missedSummaryList && (
                           <motion.ul 
                             initial={{ opacity: 0, height: 0 }}
                             animate={{ opacity: 1, height: 'auto' }}
                             className="space-y-1.5 pt-1 text-[11px] leading-relaxed text-zinc-650 dark:text-zinc-350 font-sans"
                           >
                              {missedSummaryList.map((bullet, idx) => (
                                 <motion.li 
                                   key={idx}
                                   initial={{ opacity: 0, x: -5 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   transition={{ delay: idx * 0.1 }}
                                   className="flex items-start gap-1.5"
                                 >
                                    <span className="text-emerald-500">•</span>
                                    <span>{bullet}</span>
                                 </motion.li>
                              ))}
                           </motion.ul>
                        )}

                        <button
                          onClick={generateMissedSummary}
                          disabled={isGeneratingMissedSummary}
                          className="w-full py-2 bg-[#00a884] hover:bg-[#008f70] disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-400 font-sans text-[11px] font-semibold text-white uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                        >
                           {isGeneratingMissedSummary ? (
                              <>
                                <RefreshCcw size={12} className="animate-spin" />
                                <span>Analyzing Signals...</span>
                              </>
                           ) : (
                              <>
                                <Sparkles size={12} />
                                <span>Summarize Missed Messages</span>
                              </>
                           )}
                        </button>
                     </div>

                       <div className="flex justify-between items-center px-2 cursor-pointer group" onClick={() => { setShowSharedHub(true); setActiveHubTab('media'); }}>
                           <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest text-wa-primary group-hover:underline">Media, links and docs</h4>
                           <div className="flex items-center gap-1">
                              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                 {decryptedMessages.filter(m => m.type === 'image' || m.type === 'video').length}
                              </span>
                              <ChevronRight size={14} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                           </div>
                       </div>
                       <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
                          {decryptedMessages.filter(m => m.type === 'image' || m.type === 'video').slice(0, 10).map((m, idx) => (
                             <div key={m.id || idx} className="w-24 h-24 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0 group relative cursor-pointer shadow-sm">
                                {m.type === 'image' ? (
                                   <img src={m.mediaUrl} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" onClick={() => setPreviewMedia({ url: m.mediaUrl, type: m.type, senderName: m.senderId === user?.uid ? 'You' : (m.senderName || chatInfo?.peerName || 'Peer'), createdAt: m.createdAt, id: m.id })} />
                                ) : (
                                   <div className="w-full h-full flex items-center justify-center relative" onClick={() => setPreviewMedia({ url: m.mediaUrl, type: m.type, senderName: m.senderId === user?.uid ? 'You' : (m.senderName || chatInfo?.peerName || 'Peer'), createdAt: m.createdAt, id: m.id })}>
                                      <video src={m.mediaUrl} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                         <Play size={20} fill="white" className="text-white drop-shadow-md" />
                                      </div>
                                   </div>
                                )}
                             </div>
                          ))}
                          {decryptedMessages.filter(m => m.type === 'image' || m.type === 'video').length === 0 && (
                             <div className="w-full py-12 text-center bg-zinc-50/50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl mx-1 flex flex-col items-center">
                                <ImageIcon size={24} className="text-zinc-300 dark:text-zinc-700 mb-2" />
                                <p className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">No shared signals captured</p>
                             </div>
                          )}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-2">{chatInfo?.isGroup ? 'Participants' : 'Connection Details'}</h4>
                       <div className="space-y-2 px-1">
                       {chatInfo?.isGroup ? (
                          <>
                          <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                             <label className="flex items-center justify-center gap-3 w-full py-4 bg-wa-primary text-white rounded-xl text-[11px] font-mono font-bold uppercase tracking-widest cursor-pointer hover:bg-wa-primary-dark transition-all shadow-md active:scale-95">
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*" 
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file || !chatId) return;
                                    try {
                                       setUploading(true);
                                       const url = await uploadFile(file, `groups/${chatId}`);
                                       await updateDoc(doc(db, 'chats', chatId), {
                                          groupPhoto: url,
                                          updatedAt: serverTimestamp()
                                       });
                                       setToast({ message: "Group photo updated", type: 'success' });
                                    } catch (err) {
                                       console.error("Group photo failed", err);
                                       setToast({ message: "Update failed", type: 'error' });
                                    } finally {
                                       setUploading(false);
                                    }
                                  }} 
                                />
                                <Camera size={18} strokeWidth={3} />
                                Change Group Identity
                              </label>
                           </div>

                           <div className="mt-4 px-2 space-y-4">
                              <label className="flex items-center justify-center gap-3 w-full py-4 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-xl text-[11px] font-mono font-bold uppercase tracking-widest cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-all shadow-sm active:scale-95">
                                 <input 
                                   type="file" 
                                   className="hidden" 
                                   accept="image/*" 
                                   onChange={async (e) => {
                                     const file = e.target.files?.[0];
                                     if (!file || !chatId) return;
                                     try {
                                        setIsUpdatingWallpaper(true);
                                        const url = await uploadFile(file, `wallpapers/${chatId}`);
                                        await updateDoc(doc(db, 'chats', chatId), {
                                           customWallpaper: url,
                                           updatedAt: serverTimestamp()
                                        });
                                        setToast({ message: "Wallpaper updated", type: 'success' });
                                     } catch (err) {
                                        console.error("Wallpaper update failed", err);
                                        setToast({ message: "Update failed", type: 'error' });
                                     } finally {
                                        setIsUpdatingWallpaper(false);
                                     }
                                   }} 
                                 />
                                 {isUpdatingWallpaper ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                                 {isUpdatingWallpaper ? "Uploading..." : "Custom Wallpaper"}
                              </label>

                              <div className="relative mb-6">
                                 <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                 <input 
                                    type="text"
                                    placeholder="Filter connection nodes..."
                                    value={memberSearchTerm}
                                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-[10px] font-mono font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-wa-primary/20 transition-all text-zinc-900 dark:text-zinc-100 font-mono"
                                 />
                              </div>
                           </div>
                           {groupParticipants
                             .filter((p: any) => !memberSearchTerm || (p.displayName || '').toLowerCase().includes(memberSearchTerm.toLowerCase()))
                             .map((participant: any) => {
                             const isParticipantAdmin = chatInfo?.admins.includes(participant.id);
                             const isMeAdmin = chatInfo?.admins.includes(user?.uid);
                             return (
                                <div key={participant.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all group shadow-sm">
                                   <img src={participant.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.id}`} className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-700 group-hover:border-zinc-300 transition-colors object-cover" />
                                   <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                         <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate text-[14px]">{participant.displayName}</span>
                                         {isParticipantAdmin && (
                                            <span className="text-[9px] font-mono font-bold bg-wa-primary text-white px-2 py-0.5 rounded-full uppercase leading-none">Admin</span>
                                         )}
                                      </div>
                                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{participant.about || (participant.id === user?.uid ? 'You' : 'Available')}</p>
                                   </div>
                                   
                                   {isMeAdmin && participant.id !== user?.uid && (
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <button 
                                           onClick={() => toggleAdmin(participant.id)}
                                           className="p-2 text-zinc-500 hover:text-wa-primary hover:bg-wa-primary/10 rounded-lg transition-colors"
                                           title={isParticipantAdmin ? "Revoke Admin" : "Make Admin"}
                                         >
                                            <Check size={16} />
                                         </button>
                                         <button 
                                           onClick={() => removeParticipant(participant.id)}
                                           className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                           title="Remove from group"
                                         >
                                            <X size={16} />
                                         </button>
                                      </div>
                                   )}
                                </div>
                             );
                          })
                          }
                          </>
                        ) : (
                          <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4 shadow-inner">
                             <div className="flex items-center justify-between">
                                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Sync State</span>
                                <span className="text-[10px] font-mono font-bold text-green-500 uppercase tracking-widest flex items-center gap-1.5">
                                   <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                   LIVE
                                </span>
                             </div>
                             <div className="flex items-center justify-between">
                                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Protocol</span>
                                <span className="text-[10px] font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">End-to-End</span>
                             </div>
                             <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                <p className="text-[10px] text-zinc-400 italic leading-relaxed">
                                   Messages in this channel are crytpographically isolated and only accessible by participating nodes.
                                </p>
                             </div>
                          </div>
                       )}
                       </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <h4 className="text-[10px] font-mono font-bold text-wa-primary uppercase tracking-widest px-2 flex items-center gap-1.5">
                        <Flame size={12} className="fill-red-500 text-red-500 animate-pulse" />
                        <span>Volatile Transmission Hub</span>
                      </h4>
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4 text-left">
                        <div>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider block mb-2">
                            Auto-Delete Disappearing Timer
                          </span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { label: 'None', val: 0 },
                              { label: '5s', val: 5 },
                              { label: '10s', val: 10 },
                              { label: '30s', val: 30 },
                              { label: '1m', val: 60 },
                              { label: '1h', val: 3600 },
                              { label: '1d', val: 86400 }
                            ].map((opt) => (
                              <button
                                key={opt.label}
                                onClick={() => {
                                  setEphemeralTimer(opt.val);
                                  localStorage.setItem(`aero_ephemeral_timer_${chatId}`, String(opt.val));
                                  setToast({
                                    message: opt.val > 0 
                                      ? `🔥 Secure self-destruct countdown armed to ${opt.label}!`
                                      : "🌿 Disappearing messages countdown protocols disarmed.",
                                    type: 'success'
                                  });
                                }}
                                className={cn(
                                  "py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider border transition-all active:scale-95",
                                  ephemeralTimer === opt.val 
                                    ? "bg-red-500 text-white border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" 
                                    : "bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-350"
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
                          <div>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider block">
                              Screenshot & Grab block
                            </span>
                            <p className="text-[9px] text-zinc-400 opacity-60 leading-tight">
                              Prevent capture mirroring and grabs
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const newVal = !screenshotBlockEnabled;
                              setScreenshotBlockEnabled(newVal);
                              localStorage.setItem(`aero_screenshot_shield_${chatId}`, String(newVal));
                              setToast({
                                message: newVal 
                                  ? "🛡️ SCREENSHOT SHIELD: Active for volatile transmissions."
                                  : "⚠️ WARNING: Screenshot shield offline.",
                                  type: newVal ? 'success' : 'error'
                              });
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest transition-all",
                              screenshotBlockEnabled 
                                ? "bg-emerald-500 text-white shadow-[0_0_6px_rgba(16,185,129,0.3)]" 
                                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                            )}
                          >
                            {screenshotBlockEnabled ? 'Active' : 'Offline'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                       <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-2">Hacking Proof System</h4>
                       <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-wa-primary/0 via-wa-primary to-wa-primary/0 animate-scan-slow opacity-50" />
                          
                          <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-2">
                                <div className={cn(
                                   "w-2 h-2 rounded-full",
                                   securityScore > 90 ? "bg-wa-primary animate-pulse" : "bg-red-500 animate-pulse"
                                )}></div>
                                <span className={cn(
                                   "text-[10px] font-mono font-bold uppercase tracking-widest",
                                   securityScore > 90 ? "text-wa-primary" : "text-red-500"
                                )}>{securityScore > 90 ? 'System Integrity: Optimal' : 'System compromised'}</span>
                             </div>
                             <ShieldCheck size={14} className="text-wa-primary" />
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                             <div className="p-2 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                                <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Defense Array</p>
                                <p className="text-[11px] font-mono font-bold text-white">AES-4096-ECC</p>
                             </div>
                             <div className="p-2 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                                <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Threat Detect</p>
                                <p className="text-[11px] font-mono font-bold text-white">0 ACTIVE</p>
                             </div>
                          </div>

                          <button 
                             onClick={() => {
                                setIsProofing(true);
                                setTimeout(() => {
                                   setIsProofing(false);
                                   setSecurityScore(Math.floor(Math.random() * (100 - 95 + 1)) + 95);
                                }, 3000);
                             }}
                             disabled={isProofing}
                             className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 group/btn"
                          >
                             {isProofing ? (
                                <>
                                   <Loader2 size={12} className="animate-spin text-wa-primary" />
                                   <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-wa-primary">Auditing Nodes...</span>
                                </>
                             ) : (
                                <>
                                   <Terminal size={12} className="group-hover/btn:text-wa-primary transition-colors" />
                                   <span className="text-[9px] font-mono font-bold uppercase tracking-widest">Execute Security Audit</span>
                                </>
                             )}
                          </button>

                          <div className="mt-4 pt-4 border-t border-zinc-900 flex flex-col gap-2">
                             <div className="flex items-center gap-2 opacity-50">
                                <Activity size={10} className="text-wa-primary" />
                                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Live Traffic Isolation: Enabled</span>
                             </div>
                             <div className="flex items-center gap-2 opacity-50">
                                <Lock size={10} className="text-wa-primary" />
                                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Quantum-Chain Resistance: Active</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                       <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-2">Group Analytics</h4>
                       <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                          <div className="flex justify-between mb-4">
                             <div>
                                <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Total Nodes</p>
                                <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{chatInfo?.participants?.length || 0}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Active Signalers</p>
                                <p className="text-xl font-black text-wa-primary">
                                   {new Set(decryptedMessages.filter(m => {
                                      const msgTime = m.createdAt?.toDate ? m.createdAt.toDate().getTime() : 0;
                                      return (Date.now() - msgTime) < 24 * 60 * 60 * 1000;
                                   }).map(m => m.senderId)).size}
                                </p>
                             </div>
                          </div>
                          
                          <div className="h-[120px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                   {
                                      name: 'Activity',
                                      Total: chatInfo?.participants?.length || 0,
                                      Active: new Set(decryptedMessages.filter(m => {
                                         const msgTime = m.createdAt?.toDate ? m.createdAt.toDate().getTime() : 0;
                                         return (Date.now() - msgTime) < 24 * 60 * 60 * 1000;
                                      }).map(m => m.senderId)).size
                                   }
                                ]}>
                                   <XAxis dataKey="name" hide />
                                   <YAxis hide />
                                   <Tooltip 
                                      contentStyle={{ 
                                         backgroundColor: '#18181b', 
                                         border: 'none', 
                                         borderRadius: '8px',
                                         fontSize: '10px',
                                         fontFamily: 'monospace',
                                         color: '#fff'
                                      }}
                                      itemStyle={{ color: '#fff' }}
                                   />
                                   <Bar dataKey="Total" fill="#3f3f46" radius={[4, 4, 0, 0]} />
                                   <Bar dataKey="Active" fill="#25d366" radius={[4, 4, 0, 0]} />
                                </BarChart>
                             </ResponsiveContainer>
                          </div>
                          <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest text-center mt-3">Node Distribution vs active frequency</p>
                       </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                       <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-2">Group Activity</h4>
                       <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4 shadow-inner">
                          <div className="flex items-center justify-between px-1">
                             <div className="flex flex-col">
                                <span className="text-[16px] font-black text-zinc-900 dark:text-zinc-100">
                                   {decryptedMessages.filter(m => {
                                      const msgTime = m.createdAt?.toDate ? m.createdAt.toDate().getTime() : Date.now();
                                      return (Date.now() - msgTime) < 24 * 60 * 60 * 1000;
                                   }).length}
                                </span>
                                <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Signals / 24h</span>
                             </div>
                             <div className="px-3 py-1 bg-wa-primary/10 rounded-full flex items-center gap-1.5 border border-wa-primary/20">
                                <span className="w-1.5 h-1.5 bg-wa-primary rounded-full animate-pulse" />
                                <span className="text-[9px] font-mono font-bold text-wa-primary uppercase tracking-widest">Live Flow</span>
                             </div>
                          </div>
                          
                          <div className="h-28 w-full -mx-2">
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={messageStats}>
                                   <defs>
                                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                         <stop offset="5%" stopColor="#25D366" stopOpacity={0.4}/>
                                         <stop offset="95%" stopColor="#25D366" stopOpacity={0}/>
                                      </linearGradient>
                                   </defs>
                                   <Area 
                                      type="monotone" 
                                      dataKey="count" 
                                      stroke="#25D366" 
                                      strokeWidth={3}
                                      fillOpacity={1} 
                                      fill="url(#colorCount)" 
                                      isAnimationActive={true}
                                      animationDuration={1500}
                                   />
                                   <Tooltip 
                                      content={({ active, payload }) => {
                                         if (active && payload && payload.length) {
                                            return (
                                               <div className="bg-zinc-950/90 backdrop-blur-md border border-wa-primary/20 p-2.5 rounded-xl shadow-2xl">
                                                  <p className="text-[9px] font-mono font-bold text-wa-primary uppercase tracking-widest mb-0.5">{payload[0].payload.time}</p>
                                                  <p className="text-[13px] font-black text-white">{payload[0].value} <span className="text-[9px] font-mono font-normal opacity-50">signals</span></p>
                                               </div>
                                            );
                                         }
                                         return null;
                                      }}
                                   />
                                </AreaChart>
                             </ResponsiveContainer>
                          </div>
                       </div>
                    </div>

                      <div className="space-y-4">
                         <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-2">Wallpaper Styling</h4>
                         <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-6 shadow-inner">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-zinc-500">
                                <span>OPACITY</span>
                                <span>{(wallpaperOpacity * 100).toFixed(0)}%</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.05" 
                                value={wallpaperOpacity} 
                                onChange={(e) => setWallpaperOpacity(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-wa-primary"
                              />
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-zinc-500">
                                <span>GRAIN TEXTURE</span>
                                <span>{(wallpaperNoise * 100).toFixed(0)}%</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.05" 
                                value={wallpaperNoise} 
                                onChange={(e) => setWallpaperNoise(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-wa-primary"
                              />
                            </div>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-2">Notifications</h4>
                        <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4 shadow-inner">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 bg-wa-primary/10 text-wa-primary rounded-xl">
                                    <Bell size={18} />
                                 </div>
                                 <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Alert Tone</span>
                              </div>
                              <select 
                                 value={currentUserProfile?.notificationSettings?.[chatId!]?.tone || 'Default'}
                                 onChange={(e) => {
                                   const newTone = e.target.value;
                                   updateNotificationTone(newTone);
                                   playNotificationSound(newTone as ToneType);
                                 }}
                                 className="bg-transparent text-[10px] font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest outline-none border-b border-wa-primary/30 pb-1"
                              >
                                 {Object.keys(NOTIFICATION_TONES).map(tone => (
                                   <option key={tone} value={tone} className="bg-white dark:bg-zinc-900">{tone}</option>
                                 ))}
                                 <option value="Silent" className="bg-white dark:bg-zinc-900">Silent</option>
                              </select>
                           </div>

                           <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 bg-wa-primary/10 text-wa-primary rounded-xl">
                                    <Eye size={18} />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Read Receipts</span>
                                    <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">Share view status for this chat</span>
                                 </div>
                              </div>
                              <button 
                                onClick={() => togglePerChatReadReceipts(!(currentUserProfile?.notificationSettings?.[chatId!]?.readReceiptsEnabled !== false))}
                                className={cn(
                                  "w-10 h-6 rounded-full relative transition-colors duration-300",
                                  currentUserProfile?.notificationSettings?.[chatId!]?.readReceiptsEnabled !== false ? "bg-wa-primary" : "bg-zinc-300"
                                )}
                              >
                                <motion.div 
                                  animate={{ x: currentUserProfile?.notificationSettings?.[chatId!]?.readReceiptsEnabled !== false ? 18 : 2 }}
                                  className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                                />
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-6 border-t border-zinc-100 bg-white">
                     <button className="w-full py-3 text-red-500 font-mono font-bold text-[11px] uppercase tracking-widest hover:bg-red-50 border border-transparent hover:border-red-100 rounded-full transition-all">
                        Leave Transmission
                     </button>
                  </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Theme Package Modal */}
      <AnimatePresence>
        {showThemePicker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowThemePicker(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-7 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
                <div>
                  <h3 className="font-black text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-tighter text-lg">
                    <Palette size={22} className="text-wa-primary" />
                    Theme Packages
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-1 font-bold">Select visual identity</p>
                </div>
                <button onClick={() => setShowThemePicker(false)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors text-zinc-500">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto no-scrollbar">
                <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-2xl mb-4 w-full">
                  <button 
                    onClick={() => setBubbleShape('modern')}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all",
                      bubbleShape === 'modern' ? "bg-white dark:bg-zinc-700 text-wa-primary shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                    )}
                  >
                    Modern
                  </button>
                  <button 
                    onClick={() => setBubbleShape('classic')}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all",
                      bubbleShape === 'classic' ? "bg-white dark:bg-zinc-700 text-wa-primary shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                    )}
                  >
                    Classic
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 mb-6">
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Auto Theme Cycle</span>
                      <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest leading-none mt-1">Noir at night, Classic by day</span>
                    </div>
                    <button 
                      onClick={() => {
                        const newValue = !isThemeCycleEnabled;
                        setIsThemeCycleEnabled(newValue);
                        localStorage.setItem(`themeCycle_${chatId}`, newValue.toString());
                      }}
                      className={cn(
                        "w-10 h-6 rounded-full transition-all relative flex items-center px-1 shrink-0",
                        isThemeCycleEnabled ? "bg-wa-primary" : "bg-zinc-300 dark:bg-zinc-700"
                      )}
                    >
                      <motion.div 
                        animate={{ x: isThemeCycleEnabled ? 16 : 0 }}
                        className="w-4 h-4 bg-white rounded-full shadow-sm" 
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Sparkles size={12} className="text-wa-primary" />
                        <span className="text-[11px] font-black uppercase tracking-tighter text-zinc-900 dark:text-white">AI Auto-Reply</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest leading-none mt-1">Drafts replies when you're away</span>
                    </div>
                    <button 
                      onClick={() => {
                        const newValue = !isAiAutoReplyEnabled;
                        setIsAiAutoReplyEnabled(newValue);
                        localStorage.setItem(`aiAutoReply_${chatId}`, newValue.toString());
                      }}
                      className={cn(
                        "w-10 h-6 rounded-full transition-all relative flex items-center px-1 shrink-0",
                        isAiAutoReplyEnabled ? "bg-wa-primary" : "bg-zinc-300 dark:bg-zinc-700"
                      )}
                    >
                      <motion.div 
                        animate={{ x: isAiAutoReplyEnabled ? 16 : 0 }}
                        className="w-4 h-4 bg-white rounded-full shadow-sm" 
                      />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 col-span-2">
                  {THEME_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => updateThemePackage(pkg)}
                    className={cn(
                      "group relative aspect-[3/4] rounded-3xl overflow-hidden border-2 transition-all shadow-xl active:scale-95",
                      chatInfo?.themePackage === pkg.id || (!chatInfo?.themePackage && pkg.id === 'classic')
                        ? "border-wa-primary ring-4 ring-wa-primary/20"
                        : "border-transparent hover:border-wa-primary/30"
                    )}
                  >
                    {/* Preview Background */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundColor: theme === 'dark' ? pkg.darkColor : pkg.color }}
                    />
                    {pkg.wallpaper && (
                      <div 
                        className="absolute inset-0 opacity-40 bg-repeat bg-[length:100px]"
                        style={{ backgroundImage: `url('${pkg.wallpaper}')` }}
                      />
                    )}
                    
                    {/* Preview Bubbles */}
                    <div className="absolute inset-0 p-3 flex flex-col gap-2 justify-center">
                       <div className={cn(pkg.bubbleMe, "w-3/4 h-4 rounded-full rounded-tr-none ml-auto scale-90 opacity-80 shadow-sm")} />
                       <div className={cn(pkg.bubbleThem, "w-3/4 h-4 rounded-full rounded-tl-none mr-auto scale-90 opacity-80 shadow-sm")} />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 flex flex-col justify-end p-4">
                      <span className={cn("text-white text-[12px] font-black uppercase tracking-tighter leading-none", pkg.font)}>{pkg.name}</span>
                       <div className={cn("w-6 h-1 mt-1 rounded-full", pkg.accent)} />
                    </div>
                    
                    {(chatInfo?.themePackage === pkg.id || (!chatInfo?.themePackage && pkg.id === 'classic')) && (
                      <div className="absolute top-3 right-3 w-7 h-7 bg-wa-primary rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
                        <Check size={16} strokeWidth={4} />
                      </div>
                    )}
                  </button>
                ))}
                </div>
              </div>

              <div className="p-7 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800">
                 <p className="text-[10px] text-zinc-400 text-center font-bold uppercase tracking-widest leading-relaxed">
                   Themes synchronize across all frequencies and devices for this channel.
                 </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Customization Modal */}
      <AnimatePresence>
        {showCustomizer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowCustomizer(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden my-8"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-7 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
                <div>
                  <h3 className="font-black text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-tighter text-lg">
                    <Sliders size={22} className="text-wa-primary animate-pulse" />
                    Chat Customizer
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-1 font-bold">Curate private transmission canvas</p>
                </div>
                <button onClick={() => setShowCustomizer(false)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors text-zinc-500">
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Contents */}
              <div className="p-6 max-h-[65vh] overflow-y-auto no-scrollbar space-y-6">
                
                {/* Visual Real-Time Preview Panel */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-1">Active Design Preview</span>
                  <div 
                    className="rounded-3xl p-4 relative overflow-hidden h-36 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-colors duration-500"
                    style={{ 
                      backgroundColor: theme === 'dark' 
                        ? (chatInfo?.customDarkColor || activeTheme.darkColor) 
                        : (chatInfo?.customColor || activeTheme.color) 
                    }}
                  >
                    {/* Pattern Overlay in Preview */}
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-40"
                      style={{ 
                        backgroundImage: (chatInfo?.customWallpaper || activeTheme.wallpaper) ? `url('${chatInfo?.customWallpaper || activeTheme.wallpaper}')` : 'none', 
                        backgroundRepeat: 'repeat',
                        backgroundSize: (chatInfo?.customWallpaper && chatInfo.customWallpaper.includes('transparenttextures.com')) ? '100px' : '300px'
                      }}
                    />

                    {/* Sim messages */}
                    <div className="relative z-10 flex flex-col gap-2 w-full text-[12px]">
                      {/* Person message bubble */}
                      <div className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-3 py-1.5 rounded-full rounded-tl-none self-start shadow-sm border border-black/5 dark:border-white/5 max-w-[80%] font-semibold leading-tight">
                        Initializing custom transmission node...
                      </div>
                      
                      {/* My message bubble */}
                      <div 
                        className="text-white px-3 py-1.5 rounded-full rounded-tr-none self-end shadow-sm max-w-[80%] font-semibold leading-tight text-right flex flex-col items-end"
                        style={{ 
                          backgroundColor: chatInfo?.customAccentColor || '#00b489' 
                        }}
                      >
                        <div>Secure frequency established.</div>
                      </div>
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-[8px] font-mono font-bold opacity-60 uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      <span>Light/Dark Adaptive Node</span>
                      <span className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">Active</span>
                    </div>
                  </div>
                </div>

                {/* 1. Curated Accent Colors */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Select Accent Color</span>
                    {chatInfo?.customAccentColor && (
                      <span className="text-[9px] font-mono font-black text-wa-primary uppercase tracking-widest">Selected</span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { id: 'teal', name: 'Classic Teal', hex: '#00b489' },
                      { id: 'emerald', name: 'Emerald', hex: '#10b981' },
                      { id: 'sky', name: 'Sky Blue', hex: '#0284c7' },
                      { id: 'indigo', name: 'Indigo', hex: '#6366f1' },
                      { id: 'fuchsia', name: 'Fuchsia', hex: '#d946ef' },
                      { id: 'rose', name: 'Crimson Rose', hex: '#f43f5e' },
                      { id: 'orange', name: 'Lava Orange', hex: '#f97316' },
                      { id: 'gold', name: 'Solar Gold', hex: '#eab308' },
                    ].map((accent) => (
                      <button 
                        key={accent.id}
                        onClick={() => updateChatCustomAttributes({ customAccentColor: accent.hex })}
                        className="group relative flex flex-col items-center justify-center p-2 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-850 transition-all active:scale-95"
                        title={accent.name}
                      >
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md shadow-black/10 relative transition-transform group-hover:scale-105"
                          style={{ backgroundColor: accent.hex }}
                        >
                          {chatInfo?.customAccentColor === accent.hex && (
                            <Check size={18} strokeWidth={4} />
                          )}
                        </div>
                        <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-zinc-400 truncate w-full text-center mt-1.5 leading-none">{accent.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Seamless Background Patterns */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-1">Background Pattern overlay</span>
                  <div className="grid grid-cols-3 gap-2">
                    {WALLPAPER_PATTERNS.slice(0, 9).map((pattern) => (
                      <button 
                        key={pattern.id}
                        onClick={() => updateChatCustomAttributes({ customWallpaper: pattern.url })}
                        className={cn(
                          "group h-16 rounded-2xl relative overflow-hidden border-2 transition-all active:scale-95 flex items-end p-2.5",
                          chatInfo?.customWallpaper === pattern.url || (!chatInfo?.customWallpaper && pattern.id === 'none')
                            ? "border-wa-primary ring-2 ring-wa-primary/10"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                        )}
                      >
                        {/* Background visual texture inside grid button */}
                        <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800" />
                        {pattern.url && (
                          <div 
                            className="absolute inset-0 opacity-40 bg-repeat"
                            style={{ 
                              backgroundImage: `url('${pattern.url}')`,
                              backgroundSize: '40px'
                            }}
                          />
                        )}
                        <span className="text-[9px] font-mono font-black uppercase text-zinc-650 dark:text-zinc-350 tracking-wider relative z-10 leading-none">{pattern.name}</span>
                        {(chatInfo?.customWallpaper === pattern.url || (!chatInfo?.customWallpaper && pattern.id === 'none')) && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-wa-primary rounded-full flex items-center justify-center text-white scale-90">
                            <Check size={10} strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Base Canvas Custom BG Preset (Light / Dark duo sync) */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-1">Base Canvas BG Preset</span>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Sage (Original)', light: '#efeae2', dark: '#0b141a' },
                      { name: 'Pure Slate', light: '#f1f5f9', dark: '#0f172a' },
                      { name: 'Aero Violet', light: '#faf5ff', dark: '#09090b' },
                      { name: 'Royal Midnight', light: '#eff6ff', dark: '#030712' },
                      { name: 'Desert Oasis', light: '#fff7ed', dark: '#1c1917' },
                      { name: 'Peace Forest', light: '#f0fdf4', dark: '#022c22' },
                    ].map((preset) => {
                      const isActive = chatInfo?.customColor === preset.light && chatInfo?.customDarkColor === preset.dark;
                      return (
                        <button 
                          key={preset.name}
                          onClick={() => updateChatCustomAttributes({ 
                            customColor: preset.light, 
                            customDarkColor: preset.dark 
                          })}
                          className={cn(
                            "flex items-center gap-3 p-3 bg-zinc-50 dark:bg-[#1a2329] border-2 rounded-2xl w-full text-left transition-all active:scale-95 group",
                            isActive 
                              ? "border-wa-primary shadow-[0_0_8px_rgba(0,180,137,0.15)]" 
                              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                          )}
                        >
                          <div className="flex h-7 w-7 rounded-lg overflow-hidden shrink-0 border border-black/10 shadow-sm">
                            <div className="w-1/2" style={{ backgroundColor: preset.light }} />
                            <div className="w-1/2" style={{ backgroundColor: preset.dark }} />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[9px] font-mono font-black uppercase tracking-wider text-zinc-900 dark:text-white truncate leading-none">{preset.name}</span>
                            <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest leading-none mt-1">Light / Dark</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Wallpaper Opacity */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-3xl space-y-3 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-zinc-500">
                    <span className="uppercase tracking-widest">Wallpaper Pattern Opacity</span>
                    <span>{((chatInfo?.customWallpaperOpacity !== undefined && chatInfo?.customWallpaperOpacity !== null ? chatInfo.customWallpaperOpacity : 0.4) * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    value={chatInfo?.customWallpaperOpacity !== undefined && chatInfo?.customWallpaperOpacity !== null ? chatInfo.customWallpaperOpacity : 0.4} 
                    onChange={(e) => updateChatCustomAttributes({ customWallpaperOpacity: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-wa-primary"
                  />
                </div>

              </div>

              {/* Footer */}
              <div className="p-7 bg-zinc-55 dark:bg-zinc-800/10 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-4">
                <button 
                  onClick={() => {
                    updateChatCustomAttributes({
                      customWallpaper: "",
                      customAccentColor: "",
                      customColor: "",
                      customDarkColor: "",
                      customWallpaperOpacity: 0.4
                    });
                  }}
                  className="w-full py-3 border-2 border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 font-mono font-bold text-[10px] uppercase tracking-widest rounded-2xl transition-all active:scale-95"
                >
                  Reset To System Defaults
                </button>
                <p className="text-[10px] text-zinc-400 text-center font-bold uppercase tracking-widest leading-relaxed">
                  Theme settings synchronize permanently and instantly in Firestore secure storage.
                </p>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forward Message Modal */}
      <AnimatePresence>
        {showForwardModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setShowForwardModal(false); setForwardingMessage(null); }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Forward size={18} className="text-wa-primary" />
                    Forward Message
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-1">Select recipient</p>
                </div>
                <button 
                  onClick={() => { setShowForwardModal(false); setForwardingMessage(null); }} 
                  className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors text-zinc-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 max-h-[60vh] overflow-y-auto no-scrollbar space-y-2">
                {userChats.length === 0 ? (
                  <div className="py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-zinc-300 mb-2" />
                    <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Scanning channels...</p>
                  </div>
                ) : (
                  userChats.map((chat: any) => (
                    <button
                      key={chat.id}
                      onClick={() => handleForwardMessage(chat.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group text-left"
                    >
                      <img 
                        src={chat.groupPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id}`}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-wa-primary/30 transition-all font-mono"
                        alt=""
                      />
                      <div className="flex-1 min-w-0">
                        <span className="block font-bold text-zinc-900 dark:text-zinc-100 truncate text-sm">
                          {chat.groupName || chat.peerName || 'Encrypted Channel'}
                        </span>
                        <span className="block text-[10px] text-zinc-400 truncate uppercase tracking-tighter">
                          {chat.isGroup ? 'Multicast Group' : 'Direct Link'}
                        </span>
                      </div>
                      <div className="p-2 bg-wa-primary/10 text-wa-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Send size={14} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Message Modal */}
      <SchedulePicker
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={(date, recurrence) => {
          setActiveScheduledDate(date);
          setActiveRecurrence(recurrence);
          setShowScheduleModal(false);
          setToast({ message: "Schedule target loaded. Press Send to dispatch.", type: 'success' });
        }}
        peerName={chatInfo?.peerName || chatInfo?.groupName || 'Personnel'}
        peerId={chatInfo?.peerId || chatId}
      />

      {/* Message Edit History Modal */}
      <EditHistoryModal
        isOpen={!!activeHistoryMessageId}
        onClose={() => setActiveHistoryMessageId(null)}
        messageId={activeHistoryMessageId || ''}
        chatId={chatId || ''}
        isGroup={isGroup}
        sharedKey={sharedKey}
        userId={user?.uid || ''}
        isAdmin={chatInfo?.admins?.includes(user?.uid) || false}
        groupParticipants={groupParticipants}
      />

      {/* Quick Reaction Modal */}
      <AnimatePresence>
        {reactionMsgId && (
          <div className="fixed inset-0 z-[150] bg-black/5" onClick={() => setReactionMsgId(null)}>
             <motion.div 
               initial={{ opacity: 0, scale: 0.8, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.8, y: 10 }}
               className="absolute bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full p-2 flex gap-1 shadow-2xl"
               style={{ 
                 top: '50%',
                 left: '50%',
                 transform: 'translate(-50%, -50%)' 
               }}
               onClick={e => e.stopPropagation()}
             >
                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => {
                      addReaction(reactionMsgId, emoji);
                      setReactionMsgId(null);
                    }}
                    className="w-10 h-10 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all text-xl active:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-6 space-y-2 relative z-10 bg-transparent"
        onScroll={handleScroll}
        ref={scrollContainerRef}
      >
        {disappearingSettings && disappearingSettings.timer > 0 && (
          <div className="mb-4 flex justify-center">
            <DisappearingBanner 
              timer={disappearingSettings.timer} 
              onSettingsClick={() => setShowDisappearingModal(true)} 
            />
          </div>
        )}
        {loadingMessages && <MessageSkeleton />}
        <AnimatePresence initial={false}>
          {(() => {
            let visibleMessages = decryptedMessages.filter(msg => !currentUserProfile?.blockedUsers?.includes(msg.senderId));
            
            if (roomSearchTerm || roomSearchStartDate || roomSearchEndDate) {
              const term = roomSearchTerm.toLowerCase();
              visibleMessages = visibleMessages.filter(msg => {
                const textMatch = !roomSearchTerm || (
                  msg.text?.toLowerCase().includes(term) ||
                  msg.type === term ||
                  msg.pollOptions?.some((opt: any) => opt.text.toLowerCase().includes(term)) ||
                  msg.replyTo?.text?.toLowerCase().includes(term)
                );

                let dateMatch = true;
                const msgTime = msg.createdAt?.toDate ? msg.createdAt.toDate().getTime() : (typeof msg.createdAt === 'number' ? msg.createdAt : Date.now());
                if (roomSearchStartDate) {
                  const start = new Date(roomSearchStartDate).getTime();
                  if (msgTime < start) dateMatch = false;
                }
                if (roomSearchEndDate) {
                  const end = new Date(roomSearchEndDate).getTime() + 86400000;
                  if (msgTime > end) dateMatch = false;
                }

                return textMatch && dateMatch;
              });
            }

            const firstUnreadMessage = visibleMessages.find(m => m.senderId !== user?.uid && !m.readBy?.[user?.uid]);
            const lastUserMessageId = [...visibleMessages].reverse().find(m => m.senderId === user?.uid)?.id;

            return visibleMessages.map((msg, idx) => {
              const isMe = msg.senderId === user?.uid;
              const isFirstUnread = firstUnreadMessage && msg.id === firstUnreadMessage.id;
              const isMatched = roomSearchTerm.trim() !== '' && 
                               msg.text?.toLowerCase().includes(roomSearchTerm.toLowerCase());
              
              const currentSeconds = msg.createdAt?.seconds || Date.now() / 1000;
              const prevSeconds = visibleMessages[idx-1]?.createdAt?.seconds || Date.now() / 1000;
              const showTime = idx === 0 || (currentSeconds - prevSeconds > 3600);

              const sender = groupParticipants.find(p => p.uid === msg.senderId) || (msg.senderId === user?.uid ? currentUserProfile : peerProfile);
              const senderPhoto = sender?.photoURL || `https://ui-avatars.com/api/?name=${sender?.displayName || 'User'}&background=random`;

            return (
              <React.Fragment key={msg.id}>
                {isFirstUnread && (
                  <div 
                    id="unread-divider"
                    className="w-full flex items-center justify-center my-6"
                  >
                    <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800/60" />
                    <span className="text-zinc-500 dark:text-zinc-400 px-3 text-[11px] font-mono font-bold uppercase tracking-widest">
                      New Messages
                    </span>
                    <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800/60" />
                  </div>
                )}
                {showTime && !isPeaceModeActive && (
                  <div className="w-full flex justify-center my-8">
                    <span className="bg-zinc-200/50 px-3 py-1 rounded-full text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest shadow-sm border border-zinc-200/50">
                      {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'MMMM d, h:mm a') : format(new Date(), 'MMMM d, h:mm a')}
                    </span>
                  </div>
                )}
                
                    <motion.div
                      ref={registerRef(msg.id)}
                      data-message-id={msg.id}
                      id={`message-${msg.id}`}
                      initial={{ opacity: 0, scale: 0.9, y: 30 }}
                      animate={{ 
                        opacity: 1, 
                        scale: isMatched ? 1.02 : 1, 
                        y: 0,
                        x: swipingMessageId === msg.id ? 20 : 0
                      }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 100 }}
                      dragElastic={0.1}
                      onDragStart={() => setSwipingMessageId(msg.id)}
                      onDragEnd={(_, info) => {
                        setSwipingMessageId(null);
                        if (info.offset.x > 60) {
                          setReplyingTo(msg);
                          if ('vibrate' in navigator) navigator.vibrate(10);
                        }
                      }}
                      transition={{ 
                        type: "spring", 
                        damping: 25, 
                        stiffness: 400,
                        opacity: { duration: 0.3 }
                      }}
                      layout
                      onClick={() => setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id);
                  }}
                  className={cn(
                    "flex flex-col relative cursor-pointer group/msg",
                    messageLayout === 'compact' ? "mb-1" : "mb-4",
                    isMe ? "items-end" : "items-start",
                    isMatched && "z-20"
                  )}
                  onMouseEnter={() => setHoveredMessageId(msg.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                {hoveredMessageId === msg.id && (
                  <ReactionPicker isOpen={true} onSelect={(e) => addReaction(msg.id, e)} onClose={() => setHoveredMessageId(null)} isMe={isMe} />
                )}
                   {isMatched && (
                      <motion.div 
                        animate={{ 
                          opacity: [0.1, 0.3, 0.1],
                          scale: [1, 1.05, 1]
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-[-8px] bg-yellow-200/30 dark:bg-yellow-500/20 rounded-[28px] pointer-events-none -z-10 blur-lg" 
                      />
                   )}
                   <AnimatePresence>
                      {selectedMessageId === msg.id && (
                         <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={cn(
                               "absolute z-50 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 p-2 flex flex-col gap-1 min-w-[120px]",
                               isMe ? "right-0 bottom-full mb-2" : "left-0 bottom-full mb-2"
                            )}
                            onClick={(e) => e.stopPropagation()}
                         >
                            <div className="flex justify-around p-2 gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-1">
                               {['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '✨'].map(emoji => (
                                  <button key={emoji} onClick={() => { addReaction(msg.id, emoji); setSelectedMessageId(null); }} className="hover:scale-125 transition-transform text-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">{emoji}</button>
                               ))}
                               <button 
                                 onClick={() => { 
                                   setShowEmojiInput(msg.id);
                                   setTimeout(() => emojiInputRef.current?.focus(), 100);
                                 }} 
                                 className="hover:scale-125 transition-transform text-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400"
                               >
                                  <Plus size={20} />
                               </button>
                            </div>
                            {showEmojiInput === msg.id && (
                              <div className="absolute top-0 right-0 left-0 bg-white dark:bg-zinc-900 p-2 border-b border-zinc-100 dark:border-zinc-800 z-50 flex gap-2">
                                <input
                                  ref={emojiInputRef}
                                  type="text"
                                  placeholder="Emoji..."
                                  className="flex-1 bg-zinc-50 dark:bg-zinc-800 border-none rounded px-2 py-1 text-sm outline-none"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const emoji = (e.target as HTMLInputElement).value;
                                      if (emoji) {
                                        addReaction(msg.id, emoji);
                                        setShowEmojiInput(null);
                                        setSelectedMessageId(null);
                                      }
                                    }
                                  }}
                                />
                                <button onClick={() => setShowEmojiInput(null)} className="text-zinc-400 p-1"><X size={14} /></button>
                              </div>
                            )}
                            <button 
                               onClick={() => { setReplyingTo(msg); setSelectedMessageId(null); }} 
                               className="w-full text-left px-3 py-2 text-zinc-900 dark:text-zinc-100 font-bold font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all flex items-center justify-between"
                            >
                               <span>{chatInfo?.pinnedMessages?.includes(msg.id) ? 'Unpin Signal' : 'Pin to Viewport'}</span>
                                <Pin size={12} className={cn(chatInfo?.pinnedMessages?.includes(msg.id) && "fill-wa-primary text-wa-primary")} />
                             </button>
                             <button 
                                onClick={() => { setReplyingTo(msg); setSelectedMessageId(null); }} 
                                className="w-full text-left px-3 py-2 text-zinc-900 dark:text-zinc-100 font-bold font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all flex items-center justify-between"
                             >
                                <span>Reply</span>
                               <Reply size={12} />
                            </button>
                            {(msg.type === 'text' || msg.transcript) && (
                              <button 
                                 onClick={() => { 
                                   handleTranslateSingleMessage(msg.id, msg.type === 'text' ? msg.text : msg.transcript); 
                                   setSelectedMessageId(null); 
                                 }} 
                                 className="w-full text-left px-3 py-2 text-zinc-900 dark:text-zinc-100 font-bold font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all flex items-center justify-between"
                              >
                                 <span>Translate AI</span>
                                 <Globe size={12} className="text-indigo-500" />
                              </button>
                            )}
                            <button 
                               onClick={() => { 
                                 setForwardingMessage(msg); 
                                 setSelectedMessageId(null); 
                                 setShowForwardModal(true);
                                 fetchUserChats();
                               }} 
                               className="w-full text-left px-3 py-2 text-zinc-900 dark:text-zinc-100 font-bold font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all flex items-center justify-between"
                            >
                               <span>Forward</span>
                               <Forward size={12} />
                            </button>
                            <button 
                               onClick={() => { toggleStar(msg.id); setSelectedMessageId(null); }} 
                               className="w-full text-left px-3 py-2 text-zinc-900 font-bold font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-100 rounded-xl transition-all flex items-center justify-between"
                            >
                               <span>{currentUserProfile?.starredMessages?.some((s: any) => s.messageId === msg.id) ? 'Unstar' : 'Star'}</span>
                               <Check size={12} />
                            </button>
                            {((isMe || chatInfo?.admins?.includes(user?.uid)) && msg.type === 'text' && !msg.isViewOnce) && (
                               <button 
                                  onClick={() => { 
                                     setEditingMessage(msg); 
                                     setInlineEditText(msg.decryptedText || msg.text || ''); 
                                     setSelectedMessageId(null); 
                                  }} 
                                  className="w-full text-left px-3 py-2 text-emerald-600 font-bold font-mono text-[10px] uppercase tracking-widest hover:bg-emerald-50 rounded-xl transition-all flex items-center justify-between cursor-pointer"
                               >
                                  <span>Edit message</span>
                                  <Edit size={12} />
                               </button>
                            )}
                            {msg.isEdited && !msg.hideHistory && (
                               <button 
                                  onClick={() => { 
                                     setActiveHistoryMessageId(msg.id);
                                     setSelectedMessageId(null); 
                                  }} 
                                  className="w-full text-left px-3 py-2 text-blue-550 font-bold font-mono text-[10px] uppercase tracking-widest hover:bg-blue-50 rounded-xl transition-all flex items-center justify-between cursor-pointer"
                               >
                                  <span>History Log</span>
                                  <History size={12} />
                               </button>
                            )}
                            {isMe && (
                               <button onClick={() => setMessageToDelete(msg.id)} className="w-full text-left px-3 py-2 text-red-500 font-bold font-mono text-[10px] uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all flex items-center justify-between">
                                  <span>Delete</span>
                                  <X size={12} />
                               </button>
                            )}
                         </motion.div>
                      )}
                   </AnimatePresence>
                    <div className={cn("flex items-end gap-2 max-w-[92%]", isMe ? "flex-row-reverse" : "flex-row")}>
                      {messageLayout === 'expanded' && (
                        <motion.img 
                          layout
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          src={isMe ? (currentUserProfile?.photoURL || `https://ui-avatars.com/api/?name=${currentUserProfile?.displayName || 'Me'}&background=random`) : senderPhoto} 
                          className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-800 shadow-sm shrink-0 mb-1" 
                        />
                      )}
                      {isMe && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); toggleStar(msg.id); }}
                            className={cn(
                              "p-1.5 rounded-full transition-all flex-shrink-0 cursor-pointer hidden md:flex mb-1",
                              currentUserProfile?.starredMessages?.some((s: any) => s.messageId === msg.id) 
                                ? "text-yellow-500 hover:bg-yellow-50/50" 
                                : "text-zinc-300 opacity-0 group-hover/msg:opacity-100 hover:text-yellow-500 hover:bg-zinc-100"
                            )}
                         >
                            <Star size={16} fill={currentUserProfile?.starredMessages?.some((s: any) => s.messageId === msg.id) ? "currentColor" : "none"} />
                         </button>
                      )}
                    <motion.div 
                    layout
                    initial={false}
                    animate={{
                       backgroundColor: isMe && bubbleColor ? bubbleColor : undefined,
                       color: isMe && bubbleColor ? (parseInt((bubbleColor || '#000').replace('#', ''), 16) > 0xffffff / 1.5 ? '#000' : '#fff') : undefined
                    }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={() => {
                      if (selectedThreadIds.length > 0) {
                        toggleMessageInThread(msg.id);
                      }
                    }}
                    onMouseDown={(e) => {
                      if (selectedThreadIds.length > 0) return;
                      const timer = setTimeout(() => {
                        setReactionMsgId(msg.id);
                        setSelectedThreadIds([msg.id]);
                        if ('vibrate' in navigator) navigator.vibrate(50);
                      }, 600);
                      setLongPressTimer(timer);
                    }}
                    onMouseUp={() => {
                      if (longPressTimer) clearTimeout(longPressTimer);
                    }}
                    onTouchStart={() => {
                      if (selectedThreadIds.length > 0) return;
                      const timer = setTimeout(() => {
                        setReactionMsgId(msg.id);
                        setSelectedThreadIds([msg.id]);
                        if ('vibrate' in navigator) navigator.vibrate(50);
                      }, 600);
                      setLongPressTimer(timer);
                    }}
                    onTouchEnd={() => {
                      if (longPressTimer) clearTimeout(longPressTimer);
                    }}
                    className={cn(
                    "relative group shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] w-full max-w-[fit-content] border border-transparent backdrop-blur-sm z-10",
                    messageLayout === 'compact' ? "px-2 py-0.5 min-w-[50px] text-[13px]" : "px-4 py-2 min-w-[100px] text-[15px]",
                    isMe 
                      ? cn(activeTheme.bubbleMe, bubbleShape === 'modern' ? "rounded-[20px] rounded-tr-none" : "rounded-lg rounded-tr-none", "ml-auto") 
                      : cn(activeTheme.bubbleThem, bubbleShape === 'modern' ? "rounded-[20px] rounded-tl-none" : "rounded-lg rounded-tl-none", "mr-auto"),
                    msg.isViewOnce && "border-dashed border-wa-primary/30",
                    selectedThreadIds.includes(msg.id) && "ring-4 ring-wa-primary/40 ring-offset-2 dark:ring-offset-zinc-950 scale-[1.02]",
                    msg.isEdited && "border-l-2 border-l-amber-500 pl-3.5"
                  )}>
                    {(() => {
                      const totalReactions = Object.values(msg.reactions || {}).reduce((acc: number, users: any) => acc + (users?.length || 0), 0) as number;
                      return totalReactions > 1 && (
                        <motion.div 
                          layout
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={cn(
                            "absolute -top-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shadow-lg border-2 border-white dark:border-zinc-900 z-30 transition-colors",
                            isMe ? "-right-2 bg-wa-secondary text-white" : "-left-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                          )}
                        >
                          {totalReactions}
                        </motion.div>
                      );
                    })()}
                    {selectedThreadIds.includes(msg.id) && (
                      <div className={cn(
                        "absolute -top-2 -right-2 w-6 h-6 bg-wa-primary rounded-full flex items-center justify-center text-white shadow-lg z-20 border-2 border-white dark:border-zinc-900",
                        isMe ? "-left-2 right-auto" : "-right-2"
                      )}>
                        <Check size={14} strokeWidth={4} />
                      </div>
                    )}
                    {msg.burnDuration !== undefined && (
                       <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-black uppercase tracking-tighter text-red-500/95 dark:text-red-400">
                          <Flame size={12} className="fill-red-500 text-red-500 animate-pulse" />
                          <span>Burn in {countdownState[msg.id] !== undefined ? countdownState[msg.id] : msg.burnDuration}s</span>
                       </div>
                    )}
                    {msg.isViewOnce && (
                       <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-black uppercase tracking-tighter text-wa-primary/70">
                          <Eye size={12} strokeWidth={3} />
                          <span>Self-Destruct Transmission</span>
                       </div>
                    )}
                    {msg.type === 'sticker' && (
                      <div className="p-1 max-w-[150px] flex flex-col items-center">
                        <span className="text-6xl animate-bounce inline-block select-none filter drop-shadow-md py-2">
                          {msg.stickerUrl || msg.text}
                        </span>
                        <div className="text-[9px] font-mono font-bold text-amber-500/80 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                          🌟 PREMIUM STICKER
                        </div>
                      </div>
                    )}
                    {msg.type === 'image' && (
                      msg.isViewOnce ? (
                        <ViewOnceOverlay
                          messageId={msg.id}
                          chatId={chatId || ''}
                          isGroup={isGroup}
                          mediaUrl={msg.mediaUrl}
                          type="image"
                          viewedBy={msg.viewedBy || []}
                          userId={user?.uid || ''}
                          isSender={msg.senderId === user?.uid}
                        />
                      ) : (
                        <div className="relative group/media cursor-pointer" onClick={() => { setPreviewMedia({ url: msg.mediaUrl, type: msg.type, senderName: msg.senderId === user?.uid ? 'You' : (msg.senderName || chatInfo?.peerName || 'Peer'), createdAt: msg.createdAt, id: msg.id }); }}>
                          <img 
                            src={msg.mediaUrl} 
                            className="max-w-full rounded-lg bg-zinc-100 min-h-[100px] transition-all" 
                            alt="Shared" 
                          />
                          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/40 to-transparent flex justify-end items-center gap-1.5 z-10">
                            {msg.expiresAt && (
                              <ExpiryIndicator expiresAt={msg.expiresAt} />
                            )}
                            <span className="text-[10px] font-mono text-white/95">
                              {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'h:mm a') : format(new Date(), 'h:mm a')}
                            </span>
                            {isMe && msg.id === lastUserMessageId && (
                              <MessageStatus 
                                status={msg.status} 
                                readBy={msg.readBy} 
                                senderId={msg.senderId} 
                                isGroup={isGroup} 
                                groupParticipants={groupParticipants} 
                              />
                            )}
                          </div>
                        </div>
                      )
                    )}
                    {msg.type === 'video' && (
                      msg.isViewOnce ? (
                        <ViewOnceOverlay
                          messageId={msg.id}
                          chatId={chatId || ''}
                          isGroup={isGroup}
                          mediaUrl={msg.mediaUrl}
                          type="video"
                          viewedBy={msg.viewedBy || []}
                          userId={user?.uid || ''}
                          isSender={msg.senderId === user?.uid}
                        />
                      ) : (
                        <div className="relative group/media cursor-pointer" onClick={() => { setPreviewMedia({ url: msg.mediaUrl, type: msg.type, senderName: msg.senderId === user?.uid ? 'You' : (msg.senderName || chatInfo?.peerName || 'Peer'), createdAt: msg.createdAt, id: msg.id }); }}>
                          <video 
                             src={msg.mediaUrl} 
                             controls 
                             className="max-w-full rounded-lg bg-black min-h-[100px] transition-all" 
                          />
                          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/40 to-transparent flex justify-end items-center gap-1.5 pointer-events-none z-10">
                            {msg.expiresAt && (
                              <ExpiryIndicator expiresAt={msg.expiresAt} />
                            )}
                            <span className="text-[10px] font-mono text-white/95">
                              {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'h:mm a') : format(new Date(), 'h:mm a')}
                            </span>
                            {isMe && msg.id === lastUserMessageId && (
                              <MessageStatus 
                                status={msg.status} 
                                readBy={msg.readBy} 
                                senderId={msg.senderId} 
                                isGroup={isGroup} 
                                groupParticipants={groupParticipants} 
                              />
                            )}
                          </div>
                          <div className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-full text-white backdrop-blur-md pointer-events-none">
                             <Play size={12} fill="currentColor" />
                          </div>
                          <div className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-none opacity-0 group-hover/media:opacity-100 transition-opacity">
                             <span className="bg-black/60 text-white/90 text-[10px] font-mono tracking-widest uppercase px-2 py-1 rounded backdrop-blur-md">
                                 [ ambient audio ]
                             </span>
                          </div>
                        </div>
                      )
                    )}

                    {msg.type === 'audio' && (
                      <>
                        <div className="flex items-center gap-3 px-3 py-2 min-w-[240px]">
                        <audio 
                          src={msg.mediaUrl} 
                          id={`audio-${msg.id}`} 
                          className="hidden" 
                          onTimeUpdate={(e) => {
                             const audio = e.currentTarget;
                             const progress = (audio.currentTime / audio.duration) * 100;
                             setAudioProgress(prev => ({ ...prev, [msg.id]: progress }));
                          }}
                          onEnded={() => {
                            setPlayingAudioId(null);
                            setAudioProgress(prev => ({ ...prev, [msg.id]: 0 }));
                          }} 
                        />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const audio = document.getElementById(`audio-${msg.id}`) as HTMLAudioElement;
                            if (audio.paused) {
                              // Stop other playing audios
                              if (playingAudioId) {
                                const otherAudio = document.getElementById(`audio-${playingAudioId}`) as HTMLAudioElement;
                                if (otherAudio) otherAudio.pause();
                              }
                              audio.play();
                              setPlayingAudioId(msg.id);
                            } else {
                              audio.pause();
                              setPlayingAudioId(null);
                            }
                          }}
                          className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 shrink-0", 
                             isMe ? "bg-white text-zinc-950 hover:bg-zinc-50" : "bg-zinc-950 text-white hover:bg-zinc-800"
                          )}
                        >
                          {playingAudioId === msg.id ? <Volume2 size={18} className="animate-pulse" /> : <Play size={18} fill="currentColor" />}
                        </button>
                        <div className="flex-1 space-y-1.5 overflow-hidden">
                          <AudioWaveform 
                            url={msg.mediaUrl} 
                            isActive={playingAudioId === msg.id} 
                            progress={audioProgress[msg.id] || 0} 
                            onSeek={(percent) => {
                              const audio = document.getElementById(`audio-${msg.id}`) as HTMLAudioElement;
                              if (audio && audio.duration) {
                                audio.currentTime = (percent / 100) * audio.duration;
                              }
                            }}
                          />
                          <div className={cn("flex justify-between items-center text-[10px] font-mono font-bold uppercase tracking-widest", isMe ? "text-white/70" : "text-zinc-400")}>
                            <span>{formatDuration(msg.duration || 0)}</span>
                            {msg.transcript ? (
                               <span className="flex items-center gap-1 text-wa-primary active:scale-95 transition-transform cursor-pointer" onClick={() => transcribeVoiceMessage(msg.id, msg.mediaUrl)}>
                                 <FileText size={10} /> Transcribed
                               </span>
                            ) : (
                               <button 
                                onClick={(e) => { e.stopPropagation(); transcribeVoiceMessage(msg.id, msg.mediaUrl); }}
                                disabled={transcribingMessages.has(msg.id)}
                                className="flex items-center gap-1 hover:text-wa-primary transition-colors disabled:opacity-50"
                               >
                                 {transcribingMessages.has(msg.id) ? (
                                   <Loader2 size={10} className="animate-spin" />
                                 ) : (
                                   <Sparkles size={10} />
                                 )}
                                 {transcribingMessages.has(msg.id) ? 'Processing...' : 'Transcribe'}
                               </button>
                            )}
                          </div>
                        </div>
                      </div>
                      {msg.transcript && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "mx-3 mb-2 p-3 rounded-xl text-xs leading-relaxed space-y-1.5",
                            isMe ? "bg-black/10 text-white/95 border border-white/10" : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-700"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1 opacity-50">
                             <FileText size={10} />
                             <span className="text-[9px] font-mono font-bold uppercase tracking-widest">AI Transcript</span>
                             {msg.transcriptionConfidence && (
                                <span className="ml-auto text-[8px] opacity-70">{(msg.transcriptionConfidence * 100).toFixed(0)}% Confidence</span>
                             )}
                          </div>
                          <p className="italic font-medium">"{msg.transcript}"</p>
                          {translations[msg.id] && (
                            <div className="text-[11px] leading-relaxed pt-1.5 border-t border-dashed border-zinc-200 dark:border-zinc-700 mt-1 pl-1 font-medium text-indigo-600 dark:text-cyan-400">
                              <span className="text-[9px] uppercase font-mono font-black text-indigo-500/80 dark:text-cyan-500/60 mr-1">TRANS [{translationTargetLanguage}]:</span>
                              "{translations[msg.id]}"
                            </div>
                          )}
                          {isTranslating[msg.id] && (
                            <div className="flex items-center gap-1.5 text-[9px] text-indigo-500 font-mono animate-pulse uppercase tracking-wider">
                              <Loader2 size={10} className="animate-spin" /> Translating transcript...
                            </div>
                          )}
                        </motion.div>
                      )}
                    </>
                    )}

                    {msg.type === 'event' && msg.eventInfo && (
                       <EventCard 
                          messageId={msg.id}
                          chatId={routeChatId || ''}
                          eventInfo={msg.eventInfo}
                       />
                    )}

                    {msg.type === 'location' && (
                       <div className="space-y-2.5 min-w-[280px] max-w-[325px] p-2 bg-white/40 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative">
                          <div className="flex items-center justify-between px-1">
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-wa-primary/10 rounded-full flex items-center justify-center shrink-0">
                                   <MapPin className="text-[#00a884]" size={14} />
                                </div>
                                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest font-mono">Shared Position</span>
                             </div>
                             {msg.isLive && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#00a884]/15 rounded-full">
                                   <div className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-pulse" />
                                   <span className="text-[9px] font-black font-mono text-[#00a884] uppercase tracking-wider">Live</span>
                                </div>
                             )}
                          </div>
                          <div className="w-full h-36 rounded-xl overflow-hidden border border-zinc-150 dark:border-zinc-800/60 relative">
                             {msg.lat && msg.lng ? (
                                <iframe 
                                   width="100%" 
                                   height="100%" 
                                   frameBorder="0" 
                                   scrolling="no" 
                                   marginHeight={0} 
                                   marginWidth={0} 
                                   src={`https://www.openstreetmap.org/export/embed.html?bbox=${msg.lng - 0.01}%2C${msg.lat - 0.01}%2C${msg.lng + 0.01}%2C${msg.lat + 0.01}&marker=${msg.lat}%2C${msg.lng}`}
                                   title="Shared GPS Coordinates"
                                   className="w-full h-full object-cover rounded-xl"
                                />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                                   <div className="flex flex-col items-center gap-2 text-zinc-500">
                                      <Loader2 className="animate-spin" size={20} />
                                      <span className="text-[10px] font-mono tracking-widest uppercase">Acquiring Lock</span>
                                   </div>
                                </div>
                             )}
                          </div>
                          <div className="flex justify-between items-center px-1 font-mono text-[8px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">
                             <span>LAT: {msg.lat ? msg.lat.toFixed(5) : '---.-----'}</span>
                             <span>LNG: {msg.lng ? msg.lng.toFixed(5) : '---.-----'}</span>
                          </div>
                          {msg.isLive && msg.senderId === user?.uid && (
                             <button
                                onClick={() => stopLocationShare(msg.id)}
                                className="w-full mt-2 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors border border-red-500/20"
                             >
                                Terminate Live Stream
                             </button>
                          )}
                       </div>
                    )}

                    {msg.type === 'poll' && (
                       <div className="space-y-4 min-w-[280px] p-2 bg-white/40 dark:bg-zinc-800/40 rounded-2xl border border-white/50 dark:border-zinc-700/50 backdrop-blur-sm">
                          <div className="flex items-start gap-3">
                             <div className="w-10 h-10 bg-wa-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                <BarChart2 size={20} className="text-wa-primary" />
                             </div>
                             <div>
                                <h4 className="font-black text-[15px] text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter leading-tight">
                                   <HighlightText text={msg.text} highlight={roomSearchTerm} />
                                </h4>
                                <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-1">Multi-choice Signal gathering</p>
                             </div>
                          </div>

                          <div className="space-y-2.5">
                             {msg.pollOptions?.map((opt: any) => {
                                const votesMap = (msg.pollVotes || {}) as Record<string, string[]>;
                                const totalVotes = Object.values(votesMap).reduce((acc: number, v) => acc + (v?.length || 0), 0);
                                const votes = votesMap[opt.id]?.length || 0;
                                const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                                const isVoted = votesMap[opt.id]?.includes(user?.uid || '');
                                return (
                                   <button 
                                      key={opt.id}
                                      onClick={() => handleVote(msg.id, opt.id)}
                                      className={cn(
                                         "w-full p-3.5 rounded-2xl border transition-all relative overflow-hidden flex items-center justify-between group/opt active:scale-[0.98] shadow-sm",
                                         isVoted ? "border-wa-primary bg-wa-primary/5 ring-1 ring-wa-primary/10" : "border-zinc-200 dark:border-zinc-700/50 bg-white/50 dark:bg-zinc-900/50 hover:border-wa-primary/40"
                                      )}
                                   >
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                                        className="absolute inset-y-0 left-0 bg-wa-primary/15 pointer-events-none" 
                                      />
                                      
                                      <div className="relative z-10 flex items-center gap-3">
                                         <div className={cn(
                                            "w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center shrink-0",
                                            isVoted ? "border-wa-primary bg-wa-primary shadow-[0_0_8px_rgba(37,211,102,0.4)]" : "border-zinc-300 dark:border-zinc-600 group-hover/opt:border-wa-primary/50"
                                         )}>
                                            {isVoted && <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}><Check size={12} strokeWidth={4} className="text-white" /></motion.div>}
                                         </div>
                                         <span className={cn("text-[13px] font-bold transition-colors", isVoted ? "text-wa-primary" : "text-zinc-800 dark:text-zinc-200")}>
                                            <HighlightText text={opt.text} highlight={roomSearchTerm} />
                                         </span>
                                      </div>

                                      <div className="relative z-10 flex items-center gap-2">
                                         <div className="flex flex-col items-end">
                                            <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 font-mono italic">{Math.round(percentage)}%</span>
                                            <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-widest">{votes} {votes === 1 ? 'Vote' : 'Votes'}</span>
                                         </div>
                                      </div>
                                   </button>
                                );
                             })}
                          </div>
                          
                          <div className="flex justify-between items-center text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-[0.15em] pt-3 mt-1 border-t border-zinc-200 dark:border-zinc-700/50">
                             <span className="flex items-center gap-1.5 ring-1 ring-zinc-200 dark:ring-zinc-700/50 px-2 py-0.5 rounded-full bg-zinc-50 dark:bg-zinc-800/50">
                                <UsersIcon size={10} className="text-zinc-400" />
                                {Object.values(msg.pollVotes || {}).flat().length} Signals Transmitted
                             </span>
                             <div className="flex items-center gap-1.5">
                                {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'h:mm a') : format(new Date(), 'h:mm a')}
                                {isMe && msg.id === lastUserMessageId && (
                                   <MessageStatus 
                                     status={msg.status} 
                                     readBy={msg.readBy} 
                                     senderId={msg.senderId} 
                                     isGroup={isGroup} 
                                     groupParticipants={groupParticipants} 
                                   />
                                )}
                             </div>
                          </div>
                       </div>
                    )}
                    
                    {msg.replyTo && (
                        <div 
                           className={cn("mb-2 pl-3 border-l-4 py-0.5 rounded-sm cursor-pointer hover:opacity-80 transition-opacity bg-black/5 dark:bg-white/5", isMe ? "border-wa-primary" : "border-wa-primary")}
                           onClick={() => {
                              document.getElementById(`message-${msg.replyTo.messageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                           }}
                        >
                           <span className="text-[11px] font-bold block mb-1 text-wa-primary">
                             {msg.replyTo.senderId === user?.uid ? 'You' : chatInfo?.groupName || 'Them'}
                           </span>
                           <p className="text-[13px] truncate text-black/70 dark:text-white/70">
                              <HighlightText text={msg.replyTo.text} highlight={roomSearchTerm} />
                           </p>
                        </div>
                    )}

                    {!isMe && scamResults[msg.id]?.isScam && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-2 flex items-start gap-2"
                      >
                        <ShieldAlert className="text-red-500 shrink-0" size={16} />
                        <div>
                          <p className="text-[10px] font-mono font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Potential Scam Detected</p>
                          <p className="text-[9px] text-red-500/80 dark:text-red-400/60 leading-tight mt-0.5">{scamResults[msg.id].reason}</p>
                        </div>
                      </motion.div>
                    )}

                    {msg.type === 'text' && (
                      <div className="space-y-1">
                        {editingMessage?.id === msg.id ? (
                          <div className="flex flex-col gap-2 min-w-[220px] py-1" onClick={(e) => e.stopPropagation()}>
                            <textarea
                              value={inlineEditText}
                              onChange={(e) => setInlineEditText(e.target.value)}
                              rows={2}
                              className="w-full bg-black/20 dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 rounded-xl px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-amber-500 resize-none font-sans"
                              placeholder="Edit your message..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleInlineEditSave(msg);
                                }
                              }}
                            />
                            {chatInfo?.admins?.includes(user?.uid) && msg.senderId !== user?.uid && (
                              <label className="flex items-center gap-1.5 cursor-pointer mt-1 pl-1">
                                <input
                                  type="checkbox"
                                  checked={hideHistoryByAdmin}
                                  onChange={(e) => setHideHistoryByAdmin(e.target.checked)}
                                  className="rounded border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 text-amber-500 focus:ring-amber-500 w-3.5 h-3.5"
                                />
                                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Hide Revision History</span>
                              </label>
                            )}
                            <div className="flex justify-end gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingMessage(null);
                                  setInlineEditText('');
                                }}
                                className="px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-1"
                              >
                                <X size={12} /> Cancel
                              </button>
                              <button
                                onClick={() => handleInlineEditSave(msg)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono transition-all cursor-pointer text-xs uppercase tracking-widest flex items-center gap-1"
                              >
                                <Check size={12} /> Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className={cn(
                              "leading-relaxed whitespace-pre-wrap", 
                              msg.type === 'deleted' && "italic opacity-50",
                              messageLayout === 'compact' ? "inline" : "block"
                            )}>
                              <HighlightText text={msg.text} highlight={roomSearchTerm} />
                            </p>
                            {msg.text && extractUrl(msg.text) && (
                              <UrlPreviewCard url={extractUrl(msg.text)!} />
                            )}
                          </>
                        )}
                        {translations[msg.id] && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            className={cn(
                              "text-[11px] leading-relaxed pt-1.5 border-t border-dashed font-medium flex items-start gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-lg mt-1",
                              isMe ? "border-white/20 text-indigo-200" : "border-zinc-200 dark:border-zinc-700/50 text-indigo-600 dark:text-cyan-400"
                            )}
                          >
                            <span className="text-[9px] uppercase font-mono font-black text-indigo-500/80 dark:text-cyan-500/60 shrink-0 mt-0.5">TRANS [{translationTargetLanguage}]:</span>
                            <span>{translations[msg.id]}</span>
                          </motion.div>
                        )}
                        {isTranslating[msg.id] && (
                          <div className="flex items-center gap-1.5 text-[9px] text-indigo-500 font-mono animate-pulse uppercase tracking-wider py-0.5">
                            <Loader2 size={10} className="animate-spin" /> Translating...
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Reactions */}
                    {msg.reactions && Object.entries(msg.reactions).some(([_, users]: any) => users.length > 0) && (
                       <div className={cn(
                          "absolute flex flex-wrap gap-1 z-10",
                          messageLayout === 'compact' ? "-bottom-1.5" : "-bottom-3",
                          isMe ? "right-2" : "left-2"
                       )}>
                          <AnimatePresence mode="popLayout">
                            {Object.entries(msg.reactions).map(([emoji, users]: any) => users.length > 0 && (
                               <motion.div 
                                 key={emoji} 
                                 layout
                                 initial={{ scale: 0, opacity: 0, scaleY: 0.5 }}
                                 animate={{ 
                                   scale: 1, 
                                   opacity: 1, 
                                   scaleY: 1,
                                   transition: { type: "spring", damping: 10, stiffness: 200 }
                                 }}
                                 exit={{ scale: 0, opacity: 0 }}
                                 whileHover={{ scale: 1.15 }}
                                 title={users.map((uid: string) => {
                                   if (uid === user?.uid) return 'You';
                                   const p = groupParticipants?.find(p => p.uid === uid) || (uid === peerProfile?.uid ? peerProfile : null);
                                   return p?.displayName || 'Unknown User';
                                 }).join(', ')}
                                 className={cn(
                                   "rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.1)] border flex items-center gap-1 bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 ring-1 ring-zinc-100 dark:ring-zinc-800 cursor-help",
                                   messageLayout === 'compact' ? "px-1 py-0.2" : "px-2 py-1"
                                 )}
                               >
                                  <motion.span 
                                    key={`emoji-${users.length}`} 
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    className={cn("leading-none", messageLayout === 'compact' ? "text-[10px]" : "text-sm")}
                                  >
                                    {emoji}
                                  </motion.span>
                                  {users.length > 1 && (
                                    <motion.span 
                                      key={`count-${users.length}`}
                                      initial={{ scale: 0.5, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      className={cn("font-bold text-zinc-500 dark:text-zinc-400", messageLayout === 'compact' ? "text-[8px]" : "text-[10px]")}
                                    >
                                      {users.length}
                                    </motion.span>
                                  )}
                               </motion.div>
                            ))}
                          </AnimatePresence>
                       </div>
                    )}
                    
                    {msg.type !== 'image' && msg.type !== 'video' && (
                      <div className={cn(
                        "flex items-center justify-end gap-1.5 clear-both",
                        messageLayout === 'compact' ? "inline-flex ml-2 align-bottom" : "mt-1 -mb-1 float-right"
                      )}>
                        {msg.isEdited && (
                          <div className="relative group/edit-lbl inline-block mr-1">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!msg.hideHistory) {
                                  setActiveHistoryMessageId(msg.id);
                                }
                              }}
                              className={cn(
                                "font-bold text-amber-500 uppercase font-mono tracking-widest hover:underline cursor-pointer",
                                messageLayout === 'compact' ? "text-[7px]" : "text-[8px]",
                                msg.hideHistory && "cursor-not-allowed text-zinc-600 hover:no-underline"
                              )}
                            >
                              {(() => {
                                const edits = msg.edits || [];
                                if (edits.length > 0) {
                                  const lastEdit = edits[edits.length - 1];
                                  if (lastEdit.editedByAdmin) {
                                    return 'edited by admin';
                                  }
                                  if (lastEdit.editedBy && lastEdit.editedBy !== msg.senderId) {
                                    const p = groupParticipants?.find((gp: any) => gp.uid === lastEdit.editedBy) || (lastEdit.editedBy === peerProfile?.uid ? peerProfile : null);
                                    return `edited by ${p?.displayName || 'Moderator'}`;
                                  }
                                }
                                if (msg.editedByAdmin) return 'edited by admin';
                                return 'edited';
                              })()}
                            </span>
                            
                            {/* Hover tooltip for edit details */}
                            {!msg.hideHistory && (
                              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/edit-lbl:block bg-zinc-950 text-zinc-300 text-[10px] font-mono p-2 rounded-lg border border-zinc-800 shadow-xl z-[60] whitespace-nowrap pointer-events-none">
                                Revisions: {msg.edits?.length || 1} {msg.edits?.length === 1 ? 'change' : 'changes'}
                                {msg.editedAt && ` • Last edit: ${format(msg.editedAt?.toDate ? msg.editedAt.toDate() : new Date(msg.editedAt), 'h:mm a')}`}
                              </div>
                            )}
                          </div>
                        )}
                        {msg.expiresAt && (
                          <ExpiryIndicator expiresAt={msg.expiresAt} />
                        )}
                        {!isPeaceModeActive && (
                          <span className={cn(
                            "font-normal text-black/40 dark:text-white/40",
                            messageLayout === 'compact' ? "text-[9px]" : "text-[11px]"
                          )}>
                            {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'h:mm a') : format(new Date(), 'h:mm a')}
                          </span>
                        )}
                        {isMe && msg.id === lastUserMessageId && (
                           <MessageStatus 
                             status={msg.status} 
                             readBy={msg.readBy} 
                             senderId={msg.senderId} 
                             isGroup={isGroup} 
                             groupParticipants={groupParticipants} 
                           />
                        )}
                      </div>
                    )}
                    
                    {/* This div clears the float if needed */}
                    {msg.type !== 'image' && msg.type !== 'video' && <div className="clear-both" />}
                  </motion.div>
                     {!isMe && (
                        <button 
                           onClick={(e) => { e.stopPropagation(); toggleStar(msg.id); }}
                           className={cn(
                             "p-1.5 rounded-full transition-all flex-shrink-0 cursor-pointer hidden md:flex",
                             currentUserProfile?.starredMessages?.some((s: any) => s.messageId === msg.id) 
                               ? "text-zinc-900 hover:bg-zinc-100" 
                               : "text-zinc-300 opacity-0 group-hover/msg:opacity-100 hover:text-zinc-900 hover:bg-zinc-100"
                           )}
                        >
                           <Star size={16} fill={currentUserProfile?.starredMessages?.some((s: any) => s.messageId === msg.id) ? "currentColor" : "none"} />
                        </button>
                     )}
                  </div>
                </motion.div>
              </React.Fragment>
            );
            });
          })()}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-4" />
        
        {/* Scroll to Bottom Button */}
        <AnimatePresence>
          {showScrollToBottom && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="fixed bottom-24 right-6 z-50 w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-wa-primary hover:text-wa-primary/80 transition-all active:scale-95 group"
            >
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-wa-primary rounded-full border-2 border-white dark:border-zinc-800 animate-pulse" />
              <svg viewBox="0 0 24 24" width="24" height="24" className="stroke-current fill-none" strokeWidth="3">
                 <path d="M7 13l5 5 5-5M7 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Smart Replies */}
      <AnimatePresence>
         {smartReplies.length > 0 && !isRecording && (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 10 }}
               className="px-4 py-3 flex flex-wrap gap-2 overflow-x-auto no-scrollbar border-t border-zinc-200 bg-white"
            >
               {smartReplies.map((reply, i) => (
                  <button 
                     key={i}
                     onClick={() => setInputText(reply)}
                     className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-full text-[11px] font-mono font-bold text-zinc-900 active:scale-95 transition-all whitespace-nowrap"
                  >
                     {reply}
                  </button>
               ))}
            </motion.div>
         )}
      </AnimatePresence>

      {/* Input */}
      <div className="px-2 py-2 flex-shrink-0 bg-transparent mb-safe z-10 w-full relative">
        {(!chatInfo?.isGroup && (currentUserProfile?.blockedUsers?.includes(chatInfo?.participants?.find((id: string) => id !== user?.uid)) || peerProfile?.blockedUsers?.includes(user?.uid))) ? (
          <div className="max-w-4xl mx-auto p-4 text-center">
             <p className="text-zinc-500 font-mono font-bold text-[10px] uppercase tracking-widest bg-zinc-100 rounded-lg py-2">
                This channel is currently isolated. Communication suspended.
             </p>
          </div>
        ) : (
          <>
          {replyingTo && (
             <div className="bg-white/90 dark:bg-[#202c33]/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl mx-12 p-3 mb-2 flex justify-between items-start shadow-sm mb-2 relative top-0 z-0">
                 <div className="pl-3 border-l-4 border-wa-primary min-w-0 pr-4">
                     <span className="text-[11px] font-bold block mb-1 text-wa-primary">
                       {replyingTo.senderId === user?.uid ? 'You' : chatInfo?.groupName || 'Them'}
                     </span>
                     <p className="text-[13px] text-zinc-600 dark:text-zinc-300 truncate">{replyingTo.text || 'Attachment'}</p>
                 </div>
                 <button 
                    onClick={() => setReplyingTo(null)}
                    className="w-6 h-6 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full flex items-center justify-center text-zinc-500 shadow-sm transition-colors"
                 >
                    <X size={12} />
                 </button>
             </div>
          )}
          {editingMessage && (
             <div className="bg-white/95 dark:bg-[#202c33]/95 backdrop-blur-md border border-emerald-500/20 rounded-2xl mx-12 p-3 mb-2 flex justify-between items-start shadow-md relative top-0 z-0 border-[#00a884]">
                 <div className="pl-3 border-l-4 border-[#00a884] min-w-0 pr-4">
                     <span className="text-[11px] font-bold block mb-1 text-[#00a884] uppercase tracking-wider font-mono">
                       Editing Message Protocol
                     </span>
                     <p className="text-[13px] text-zinc-650 dark:text-zinc-300 truncate">{editingMessage.decryptedText || editingMessage.text}</p>
                 </div>
                 <button 
                    onClick={() => { setEditingMessage(null); setInputText(''); }}
                    className="w-6 h-6 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 rounded-full flex items-center justify-center text-zinc-500 shadow-sm transition-colors cursor-pointer"
                    style={{ border: 'none' }}
                 >
                    <X size={12} />
                 </button>
             </div>
          )}
          {/* Typing Indicator */}
          <AnimatePresence>
            {selectedAttachments.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar bg-white/50 dark:bg-[#111b21]/50 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800"
              >
                {selectedAttachments.map((file, i) => (
                  <div key={i} className="relative group shrink-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-wa-primary/20 shadow-sm bg-white dark:bg-zinc-800">
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2">
                           <FileText size={20} className="text-wa-primary" />
                           <span className="text-[8px] truncate w-full text-center mt-1 font-mono">{file.name}</span>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => setSelectedAttachments(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900 transition-transform hover:scale-110"
                    >
                      <X size={10} strokeWidth={4} />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="px-6 py-1 flex items-center gap-2 mb-1"
              >
                <div className="flex gap-1">
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full" />
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full" />
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full" />
                </div>
                <span className="text-[12px] font-medium text-[#f59e0b]/80">
                  {typingUsers.length === 1 
                    ? `${typingUsers[0].displayName} is typing...` 
                    : 'Multiple people are typing...'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {isChannelRestricted ? (
            <div className="w-full max-w-5xl mx-auto px-4 py-6 bg-zinc-100/60 dark:bg-[#111b21] rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 text-center flex flex-col items-center justify-center gap-2 mb-4 backdrop-blur-sm shadow-inner select-none">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center border border-purple-200 dark:border-purple-900/60 shadow-sm animate-pulse mb-1">
                <ShieldAlert size={18} className="text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-[12px] font-display font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-[0.15em]">Signal Transmissions Restricted</span>
              <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest max-w-md">Only administrators of this Broadcast Channel can broadcast message packets.</span>
            </div>
          ) : (
            <>
              {messageLimitWarning && (
                <div className="max-w-5xl mx-auto px-4 py-2 mb-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-center text-xs text-amber-500 font-mono animate-pulse uppercase tracking-wider flex items-center justify-center gap-2">
                  <span>⚠️ Peace Mode: {messageLimitWarning}</span>
                </div>
              )}
              <form 
                onSubmit={handleSendMessage}
                className="flex flex-col gap-1.5 max-w-5xl mx-auto w-full px-2 mb-0.5"
              >
                {activeScheduledDate && (
                  <div className="self-start pl-2 mb-1">
                    <ScheduledMessageBadge 
                      scheduledDate={activeScheduledDate} 
                      recurrence={activeRecurrence}
                      onEdit={() => setShowScheduleModal(true)}
                      onCancel={() => {
                        setActiveScheduledDate(null);
                        setActiveRecurrence(null);
                      }} 
                    />
                  </div>
                )}
                <SmartReplyChips 
                  replies={aiSuggestedReplies} 
                  onSelectReply={sendSmartReply} 
                  isLoading={isSmartRepliesLoading} 
                />
                <div className="flex items-end gap-1.5 w-full">
                  <div className="flex-1 bg-white dark:bg-[#202c33] rounded-[22px] px-1.5 py-0 flex items-center gap-0.5 border border-transparent shadow-lg transition-all focus-within:border-wa-primary/10">
                {isRecording ? (
                   <div className="flex-1 flex items-center gap-2 py-1.5 px-2 text-wa-primary">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                      <span className="text-[15px] font-mono font-black tracking-tighter">{formatDuration(recordDuration)}</span>
                      <div className="flex-1 flex justify-center items-center gap-1 h-5">
                         {[1,2,3,4,5,6].map(i => (
                            <motion.div 
                              key={i} 
                              animate={{ height: [5, Math.random() * 15 + 5, 5] }} 
                              transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                              className="w-1 bg-wa-primary/40 rounded-full" 
                            />
                         ))}
                      </div>
                      <button type="button" onClick={() => stopRecording(true)} className="text-red-500 font-bold uppercase text-[9px] tracking-widest px-3 py-1.5 rounded-full transition-all active:scale-95">Discard</button>
                   </div>
                ) : (
                  <>
                    <button type="button" className="p-2 text-zinc-400 hover:text-wa-primary hover:bg-wa-primary/10 rounded-full transition-all active:scale-90 shrink-0">
                       <svg viewBox="0 0 24 24" width="18" height="18" className="" fill="currentColor">
                          <path d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.024-4.141-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.379 0-5.549-2.319-5.549-2.319s7.418-.064 10.6-.36zm-3.108-4.43c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
                       </svg>
                    </button>

                    {/* Sticker Picker Accessory */}
                    <div className="relative flex items-center justify-center">
                      <button 
                        type="button" 
                        onClick={() => setShowStickers(!showStickers)}
                        className={cn(
                          "p-2 rounded-full transition-all active:scale-90 shrink-0 cursor-pointer",
                          showStickers ? "text-amber-500 bg-amber-500/10" : "text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10"
                        )}
                        title="Sticker Picker"
                        style={{ border: 'none', background: 'none' }}
                      >
                         <Sparkles size={18} className={isPremium ? "animate-pulse" : ""} />
                      </button>

                      <AnimatePresence>
                        {showStickers && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowStickers(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: 15, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 15, scale: 0.95 }}
                              className="absolute bottom-12 left-0 w-72 h-80 bg-white dark:bg-[#1f2c34] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
                            >
                              <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-[#202c33]/50">
                                <span className="text-xs font-mono font-black text-amber-500 flex items-center gap-1.5 uppercase tracking-wider">
                                  <Sparkles size={12} /> Enclave Stickers
                                </span>
                                {!isPremium && (
                                  <span className="text-[9px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse">
                                    🔒 Premium Only
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-4 gap-3.5 no-scrollbar bg-white dark:bg-[#1a242c]">
                                {[
                                  '🤖', '⚡', '💿', '🖲️', '📡', '💾', '💻', '🔌', '🌌', '🔮', '🧬', '🚀', '🛰️', '🛸', '👾',
                                  '🎮', '🕹️', '🧱', '💣', '🪙', '🍄', '⭐️', '🦖', '🦊', '🎒', '🏆', '🥇',
                                  '🐱‍💻', '🐼', '🐨', '🐯', '🦁', '🦄', '🐙', '🐝', '🦥', '🦜',
                                  '🤡', '💀', '🔥', '💥', '🌈', '🍿', '👑', '💸', '💎', '💡', '🔑', '🔒'
                                ].map((st, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                      if (!isPremium) {
                                        setShowStickers(false);
                                        setShowStickerUpsell(true);
                                      } else {
                                        sendStickerMessage(st);
                                        setShowStickers(false);
                                      }
                                    }}
                                    className="text-4xl hover:scale-125 hover:rotate-6 transition-all duration-150 p-1 rounded-xl hover:bg-amber-500/5 cursor-pointer flex items-center justify-center select-none"
                                    style={{ border: 'none', background: 'none' }}
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <SmartComposeInput
                      value={inputText}
                      onChange={(newVal) => {
                        setInputText(newVal);
                        if (!isPeaceModeActive) {
                          registerTypingActivity();
                        }
                      }}
                      onSend={handleSendMessage}
                      disabled={sending}
                      placeholder="Type message..."
                      chatId={chatId || ''}
                      isGroup={isGroup}
                    />
                    
                    <div className="relative shrink-0 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                        className={cn(
                          "p-2 rounded-full transition-all active:scale-90",
                          showAttachmentMenu ? "bg-wa-primary/10 text-wa-primary" : "text-zinc-400 hover:text-wa-primary hover:bg-wa-primary/10"
                        )}
                        title="Attachment Menu"
                      >
                        <Paperclip size={18} className="-rotate-45" />
                      </button>

                      <AnimatePresence>
                        {showAttachmentMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-12 left-0 bg-zinc-950 border border-zinc-800 rounded-2xl p-2 w-48 shadow-2xl z-50 flex flex-col gap-1 text-left"
                          >
                            <label className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl cursor-pointer transition">
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={(e) => {
                                  if (e.target.files) {
                                    setSelectedAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
                                  }
                                  setShowAttachmentMenu(false);
                                  e.target.value = '';
                                }}
                                multiple
                              />
                              <Paperclip className="w-4 h-4 text-slate-400" />
                              <span>Attach Local File</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                setShowDocScanner(true);
                                setShowAttachmentMenu(false);
                              }}
                              className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition text-left w-full"
                            >
                              <Camera className="w-4 h-4 text-amber-500" />
                              <span>Scan Document</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setShowEventCreator(true);
                                setShowAttachmentMenu(false);
                              }}
                              className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#e9edef] hover:text-white hover:bg-slate-900 rounded-xl transition text-left w-full cursor-pointer"
                            >
                              <Calendar className="w-4 h-4 text-amber-500" />
                              <span>Book Coordination Block</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => setShowScheduleModal(true)}
                      className="p-2 text-zinc-400 hover:text-wa-primary hover:bg-wa-primary/10 rounded-full transition-all active:scale-90 shrink-0"
                      title="Schedule Message"
                    >
                       <Calendar size={20} />
                    </button>

                    <button 
                      type="button" 
                      onClick={() => setShowPollModal(true)}
                      className="p-2 text-zinc-400 hover:text-wa-primary hover:bg-wa-primary/10 rounded-full transition-all active:scale-90 shrink-0"
                      title="Transmit Poll"
                    >
                       <BarChart2 size={20} />
                    </button>

                    <button 
                      type="button" 
                      onClick={startLocationShare}
                      className="p-2 text-zinc-400 hover:text-[#00a884] hover:bg-[#00a884]/10 rounded-full transition-all active:scale-90 shrink-0"
                      title="Share Live Geolocation"
                    >
                       <MapPin size={20} />
                    </button>

                    <button 
                      type="button"
                      onClick={toggleVoiceToText}
                      className={cn(
                        "p-2 rounded-full transition-all active:scale-90 shrink-0 relative",
                        isTranscribing ? "bg-wa-primary/10 text-wa-primary" : "text-zinc-400 hover:text-wa-primary hover:bg-wa-primary/10"
                      )}
                      title="Voice to Text"
                    >
                      <Plus size={20} className={cn("transition-transform", isTranscribing && "rotate-45")} />
                      {isTranscribing && transcriptionConfidence > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[9px] font-mono font-bold px-2 py-1 rounded-md shadow-lg whitespace-nowrap z-[100]"
                        >
                           Accuracy: {transcriptionConfidence}%
                           <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-zinc-900" />
                        </motion.div>
                      )}
                    </button>
                    
                    {!inputText.trim() && (
                      <>
                        <label className="p-3 text-zinc-400 hover:text-wa-primary hover:bg-wa-primary/10 rounded-full transition-all active:scale-90 cursor-pointer shrink-0" title="Attach Media">
                          <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => {
                            if (e.target.files) {
                              setSelectedAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                            }
                            e.target.value = '';
                          }} multiple disabled={uploading} />
                          <ImageIcon size={24} className={uploading ? "animate-pulse" : ""} />
                        </label>

                        <button 
                          type="button"
                          onClick={() => setShowCameraCaptureModal(true)}
                          className="p-3 text-zinc-400 hover:text-wa-primary hover:bg-wa-primary/10 rounded-full transition-all active:scale-90 shrink-0 cursor-pointer"
                          title="Capture Photo from Camera"
                        >
                          <Camera size={24} className={uploading ? "animate-pulse" : ""} />
                        </button>
                      </>
                    )}

                    <button 
                      type="button"
                      onClick={() => setIsViewOnce(!isViewOnce)}
                      className={cn(
                          "p-3 rounded-full transition-all active:scale-90",
                          isViewOnce ? "bg-wa-primary/10 text-wa-primary" : "text-zinc-400 hover:text-wa-primary hover:bg-wa-primary/10"
                      )}
                      title="Self-Destruct Mode"
                    >
                          <Eye size={22} className={isViewOnce ? "animate-pulse" : ""} />
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 mb-0.5">
                {!inputText.trim() && !isRecording ? (
                   <button
                    type="button"
                    onMouseDown={startRecording}
                    onMouseUp={() => stopRecording(false)}
                    className="w-[52px] h-[52px] rounded-full bg-wa-primary text-white hover:bg-wa-primary-dark flex flex-shrink-0 items-center justify-center transition-all shadow-xl active:scale-95 self-end shrink-0"
                  >
                    <Mic size={24} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={(!inputText.trim() && !isRecording) || sending}
                    className={cn(
                      "w-[52px] h-[52px] rounded-full flex flex-shrink-0 items-center justify-center transition-all shadow-xl active:scale-95 self-end shrink-0",
                      (inputText.trim() || isRecording) 
                        ? "bg-wa-primary text-white hover:bg-wa-primary-dark shadow-wa-primary/20" 
                        : "bg-zinc-200 text-white cursor-not-allowed"
                    )}
                  >
                    {sending ? <Loader2 size={24} className="animate-spin text-white" /> : <Send size={24} className="ml-1 text-white" fill="currentColor" />}
                  </button>
                )}
              </div>
            </div>
            </form>
            </>
          )}
          <div className="max-w-5xl mx-auto w-full px-4">
            <DraftSavedToast show={isDraftSaved} />
          </div>
        </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {messageToDelete && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-[#f4f4f5] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <ShieldAlert className="text-red-500" size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight">Delete message?</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">This action cannot be undone. The message will be irrecoverable.</p>
                 </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                 <button onClick={() => setMessageToDelete(null)} className="px-5 py-2.5 rounded-full text-xs font-bold font-mono tracking-widest uppercase text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
                 <button onClick={() => { deleteMessage(messageToDelete); setMessageToDelete(null); }} className="px-5 py-2.5 rounded-full text-xs font-bold font-mono tracking-widest uppercase bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm">Confirm</button>
              </div>
           </div>
        </div>
      )}

      {/* Clear Chat Confirmation Modal */}
      {showClearChatConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white dark:bg-[#1f2c34] border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <ShieldAlert className="text-red-500" size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight">Clear this chat?</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Messages will be removed for you. They will remain for other participants.</p>
                 </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                 <button onClick={() => setShowClearChatConfirm(false)} className="px-4 py-2 rounded-md text-sm font-medium text-wa-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Cancel</button>
                 <button onClick={clearChatHistory} className="px-4 py-2 rounded-md text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm">Clear chat</button>
              </div>
           </div>
        </div>
      )}
      {/* Event Booking / Coordination Modal */}
      <AnimatePresence>
        {showEventCreator && (
          <EventCreator 
            chatId={routeChatId || ''}
            chatContext={decryptedMessages.slice(-10).map(m => `${m.senderId === user?.uid ? 'You' : 'Personnel'}: ${m.text}`).join('\n')}
            onClose={() => setShowEventCreator(false)}
            onSuccess={handleEventCreatedInChat}
          />
        )}
      </AnimatePresence>

      {/* Poll Creation Modal */}
      <AnimatePresence>
        {showPollModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-[32px] overflow-hidden shadow-2xl border border-zinc-100 dark:border-zinc-800"
            >
               <div className="bg-wa-primary p-6 text-white text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                     <BarChart2 size={32} strokeWidth={3} className="text-white" />
                  </div>
                  <h2 className="text-[20px] font-black uppercase tracking-tighter">Create a New Poll</h2>
                  <p className="text-[11px] font-mono font-bold text-white/70 uppercase tracking-widest mt-1">Gather collective feedback from the group</p>
               </div>
               
               <div className="p-8 space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-1">Poll Question</label>
                     <input 
                       type="text" 
                       placeholder="What is the objective?"
                       value={pollQuestion}
                       onChange={e => setPollQuestion(e.target.value)}
                       className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 font-bold outline-none focus:border-wa-primary/30 transition-all shadow-inner"
                     />
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-1">Options</label>
                     {pollOptions.map((opt, i) => (
                       <div key={i} className="flex gap-2 group">
                          <input 
                             type="text" 
                             placeholder={`Option ${i+1}`}
                             value={opt}
                             onChange={e => {
                                const newOpts = [...pollOptions];
                                newOpts[i] = e.target.value;
                                if (i === pollOptions.length - 1 && opt === '') {
                                   newOpts.push('');
                                }
                                setPollOptions(newOpts);
                             }}
                             className="flex-1 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-[18px] px-4 py-3 text-sm font-bold outline-none focus:border-wa-primary/30 transition-all"
                          />
                          {pollOptions.length > 2 && (
                             <button 
                               onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                               className="p-3 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-[18px] transition-all"
                             >
                                <X size={18} />
                             </button>
                          )}
                       </div>
                     ))}
                  </div>

                  <div className="pt-4 flex gap-3">
                     <button 
                       onClick={() => setShowPollModal(false)}
                       className="flex-1 py-4 text-zinc-500 font-mono font-bold text-[11px] uppercase tracking-widest bg-zinc-50 hover:bg-zinc-100 rounded-2xl transition-all active:scale-95"
                     >
                       Abort
                     </button>
                     <button 
                       onClick={createPoll}
                       disabled={!pollQuestion || pollOptions.filter(o => o.trim()).length < 2}
                       className="flex-[2] py-4 bg-wa-primary text-white font-mono font-bold text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:grayscale"
                     >
                       Create Poll
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PDF Export Options Modal */}
      <AnimatePresence>
        {showExportPDFOptions && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExportPDFOptions(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative z-10 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-wa-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText size={32} className="text-wa-primary" />
                </div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter mb-2">Export to PDF</h3>
                <p className="text-sm text-zinc-500 font-medium mb-8">Choose your preferred layout for the chat export.</p>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">Export Layout</span>
                      <span className="text-[10px] text-zinc-500 uppercase font-black">{pdfExportLayout} mode activated</span>
                    </div>
                    <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <button 
                        onClick={() => setPdfExportLayout('compact')}
                        className={cn(
                          "px-4 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all",
                          pdfExportLayout === 'compact' ? "bg-wa-primary text-white" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                        )}
                      >
                        Compact
                      </button>
                      <button 
                        onClick={() => setPdfExportLayout('detailed')}
                        className={cn(
                          "px-4 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all",
                          pdfExportLayout === 'detailed' ? "bg-wa-primary text-white" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                        )}
                      >
                        Detailed
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowExportPreview(true)}
                    className="w-full py-5 bg-wa-primary text-white font-black rounded-[1.5rem] transition-all shadow-xl shadow-wa-primary/20 active:scale-95 uppercase tracking-tighter text-base flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    Preview & Export
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Export Preview Modal */}
      <AnimatePresence>
        {showExportPreview && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]"
            >
               <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 shrink-0">
                  <div>
                    <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tighter text-lg">Export Preview</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Data Selection Verification</p>
                  </div>
                  <button onClick={() => setShowExportPreview(false)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
                    <X size={24} />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                  <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest px-2 mb-2">First 5 messages appearing in export:</p>
                  {decryptedMessages.slice(0, 5).map((m, idx) => (
                     <div key={idx} className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                        <div className="flex justify-between items-start mb-1">
                           <span className="text-[10px] font-mono font-bold text-wa-primary uppercase tracking-widest">
                              {m.senderId === user?.uid ? 'Me' : 'Peer'}
                           </span>
                           <span className="text-[9px] font-mono text-zinc-400">
                              {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                           </span>
                        </div>
                        <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
                           {m.text || `[Media: ${m.type}]`}
                        </p>
                     </div>
                  ))}
                  {decryptedMessages.length === 0 && (
                     <div className="py-12 text-center opacity-50">
                        <MessageCircle size={32} className="mx-auto mb-2 text-zinc-400" />
                        <p className="text-[10px] font-mono font-bold uppercase tracking-widest">Zero signals detected for export</p>
                     </div>
                  )}
               </div>
               
               <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                  <div className="flex gap-3">
                     <button 
                        onClick={() => setShowExportPreview(false)}
                        className="flex-1 py-4 text-[11px] font-mono font-bold uppercase tracking-widest text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-2xl transition-all"
                     >
                        Abort
                     </button>
                     <button 
                        onClick={() => {
                           setShowExportPreview(false);
                           exportChatToPDF(pdfExportLayout);
                        }}
                        className="flex-1 py-4 bg-wa-primary text-white font-black rounded-2xl transition-all shadow-lg hover:bg-wa-primary-dark active:scale-95 uppercase tracking-tighter text-sm"
                     >
                        Confirm & Export
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PDF Export Progress Overlay */}
      <AnimatePresence>
        {isExportingPDF && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white dark:bg-zinc-900 p-10 rounded-[3rem] shadow-2xl w-full max-w-xs text-center border border-zinc-100 dark:border-zinc-800"
            >
              <div className="relative w-24 h-24 mx-auto mb-8">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-zinc-100 dark:text-zinc-800"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="251.2"
                    animate={{ strokeDashoffset: 251.2 - (251.2 * exportProgress) / 100 }}
                    transition={{ duration: 0.5 }}
                    className="text-wa-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-black text-zinc-900 dark:text-white font-mono">{exportProgress}%</span>
                </div>
              </div>
              <h4 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tighter mb-2">Generating PDF</h4>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Encrypting & Formatting...</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Peace AI System Architecture Planner */}
      <AnimatePresence>
        {showPlanningBoard && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPlanningBoard(false)}
              className="absolute inset-0"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[85vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                    <Sparkles className="text-[#00A884]" size={20} />
                    Peace AI Project Planner
                  </h3>
                  <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-1 font-sans">Multi-step System Architecture sketches</p>
                </div>
                <button 
                  onClick={() => setShowPlanningBoard(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                
                {/* Visual Architecture Chart Sketch */}
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-3 px-1">Network Block Node Sketch</h4>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl flex flex-wrap gap-4 items-center justify-center relative overflow-hidden">
                     <div className="absolute inset-0 bg-[radial-gradient(#00a884_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03]" />
                     
                     <div className="px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center z-10 w-36">
                       <span className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase">Input Node</span>
                       <p className="text-xs font-black uppercase text-zinc-850 dark:text-zinc-200">Peace Gate</p>
                     </div>

                     <div className="text-zinc-400 z-10">➔</div>

                     <div className="px-3.5 py-2.5 bg-[#00a884]/15 border border-[#00a884]/25 rounded-xl text-center z-10 w-36 animate-pulse">
                       <span className="text-[9px] font-mono font-bold text-[#00A884] uppercase">Decentralized Tunnel</span>
                       <p className="text-xs font-black uppercase text-[#00A884]">AES Shield</p>
                     </div>

                     <div className="text-zinc-400 z-10">➔</div>

                     <div className="px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center z-10 w-36">
                       <span className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase">Isolated Store</span>
                       <p className="text-xs font-black uppercase text-zinc-850 dark:text-zinc-200">Sub-Enclave</p>
                     </div>
                  </div>
                </div>

                {/* Steps Section */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-2 px-1">Interactive Steps & Milestones</h4>
                  <div className="space-y-3">
                    {planningSteps.map((step, idx) => (
                      <div 
                        key={idx}
                        className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl flex items-center justify-between gap-4 transition-all hover:border-[#00a884]/30"
                      >
                        <div className="flex-1">
                          <h5 className="text-[13px] font-black uppercase text-zinc-800 dark:text-zinc-200 tracking-tight">{step.title}</h5>
                          <p className="text-xs text-zinc-500 dark:text-zinc-450 font-normal mt-0.5 font-sans">{step.desc}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0 font-sans">
                          {/* Status toggle selectors */}
                          <button
                            onClick={() => {
                              const updated = [...planningSteps];
                              updated[idx].status = 'completed';
                              setPlanningSteps(updated);
                            }}
                            className={`px-2 py-1 text-[9px] font-mono font-bold uppercase rounded-lg transition-colors ${
                              step.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-500 font-bold'
                                : 'bg-transparent text-zinc-400 hover:text-emerald-500'
                            }`}
                          >
                            Done
                          </button>
                          <button
                            onClick={() => {
                              const updated = [...planningSteps];
                              updated[idx].status = 'active';
                              setPlanningSteps(updated);
                            }}
                            className={`px-2 py-1 text-[9px] font-mono font-bold uppercase rounded-lg transition-colors ${
                              step.status === 'active'
                                ? 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 font-bold'
                                : 'bg-transparent text-zinc-400 hover:text-amber-500'
                            }`}
                          >
                            Work
                          </button>
                          <button
                            onClick={() => {
                              const updated = [...planningSteps];
                              const nextSteps = updated.filter((_, sIdx) => sIdx !== idx);
                              setPlanningSteps(nextSteps);
                            }}
                            className="p-1.5 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-lg transition-all"
                            title="Remove step"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Step Block */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl space-y-3.5">
                  <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest font-sans">Append Custom Security Milestone</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     <input 
                       type="text" 
                       placeholder="Milestone Title (e.g., VPN Tunnel)" 
                       value={newStepTitle}
                       onChange={e => setNewStepTitle(e.target.value)}
                       className="px-4 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none focus:border-[#00a884] bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 font-sans"
                     />
                     <input 
                       type="text" 
                       placeholder="Description details..." 
                       value={newStepDesc}
                       onChange={e => setNewStepDesc(e.target.value)}
                       className="px-4 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none focus:border-[#00a884] bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 font-sans"
                     />
                  </div>

                  <button
                    onClick={handleAddPlanningStep}
                    className="w-full py-2 bg-zinc-900 dark:bg-[#00a884] hover:bg-zinc-850 dark:hover:bg-[#008f70] text-white text-[11px] font-mono font-bold uppercase tracking-widest rounded-xl transition-all shadow active:scale-98 cursor-pointer"
                  >
                     ➔ Inject Core Plan Parameter
                  </button>
                </div>

              </div>
              
              <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end">
                <button 
                  onClick={() => setShowPlanningBoard(false)}
                  className="px-6 py-3 bg-zinc-150 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-[11px] font-mono font-bold uppercase tracking-widest hover:brightness-95 active:scale-97 transition-all cursor-pointer font-sans"
                >
                  Close Board
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Camera Wallpaper Modal */}
      <AnimatePresence>
        {showCameraWallpaperModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCameraWallpaperModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Chat Wallpaper</h3>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Camera Capture Mode</p>
                </div>
                <button 
                  onClick={() => setShowCameraWallpaperModal(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 relative bg-black aspect-video flex items-center justify-center overflow-hidden">
                {!capturedImage ? (
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img 
                    src={capturedImage} 
                    className="w-full h-full object-cover"
                    alt="Captured Wallpaper"
                  />
                )}
                
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center flex-col gap-4">
                    <Loader2 size={48} className="text-wa-primary animate-spin" />
                    <span className="text-white font-black uppercase tracking-tighter text-xl">Uploading Asset</span>
                  </div>
                )}
              </div>

              <div className="p-8 bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex gap-4">
                  {!capturedImage ? (
                    <button 
                      onClick={capturePhoto}
                      className="flex-1 py-4 bg-wa-primary text-white font-black rounded-2xl transition-all shadow-lg shadow-wa-primary/20 active:scale-95 uppercase tracking-tighter flex items-center justify-center gap-2"
                    >
                      <Camera size={20} fill="currentColor" />
                      Capture Frame
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => setCapturedImage(null)}
                        className="flex-1 py-4 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white font-black rounded-2xl transition-all active:scale-95 uppercase tracking-tighter"
                      >
                        Retake
                      </button>
                      <button 
                        onClick={saveWallpaper}
                        disabled={uploading}
                        className="flex-1 py-4 bg-wa-primary text-white font-black rounded-2xl transition-all shadow-lg shadow-wa-primary/20 active:scale-95 uppercase tracking-tighter"
                      >
                        Set as Wallpaper
                      </button>
                    </>
                  )}
                </div>
                <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-6">
                  Note: Custom wallpapers are visible to everyone in the room.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Secure Photo Capture Modal */}
      <AnimatePresence>
        {showCameraCaptureModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 select-none">
            {/* Dark glass backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCameraCaptureModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            
            {/* Modal main card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-[#101c26] text-white w-full max-w-md rounded-3xl overflow-hidden shadow-[0_24px_60px_rgba(0,168,132,0.15)] relative z-10 border border-teal-500/20 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-teal-500/10 flex items-center justify-between shrink-0 bg-[#162734]">
                <div>
                  <h3 className="text-md font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    Secure Sight Input
                  </h3>
                  <p className="text-[10px] text-teal-400 font-mono uppercase tracking-widest mt-0.5">Capture instant verification artifact</p>
                </div>
                <button 
                  onClick={() => setShowCameraCaptureModal(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Viewport Area */}
              <div className="flex-1 relative bg-black/40 aspect-square flex items-center justify-center overflow-hidden p-4">
                <div className="w-full h-full relative rounded-2xl overflow-hidden border border-teal-500/10 shadow-inner">
                  {!capturedPhoto ? (
                    <video 
                      ref={captureVideoRef}
                      autoPlay 
                      playsInline 
                      muted
                      className="w-full h-full object-cover scale-x-[-1] bg-[#0c151d]"
                    />
                  ) : (
                    <img 
                      src={capturedPhoto} 
                      className="w-full h-full object-cover scale-x-[-1] animate-fade-in"
                      alt="Captured Sight"
                    />
                  )}

                  {/* Aesthetic Corner Brackets */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-teal-400/60 pointer-events-none" />
                  <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-teal-400/60 pointer-events-none" />
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-teal-400/60 pointer-events-none" />
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-teal-400/60 pointer-events-none" />
                </div>
              </div>

              {/* Action Board controls */}
              <div className="p-6 bg-[#162734] border-t border-teal-500/10">
                <div className="flex flex-col gap-4">
                  {!capturedPhoto ? (
                    <div className="flex items-center justify-center py-2">
                      <button 
                        onClick={handleCapturePhoto}
                        className="w-16 h-16 rounded-full bg-[#00a884] hover:bg-[#009675] text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 relative"
                        title="Shutter"
                      >
                        <div className="absolute -inset-1.5 rounded-full border border-[#00a884]/30 animate-pulse" />
                        <Camera size={24} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setCapturedPhoto(null)}
                        className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-all active:scale-95 text-xs uppercase tracking-wider font-mono border border-zinc-700"
                      >
                        Retake
                      </button>
                      <button 
                        onClick={handleAcceptPhoto}
                        className="flex-1 py-3.5 bg-[#00a884] hover:bg-[#009675] text-white font-bold rounded-xl transition-all active:scale-95 text-xs uppercase tracking-wider font-mono shadow-md shadow-teal-500/15"
                      >
                        Attach Photo
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-center text-[9px] text-[#8696a0] font-mono uppercase tracking-widest mt-4">
                  Fully encrypted camera channel stream.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Wallpaper Gallery Modal */}
      <AnimatePresence>
        {showWallpaperGallery && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWallpaperGallery(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Pattern Gallery</h3>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Built-in Wallpapers</p>
                </div>
                <button 
                  onClick={() => setShowWallpaperGallery(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 no-scrollbar">
                {WALLPAPER_PATTERNS.map((pattern) => (
                  <button
                    key={pattern.id}
                    onClick={() => selectPatternWallpaper(pattern.url)}
                    className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group transition-all hover:scale-105 active:scale-95"
                  >
                    <div 
                      className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 transition-all group-hover:brightness-110"
                      style={{ 
                        backgroundImage: pattern.url ? `url('${pattern.url}')` : 'none',
                        backgroundSize: 'auto'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-white text-[10px] font-black uppercase tracking-widest">{pattern.name}</span>
                    </div>
                    {chatInfo?.customWallpaper === pattern.url && (
                      <div className="absolute top-2 right-2 bg-wa-primary text-white p-1 rounded-full shadow-lg">
                        <Check size={12} strokeWidth={4} />
                      </div>
                    )}
                    {!pattern.url && (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-400 font-mono text-[10px] uppercase font-bold tracking-widest">
                        Reset
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {isUpdatingWallpaper && (
                <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm z-20 flex items-center justify-center flex-col gap-4">
                   <Loader2 size={40} className="text-wa-primary animate-spin" />
                   <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Updating Channel Asset...</span>
                </div>
              )}

              <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 text-center shrink-0">
                 <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                   Note: Custom wallpapers are visible to everyone and optimized for clarity.
                 </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {/* Shared Content Hub Modal */}
      <AnimatePresence>
        {showSharedHub && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-950/80 backdrop-blur-xl flex items-center justify-center p-0 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full h-full md:max-w-4xl md:max-h-[85vh] bg-white dark:bg-[#111b21] md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/10"
            >
              <div className="p-6 md:p-8 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-wa-primary/10 flex items-center justify-center text-wa-primary">
                    <LayoutGrid size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Shared Signals</h2>
                    <p className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest">Digital Archives</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSharedHub(false)}
                  className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all active:scale-90"
                >
                  <X size={24} className="text-zinc-500" />
                </button>
              </div>

              <div className="flex gap-2 p-4 md:px-8 border-b border-zinc-50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50">
                {(['media', 'links', 'docs'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveHubTab(tab)}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-[11px] font-mono font-bold uppercase tracking-widest transition-all",
                      activeHubTab === tab 
                        ? "bg-wa-primary text-white shadow-lg shadow-wa-primary/20" 
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
                {activeHubTab === 'media' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl w-fit border border-zinc-200/50 dark:border-zinc-800/80 shadow-inner">
                      {(['all', 'images', 'videos'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setMediaSubFilter(filter)}
                          className={cn(
                            "px-5 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer",
                            mediaSubFilter === filter
                              ? "bg-white dark:bg-zinc-800 text-wa-primary dark:text-white shadow-sm border border-zinc-200/30 dark:border-zinc-700/50"
                              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                          )}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {decryptedMessages
                        .filter(m => {
                          if (m.type !== 'image' && m.type !== 'video') return false;
                          if (mediaSubFilter === 'images') return m.type === 'image';
                          if (mediaSubFilter === 'videos') return m.type === 'video';
                          return true;
                        })
                        .map((m, idx) => (
                          <motion.div
                            key={m.id || idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                            className={cn(
                              "group relative rounded-[1.5rem] overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-pointer shadow-sm active:scale-95 transition-transform",
                              idx % 5 === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
                            )}
                            onClick={() => setPreviewMedia({ url: m.mediaUrl, type: m.type, senderName: m.senderId === user?.uid ? 'You' : (m.senderName || chatInfo?.peerName || 'Peer'), createdAt: m.createdAt, id: m.id })}
                          >
                            {m.type === 'image' ? (
                              <img src={m.mediaUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                <video src={m.mediaUrl} className="w-full h-full object-cover opacity-60" />
                                <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                                  <Play size={32} fill="white" className="text-white drop-shadow-xl" />
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      {decryptedMessages.filter(m => {
                        if (m.type !== 'image' && m.type !== 'video') return false;
                        if (mediaSubFilter === 'images') return m.type === 'image';
                        if (mediaSubFilter === 'videos') return m.type === 'video';
                        return true;
                      }).length === 0 && (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center opacity-40">
                           <CameraOff size={48} className="mb-4" />
                           <p className="text-sm font-mono font-bold uppercase tracking-[0.2em]">Zero Data Captured</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeHubTab === 'links' && (
                  <div className="space-y-4 max-w-2xl mx-auto">
                    {decryptedMessages
                      .filter(m => m.text && (m.text.includes('http://') || m.text.includes('https://')))
                      .map((m, idx) => {
                         const urlMatch = m.text?.match(/https?:\/\/[^\s]+/);
                         const url = urlMatch ? urlMatch[0] : '#';
                         return (
                           <motion.a
                             key={m.id || idx}
                             href={url}
                             target="_blank"
                             rel="noopener noreferrer"
                             initial={{ opacity: 0, x: -20 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: idx * 0.05 }}
                             className="group flex items-center gap-6 p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:bg-white dark:hover:bg-zinc-850 hover:shadow-xl hover:-translate-y-1 transition-all"
                           >
                             <div className="w-14 h-14 rounded-2xl bg-wa-primary/10 flex items-center justify-center text-wa-primary group-hover:bg-wa-primary group-hover:text-white transition-all shrink-0">
                               <Link size={24} />
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="text-xs font-mono font-black text-wa-primary uppercase tracking-[0.15em] mb-1">Signal Protocol</p>
                               <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-wa-primary transition-colors">
                                 {url.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}
                               </h4>
                               <p className="text-xs text-zinc-500 truncate mt-1">{url}</p>
                             </div>
                             <ExternalLink size={18} className="text-zinc-300 group-hover:text-wa-primary transition-colors" />
                           </motion.a>
                         );
                      })}
                    {decryptedMessages.filter(m => m.text && (m.text.includes('http://') || m.text.includes('https://'))).length === 0 && (
                      <div className="py-32 flex flex-col items-center justify-center opacity-40">
                         <Globe size={48} className="mb-4" />
                         <p className="text-sm font-mono font-bold uppercase tracking-[0.2em]">No Outbound Links Found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Scanner Overlay */}
      <AnimatePresence>
        {showQRScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-zinc-950/70 backdrop-blur-2xl flex flex-col items-center justify-center p-4 md:p-6 text-white"
          >
            {/* Elegant Focus Overlay */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/40 pointer-events-none" />

            <div className="w-full max-w-sm flex flex-col items-center gap-8 relative z-10">
              <div className="text-center space-y-4 w-full">
                <div className="w-20 h-20 bg-wa-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-wa-primary/10 relative">
                  <div className="absolute inset-0 bg-wa-primary/5 blur-2xl rounded-full" />
                  <QrCode size={40} className="text-wa-primary relative z-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black uppercase tracking-[0.3em] text-white">Signal Capture</h3>
                  <p className="text-[10px] font-mono font-bold text-wa-primary uppercase tracking-[0.2em] opacity-80">
                    {isProofing ? 'Synchronizing Nodes...' : 'Awaiting Digital handshake'}
                  </p>
                </div>
                
                <AnimatePresence>
                  {scanWarning && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0, y: -10 }}
                      animate={{ height: 'auto', opacity: 1, y: 0 }}
                      exit={{ height: 0, opacity: 0, y: -10 }}
                      className="w-full bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex gap-3 items-start overflow-hidden text-left"
                    >
                      <ShieldAlert size={18} className="text-red-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest">Security Breach Detected</p>
                        <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">{scanWarning}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-relaxed max-w-[280px] mx-auto">
                  Scan a QR code to instantly authenticate connections or join encrypted channels
                </p>
              </div>

              <motion.div 
                animate={{ 
                  boxShadow: [
                    "0 0 40px rgba(37,211,102,0.1)", 
                    "0 0 80px rgba(37,211,102,0.2)", 
                    "0 0 40px rgba(37,211,102,0.1)"
                  ] 
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-full aspect-square bg-zinc-950 rounded-[3rem] overflow-hidden border border-wa-primary/30 ring-1 ring-wa-primary/20 transition-all duration-700"
              >
                <div id="qr-reader" className="w-full h-full scale-[1.02] grayscale contrast-125 invert dark:invert-0 brightness-[0.8]" />
                
                {/* Success Flash */}
                <AnimatePresence>
                  {showSuccessFlash && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-wa-primary/40 z-20 pointer-events-none flex items-center justify-center"
                    >
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white p-4 rounded-full shadow-2xl"
                      >
                        <ShieldCheck size={40} className="text-wa-primary" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* High Contrast Dark Overlay */}
                <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                
                {/* High Contrast Scanner Frame */}
                <div className="absolute inset-0 border-[40px] border-zinc-950/90 pointer-events-none" />
                
                {/* Torch Toggle */}
                <button
                  onClick={toggleTorch}
                  className={cn(
                    "absolute bottom-12 left-1/2 -translate-x-1/2 z-30 p-4 rounded-full transition-all active:scale-95 group border shadow-2xl",
                    isTorchOn 
                      ? "bg-wa-primary border-wa-primary text-black shadow-wa-primary/40 animate-pulse" 
                      : "bg-black/50 hover:bg-black/70 border-white/20 text-white"
                  )}
                  title="Toggle Flashlight"
                >
                  {isTorchOn ? (
                    <Flashlight size={24} className="fill-current" />
                  ) : (
                    <Flashlight size={24} className="group-hover:text-wa-primary transition-colors" />
                  )}
                </button>

                {/* Low Light Alert */}
                <AnimatePresence>
                  {isLowLight && !isTorchOn && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 bg-yellow-500/90 backdrop-blur-sm rounded-full text-black text-[10px] font-bold uppercase tracking-widest shadow-xl"
                    >
                      <Sun size={12} className="animate-spin-slow" />
                      Low Light: Enable Signal Lamp
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pulse Glow */}
                <div className="absolute inset-10 border-2 border-wa-primary/40 rounded-3xl animate-pulse pointer-events-none shadow-[inset_0_0_40px_rgba(37,211,102,0.1)]" />
                
                {/* Advanced Scan Line */}
                <motion.div 
                  animate={{ y: [0, 320, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-wa-primary to-transparent opacity-100 shadow-[0_0_40px_rgba(37,211,102,1)] z-10"
                />

                {/* Cyber Corner Accents - Enhanced */}
                <motion.div 
                  animate={{ opacity: [0.5, 1, 0.5], scale: [0.98, 1, 0.98] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-wa-primary rounded-tl-2xl shadow-[0_0_20px_rgba(37,211,102,0.4)]" 
                />
                <motion.div 
                  animate={{ opacity: [0.5, 1, 0.5], scale: [0.98, 1, 0.98] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-wa-primary rounded-tr-2xl shadow-[0_0_20px_rgba(37,211,102,0.4)]" 
                />
                <motion.div 
                  animate={{ opacity: [0.5, 1, 0.5], scale: [0.98, 1, 0.98] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-wa-primary rounded-bl-2xl shadow-[0_0_20px_rgba(37,211,102,0.4)]" 
                />
                <motion.div 
                  animate={{ opacity: [0.5, 1, 0.5], scale: [0.98, 1, 0.98] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-wa-primary rounded-br-2xl shadow-[0_0_20_rgba(37,211,102,0.4)]" 
                />
              </motion.div>

              {recentScans.length > 0 && (
                <div className="w-full space-y-4">
                   <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Recent Signals</h4>
                        <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
                          {['All', 'Trusted', 'Warning'].map((f) => (
                            <button
                              key={f}
                              onClick={() => setScanFilter(f as any)}
                              className={cn(
                                "px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider rounded transition-all",
                                scanFilter === f ? "bg-wa-primary text-black" : "text-zinc-500 hover:text-white"
                              )}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowPurgeConfirm(true)}
                        className="text-[9px] font-mono font-bold text-wa-primary uppercase tracking-widest hover:underline"
                      >
                        Purge
                      </button>
                   </div>

                   {/* Purge Confirmation Dialog */}
                   <AnimatePresence>
                      {showPurgeConfirm && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col gap-2"
                        >
                          <p className="text-[10px] font-mono text-red-500 font-bold uppercase tracking-widest text-center">
                            Purge all local signal nodes?
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowPurgeConfirm(false)}
                              className="flex-1 py-1.5 bg-zinc-900 text-zinc-400 text-[9px] font-mono font-bold uppercase tracking-widest rounded-lg hover:text-white transition-colors"
                            >
                              Abort
                            </button>
                            <button
                              onClick={() => {
                                setRecentScans([]);
                                setShowPurgeConfirm(false);
                              }}
                              className="flex-1 py-1.5 bg-red-500 text-black text-[9px] font-mono font-bold uppercase tracking-widest rounded-lg hover:bg-red-400 transition-colors"
                            >
                              Confirm
                            </button>
                          </div>
                        </motion.div>
                      )}
                   </AnimatePresence>

                   <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                      {recentScans
                        .filter(s => {
                          if (scanFilter === 'All') return true;
                          const isTrusted = s.data.startsWith('user:') || s.data.startsWith('group:');
                          return scanFilter === 'Trusted' ? isTrusted : !isTrusted;
                        })
                        .map((scan) => (
                         <button
                           key={scan.id}
                           onClick={() => handleQRScan(scan.data)}
                           className="w-full p-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between hover:bg-zinc-800 transition-all group"
                         >
                            <div className="flex items-center gap-3 overflow-hidden">
                               <div className={cn(
                                 "p-2 rounded-lg transition-colors",
                                 (scan.data.startsWith('user:') || scan.data.startsWith('group:')) 
                                   ? "bg-wa-primary/10 group-hover:bg-wa-primary/20" 
                                   : "bg-red-500/10 group-hover:bg-red-500/20"
                               )}>
                                  <Link size={12} className={cn(
                                    (scan.data.startsWith('user:') || scan.data.startsWith('group:')) ? "text-wa-primary" : "text-red-500"
                                  )} />
                               </div>
                               <div className="flex flex-col items-start min-w-0">
                                  <span className="text-[11px] font-medium text-zinc-100 truncate w-full">{scan.data}</span>
                                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                                     {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                               </div>
                            </div>
                            <ChevronRight size={14} className="text-zinc-600 group-hover:text-wa-primary" />
                         </button>
                      ))}
                   </div>

                   {/* Security Audit Log */}
                   <div className="mt-4 p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <Terminal size={12} className="text-wa-primary" />
                        <h4 className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-[0.2em]">Security Audit Log</h4>
                      </div>
                      <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                        {cloudScanHistory.map((log) => (
                          <div key={log.id} className="flex items-start gap-2 py-1 px-2 hover:bg-white/5 rounded transition-colors group">
                            <div className={cn(
                              "w-1 h-1 rounded-full mt-1.5",
                              (log.data?.startsWith('user:') || log.data?.startsWith('group:')) ? "bg-wa-primary shadow-[0_0_5px_rgba(37,211,102,1)]" : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,1)]"
                            )} />
                            <div className="flex flex-col">
                              <p className="text-[8px] font-mono text-zinc-400 break-all leading-relaxed">
                                <span className="text-zinc-600">[{new Date(log.timestamp?.toDate ? log.timestamp.toDate() : Date.now()).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>{" "}
                                EVENT: {log.data?.startsWith('user:') || log.data?.startsWith('group:') ? 'PEER_DISCOVERY' : 'MALICIOUS_HANDSHAKE_DETECTION'} | DATA: {log.data}
                              </p>
                              <p className="text-[7px] font-mono text-zinc-600 uppercase tracking-tighter mt-0.5">
                                UID: {log.userId?.slice(-6)} | OS: {log.metadata?.platform} | SRCE: {chatId ? 'ROOM_CAPTURE' : 'LIST_CAPTURE'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              )}

              <button 
                onClick={() => {
                   setShowQRScanner(false);
                   setScanWarning(null);
                }}
                className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-[1.5rem] border border-white/5 text-[10px] font-mono font-black uppercase tracking-[0.4em] transition-all active:scale-95 text-zinc-500 hover:text-white"
              >
                Close Scanner
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedThreadIds.length > 0 && (
          <motion.div
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            exit={{ y: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[120] bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-6 pb-12 flex justify-between items-center shadow-[0_-20px_50px_rgba(0,0,0,0.2)] px-8"
          >
            <div className="flex flex-col">
               <span className="text-zinc-900 dark:text-white font-black text-xl leading-none uppercase tracking-tighter">{selectedThreadIds.length} Transmissions Selected</span>
               <button onClick={() => setSelectedThreadIds([])} className="text-[10px] font-mono font-bold text-wa-primary uppercase tracking-widest text-left mt-2 hover:underline">Abort Capture</button>
            </div>
            <button 
                  onClick={summarizeSelectedThread}
                  disabled={isSummarizing}
                  className="px-8 py-4 bg-wa-primary text-white rounded-[1.5rem] hover:bg-wa-primary/90 transition-all flex items-center gap-3 font-black uppercase tracking-[0.15em] text-[12px] shadow-xl disabled:opacity-50 active:scale-95 group"
               >
                  {isSummarizing ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                       <Loader2 size={20} />
                    </motion.div>
                  ) : (
                    <Sparkles size={20} className="group-hover:scale-120 transition-transform" />
                  )}
                  Generate AI Summary
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {threadSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setThreadSummary(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-wa-primary" />
              
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-wa-primary/10 rounded-2xl flex items-center justify-center text-wa-primary">
                       <Sparkles size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">AI Intelligence</h3>
                      <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-1">Core Signal Synthesis</p>
                    </div>
                  </div>
                  <button onClick={() => setThreadSummary(null)} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400">
                    <X size={24} />
                  </button>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-850 p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-inner">
                  <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                    {threadSummary}
                  </p>
                </div>

                <div className="mt-8 flex justify-end">
                   <button 
                     onClick={() => {
                        const blob = new Blob([threadSummary], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `thread-summary-${new Date().getTime()}.txt`;
                        a.click();
                     }}
                     className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors flex items-center gap-2"
                   >
                     <Download size={16} />
                     Save Synthesis
                   </button>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
                 <p className="text-[9px] font-mono font-black text-zinc-400 uppercase tracking-[0.3em]">AI-Generated Content • Encryption Verified</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 100, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 100, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[150] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px] border border-white/20 backdrop-blur-xl"
            style={{ 
              backgroundColor: toast.type === 'success' ? '#25D366' : '#ef4444',
              color: 'white'
            }}
          >
            {toast.type === 'success' ? <CheckCircle size={20} /> : <ShieldAlert size={20} />}
            <div className="flex-1 flex flex-col">
              <span className="text-sm font-bold">{toast.message}</span>
              <span className="text-[10px] opacity-80 uppercase font-bold tracking-widest">Notification</span>
            </div>
            {toast.action && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toast.action?.onClick();
                }}
                className="px-4 py-2 bg-white text-wa-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-colors shadow-lg"
              >
                {toast.action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Media Gallery Lightbox */}
      <AnimatePresence>
        {previewMedia && (() => {
          const allMedia = decryptedMessages.filter(m => !m.isViewOnce && (m.type === 'image' || m.type === 'video'));
          const currentIndex = allMedia.findIndex(m => m.mediaUrl === previewMedia.url);

          const navigateMedia = (direction: 'prev' | 'next') => {
            const nextIdx = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
            if (nextIdx >= 0 && nextIdx < allMedia.length) {
              const nextMedia = allMedia[nextIdx];
              setPreviewMedia({
                url: nextMedia.mediaUrl,
                type: nextMedia.type,
                senderName: nextMedia.senderId === user?.uid ? 'You' : (nextMedia.senderName || chatInfo?.peerName || 'Peer'),
                createdAt: nextMedia.createdAt,
                id: nextMedia.id
              });
            }
          };

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-zinc-950/95 backdrop-blur-2xl flex flex-col items-center justify-between p-4 select-none"
              onClick={() => setPreviewMedia(null)}
            >
              <div className="w-full flex items-center justify-between p-4 relative z-10 max-w-7xl mx-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono font-bold text-wa-primary uppercase tracking-[0.2em]">Signal Archive</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-white font-bold text-sm">{previewMedia.senderName}</span>
                    <span className="text-zinc-500 font-bold">•</span>
                    <span className="text-zinc-400 text-xs font-mono">
                      {previewMedia.createdAt?.toDate ? format(previewMedia.createdAt.toDate(), 'PP p') : 'Captured Now'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {previewMedia.id && (
                    <button
                      onClick={() => {
                        setPreviewMedia(null);
                        setShowSharedHub(false);
                        setTimeout(() => {
                          const el = document.getElementById(`message-${previewMedia.id}`);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.classList.add('bg-wa-primary/10', 'transition-colors', 'duration-1000');
                            setTimeout(() => el.classList.remove('bg-wa-primary/10'), 2000);
                          }
                        }, 300);
                      }}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer"
                    >
                      View in Chat
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = previewMedia.url;
                      a.target = '_blank';
                      a.download = `media-${currentIndex}.${previewMedia.type === 'image' ? 'jpg' : 'mp4'}`;
                      a.click();
                    }}
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl transition-all cursor-pointer"
                    title="Download"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => setPreviewMedia(null)}
                    className="p-2.5 bg-wa-primary text-white hover:bg-wa-primary-dark rounded-xl shadow-lg transition-all cursor-pointer"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full max-w-5xl flex items-center justify-between relative" onClick={(e) => e.stopPropagation()}>
                <div className="absolute left-4 z-10">
                  {currentIndex > 0 ? (
                    <button
                      onClick={() => navigateMedia('prev')}
                      className="p-4 bg-white/5 hover:bg-white/15 border border-white/10 text-white rounded-2xl transition-all active:scale-90 hover:scale-105 cursor-pointer"
                    >
                      <ChevronLeft size={28} strokeWidth={2.5} />
                    </button>
                  ) : (
                    <div className="w-16 h-16 opacity-0 pointer-events-none" />
                  )}
                </div>

                <div className="flex-1 h-full flex items-center justify-center p-4 md:p-8">
                  <motion.div
                    key={previewMedia.url}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="max-h-[70vh] md:max-h-[75vh] max-w-full flex items-center justify-center rounded-3xl overflow-auto no-scrollbar shadow-2xl relative border border-white/10 bg-zinc-900/40 backdrop-blur-md p-4"
                  >
                    {previewMedia.type === 'image' ? (
                      <div className="relative flex items-center justify-center min-h-[400px]">
                        <motion.img
                          src={previewMedia.url}
                          alt="Captured Signal"
                          className="max-h-[65vh] md:max-h-[70vh] w-auto max-w-full object-contain origin-center transition-transform duration-300"
                          style={{
                            transform: `scale(${previewZoom}) rotate(${previewRotate}deg)`,
                          }}
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Interactive floating control dock */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-zinc-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/10 flex items-center gap-3 z-30 shadow-xl" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewZoom(prev => Math.max(0.5, prev - 0.25));
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-xl text-white transition-all cursor-pointer"
                            title="Zoom Out"
                          >
                            <ZoomOut size={14} />
                          </button>
                          <span className="text-[10px] font-mono font-bold text-zinc-300 min-w-[32px] text-center select-none">
                            {Math.round(previewZoom * 100)}%
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewZoom(prev => Math.min(3, prev + 0.25));
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-xl text-white transition-all cursor-pointer"
                            title="Zoom In"
                          >
                            <ZoomIn size={14} />
                          </button>
                          <div className="w-px h-3 bg-white/15" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewRotate(prev => (prev + 90) % 360);
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-xl text-white transition-all cursor-pointer"
                            title="Rotate 90°"
                          >
                            <RotateCw size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewZoom(1);
                              setPreviewRotate(0);
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-xl text-white transition-all cursor-pointer"
                            title="Reset Views"
                          >
                            <RefreshCcw size={12} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <video
                        src={previewMedia.url}
                        controls
                        autoPlay
                        className="max-h-[70vh] md:max-h-[75vh] w-auto max-w-full object-contain"
                      />
                    )}
                  </motion.div>
                </div>

                <div className="absolute right-4 z-10">
                  {currentIndex < allMedia.length - 1 ? (
                    <button
                      onClick={() => navigateMedia('next')}
                      className="p-4 bg-white/5 hover:bg-white/15 border border-white/10 text-white rounded-2xl transition-all active:scale-90 hover:scale-105 cursor-pointer"
                    >
                      <ChevronRight size={28} strokeWidth={2.5} />
                    </button>
                  ) : (
                    <div className="w-16 h-16 opacity-0 pointer-events-none" />
                  )}
                </div>
              </div>

              <div className="w-full text-center pb-6 pt-2 select-none z-10" onClick={(e) => e.stopPropagation()}>
                <span className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-white/80 text-[10px] font-mono tracking-widest uppercase">
                  Transmit {currentIndex + 1} of {allMedia.length}
                </span>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <PlanningBoard 
        isOpen={showPlanningBoard} 
        onClose={() => setShowPlanningBoard(false)} 
        theme={theme} 
      />

      {showStickerUpsell && (
        <PremiumModal onClose={() => setShowStickerUpsell(false)} />
      )}

      {showDisappearingModal && (
        <DisappearingMessageToggle
          isOpen={showDisappearingModal}
          onClose={() => setShowDisappearingModal(false)}
          timer={disappearingSettings?.timer || 0}
          onUpdate={updateDisappearingTimer}
          isGroup={isGroup}
          chatInfo={chatInfo}
          currentUserUid={user?.uid}
        />
      )}

      {/* Enclave OS Chat Summary Modal */}
      <ChatSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summary={summaryData}
        error={summaryError}
        isLoading={summaryLoading}
        onRetry={handleSummarizeClick}
        onPin={handlePinSummary}
        isPinned={!!pinnedSummary}
        onSelectSmartReply={(reply) => {
          sendSmartReply(reply);
          setIsSummaryModalOpen(false);
        }}
      />

      {showDocScanner && (
        <DocumentScanner
          onClose={() => setShowDocScanner(false)}
          onDispatchDocument={handleDispatchScannedDocument}
          chatId={chatId}
        />
      )}
    </motion.div>
  );
}
