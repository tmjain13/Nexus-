import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, getDocs, updateDoc, deleteDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, collection, query, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { uploadFile } from '../services/storageService';
import { X, Camera, Settings, Users, ShieldAlert, LogOut, Edit, Check, UserPlus, Info, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import GroupMemberList from './GroupMemberList';

interface GroupInfoPanelProps {
  chatId: string;
  chatInfo: any;
  onClose: () => void;
}

export default function GroupInfoPanel({ chatId, chatInfo, onClose }: GroupInfoPanelProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(chatInfo.name || '');
  const [description, setDescription] = useState(chatInfo.description || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [contacts, setContacts] = useState<any[]>([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchContactQuery, setSearchContactQuery] = useState('');

  const admins = chatInfo.admins || [];
  const members = chatInfo.members || [];
  const createdBy = chatInfo.createdBy || '';
  const settings = chatInfo.settings || { onlyAdminsCanAdd: false, onlyAdminsCanEdit: false };

  const isMeAdmin = admins.includes(user?.uid || '');
  const isMeCreator = createdBy === user?.uid;
  const canEditInfo = !settings.onlyAdminsCanEdit || isMeAdmin;
  const canAddMembers = !settings.onlyAdminsCanAdd || isMeAdmin;

  useEffect(() => {
    setName(chatInfo.name || '');
    setDescription(chatInfo.description || '');
    setAvatarPreview(null);
    setAvatarFile(null);
  }, [chatInfo]);

  useEffect(() => {
    if (!user || !showAddMembers) return;
    const fetchContacts = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'users', user.uid, 'contacts')));
        setContacts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error loading contacts for addition:", err);
      }
    };
    fetchContacts();
  }, [user, showAddMembers]);

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

  const handleSaveChanges = async () => {
    if (!name.trim() || loading) return;
    setLoading(true);
    try {
      let finalAvatar = chatInfo.avatar || '';
      if (avatarFile) {
        finalAvatar = await uploadFile(avatarFile, `groupAvatars/${chatId}`);
      }

      await updateDoc(doc(db, 'chats', chatId), {
        name: name.trim(),
        description: description.trim(),
        avatar: finalAvatar,
        updatedAt: serverTimestamp()
      });

      // Send System message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: `${user?.displayName || 'Admin'} updated group details`,
        senderId: 'system',
        senderName: 'System',
        type: 'system',
        createdAt: serverTimestamp()
      });

      setIsEditing(false);
    } catch (err) {
      console.error("Error updating group info:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (key: 'onlyAdminsCanAdd' | 'onlyAdminsCanEdit') => {
    if (!isMeAdmin) return;
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        [`settings.${key}`]: !settings[key]
      });

      const settingLabel = key === 'onlyAdminsCanAdd' ? 'Add Members setting' : 'Edit Info setting';
      const settingVal = !settings[key] ? 'Admins Only' : 'Everyone';

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: `${user?.displayName || 'Admin'} updated "${settingLabel}" to "${settingVal}"`,
        senderId: 'system',
        senderName: 'System',
        type: 'system',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error toggling group setting:", err);
    }
  };

  const handleAddMember = async (targetContact: any) => {
    if (members.includes(targetContact.id)) return;
    setLoading(true);
    try {
      // 1. Add to group doc
      await updateDoc(doc(db, 'chats', chatId), {
        members: arrayUnion(targetContact.id),
        participants: arrayUnion(targetContact.id)
      });

      // 2. Fetch public key & write to memberKeys subcollection for group E2EE
      const userDocSnap = await getDoc(doc(db, 'users', targetContact.id));
      if (userDocSnap.exists()) {
        const pubKey = userDocSnap.data()?.publicKey;
        if (pubKey) {
          await setDoc(doc(db, 'chats', chatId, 'memberKeys', targetContact.id), {
            userId: targetContact.id,
            publicKey: pubKey,
            updatedAt: serverTimestamp()
          });
        }
      }

      // 3. Send system message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: `${user?.displayName || 'Member'} added ${targetContact.displayName} to the group`,
        senderId: 'system',
        senderName: 'System',
        type: 'system',
        createdAt: serverTimestamp()
      });

    } catch (err) {
      console.error("Error adding member:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!user) return;
    const confirmLeave = window.confirm("Are you sure you want to leave this group? You will no longer be able to read or write messages.");
    if (!confirmLeave) return;

    setLoading(true);
    try {
      const isOnlyMember = members.length <= 1;
      if (isOnlyMember) {
        await deleteDoc(doc(db, 'chats', chatId));
        onClose();
        return;
      }

      const isMeAdmin = admins.includes(user.uid);
      let updatedAdmins = admins.filter((id: string) => id !== user.uid);
      let updatedMembers = members.filter((id: string) => id !== user.uid);

      if (isMeAdmin && updatedAdmins.length === 0 && updatedMembers.length > 0) {
        // Auto-promote oldest member
        const oldestMember = updatedMembers[0];
        updatedAdmins.push(oldestMember);

        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          text: `User ${oldestMember.substring(0, 5)}... was automatically promoted to Admin since the last Admin left.`,
          senderId: 'system',
          senderName: 'System',
          type: 'system',
          createdAt: serverTimestamp()
        });
      }

      // Update doc
      await updateDoc(doc(db, 'chats', chatId), {
        members: updatedMembers,
        participants: updatedMembers,
        admins: updatedAdmins
      });

      // Send leave message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: `${user.displayName || 'Member'} left the group`,
        senderId: 'system',
        senderName: 'System',
        type: 'system',
        createdAt: serverTimestamp()
      });

      onClose();
    } catch (err) {
      console.error("Error leaving group:", err);
    } finally {
      setLoading(false);
    }
  };

  const addableContacts = contacts.filter(c => !members.includes(c.id) && 
    (c.displayName?.toLowerCase().includes(searchContactQuery.toLowerCase()) || 
     c.username?.toLowerCase().includes(searchContactQuery.toLowerCase()))
  );

  return (
    <div className={cn(
      "w-full md:w-80 h-full border-l flex flex-col shrink-0 overflow-hidden relative z-40 transition-colors duration-200",
      isDark ? "bg-[#0b0f12] border-zinc-900 text-zinc-150" : "bg-white border-zinc-200 text-zinc-900"
    )}>
      {/* Header */}
      <div className={cn(
        "px-5 py-4 border-b flex justify-between items-center shrink-0",
        isDark ? "border-zinc-900/50 bg-[#070b0e]" : "border-zinc-150 bg-zinc-50"
      )}>
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Group Controls</h3>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-500/10 cursor-pointer">
          <X size={16} />
        </button>
      </div>

      {/* Main Scroll Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Profile Card & Editing */}
        <div className="flex flex-col items-center text-center space-y-3.5">
          <div className="relative group">
            <img
              src={avatarPreview || chatInfo.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${chatInfo.name}`}
              alt={chatInfo.name}
              className="w-20 h-20 rounded-full border border-zinc-500/10 object-cover shadow-md"
            />
            {isEditing && (
              <label className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center cursor-pointer transition-opacity">
                <Camera size={18} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            )}
          </div>

          <div className="w-full space-y-2">
            {isEditing ? (
              <div className="space-y-2 text-left">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(
                    "w-full border rounded-xl py-2 px-3 text-xs outline-none focus:border-amber-500",
                    isDark ? "bg-zinc-900/40 border-zinc-800 text-zinc-250" : "bg-zinc-50 border-zinc-200 text-zinc-800"
                  )}
                  placeholder="Group Name"
                  maxLength={25}
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={cn(
                    "w-full border rounded-xl py-2 px-3 text-xs outline-none focus:border-amber-500 resize-none",
                    isDark ? "bg-zinc-900/40 border-zinc-800 text-zinc-250" : "bg-zinc-50 border-zinc-200 text-zinc-800"
                  )}
                  placeholder="Group Description (optional)"
                  rows={2}
                  maxLength={100}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-1.5 border border-zinc-500/20 rounded-lg text-[10px] uppercase font-bold text-zinc-400 cursor-pointer hover:bg-zinc-500/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="flex-1 py-1.5 bg-amber-500 text-black rounded-lg text-[10px] uppercase font-bold hover:bg-amber-600 cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2">
                  <h4 className="text-base font-bold tracking-tight">{chatInfo.name}</h4>
                  {canEditInfo && (
                    <button onClick={() => setIsEditing(true)} className="p-1 rounded text-zinc-500 hover:text-amber-500 cursor-pointer">
                      <Edit size={12} />
                    </button>
                  )}
                </div>
                {chatInfo.description && (
                  <p className="text-xs text-zinc-500 leading-normal max-w-xs">{chatInfo.description}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Member Addition Trigger */}
        {canAddMembers && (
          <div className="pt-2">
            <button
              onClick={() => setShowAddMembers(!showAddMembers)}
              className="w-full py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-amber-500/15 cursor-pointer transition-all"
            >
              <UserPlus size={14} />
              <span>Add Members</span>
            </button>
          </div>
        )}

        {/* Add Members Drawer */}
        {showAddMembers && (
          <div className={cn(
            "p-3 rounded-xl border space-y-3",
            isDark ? "bg-zinc-900/30 border-zinc-850" : "bg-zinc-50 border-zinc-200"
          )}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Add from Contacts</span>
              <button onClick={() => setShowAddMembers(false)} className="text-zinc-500 hover:text-zinc-200 cursor-pointer">
                <X size={12} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Filter contacts..."
              value={searchContactQuery}
              onChange={(e) => setSearchContactQuery(e.target.value)}
              className={cn(
                "w-full border focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-lg py-1.5 px-2.5 text-[11px] outline-none",
                isDark ? "bg-zinc-950 border-zinc-800 text-zinc-200" : "bg-white border-zinc-250 text-zinc-850"
              )}
            />
            <div className="space-y-1.5 max-h-36 overflow-y-auto divide-y divide-zinc-850/10">
              {addableContacts.length === 0 ? (
                <p className="text-center text-[10px] text-zinc-500 py-3">No contacts to add.</p>
              ) : (
                addableContacts.map(c => (
                  <div key={c.id} className="flex justify-between items-center py-1.5 first:pt-0">
                    <span className="text-xs font-semibold truncate max-w-[140px]">{c.displayName}</span>
                    <button
                      onClick={() => handleAddMember(c)}
                      className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-black rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Group Settings Section (Admin Only) */}
        {isMeAdmin && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-1">Security Settings</h4>
            <div className={cn(
              "rounded-xl border divide-y transition-colors",
              isDark ? "bg-zinc-900/20 border-zinc-900/50 divide-zinc-900/40" : "bg-zinc-50/50 border-zinc-100 divide-zinc-150"
            )}>
              <div className="flex items-center justify-between p-3">
                <div className="flex flex-col gap-0.5 max-w-[180px]">
                  <span className="text-xs font-semibold">Restrict Member Addition</span>
                  <span className="text-[9px] text-zinc-500">Only administrators can add members</span>
                </div>
                <button
                  onClick={() => toggleSetting('onlyAdminsCanAdd')}
                  className={cn(
                    "w-9 h-5 rounded-full transition-all relative flex items-center cursor-pointer",
                    settings.onlyAdminsCanAdd ? "bg-amber-500" : "bg-zinc-700"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full bg-black shadow-sm transition-all absolute",
                    settings.onlyAdminsCanAdd ? "right-0.5" : "left-0.5"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3">
                <div className="flex flex-col gap-0.5 max-w-[180px]">
                  <span className="text-xs font-semibold">Restrict Info Modification</span>
                  <span className="text-[9px] text-zinc-500">Only administrators can modify group details</span>
                </div>
                <button
                  onClick={() => toggleSetting('onlyAdminsCanEdit')}
                  className={cn(
                    "w-9 h-5 rounded-full transition-all relative flex items-center cursor-pointer",
                    settings.onlyAdminsCanEdit ? "bg-amber-500" : "bg-zinc-700"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full bg-black shadow-sm transition-all absolute",
                    settings.onlyAdminsCanEdit ? "right-0.5" : "left-0.5"
                  )} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Member Directory */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-1 flex justify-between">
            <span>Members ({members.length})</span>
            <span className="font-semibold text-zinc-500">Admins: {admins.length}</span>
          </h4>
          <GroupMemberList
            chatId={chatId}
            memberIds={members}
            admins={admins}
            createdBy={createdBy}
          />
        </div>

        {/* Leave Group Action */}
        <div className="pt-4 border-t border-zinc-500/10">
          <button
            onClick={handleLeaveGroup}
            disabled={loading}
            className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-500/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <LogOut size={13} />
            <span>Leave Group Chat</span>
          </button>
        </div>

      </div>
    </div>
  );
}
