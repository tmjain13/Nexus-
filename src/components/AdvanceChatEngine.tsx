import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
  type DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { 
  Check, 
  CheckCheck, 
  Sparkles, 
  Smile, 
  ShieldCheck, 
  Video, 
  Phone, 
  MoreVertical,
  ChevronRight,
  Info,
  X,
  Camera,
  Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Contact Definition
interface Contact {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  lastSeen: string | null;
  verified: boolean;
  isGroup?: boolean;
  isChannel?: boolean;
}

// Chat Item Definition
interface ChatItem {
  id: string;
  contactId: string;
  lastMsg: string;
  time: string;
  unread: number;
  pinned: boolean;
  draft: string | null;
}

// Message Definition
interface SyncMessage {
  id: string;
  from: 'me' | 'them';
  senderId?: string;
  text: string;
  time: string;
  status: 'sent' | 'delivered' | 'read';
  reactions: { emoji: string; by: string }[];
  createdAt?: any;
  imageUrl?: string;
}

const CONTACTS: Contact[] = [
  { id: "1", name: "Sophia Carter", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sophia", online: true, lastSeen: null, verified: true },
  { id: "2", name: "James Miller", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=james", online: false, lastSeen: "2 min ago", verified: false },
  { id: "3", name: "Priya Sharma", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya", online: true, lastSeen: null, verified: true },
  { id: "4", name: "Design Team 🎨", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=designteam", online: false, lastSeen: "5h ago", isGroup: true, verified: false },
  { id: "7", name: "Crypto Signals 📡", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=crypto", online: true, lastSeen: null, isGroup: true, isChannel: true, verified: true },
];

const INITIAL_CHATS: ChatItem[] = [
  { id: "1", contactId: "1", lastMsg: "See you tomorrow! 😊", time: "9:41 AM", unread: 2, pinned: true, draft: null },
  { id: "7", contactId: "7", lastMsg: "BTC hitting new highs 🚀", time: "9:30 AM", unread: 14, pinned: false, draft: null },
  { id: "2", contactId: "2", lastMsg: "Can you send me the file?", time: "8:22 AM", unread: 0, pinned: true, draft: "Sure, one sec..." },
];

const LOCAL_MESSAGES_MOCKS: Record<string, SyncMessage[]> = {
  "1": [
    { id: "m1", from: "them", text: "Hey! Are we still on for tomorrow?", time: "9:30 AM", status: "read", reactions: [] },
    { id: "m2", from: "me", text: "Yes absolutely! Looking forward to it 🎉", time: "9:32 AM", status: "read", reactions: [{ emoji: "❤️", by: "them" }] },
    { id: "m5", from: "them", text: "You're the best! See you tomorrow! 😊", time: "9:41 AM", status: "delivered", reactions: [] },
  ],
  "2": [
    { id: "m4", from: "them", text: "Can you send me the file?", time: "8:22 AM", status: "read", reactions: [] },
  ],
  "3": [],
  "4": [],
  "7": [
    { id: "m7_1", from: "them", text: "Welcome to Crypto Signals Feed! 📡", time: "9:00 AM", status: "read", reactions: [] },
    { id: "m7_2", from: "them", text: "BTC hitting new highs 🚀", time: "9:30 AM", status: "read", reactions: [] }
  ]
};

export const AdvanceChatEngine = () => {
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState<ChatItem>(INITIAL_CHATS[0]);
  const [localMessages, setLocalMessages] = useState<Record<string, SyncMessage[]>>(LOCAL_MESSAGES_MOCKS);
  const [firestoreMessages, setFirestoreMessages] = useState<SyncMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [syncWithFirestore, setSyncWithFirestore] = useState(true);
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null);
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeContact = CONTACTS.find(c => c.id === activeChat.contactId) || CONTACTS[0];

  // Resolve stable Chat ID (Personal: sorted users, Group: steady prefix)
  const currentChatId = useMemo(() => {
    if (!user) return `advance_chat_${activeChat.contactId}`;
    if (activeContact.isGroup || activeContact.isChannel) {
      return `advance_group_${activeChat.contactId}`;
    }
    const sorted = [user.uid, activeChat.contactId].sort();
    return `advance_${sorted[0]}_${sorted[1]}`;
  }, [activeChat.contactId, user, activeContact]);

  // 1. Subscribe to Firestore Real-Time Stream for the Active Chat Room
  useEffect(() => {
    if (!syncWithFirestore || !db || !user) return;

    const chatId = currentChatId;
    const path = `chats/${chatId}/messages`;

    // Initialize room parent doc and seed local messages if first-time loader
    const initRoom = async () => {
      try {
        const chatRef = doc(db, 'chats', chatId);
        await setDoc(chatRef, {
          id: chatId,
          participants: [user.uid, activeChat.contactId],
          isGroup: !!activeContact.isGroup,
          isChannel: !!activeContact.isChannel,
          groupName: activeContact.name,
          groupPhoto: activeContact.avatar,
          updatedAt: serverTimestamp(),
          lastMessage: {
            text: 'Advance Chat Engine connected',
            senderId: user.uid,
            createdAt: serverTimestamp()
          }
        }, { merge: true });

        // Seed default initial mock conversation to firestore once per session
        const seedKey = `seeded_${chatId}_${user.uid}`;
        if (!sessionStorage.getItem(seedKey)) {
          sessionStorage.setItem(seedKey, 'true');
          const roomRef = collection(db, 'chats', chatId, 'messages');
          const seedMessages = LOCAL_MESSAGES_MOCKS[activeChat.contactId] || [];
          if (seedMessages.length > 0) {
            for (const m of seedMessages) {
              const msgRef = doc(roomRef, `seed_${m.id}`);
              await setDoc(msgRef, {
                senderId: m.from === 'me' ? user.uid : activeChat.contactId,
                senderName: m.from === 'me' ? (user.displayName || 'Developer') : activeContact.name,
                text: m.text,
                status: m.status || 'delivered',
                reactions: m.reactions || [],
                createdAt: serverTimestamp(),
                imageUrl: m.imageUrl || null
              });
            }
          }
        }
      } catch (err) {
        console.warn("Failed to set up parent room or seed initial chat details:", err);
      }
    };

    initRoom();

    const roomRef = collection(db, 'chats', chatId, 'messages');
    const q = query(roomRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList: SyncMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as DocumentData;
        
        let msgTime = 'Just Now';
        if (data.createdAt) {
          const jsDate = data.createdAt.toDate();
          msgTime = jsDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        messagesList.push({
          id: docSnap.id,
          from: data.senderId === user.uid ? 'me' : 'them',
          senderId: data.senderId,
          text: data.text || '',
          time: msgTime,
          status: data.status || 'delivered',
          reactions: data.reactions || [],
          createdAt: data.createdAt,
          imageUrl: data.imageUrl || undefined
        });
      });

      setFirestoreMessages(messagesList);
    }, (error) => {
      console.error("Firestore real-time room sync error:", error);
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [currentChatId, syncWithFirestore, user, activeChat.contactId, activeContact]);

  // 2. Resolve Active Stream Messages
  const activeChatMessages = useMemo(() => {
    if (syncWithFirestore) {
      return firestoreMessages;
    }
    // Fallback to local simulated mock database if syncing is explicitly turned off
    return localMessages[activeChat.contactId] || [];
  }, [activeChat.contactId, syncWithFirestore, firestoreMessages, localMessages]);

  // 3. Keep Chat Canvas Scrolled to bottom during live delivery
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatMessages]);

  // 4. Handle sending message via form
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() && !selectedImage) return;

    const typedMsgText = inputMsg.trim();
    const formattedLocalTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const imageToAttach = selectedImage;

    // Reset attachments immediately so the layout is snappy
    setInputMsg('');
    setSelectedImage(null);
    setShowInputEmojiPicker(false);

    // Try Firestore dispatch first
    if (syncWithFirestore && db && user) {
      const chatId = currentChatId;
      const path = `chats/${chatId}/messages`;
      try {
        const roomRef = collection(db, 'chats', chatId, 'messages');
        const timestampValue = serverTimestamp();
        
        await addDoc(roomRef, {
          senderId: user.uid,
          senderName: user.displayName || 'Developer',
          text: typedMsgText,
          status: 'sent',
          reactions: [],
          createdAt: timestampValue,
          ...(imageToAttach ? { imageUrl: imageToAttach } : {})
        });

        // Sync parent room header
        const chatRef = doc(db, 'chats', chatId);
        await setDoc(chatRef, {
          lastMessage: {
            text: typedMsgText || '[Image Attachment]',
            senderId: user.uid,
            createdAt: timestampValue
          },
          updatedAt: timestampValue
        }, { merge: true });

        return;
      } catch (err) {
        console.error("Firestore dispatch failed, placing in local state memory:", err);
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }

    // Local state fallback
    const newLocalMsg: SyncMessage = {
      id: `m_${Date.now()}`,
      from: 'me',
      text: typedMsgText,
      time: formattedLocalTime,
      status: 'sent',
      reactions: [],
      ...(imageToAttach ? { imageUrl: imageToAttach } : {})
    };

    setLocalMessages(prev => ({
      ...prev,
      [activeChat.contactId]: [...(prev[activeChat.contactId] || []), newLocalMsg]
    }));
  };

  // Add Emoji reaction implementation
  const handleAddReaction = async (msgId: string, emoji: string) => {
    if (syncWithFirestore && db && user) {
      const chatId = currentChatId;
      const path = `chats/${chatId}/messages/${msgId}`;
      try {
        const msgRef = doc(db, 'chats', chatId, 'messages', msgId);
        
        const msgDoc = firestoreMessages.find(m => m.id === msgId);
        const existingReactions = msgDoc?.reactions || [];
        
        const updatedReactions = [
          ...existingReactions.filter(r => r.by !== user.uid),
          { emoji, by: user.uid }
        ];

        await updateDoc(msgRef, {
          reactions: updatedReactions
        });
      } catch (err) {
        console.error("Failed to update reactions in firestore:", err);
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    } else {
      setLocalMessages(prev => {
        const currentList = prev[activeChat.contactId] || [];
        const updatedList = currentList.map(msg => {
          if (msg.id === msgId) {
            return {
              ...msg,
              reactions: [{ emoji, by: 'me' }]
            };
          }
          return msg;
        });
        return { ...prev, [activeChat.contactId]: updatedList };
      });
    }
    setShowEmojiPickerFor(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#060814] text-white font-sans selection:bg-amber-500/30 selection:text-amber-300">
      
      {/* iOS & Android Top Safe Area Buffer */}
      <div 
        className="w-full bg-[#0b0f26] shrink-0" 
        style={{ height: 'env(safe-area-inset-top, 24px)' }} 
      />

      {/* Primary Communication Header Bar */}
      <header className="bg-[#0b0f26]/95 backdrop-blur-md border-b border-zinc-900/60 p-4 sticky top-0 z-20 flex items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={activeContact.avatar} 
              alt={activeContact.name} 
              className="w-11 h-11 rounded-full bg-zinc-805/40 border border-zinc-800/80 object-cover" 
            />
            {activeContact.online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#0b0f26] rounded-full shadow-[0_0_8px_#34d399]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-[14.5px] leading-tight">
              <h2>{activeContact.name}</h2>
              {activeContact.verified && (
                <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] font-mono tracking-wider text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <span className={activeContact.online ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                • {activeContact.online ? 'ऑनलाइन (Online)' : activeContact.lastSeen || 'ऑफलाइन'}
              </span>
            </p>
          </div>
        </div>

        {/* Premium Control Center */}
        <div className="flex items-center gap-2">
          {/* Real-time Sync Mode Badge Pin */}
          <button 
            type="button"
            onClick={() => setSyncWithFirestore(!syncWithFirestore)}
            className={`px-3 py-1.5 rounded-full border text-[9px] font-mono font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 ${
              syncWithFirestore 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-zinc-800/20 border-zinc-700/30 text-zinc-400'
            }`}
            title="Toggle Real-Time Cloud Synchronization"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${syncWithFirestore ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
            {syncWithFirestore ? 'Cloud Live' : 'Offline Mode'}
          </button>
          
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/30 rounded-full transition-all shrink-0 cursor-pointer border-none bg-none">
            <Phone size={18} />
          </button>
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/30 rounded-full transition-all shrink-0 cursor-pointer border-none bg-none">
            <Video size={18} />
          </button>
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/30 rounded-full transition-all shrink-0 cursor-pointer border-none bg-none">
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* Cloud Sync Information Strip */}
      <div className="bg-[#ffaa00]/10 border-b border-[#ffaa00]/10 px-4 py-2 text-[11px] text-amber-200/80 font-mono tracking-wide flex items-center gap-2 justify-center">
        <Info size={13} className="text-[#ffaa00] shrink-0" />
        <span>Realtime synchronization coordinates active across both mobile and web clients.</span>
      </div>

      {/* Core Scrollable Communication Canvas */}
      <main className="flex-1 overflow-y-auto px-4 py-5 gap-3.5 flex flex-col bg-[#060814] relative md:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/[0.02] via-[#060814]/0 to-[#060814]/0 pointer-events-none" />
        
        {activeChatMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-zinc-500 space-y-3.5">
            <div className="p-4 bg-zinc-900/40 rounded-full border border-zinc-800/60 max-w-max text-zinc-400">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-300 text-sm font-sans">No message signals yet</h3>
              <p className="text-xs text-zinc-550 max-w-xs mt-1 leading-relaxed">Transmit your first encrypted system log using the entry field below.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 relative z-10">
            {activeChatMessages.map((msg) => {
              const isMe = msg.from === "me";
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} group items-end gap-2`}
                >
                  {/* Avatar left-side for peer messages */}
                  {!isMe && (
                    <img 
                      src={activeContact.avatar} 
                      alt="" 
                      className="w-7 h-7 rounded-full bg-zinc-800/50 object-cover border border-zinc-850 shadow-sm shrink-0" 
                    />
                  )}

                  <div className="relative max-w-[75%] md:max-w-[65%]">
                    {/* Message Bubble Body */}
                    <div 
                      className={`p-3.5 rounded-2xl text-[13.5px] leading-relaxed relative flex flex-col transition-all duration-200 ${
                        isMe 
                          ? 'bg-[#ffaa00] text-[#060814] font-bold shadow-md hover:bg-amber-400 shadow-amber-500/[0.04]' 
                          : 'bg-[#111830] text-zinc-100 border border-zinc-800/50 hover:bg-[#151c38]'
                      }`}
                      style={{
                        borderBottomRightRadius: isMe ? '4px' : '16px',
                        borderBottomLeftRadius: isMe ? '16px' : '4px',
                      }}
                    >
                      {/* Subtitle / Sender for group channels */}
                      {(activeContact.isGroup || activeContact.isChannel) && !isMe && (
                        <span className="text-[10.5px] font-mono font-bold text-amber-500 tracking-wider uppercase mb-1 block">
                          ~ {msg.senderId?.substring(0, 5) || 'Peer'}
                        </span>
                      )}

                      {msg.imageUrl && (
                        <div className="mb-2 max-w-full rounded-xl overflow-hidden border border-zinc-800/40 bg-black/10">
                          <img 
                            src={msg.imageUrl} 
                            alt="Media Attachment" 
                            className="w-full h-auto max-h-[220px] object-cover rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {msg.text && (
                        <span className="break-words leading-loose pr-2">{msg.text}</span>
                      )}
                      
                      {/* Embedded Reaction Badge */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="absolute -bottom-2 bg-[#12162e] border border-zinc-800 px-1.5 py-0.5 rounded-full text-[10px] font-sans flex items-center gap-1 shadow-md scale-95 origin-center select-none"
                             style={{ left: isMe ? '10px' : 'auto', right: isMe ? 'auto' : '10px' }}>
                          <span className="animate-wiggle">{msg.reactions[0].emoji}</span>
                          <span className="text-[8px] font-mono font-bold text-zinc-400 capitalize">{msg.reactions[0].by}</span>
                        </div>
                      )}

                      {/* Msg Payload Meta Metrics (Timestamp, Double check receipt status) */}
                      <div className={`text-[10px] uppercase font-mono tracking-widest select-none flex items-center justify-end gap-1.5 mt-2 ${
                        isMe ? 'text-[#060814]/65 font-bold' : 'text-zinc-500'
                      }`}>
                        <span>{msg.time}</span>
                        {isMe && (
                          <span>
                            {msg.status === 'read' ? (
                              <CheckCheck size={12} strokeWidth={3} className="text-[#060814]" />
                            ) : (
                              <Check size={12} strokeWidth={3} className="text-[#060814]/60" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* micro Reaction Selector Trigger button on Hover (Visible Desktop only) */}
                    <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10 ${
                      isMe ? 'right-full mr-2' : 'left-full ml-2'
                    }`}>
                      <button 
                        onClick={() => setShowEmojiPickerFor(showEmojiPickerFor === msg.id ? null : msg.id)}
                        className="bg-zinc-900 border border-zinc-800 p-1.5 hover:bg-zinc-805 hover:text-white rounded-full text-zinc-400 transition-colors shadow-lg cursor-pointer max-w-max"
                      >
                        <Smile size={12} />
                      </button>

                      {/* Micro Emoji Reaction List popup */}
                      <AnimatePresence>
                        {showEmojiPickerFor === msg.id && (
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="absolute bottom-full bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl flex gap-1.5 shadow-2xl z-20 items-center"
                          >
                            {['❤️', '👍', '🔥', '👏', '😂', '🎉'].map((emoji) => (
                              <button 
                                key={emoji}
                                onClick={() => handleAddReaction(msg.id, emoji)}
                                className="text-sm rounded hover:bg-zinc-800 p-0.5 transition-colors cursor-pointer border-none bg-none"
                              >
                                {emoji}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Horizontal Chat Channels Segment Selection List Footer bar */}
      <section className="bg-[#0b0f26]/95 border-t border-zinc-900/60 p-4 shrink-0 shadow-lg">
        <h3 className="text-[11.5px] font-bold text-[#ffaa00] uppercase tracking-widest font-mono mb-2.5 flex items-center gap-1.5">
          <Sparkles size={12} className="animate-pulse" />
          📂 सक्रिय संवाद चैनल (Quick Channels)
        </h3>
        
        <div className="flex gap-2.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
          {INITIAL_CHATS.map((c) => {
            const contact = CONTACTS.find(cnt => cnt.id === c.contactId) || { name: 'Chat Node' };
            const isActive = c.id === activeChat.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActiveChat(c);
                  setFirestoreMessages([]);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold font-mono text-[11px] border text-left shrink-0 transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#ffaa00] text-[#060814] border-transparent shadow shadow-amber-500/20 scale-[1.012]' 
                    : 'bg-[#11152c] text-zinc-400 border-zinc-800/65 hover:bg-[#161b36] hover:text-zinc-200'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#060814]' : 'bg-zinc-700'}`} />
                <span>{contact.name}</span>
                {c.unread > 0 && !isActive && (
                  <span className="ml-1.5 bg-red-500 text-white font-sans text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                    {c.unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Dispatch form Control Area */}
      <footer className="bg-[#0b0f26] border-t border-zinc-900/60 p-4 shrink-0 flex flex-col gap-2 shadow-2xl pb-calc relative z-30">
        
        {/* Selected attachment preview layout */}
        {selectedImage && (
          <div className="relative max-w-max rounded-xl overflow-hidden border border-amber-500/30 bg-zinc-900/40 p-2 mb-2 flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-800">
              <img src={selectedImage} alt="Attachment" className="w-full h-full object-cover" />
            </div>
            <div className="pr-8">
              <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-amber-500 block">Pending Attachment</span>
              <span className="text-[11px] text-zinc-400">Image file ready to transmit</span>
            </div>
            <button 
              type="button"
              onClick={() => setSelectedImage(null)}
              className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800/40 rounded-full transition-colors cursor-pointer border-none bg-none absolute top-1 right-1"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Emoji selectors popup panel inside message input wrapper */}
        <AnimatePresence>
          {showInputEmojiPicker && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-[#11152b] border border-zinc-800/80 p-3.5 rounded-2xl flex flex-wrap gap-2 mb-2 shadow-2xl relative z-40"
            >
              {['😊', '😂', '🔥', '👍', '❤️', '🎉', '🚀', '😍', '🤔', '🙌', '💯', '✨', '🥺', '😎', '💡', '⚠️'].map((emoji) => (
                <button 
                  type="button" 
                  key={emoji}
                  onClick={() => {
                    setInputMsg(prev => prev + emoji);
                    setShowInputEmojiPicker(false);
                  }}
                  className="text-lg bg-zinc-900/80 hover:bg-[#ffaa00] hover:text-[#060814] w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer border-none"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSendMessage} className="flex gap-2.5 items-center">
          
          {/* Emoji selection popup trigger */}
          <button 
            type="button"
            onClick={() => setShowInputEmojiPicker(!showInputEmojiPicker)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 border border-zinc-800/80 ${
              showInputEmojiPicker 
                ? 'bg-[#ffaa00]/15 border-[#ffaa00]/40 text-[#ffaa00]' 
                : 'bg-[#11152b] text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
            title="Select Emojis"
          >
            <Smile size={19} />
          </button>

          {/* Media / capture file selectors */}
          <div className="flex gap-1.5 shrink-0">
            {/* Hidden file input */}
            <input 
              type="file"
              id="advance-media-upload"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (reader.readyState === 2 && typeof reader.result === 'string') {
                      setSelectedImage(reader.result);
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
            />
            <button 
              type="button"
              onClick={() => document.getElementById('advance-media-upload')?.click()}
              className="w-11 h-11 bg-[#11152b] border border-zinc-800/85 text-zinc-400 hover:text-white hover:border-zinc-700 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Upload Image"
            >
              <Paperclip size={18} />
            </button>

            {/* Camera Capture option with mobile fallback */}
            <button 
              type="button"
              onClick={() => {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                  const mobileCameraInput = document.createElement('input');
                  mobileCameraInput.type = 'file';
                  mobileCameraInput.accept = 'image/*';
                  mobileCameraInput.setAttribute('capture', 'environment');
                  mobileCameraInput.onchange = (e: any) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') setSelectedImage(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  mobileCameraInput.click();
                } else {
                  // Fallback high quality imagery Mock
                  const mockCameraImages = [
                    "https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=600&auto=format&fit=crop&q=60",
                    "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=60",
                    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=60",
                    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=60"
                  ];
                  const randomPick = mockCameraImages[Math.floor(Math.random() * mockCameraImages.length)];
                  setSelectedImage(randomPick);
                }
              }}
              className="w-11 h-11 bg-[#11152b] border border-zinc-800/85 text-zinc-400 hover:text-white hover:border-zinc-700 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 flex"
              title="Capture Live Photo"
            >
              <Camera size={18} />
            </button>
          </div>

          <input 
            type="text" 
            placeholder="यहाँ अपना संदेश लिखें भाईसाहब..." 
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            className="flex-1 px-4 py-3.5 bg-[#11152b] border border-zinc-800/80 rounded-xl text-zinc-100 placeholder:text-zinc-500 text-[13px] font-sans font-medium outline-none transition-all focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
          />
          
          <button 
            type="submit"
            className="w-11 h-11 bg-[#ffaa00] hover:bg-amber-400 text-[#060814] border-none rounded-xl flex items-center justify-center font-extrabold text-[15px] cursor-pointer shadow-md shadow-amber-500/10 transition-all active:scale-[0.93] shrink-0"
            title="Transmit message vector"
          >
            ➤
          </button>
        </form>
      </footer>

    </div>
  );
};
