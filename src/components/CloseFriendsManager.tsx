import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useCloseFriends } from '../hooks/useCloseFriends';
import { useCloseFriendSuggestions } from '../hooks/useCloseFriendSuggestions';
import { Search, Heart, UserMinus, UserPlus, X, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

export function CloseFriendsManager() {
  const { user } = useAuth();
  const { list: closeFriends, add: addCloseFriend, remove: removeCloseFriend, loading: loadingCF } = useCloseFriends();
  const { suggestions, loading: loadingAI, refresh: refreshSuggestions, dismiss: dismissSuggestion } = useCloseFriendSuggestions();

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Load all users on the platform to map user details
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter((u: any) => u.id !== user.uid);
      setAllUsers(usersList);
    });
    return () => unsubscribe();
  }, [user]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Helper to get user profile details by ID
  const getUserDetails = (userId: string) => {
    const found = allUsers.find(u => u.id === userId);
    return found || {
      displayName: "Unknown Cadet",
      username: "unknown",
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
    };
  };

  // Filter users to search and add
  const filteredUsers = allUsers.filter(u => {
    const isCF = closeFriends.some(cf => cf.userId === u.id);
    if (isCF) return false; // Hide if already in close friends
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (u.displayName || '').toLowerCase().includes(searchLower) ||
      (u.username || '').toLowerCase().includes(searchLower)
    );
  });

  const handleAdd = async (userId: string, addedBy: 'manual' | 'ai-suggested' = 'manual') => {
    try {
      await addCloseFriend(userId, addedBy);
      showToast("Added to Close Friends list", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to add friend", "error");
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await removeCloseFriend(userId);
      showToast("Removed from Close Friends list", "success");
    } catch (err) {
      showToast("Failed to remove friend", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto p-1 text-zinc-100 font-sans">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold shadow-xl z-50 flex items-center gap-2 border ${
              toast.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-950/90 border-rose-500/30 text-rose-300'
            }`}
          >
            {toast.type === 'success' ? <Heart size={14} className="fill-emerald-400 text-emerald-400 animate-pulse" /> : <X size={14} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header Card */}
      <div className="bg-gradient-to-r from-emerald-950/20 via-zinc-900/60 to-emerald-950/20 border border-emerald-500/15 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center">
            <Heart size={24} className="fill-emerald-500 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-zinc-200">Close Friends Enclave</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Share exclusive statuses, bypass Peace Mode triggers, and set priority signals.</p>
          </div>
        </div>
      </div>

      {/* AI Suggestion Deck */}
      <div className="bg-zinc-900/20 border border-zinc-850 rounded-3xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500 animate-pulse" />
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-300">AI Auto-Suggestions</span>
          </div>
          <button
            onClick={refreshSuggestions}
            disabled={loadingAI}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/40 text-[10px] font-bold font-mono uppercase tracking-widest text-zinc-300 rounded-xl transition-all disabled:opacity-50"
          >
            {loadingAI ? (
              <Loader2 size={12} className="animate-spin text-amber-500" />
            ) : (
              <RefreshCw size={12} className="text-zinc-400" />
            )}
            Refresh
          </button>
        </div>

        {suggestions.length > 0 ? (
          <div className="flex flex-col gap-3 mt-1">
            {suggestions.map((suggestion) => {
              const details = getUserDetails(suggestion.userId);
              return (
                <motion.div
                  key={suggestion.userId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/40 border border-emerald-500/10 rounded-2xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={details.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${details.username}`}
                      alt={details.displayName}
                      className="w-11 h-11 rounded-xl object-cover bg-slate-700"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-200 truncate">{details.displayName}</span>
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                          <Sparkles size={8} className="fill-amber-400" /> AI
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono mt-1 leading-relaxed">
                        {suggestion.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAdd(suggestion.userId, 'ai-suggested')}
                      className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => dismissSuggestion(suggestion.userId)}
                      className="p-1.5 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 rounded-xl transition-colors"
                      title="Dismiss suggestion for 30 days"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] text-zinc-500 italic font-mono uppercase tracking-wide text-center py-2">
            {loadingAI ? "Analyzing quantum resonance matrices..." : "Start chatting to get AI close friends suggestions."}
          </p>
        )}
      </div>

      {/* Search and Add Friends */}
      <div className="bg-zinc-900/20 border border-zinc-850 rounded-3xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Search size={15} className="text-zinc-500" />
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-300">Add contacts ({closeFriends.length}/50)</span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, username or secure freq index..."
            className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-800 focus:border-emerald-500/50 rounded-2xl pl-11 pr-4 py-3 text-xs font-mono text-zinc-200 focus:outline-none transition-colors"
          />
          <Search size={14} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" />
        </div>

        {searchTerm && (
          <div className="max-h-60 overflow-y-auto border border-zinc-850 bg-zinc-950/80 rounded-2xl divide-y divide-zinc-850/50 no-scrollbar">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3.5 hover:bg-zinc-900/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                      alt={u.displayName}
                      className="w-9 h-9 rounded-xl object-cover bg-zinc-800"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">{u.displayName}</h4>
                      <p className="text-[10px] font-mono text-zinc-500">@{u.username}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdd(u.id, 'manual')}
                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 rounded-xl transition-all"
                  >
                    <UserPlus size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-zinc-500 italic font-mono uppercase tracking-wide text-center py-4">
                No matching cadets found in search matrix.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Current Close Friends List */}
      <div className="bg-zinc-900/20 border border-zinc-850 rounded-3xl p-5 flex flex-col gap-4">
        <span className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-300">
          Current Enclave ({closeFriends.length})
        </span>

        {closeFriends.length > 0 ? (
          <div className="flex flex-col divide-y divide-zinc-850/50">
            {closeFriends.map((cf) => {
              const details = getUserDetails(cf.userId);
              const addedDate = cf.addedAt?.seconds 
                ? formatDistanceToNow(cf.addedAt.seconds * 1000, { addSuffix: true }) 
                : "recently";

              return (
                <div key={cf.userId} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <img
                      src={details.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${details.username}`}
                      alt={details.displayName}
                      className="w-11 h-11 rounded-xl object-cover bg-zinc-800"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                        {details.displayName}
                        {cf.addedBy === 'ai-suggested' && (
                          <span className="text-[8px] font-bold font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/15" title="Added via AI auto-suggestion">
                            AI
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] font-mono text-zinc-500">
                        Added {addedDate}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(cf.userId)}
                    className="p-1.5 bg-zinc-800/60 hover:bg-rose-500/15 text-zinc-400 hover:text-rose-400 border border-transparent hover:border-rose-500/20 rounded-xl transition-all"
                    title="Remove from Close Friends"
                  >
                    <UserMinus size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Heart size={32} className="text-zinc-700 stroke-dasharray mb-2.5" />
            <p className="text-[11px] text-zinc-500 italic font-mono uppercase tracking-wide">
              No intimate protocols configured.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
