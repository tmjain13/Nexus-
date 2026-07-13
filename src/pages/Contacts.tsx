import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  where,
  getDocs,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { 
  Search, 
  UserPlus, 
  MessageCircle, 
  X, 
  ChevronRight, 
  UserMinus, 
  Tag, 
  Plus, 
  Filter, 
  Check,
  MoreVertical,
  ArrowLeft,
  Camera,
  Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { QRCodeScanner } from '../components/QRCodeScanner';
import { InviteFriendsModal } from '../components/InviteFriendsModal';

export default function Contacts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [myContacts, setMyContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#25D366'); // Default wa-primary
  const [contactToCategorize, setContactToCategorize] = useState<any>(null);
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (searchParams.get('invite') === 'true') {
      setShowInviteModal(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const TAG_COLORS = [
    { name: 'Emerald', hex: '#25D366' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Rose', hex: '#f43f5e' },
    { name: 'Indigo', hex: '#6366f1' },
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'Slate', hex: '#64748b' },
  ];

  useEffect(() => {
    if (!user) return;

    // Fetch current user
    const unsubMe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) setCurrentUserProfile(docSnap.data());
    });

    // Fetch all users to "discover"
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => u.id !== user.uid);
      setAllUsers(users);
      setLoading(false);
    });

    // Fetch user's added contacts
    const unsubContacts = onSnapshot(collection(db, 'users', user.uid, 'contacts'), (snapshot) => {
      const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyContacts(contacts);
    });

    return () => {
      unsubMe();
      unsubUsers();
      unsubContacts();
    };
  }, [user]);

  const handleAddContact = async (targetUser: any) => {
// ... 
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'contacts', targetUser.id), {
        ...targetUser,
        addedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to add contact", err);
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'contacts', contactId));
      if (contactToCategorize?.id === contactId) setContactToCategorize(null);
    } catch (err) {
      console.error("Failed to remove contact", err);
    }
  };

  const handleAddCategory = async () => {
    if (!user || !newCategoryName.trim()) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        [`contactCategories.${newCategoryName.trim()}`]: newCategoryColor
      });
      setNewCategoryName('');
      setNewCategoryColor('#25D366');
      setShowCategoryModal(false);
    } catch (err) {
      console.error("Failed to add category", err);
    }
  };

  const setContactCategory = async (contactId: string, category: string | null) => {
    if (!user) return;
    try {
      const contactRef = doc(db, 'users', user.uid, 'contacts', contactId);
      await updateDoc(contactRef, {
        category: category
      });
      setContactToCategorize(null);
    } catch (err) {
      console.error("Failed to set contact category", err);
    }
  };

  const startChat = async (contact: any) => {
    if (!user) return;
    const chatId = [user.uid, contact.id].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);
    try {
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participants: [user.uid, contact.id],
          isGroup: false,
          peerName: contact.displayName,
          peerPhoto: contact.photoURL,
          updatedAt: serverTimestamp(),
        });
      }
      navigate(`/chats/${chatId}`);
    } catch (err) {
      console.warn("Failed to check or create chat, likely offline.", err);
      // Fallback: try navigating anyway, persistence might have the chat info if it existed
      navigate(`/chats/${chatId}`);
    }
  };

  const categories = ['All', ...Object.keys(currentUserProfile?.contactCategories || {})];

  const sortedContacts = [...myContacts]
    .filter(c => 
      !currentUserProfile?.blockedUsers?.includes(c.id) &&
      (c.displayName || c.username || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === 'All' || c.category === selectedCategory)
    )
    .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));

  const filteredDiscovery = allUsers.filter(u => 
    !myContacts.some(c => c.id === u.id) &&
    !currentUserProfile?.blockedUsers?.includes(u.id) &&
    (u.displayName || u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-[#111b21] font-sans overflow-hidden relative">
      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

      <header className="px-4 pt-4 pb-3 shrink-0 border-b border-zinc-200 dark:border-zinc-800 flex flex-col justify-center bg-white dark:bg-[#202c33] z-20">
        <div className="flex items-center gap-3.5 mb-2.5">
          <button 
            onClick={() => navigate('/chats')}
            className="p-1 -ml-1 text-[#54656f] dark:text-[#aebac1] hover:text-wa-primary transition-colors cursor-pointer"
            title="Back to chats"
            style={{ border: 'none', background: 'none' }}
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <h1 className="text-[19px] font-medium text-zinc-900 dark:text-[#e9edef] flex-1">Directory / Contacts</h1>
          
          <button 
            onClick={() => setShowScannerModal(true)}
            className="p-1.5 px-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-[#54656f] dark:text-[#aebac1] flex items-center gap-1.5 cursor-pointer"
            style={{ border: 'none', background: 'none' }}
            title="Scan QR Invite"
          >
            <Camera size={16} />
            <span className="text-[11px] font-medium hidden sm:inline">Scan QR</span>
          </button>

          <button 
            onClick={() => setShowInviteModal(true)}
            className="p-1.5 px-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            style={{ border: 'none' }}
            title="Invite friends"
          >
            <Gift size={16} />
            <span className="text-[11px] font-bold hidden sm:inline">Invite</span>
          </button>

          <button 
            onClick={() => setShowCategoryModal(true)}
            className="p-1.5 px-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-[#54656f] dark:text-[#aebac1] flex items-center gap-1.5 cursor-pointer"
            style={{ border: 'none', background: 'none' }}
          >
            <Tag size={16} />
            <span className="text-[11px] font-medium hidden sm:inline">New Group</span>
          </button>
        </div>
        
        <div className="relative mb-3.5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={16} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-[#111b21] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-[#e9edef] rounded-full py-2.5 pl-10 pr-4 text-[13px] font-medium focus:ring-1 focus:ring-wa-primary/40 focus:border-wa-primary outline-none transition-all placeholder:text-zinc-400 dark:placeholder-zinc-500 shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map(cat => {
            const catColor = currentUserProfile?.contactCategories?.[cat] || (cat === 'All' ? null : '#25D366');
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border transition-all whitespace-nowrap",
                  selectedCategory === cat 
                    ? "text-white shadow-lg" 
                    : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
                )}
                style={selectedCategory === cat ? { 
                  backgroundColor: catColor || '#25D366', 
                  borderColor: catColor || '#25D366',
                  boxShadow: `0 10px 15px -3px ${catColor}33`
                } : {}}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar relative z-0">
        {/* Fast Scroll Index */}
        <div className="absolute right-2 top-4 bottom-4 w-6 flex flex-col justify-between items-center z-10 hidden sm:flex">
          {alphabet.map(char => (
            <button key={char} className="text-[9px] font-mono font-bold text-zinc-400 hover:text-zinc-950 transition-colors uppercase">
              {char}
            </button>
          ))}
        </div>

        <section className="p-4">
          <div className="flex items-center justify-between mb-3 px-1">
             <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">My Contacts ({myContacts.length})</h3>
          </div>
          
          <div className="space-y-2">
            {sortedContacts.map((contact) => (
              <motion.div 
                key={contact.id} 
                layout
                className="flex items-center gap-4 bg-white p-2.5 rounded-xl border border-zinc-200 shadow-sm hover:border-zinc-300 transition-all group cursor-pointer"
                onClick={() => startChat(contact)}
              >
                <div className="relative shrink-0">
                  <img 
                    src={contact.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.username}`} 
                    className="w-10 h-10 rounded-full object-cover border border-zinc-200 bg-white"
                  />
                  {contact.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-wa-primary border-2 border-white rounded-full animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <h4 className="font-bold text-[14px] text-zinc-900 truncate leading-tight">{contact.displayName}</h4>
                        {contact.category && (
                          <span 
                            className="inline-block mt-0.5 text-[8px] font-mono font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                            style={{ 
                              backgroundColor: `${currentUserProfile?.contactCategories?.[contact.category] || '#25D366'}20`,
                              color: currentUserProfile?.contactCategories?.[contact.category] || '#25D366'
                            }}
                          >
                            {contact.category}
                          </span>
                        )}
                    </div>
                    {contact.lastSeen && !contact.isOnline && (
                      <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-tighter shrink-0">
                        {formatDistanceToNow(contact.lastSeen.toDate(), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5 truncate">{contact.about || "My Messenger User"}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setContactToCategorize(contact); }}
                        className="p-2 text-zinc-400 hover:text-wa-primary hover:bg-wa-primary/10 rounded-lg transition-all"
                    >
                        <Tag size={16} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleRemoveContact(contact.id); }}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                        <UserMinus size={16} />
                    </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="px-4 pb-24 mt-2">
          <h3 className="text-[10px] font-mono font-bold text-zinc-950 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-zinc-950 rounded-full" />
            Discover
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {filteredDiscovery.map((u) => (
              <motion.div 
                key={u.id}
                className="flex items-center gap-4 bg-white p-3 rounded-xl border border-transparent shadow-sm hover:border-zinc-300 transition-all group"
              >
                <div className="relative shrink-0">
                  <img 
                    src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} 
                    className="w-10 h-10 rounded-full border border-zinc-200 object-cover shadow-sm bg-white"
                  />
                  {u.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-wa-primary border-2 border-white rounded-full animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                   <h4 className="font-bold text-[14px] text-zinc-900 truncate">{u.displayName}</h4>
                   <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-0.5">@{u.username}</p>
                </div>
                <button 
                  onClick={() => handleAddContact(u)}
                  className="p-2.5 bg-zinc-900 text-white rounded-lg shadow-sm hover:bg-zinc-800 active:scale-95 transition-all text[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-1"
                >
                  <UserPlus size={14} /> Add
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Category Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xs bg-white dark:bg-zinc-950 rounded-[32px] overflow-hidden shadow-2xl border border-zinc-100"
            >
              <div className="p-6 text-center">
                <Tag className="mx-auto text-wa-primary mb-3" size={32} />
                <h2 className="text-lg font-bold text-zinc-900 mb-1">New Category</h2>
                <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-6">Define a custom contact group</p>
                
                <input 
                  type="text"
                  placeholder="Group Name (e.g. Work)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-wa-primary/10 transition-all font-bold mb-4"
                />

                <div className="space-y-2 mb-6">
                  <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block text-left px-1">Assign Color Signal</label>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => setNewCategoryColor(color.hex)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all border-2",
                          newCategoryColor === color.hex ? "border-zinc-900 scale-110 shadow-lg" : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 hover:bg-zinc-50 rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    className="flex-1 py-3 bg-wa-primary text-white rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest shadow-lg disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Categorize Contact Modal */}
      <AnimatePresence>
        {contactToCategorize && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setContactToCategorize(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl border border-zinc-100"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <img src={contactToCategorize.photoURL} className="w-12 h-12 rounded-full" />
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 leading-tight">{contactToCategorize.displayName}</h2>
                    <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Select Category</p>
                  </div>
                </div>

                <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-2 mb-6 no-scrollbar">
                  <button
                    onClick={() => setContactCategory(contactToCategorize.id, null)}
                    className={cn(
                      "w-full p-4 rounded-2xl border flex items-center justify-between transition-all group",
                      !contactToCategorize.category ? "border-wa-primary bg-wa-primary/5" : "border-zinc-100 hover:bg-zinc-50"
                    )}
                  >
                    <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Uncategorized</span>
                    {!contactToCategorize.category && <Check size={16} className="text-wa-primary" />}
                  </button>

                  {Object.keys(currentUserProfile?.contactCategories || {}).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setContactCategory(contactToCategorize.id, cat)}
                      className={cn(
                        "w-full p-4 rounded-2xl border flex items-center justify-between transition-all",
                        contactToCategorize.category === cat ? "border-wa-primary bg-wa-primary/5" : "border-zinc-100 hover:bg-zinc-50"
                      )}
                    >
                      <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">{cat}</span>
                      {contactToCategorize.category === cat && <Check size={16} className="text-wa-primary" />}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setContactToCategorize(null)}
                  className="w-full py-4 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 hover:bg-zinc-50 rounded-2xl transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Friends Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteFriendsModal 
            onClose={() => setShowInviteModal(false)}
            onToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* QR Code Scanner Modal */}
      <AnimatePresence>
        {showScannerModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <QRCodeScanner 
              onClose={() => setShowScannerModal(false)}
              onSuccess={(name) => showToast(`Added contact: ${name}!`, "success")}
              onError={(err) => showToast(err, "error")}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Custom Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-2xl shadow-xl border text-[11px] font-mono uppercase tracking-wider font-extrabold flex items-center gap-2",
              toast.type === 'success' 
                ? "bg-emerald-550 border-emerald-500 text-white" 
                : "bg-red-550 border-red-500 text-white"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
