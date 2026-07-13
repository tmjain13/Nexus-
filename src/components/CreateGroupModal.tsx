import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, serverTimestamp, query } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { uploadFile } from '../services/storageService';
import { X, Search, Users, Camera, Check, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (chatId: string) => void;
}

export default function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    
    const fetchContacts = async () => {
      try {
        setError(null);
        // Load contacts from /users/{uid}/contacts
        const q = query(collection(db, 'users', user.uid, 'contacts'));
        const snap = await getDocs(q);
        const contactList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setContacts(contactList);
        setFilteredContacts(contactList);
      } catch (err) {
        console.error("Failed to load contacts:", err);
        setError("Could not load contact directory.");
      }
    };

    fetchContacts();
    // Reset state
    setSelectedContactIds([]);
    setGroupName('');
    setGroupDesc('');
    setAvatarFile(null);
    setAvatarPreview(null);
  }, [isOpen, user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredContacts(
        contacts.filter(
          c => 
            (c.displayName && c.displayName.toLowerCase().includes(lower)) ||
            (c.username && c.username.toLowerCase().includes(lower))
        )
      );
    }
  }, [searchQuery, contacts]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSelectContact = (id: string) => {
    setSelectedContactIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim()) return;
    
    if (selectedContactIds.length < 1) {
      setError("Please select at least 1 contact (minimum 2 group members total).");
      return;
    }
    if (selectedContactIds.length > 255) {
      setError("Maximum 256 members allowed.");
      return;
    }
    if (groupName.length > 25) {
      setError("Group name must be 25 characters or less.");
      return;
    }
    if (groupDesc.length > 100) {
      setError("Description must be 100 characters or less.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create a dynamic chatId
      const newChatRef = doc(collection(db, 'chats'));
      const chatId = newChatRef.id;

      // 2. Handle group avatar
      let avatarUrl = '';
      if (avatarFile) {
        try {
          avatarUrl = await uploadFile(avatarFile, `groupAvatars/${chatId}`);
        } catch (uploadErr) {
          console.warn("Avatar upload failed, falling back to generated", uploadErr);
        }
      }
      
      if (!avatarUrl) {
        // Fallback: Combination Seed or Identicon
        avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(groupName)}`;
      }

      const allMembers = [user.uid, ...selectedContactIds];

      // 3. Save chat document in /chats/{chatId}
      const chatDocData = {
        type: 'group',
        name: groupName.trim(),
        description: groupDesc.trim() || '',
        avatar: avatarUrl,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        admins: [user.uid],
        members: allMembers,
        participants: allMembers, // For query backward compatibility
        settings: {
          onlyAdminsCanAdd: false,
          onlyAdminsCanEdit: false,
        },
        lastMessage: {
          text: `${user.displayName || 'Creator'} created this group`,
          createdAt: serverTimestamp(),
          senderId: 'system'
        }
      };

      await setDoc(newChatRef, chatDocData);

      // 4. Create initial system message inchats/{chatId}/messages
      const initialMsgRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(initialMsgRef, {
        text: `${user.displayName || 'Creator'} created the group "${groupName.trim()}"`,
        senderId: 'system',
        senderName: 'System',
        senderAvatar: '',
        type: 'system',
        createdAt: serverTimestamp()
      });

      // 5. Store member's public keys in chats/{chatId}/memberKeys/{userId} for E2EE exchange
      for (const memberId of allMembers) {
        try {
          const userDocSnap = await getDoc(doc(db, 'users', memberId));
          if (userDocSnap.exists()) {
            const pubKey = userDocSnap.data()?.publicKey;
            if (pubKey) {
              await setDoc(doc(db, 'chats', chatId, 'memberKeys', memberId), {
                userId: memberId,
                publicKey: pubKey,
                updatedAt: serverTimestamp()
              });
            }
          }
        } catch (err) {
          console.warn(`Could not sync public key for member ${memberId}:`, err);
        }
      }

      onSuccess(chatId);
    } catch (err: any) {
      console.error("Failed to create group:", err);
      setError(err?.message || "An unexpected error occurred during group deployment.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className={cn(
            "w-full max-w-lg rounded-2xl border flex flex-col shadow-2xl overflow-hidden max-h-[90vh]",
            isDark ? "bg-[#0b0f12] border-zinc-900 text-zinc-150" : "bg-white border-zinc-200 text-zinc-900"
          )}
        >
          {/* Header */}
          <div className={cn(
            "px-6 py-4.5 border-b flex justify-between items-center shrink-0",
            isDark ? "border-zinc-900/50" : "border-zinc-150"
          )}>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                <Users size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight">Create Secure Group</h3>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-0.5">Unified Communications Node</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className={cn(
                "p-2 rounded-full transition-colors cursor-pointer",
                isDark ? "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100" : "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800"
              )}
            >
              <X size={18} />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <Shield size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Avatar & Basic Info */}
            <div className="flex gap-4 items-start">
              <div className="relative group shrink-0">
                <div className={cn(
                  "w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden relative bg-zinc-900/30",
                  isDark ? "border-zinc-800" : "border-zinc-300"
                )}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-crop" />
                  ) : (
                    <Camera size={20} className="text-zinc-500" />
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <span className="text-[9px] text-white font-bold uppercase tracking-wide">Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>
              </div>
              
              <div className="flex-1 space-y-3.5">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-1 flex justify-between">
                    <span>Group Name <span className="text-amber-500">*</span></span>
                    <span className="text-zinc-500">{groupName.length}/25</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={25}
                    placeholder="Enter group name (required)"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className={cn(
                      "w-full border focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-xl py-2 px-3.5 text-xs font-normal outline-none transition-all mt-1",
                      isDark ? "bg-zinc-900/40 border-zinc-850 text-zinc-150 placeholder:text-zinc-600" : "bg-zinc-50 border-zinc-250 text-zinc-800 placeholder:text-zinc-400"
                    )}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-1 flex justify-between">
                    <span>Description</span>
                    <span className="text-zinc-500">{groupDesc.length}/100</span>
                  </label>
                  <textarea
                    maxLength={100}
                    placeholder="What is this group about? (optional)"
                    value={groupDesc}
                    onChange={(e) => setGroupDesc(e.target.value)}
                    rows={2}
                    className={cn(
                      "w-full border focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-xl py-2 px-3.5 text-xs font-normal outline-none transition-all resize-none mt-1",
                      isDark ? "bg-zinc-900/40 border-zinc-850 text-zinc-150 placeholder:text-zinc-600" : "bg-zinc-50 border-zinc-250 text-zinc-800 placeholder:text-zinc-400"
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Member Directory */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Select Members ({selectedContactIds.length} selected)
                </label>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  Min: 1 contact
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search contacts list..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "w-full border focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-xl py-2.5 pl-10 pr-4 text-xs font-normal outline-none transition-all",
                    isDark ? "bg-zinc-900/40 border-zinc-850 text-zinc-150" : "bg-zinc-50 border-zinc-250 text-zinc-850"
                  )}
                />
              </div>

              {/* Directory List */}
              <div className={cn(
                "border rounded-xl divide-y overflow-y-auto max-h-[220px]",
                isDark ? "border-zinc-850 divide-zinc-850/50 bg-zinc-900/10" : "border-zinc-200 divide-zinc-150 bg-zinc-50/50"
              )}>
                {filteredContacts.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs">
                    No contacts found matching search query.
                  </div>
                ) : (
                  filteredContacts.map(contact => {
                    const isSelected = selectedContactIds.includes(contact.id);
                    const photo = contact.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.username || contact.id}`;
                    return (
                      <div
                        key={contact.id}
                        onClick={() => toggleSelectContact(contact.id)}
                        className={cn(
                          "flex items-center gap-3.5 py-2.5 px-4 cursor-pointer transition-all hover:bg-amber-500/[0.02]",
                          isSelected && (isDark ? "bg-amber-500/5" : "bg-amber-500/10")
                        )}
                      >
                        <img src={photo} alt={contact.displayName} className="w-8.5 h-8.5 rounded-full object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold truncate">{contact.displayName}</h4>
                          {contact.username && (
                            <p className="text-[10px] text-zinc-500 truncate">@{contact.username}</p>
                          )}
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                          isSelected 
                            ? "bg-amber-500 border-amber-500 text-black" 
                            : (isDark ? "border-zinc-850 hover:border-zinc-750" : "border-zinc-300 hover:border-zinc-400")
                        )}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className={cn(
            "px-6 py-4.5 border-t shrink-0 flex gap-3",
            isDark ? "border-zinc-900/50 bg-[#070b0e]" : "border-zinc-150 bg-zinc-50"
          )}>
            <button
              onClick={onClose}
              disabled={loading}
              className={cn(
                "flex-1 py-3 border rounded-xl text-xs font-semibold tracking-wide hover:bg-zinc-100 transition-all cursor-pointer disabled:opacity-40",
                isDark ? "border-zinc-800 text-zinc-400 hover:bg-zinc-900" : "border-zinc-300 text-zinc-650 hover:bg-zinc-100"
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={loading || !groupName.trim() || selectedContactIds.length === 0}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Deploying...</span>
              ) : (
                <>
                  <span>Create Group</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
