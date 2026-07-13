import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, ShieldAlert, UserMinus, UserPlus, Check, Search } from 'lucide-react';
import { cn } from '../lib/utils';

interface MemberProfile {
  id: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  isOnline?: boolean;
}

interface GroupMemberListProps {
  chatId: string;
  memberIds: string[];
  admins: string[];
  createdBy: string;
  onClose?: () => void;
}

export default function GroupMemberList({ chatId, memberIds, admins, createdBy, onClose }: GroupMemberListProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    if (memberIds.length === 0) return;

    // Listen to profile updates in real-time for all group members
    const unsubs = memberIds.map(memberId => {
      return onSnapshot(doc(db, 'users', memberId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfiles(prev => {
            const filtered = prev.filter(p => p.id !== memberId);
            return [...filtered, {
              id: memberId,
              displayName: data.displayName || 'Anonymous User',
              username: data.username || '',
              photoURL: data.photoURL || '',
              isOnline: data.isOnline || false,
            }];
          });
        } else {
          // Add basic profile if user snapshot doesn't exist
          setProfiles(prev => {
            if (prev.some(p => p.id === memberId)) return prev;
            return [...prev, { id: memberId, displayName: 'User ' + memberId.substring(0, 5) }];
          });
        }
      });
    });

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [memberIds]);

  const isCurrentUserAdmin = admins.includes(user?.uid || '');

  const handlePromote = async (targetId: string) => {
    if (!chatId || loadingAction) return;
    setLoadingAction(`promote-${targetId}`);
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        admins: arrayUnion(targetId)
      });
    } catch (err) {
      console.error("Failed to promote user to admin:", err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRemove = async (targetId: string) => {
    if (!chatId || loadingAction) return;
    if (targetId === createdBy) {
      alert("The group creator cannot be removed.");
      return;
    }
    
    setLoadingAction(`remove-${targetId}`);
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        members: arrayRemove(targetId),
        participants: arrayRemove(targetId),
        admins: arrayRemove(targetId)
      });
    } catch (err) {
      console.error("Failed to remove member:", err);
    } finally {
      setLoadingAction(null);
    }
  };

  const filteredProfiles = profiles
    .filter(p => 
      p.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Creator first, then admins, then alphabetical
      if (a.id === createdBy) return -1;
      if (b.id === createdBy) return 1;
      const aAdmin = admins.includes(a.id);
      const bAdmin = admins.includes(b.id);
      if (aAdmin && !bAdmin) return -1;
      if (!aAdmin && bAdmin) return 1;
      return a.displayName.localeCompare(b.displayName);
    });

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search group members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "w-full border focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-xl py-2 pl-10 pr-4 text-xs font-normal outline-none transition-all",
            isDark ? "bg-zinc-900/40 border-zinc-850 text-zinc-200" : "bg-zinc-50 border-zinc-250 text-zinc-850"
          )}
        />
      </div>

      {/* Member List */}
      <div className="space-y-2.5">
        {filteredProfiles.map(profile => {
          const isCreator = profile.id === createdBy;
          const isAdmin = admins.includes(profile.id);
          const isMe = profile.id === user?.uid;
          const isTargetOnline = profile.isOnline;

          const photo = profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username || profile.id}`;

          return (
            <div
              key={profile.id}
              className={cn(
                "flex items-center gap-3.5 py-2.5 px-3 rounded-xl border transition-all",
                isDark ? "bg-zinc-900/15 border-zinc-900/30" : "bg-zinc-50/50 border-zinc-100"
              )}
            >
              {/* Profile Photo & Online Indicator */}
              <div className="relative shrink-0">
                <img src={photo} alt={profile.displayName} className="w-9 h-9 rounded-full object-cover border border-zinc-500/10" />
                <div className={cn(
                  "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2",
                  isDark ? "border-[#0b0f12]" : "border-white",
                  isTargetOnline ? "bg-green-500" : "bg-zinc-400"
                )} />
              </div>

              {/* Display Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold truncate leading-none">
                    {profile.displayName} {isMe && <span className="opacity-60 font-normal text-[10px]">(You)</span>}
                  </span>
                </div>
                {profile.username && (
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">@{profile.username}</p>
                )}
              </div>

              {/* Badges and Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Role Badges */}
                {isCreator ? (
                  <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Creator
                  </span>
                ) : isAdmin ? (
                  <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                    <Shield size={9} />
                    <span>Admin</span>
                  </span>
                ) : null}

                {/* Admin Control Actions */}
                {isCurrentUserAdmin && !isMe && (
                  <div className="flex items-center gap-1">
                    {/* Promote Action */}
                    {!isAdmin && (
                      <button
                        onClick={() => handlePromote(profile.id)}
                        disabled={loadingAction !== null}
                        title="Promote to Admin"
                        className={cn(
                          "p-1.5 rounded-lg border transition-all cursor-pointer",
                          isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-blue-400" : "border-zinc-200 hover:bg-zinc-100 text-zinc-550 hover:text-blue-600"
                        )}
                      >
                        <Shield size={13} />
                      </button>
                    )}

                    {/* Remove Action */}
                    {!isCreator && (
                      <button
                        onClick={() => handleRemove(profile.id)}
                        disabled={loadingAction !== null}
                        title="Remove Member"
                        className={cn(
                          "p-1.5 rounded-lg border transition-all cursor-pointer",
                          isDark ? "border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-red-400" : "border-zinc-200 hover:bg-zinc-100 text-zinc-550 hover:text-red-600"
                        )}
                      >
                        <UserMinus size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
