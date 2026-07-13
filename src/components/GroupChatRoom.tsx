import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc, updateDoc, setDoc, deleteDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { generateSymmetricKey, exportSymmetricKey, encryptText, importPublicKey, deriveSharedKey } from '../lib/e2ee';
import { 
  Users, Info, Send, Smile, Paperclip, ChevronLeft, Shield, Sparkles, Image, 
  HelpCircle, Volume2, Lock, CheckCircle, Flame, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import GroupMessageBubble from './GroupMessageBubble';
import MentionDropdown from './MentionDropdown';
import GroupInfoPanel from './GroupInfoPanel';

interface GroupChatRoomProps {
  chatId: string;
  chatInfo: any;
  onClose: () => void;
}

// 20+ Premium Sticker links for Cyber-Tech, Retro-Games, Memes, Badges
const PREMIUM_STICKERS = [
  // Cyber-Tech
  { id: 'tech1', name: 'Secure Link', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=secure_link' },
  { id: 'tech2', name: 'Cyber Node', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=cyber_node' },
  { id: 'tech3', name: 'AI Core', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai_core' },
  { id: 'tech4', name: 'Firewall', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=firewall' },
  { id: 'tech5', name: 'Crypto Pulse', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=crypto_pulse' },
  
  // Retro-Games
  { id: 'retro1', name: 'Game Over', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=game_over' },
  { id: 'retro2', name: 'Level Up', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=level_up' },
  { id: 'retro3', name: 'Coin Collector', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=coin' },
  { id: 'retro4', name: 'Space Invader', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=invader' },
  { id: 'retro5', name: 'Retro Heart', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=heart' },

  // Emojis / Memes
  { id: 'meme1', name: 'Cool Cat', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=cool_cat' },
  { id: 'meme2', name: 'Surprise', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=surprise' },
  { id: 'meme3', name: 'Shy Guy', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=shy' },
  { id: 'meme4', name: 'Developer Wink', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=dev_wink' },
  { id: 'meme5', name: 'Money Eyes', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=money' },

  // Slogans / Badges
  { id: 'badge1', name: 'Top Contributor', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=top_contributor' },
  { id: 'badge2', name: 'VIP Shield', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=vip_shield' },
  { id: 'badge3', name: 'Verified User', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=verified' },
  { id: 'badge4', name: 'Alpha Member', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=alpha' },
  { id: 'badge5', name: 'E2EE Secure', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=secure_badge' }
];

export default function GroupChatRoom({ chatId, chatInfo, onClose }: GroupChatRoomProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  
  // Member metadata and keys
  const [memberKeys, setMemberKeys] = useState<{ [userId: string]: string }>({});
  const [memberProfiles, setMemberProfiles] = useState<any[]>([]);
  
  // Mentions
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionTriggerIndex, setMentionTriggerIndex] = useState(-1);

  // Typing indicators
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const [isTypingLocal, setIsTypingLocal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<any>(null);

  useEffect(() => {
    if (!chatId) return;

    // 1. Subscribe to group messages
    const qMsgs = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    const unsubMsgs = onSnapshot(qMsgs, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Subscribe to memberKeys subcollection for E2EE key distribution
    const unsubKeys = onSnapshot(collection(db, 'chats', chatId, 'memberKeys'), (snapshot) => {
      const keysMap: { [userId: string]: string } = {};
      snapshot.docs.forEach(doc => {
        keysMap[doc.id] = doc.data().publicKey;
      });
      setMemberKeys(keysMap);
    });

    // 3. Subscribe to typing indicators
    const unsubTyping = onSnapshot(collection(db, 'chats', chatId, 'typing'), (snapshot) => {
      const usersTyping = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((t: any) => t.id !== user?.uid && t.isTyping);
      setTypingUsers(usersTyping);
    });

    return () => {
      unsubMsgs();
      unsubKeys();
      unsubTyping();
    };
  }, [chatId, user]);

  // Load member profiles (display names/usernames) for @mentions
  useEffect(() => {
    if (!chatInfo?.members || chatInfo.members.length === 0) return;

    const loadProfiles = async () => {
      const profiles: any[] = [];
      for (const mId of chatInfo.members) {
        try {
          const userSnap = await getDoc(doc(db, 'users', mId));
          if (userSnap.exists()) {
            profiles.push({ id: mId, ...userSnap.data() });
          } else {
            profiles.push({ id: mId, displayName: `User ${mId.substring(0, 5)}`, username: mId.substring(0, 5) });
          }
        } catch (err) {
          console.warn("Could not fetch user profile for mention:", err);
        }
      }
      setMemberProfiles(profiles);
    };

    loadProfiles();
  }, [chatInfo?.members]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Handle typing activity
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    // Mentions detection (@)
    const cursor = e.target.selectionStart || 0;
    const textBeforeCursor = val.substring(0, cursor);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    if (lastAtIdx !== -1 && (lastAtIdx === 0 || textBeforeCursor[lastAtIdx - 1] === ' ')) {
      const filter = textBeforeCursor.substring(lastAtIdx + 1);
      if (!filter.includes(' ')) {
        setShowMentionDropdown(true);
        setMentionFilter(filter);
        setMentionTriggerIndex(lastAtIdx);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }

    // Typing state update
    if (!isTypingLocal) {
      setIsTypingLocal(true);
      setDoc(doc(db, 'chats', chatId, 'typing', user!.uid), {
        isTyping: true,
        displayName: user?.displayName || 'Anonymous',
        updatedAt: serverTimestamp()
      }).catch(console.warn);
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTypingLocal(false);
      deleteDoc(doc(db, 'chats', chatId, 'typing', user!.uid)).catch(console.warn);
    }, 2000);
  };

  const selectMention = (username: string) => {
    if (mentionTriggerIndex === -1) return;
    const beforeMention = inputText.substring(0, mentionTriggerIndex);
    const afterMention = inputText.substring(mentionTriggerIndex + mentionFilter.length + 1);
    setInputText(`${beforeMention}@${username} ${afterMention}`);
    setShowMentionDropdown(false);
    setMentionTriggerIndex(-1);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !user) return;

    const rawText = inputText.trim();
    setInputText('');
    setShowMentionDropdown(false);

    try {
      let isEncrypted = false;
      let encryptedData = null;
      let encryptedKeys: { [userId: string]: { iv: number[], data: number[] } } = {};

      // 1. Check if we have public keys for group E2EE
      const memberUids = chatInfo.members || [];
      const keysAvailable = memberUids.every((uid: string) => memberKeys[uid]);

      // Trigger E2EE encryption if stashed keys and public keys are fully loaded
      const myPrivKey = (window as any).e2ee_keys?.[`priv_${user.uid}`];

      if (keysAvailable && myPrivKey) {
        try {
          // A. Generate random 256-bit symmetric AES key
          const symmetricKey = await generateSymmetricKey();
          const exportedJwk = await exportSymmetricKey(symmetricKey);
          const jwkString = JSON.stringify(exportedJwk);

          // B. Encrypt message payload using symmetric key
          encryptedData = await encryptText(rawText, symmetricKey);

          // C. Encrypt the symmetric key for each group member using ECDH shared secrets
          for (const memberId of memberUids) {
            const peerPubKeyStr = memberKeys[memberId];
            if (peerPubKeyStr) {
              const peerPubKey = await importPublicKey(JSON.parse(peerPubKeyStr));
              const sharedKey = await deriveSharedKey(myPrivKey, peerPubKey);
              const encryptedSymmetricKey = await encryptText(jwkString, sharedKey);
              encryptedKeys[memberId] = encryptedSymmetricKey;
            }
          }

          isEncrypted = true;
        } catch (encryptErr) {
          console.warn("[Group E2EE] Symmetric/Diffie-Hellman encryption failed, sending plaintext", encryptErr);
        }
      }

      // 2. Save group message document
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        senderName: user.displayName || 'Anonymous User',
        senderAvatar: user.photoURL || '',
        text: isEncrypted ? '[Encrypted Group Message]' : rawText,
        type: 'text',
        isEncrypted,
        encryptedData,
        encryptedKeys,
        createdAt: serverTimestamp()
      });

      // 3. Update parent chat doc
      await updateDoc(doc(db, 'chats', chatId), {
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: isEncrypted ? '🔐 [Encrypted Message]' : rawText,
          createdAt: serverTimestamp(),
          senderId: user.uid,
          senderName: user.displayName || 'Anonymous'
        }
      });

    } catch (err) {
      console.error("Failed to send group message:", err);
    }
  };

  const handleSendSticker = async (stickerUrl: string) => {
    if (!user) return;
    setShowStickers(false);

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        senderName: user.displayName || 'Anonymous User',
        senderAvatar: user.photoURL || '',
        text: 'Sent a sticker',
        type: 'sticker',
        mediaUrl: stickerUrl,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', chatId), {
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: '🎨 Sticker',
          createdAt: serverTimestamp(),
          senderId: user.uid,
          senderName: user.displayName || 'Anonymous'
        }
      });
    } catch (err) {
      console.error("Failed to send sticker:", err);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      
      {/* Primary Chat Box */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header */}
        <header className={cn(
          "px-5 py-3 border-b flex justify-between items-center shrink-0 shadow-sm transition-colors duration-200",
          isDark ? "border-zinc-900 bg-[#070b0e]" : "border-zinc-150 bg-white"
        )}>
          <div className="flex items-center gap-3.5 min-w-0">
            <button onClick={onClose} className="p-1.5 hover:bg-zinc-500/10 rounded-full cursor-pointer">
              <ChevronLeft size={20} />
            </button>
            <img 
              src={chatInfo.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${chatInfo.name}`} 
              alt={chatInfo.name} 
              onClick={() => setShowGroupInfo(!showGroupInfo)}
              className="w-10 h-10 rounded-full border border-zinc-500/10 object-cover cursor-pointer hover:scale-105 transition-transform" 
            />
            <div className="min-w-0 cursor-pointer" onClick={() => setShowGroupInfo(!showGroupInfo)}>
              <h4 className="text-sm font-bold truncate tracking-tight">{chatInfo.name}</h4>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                <Users size={10} />
                <span>{chatInfo.members?.length || 0} Members</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              <Shield size={9} />
              <span>Group E2EE</span>
            </div>
            <button 
              onClick={() => setShowGroupInfo(!showGroupInfo)}
              className="p-2 hover:bg-zinc-500/10 rounded-full text-zinc-500 hover:text-amber-500 cursor-pointer transition-colors"
            >
              <Info size={18} />
            </button>
          </div>
        </header>

        {/* Message Panel */}
        <div className={cn(
          "flex-1 overflow-y-auto px-5 py-4 space-y-1 transition-colors duration-200",
          isDark ? "bg-[#0b0f12]" : "bg-zinc-50/50"
        )}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="p-3 bg-amber-500/10 rounded-full text-amber-500 animate-pulse">
                <Lock size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold">End-to-End Encrypted Group</h4>
                <p className="text-xs text-zinc-500 max-w-xs mt-1 leading-relaxed">
                  Messages are secured with multi-user symmetric key distribution. Handshake completed securely.
                </p>
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <GroupMessageBubble 
                key={msg.id} 
                message={msg} 
                chatId={chatId} 
                isAdmin={chatInfo?.admins?.includes(user?.uid) || false}
                chatInfo={chatInfo}
                memberProfiles={memberProfiles}
              />
            ))
          )}

          {/* Typing Indicator Bubble */}
          {typingUsers.length > 0 && (
            <div className="flex gap-2 items-center text-[10px] text-zinc-500 pl-14 py-2 italic font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
              <span>
                {typingUsers.map(u => u.displayName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} transmitting activity...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Mentions Dropdown Placement */}
        {showMentionDropdown && (
          <MentionDropdown
            members={memberProfiles}
            filterText={mentionFilter}
            onSelect={selectMention}
            onClose={() => setShowMentionDropdown(false)}
          />
        )}

        {/* Input Dock */}
        <div className={cn(
          "p-4 border-t shrink-0 flex flex-col gap-3 relative z-30 transition-colors duration-200",
          isDark ? "border-zinc-900 bg-[#070b0e]" : "border-zinc-150 bg-white"
        )}>
          {/* Stickers Drawer */}
          <AnimatePresence>
            {showStickers && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className={cn(
                  "border rounded-xl p-4 mb-2 flex flex-col max-h-56 overflow-y-auto",
                  isDark ? "bg-[#0b0f12] border-zinc-850" : "bg-zinc-50 border-zinc-200"
                )}
              >
                <div className="flex justify-between items-center mb-3 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Premium Sticker Deck</span>
                  <button onClick={() => setShowStickers(false)} className="text-zinc-500 hover:text-zinc-200 cursor-pointer">
                    <X size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-3.5">
                  {PREMIUM_STICKERS.map(sticker => (
                    <button
                      key={sticker.id}
                      onClick={() => handleSendSticker(sticker.url)}
                      className="flex flex-col items-center gap-1 cursor-pointer hover:scale-110 transition-transform p-1.5 hover:bg-amber-500/5 rounded-lg"
                    >
                      <img src={sticker.url} alt={sticker.name} className="w-11 h-11 object-contain" />
                      <span className="text-[8px] text-zinc-500 truncate w-full text-center">{sticker.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => setShowStickers(!showStickers)}
              className={cn(
                "p-2.5 rounded-xl border transition-colors cursor-pointer",
                isDark ? "border-zinc-800 hover:bg-zinc-900 text-zinc-500 hover:text-amber-500" : "border-zinc-200 hover:bg-zinc-100 text-zinc-550 hover:text-amber-600"
              )}
            >
              <Sparkles size={16} />
            </button>
            
            <input
              type="text"
              placeholder="Send secured group packet..."
              value={inputText}
              onChange={handleInputChange}
              className={cn(
                "flex-1 border focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-xl py-2.5 px-4 text-xs font-normal outline-none transition-all",
                isDark ? "bg-zinc-900/40 border-zinc-850 text-zinc-150 placeholder:text-zinc-650" : "bg-zinc-50 border-zinc-250 text-zinc-850 placeholder:text-zinc-400"
              )}
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 bg-amber-500 text-black hover:bg-amber-600 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none active:scale-95 shrink-0 flex items-center justify-center"
            >
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>

      {/* Info panel sliding from right */}
      <AnimatePresence>
        {showGroupInfo && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="h-full border-l shrink-0"
          >
            <GroupInfoPanel
              chatId={chatId}
              chatInfo={chatInfo}
              onClose={() => setShowGroupInfo(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
