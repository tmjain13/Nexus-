import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, User as UserIcon, MessageSquare, Calendar, ChevronRight } from 'lucide-react';
import { collection, query, getDocs, where, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'motion/react';

interface SearchResult {
  type: 'contact' | 'chat' | 'message';
  id: string;
  chatId?: string; // used for messages
  title: string;
  subtitle: string;
  photo?: string;
  timestamp?: Date;
}

export default function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'contacts' | 'chats' | 'messages'>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setResults([]);
      setActiveTab('all');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      performSearch();
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, activeTab]);

  const performSearch = async () => {
    if (!searchTerm || !user) return;
    setLoading(true);
    
    try {
      const term = searchTerm.toLowerCase().trim();
      let newResults: SearchResult[] = [];

      // 1. SEARCH CONTACTS (USERS)
      if (activeTab === 'all' || activeTab === 'contacts') {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (docSnap.id !== user.uid && data.displayName && data.displayName.toLowerCase().includes(term)) {
            newResults.push({
              type: 'contact',
              id: docSnap.id,
              title: data.displayName,
              subtitle: data.email || 'User Node',
              photo: data.photoURL
            });
          }
        });
      }

      // 2. SEARCH CHATS & GROUPS
      const chatsSnap = await getDocs(query(collection(db, 'chats'), where('participants', 'array-contains', user.uid)));
      const groupsSnap = await getDocs(query(collection(db, 'groupChat'), where('participants', 'array-contains', user.uid)));

      const activeChats: any[] = [
        ...chatsSnap.docs.map(doc => ({ id: doc.id, isGroup: false, ...doc.data() })),
        ...groupsSnap.docs.map(doc => ({ id: doc.id, isGroup: true, ...doc.data() }))
      ];

      if (activeTab === 'all' || activeTab === 'chats') {
        activeChats.forEach(chat => {
          const title = chat.groupName || chat.peerName || 'Encrypted Chat Sandbox';
          const isMatch = title.toLowerCase().includes(term);
          if (isMatch) {
            newResults.push({
              type: 'chat',
              id: chat.id,
              title: title,
              subtitle: chat.isGroup ? 'Group channel' : '1:1 direct channel',
              photo: chat.groupPhoto
            });
          }
        });
      }

      // 3. SEARCH MESSAGES (CROSS-CHAT)
      if (activeTab === 'all' || activeTab === 'messages') {
        // Parallel scan messages in each user's active chats/groups
        const messageFetchPromises = activeChats.map(async (chat) => {
          try {
            const pathName = chat.isGroup ? 'groupChat' : 'chats';
            const messagesRef = collection(db, pathName, chat.id, 'messages');
            
            // To be secure and performant, fetch recent messages and filter clientside
            const querySnap = await getDocs(query(messagesRef, orderBy('createdAt', 'desc'), limit(50)));
            
            const matchedMsgs: SearchResult[] = [];
            querySnap.docs.forEach(msgDoc => {
              const msgData = msgDoc.data();
              if (msgData.text && msgData.text.toLowerCase().includes(term) && msgData.text !== "[Encrypted Message]") {
                matchedMsgs.push({
                  type: 'message',
                  id: msgDoc.id,
                  chatId: chat.id,
                  title: chat.groupName || chat.peerName || 'Channel Message',
                  subtitle: `Message: "${msgData.text}"`,
                  photo: chat.groupPhoto,
                  timestamp: msgData.createdAt?.toDate ? msgData.createdAt.toDate() : undefined
                });
              }
            });
            return matchedMsgs;
          } catch (e) {
            console.warn(`Scan failed for chat ID: ${chat.id}`, e);
            return [];
          }
        });

        const messagesResults2D = await Promise.all(messageFetchPromises);
        messagesResults2D.forEach(list => {
          newResults.push(...list);
        });
      }

      setResults(newResults);
    } catch (err) {
      console.error("Global search framework error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (res: SearchResult) => {
    onClose();
    if (res.type === 'contact') navigate(`/profile/${res.id}`);
    if (res.type === 'chat') navigate(`/chats/${res.id}`);
    if (res.type === 'message') navigate(`/chats/${res.chatId}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-start pt-[10vh] px-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="bg-white dark:bg-[#111b21] w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
          onClick={e => e.stopPropagation()}
        >
          {/* Top Search bar */}
          <div className="flex items-center p-4 border-b border-zinc-150 dark:border-zinc-800 bg-white dark:bg-[#202c33]">
            <SearchIcon size={22} className="text-zinc-400 dark:text-[#aebac1] mr-3 shrink-0" />
            <input 
              type="text"
              autoFocus
              placeholder="Search global messages, user profiles, channels..."
              className="flex-1 bg-transparent outline-none font-sans font-medium text-15 text-zinc-900 dark:text-[#e9edef] placeholder:text-[#8696a0] p-1"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-[#e9edef] transition-colors bg-none border-none cursor-pointer">
              <X size={20} />
            </button>
          </div>

          {/* Search tabs / Categorization filters */}
          <div className="flex border-b border-zinc-150 dark:border-zinc-800 bg-[#fafafa] dark:bg-[#111b21] px-4 py-2 gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {([
              { key: 'all', label: 'All Results' },
              { key: 'contacts', label: 'Profiles & Contacts' },
              { key: 'chats', label: 'Groups & Rooms' },
              { key: 'messages', label: 'Message Texts' }
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-full cursor-pointer border-none transition-all ${
                  activeTab === tab.key 
                    ? 'bg-wa-primary text-white shadow-sm' 
                    : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-[#aebac1] hover:bg-zinc-200/50 dark:hover:bg-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search results body */}
          <div className="max-h-[55vh] overflow-y-auto p-3 bg-white dark:bg-[#111b21]">
            {loading ? (
              <div className="p-12 text-center text-zinc-500 dark:text-[#8696a0] text-sm font-sans flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-wa-primary/45 border-t-wa-primary rounded-full animate-spin" />
                <span>Running deep secure search...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {results.map((res, i) => (
                  <button 
                    key={i}
                    onClick={() => handleClick(res)}
                    className="flex items-center gap-4 p-3 hover:bg-zinc-50 dark:hover:bg-[#202c33] rounded-2xl transition-all text-left border-none bg-none w-full cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden border border-zinc-200/40 dark:border-zinc-700/30">
                      {res.photo ? (
                        <img src={res.photo} alt={res.title} className="w-full h-full object-cover" />
                      ) : res.type === 'chat' || res.type === 'message' ? (
                        <MessageSquare size={18} className="text-zinc-500 dark:text-[#8696a0]" />
                      ) : (
                        <UserIcon size={18} className="text-zinc-500 dark:text-[#8696a0]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-semibold text-zinc-900 dark:text-[#e9edef] truncate text-sm">{res.title}</h4>
                        {res.timestamp && (
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {res.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-[#8696a0] truncate font-medium leading-normal">{res.subtitle}</p>
                    </div>
                    <ChevronRight size={14} className="text-zinc-300 dark:text-zinc-600" />
                  </button>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="p-12 text-center text-zinc-500 dark:text-[#8696a0] text-sm">
                No signal matched "{searchTerm}" in `{activeTab}` index cache.
              </div>
            ) : (
              <div className="p-12 text-center text-zinc-500 dark:text-[#8696a0] text-sm flex flex-col items-center justify-center gap-3">
                <SearchIcon size={24} className="text-zinc-300 dark:text-zinc-700" />
                <span className="font-sans">Enter a query string above to inspect history, nodes and records.</span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
