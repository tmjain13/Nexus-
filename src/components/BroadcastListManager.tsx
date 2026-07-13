import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Plus, Trash2, ArrowLeft, Send, Users, Sparkles, BookTemplate, Info, BarChart2 } from 'lucide-react';
import { collection, getDocs, onSnapshot, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useBroadcasts, BroadcastList } from '../hooks/useBroadcasts';
import { BroadcastTemplates } from './BroadcastTemplates';
import { BroadcastAnalytics } from './BroadcastAnalytics';

interface BroadcastListManagerProps {
  onBack: () => void;
}

interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  photoURL?: string;
}

export function BroadcastListManager({ onBack }: BroadcastListManagerProps) {
  const { user } = useAuth();
  const { broadcastLists, loading, createBroadcastList, deleteBroadcastList, sendBroadcastMessage } = useBroadcasts();
  
  const [activeList, setActiveList] = useState<BroadcastList | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Wizard state
  const [newListName, setNewListName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  
  // Broadcast room state
  const [messageText, setMessageText] = useState('');
  const [sentBroadcasts, setSentBroadcasts] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedMsgForAnalytics, setSelectedMsgForAnalytics] = useState<string | null>(null);

  // Load all system users as potential recipients
  useEffect(() => {
    if (!user) return;
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const list: UserProfile[] = [];
        snap.forEach(docSnap => {
          if (docSnap.id !== user.uid) {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              displayName: data.displayName || 'Unnamed user',
              username: data.username || 'user',
              photoURL: data.photoURL
            });
          }
        });
        setAvailableUsers(list);
      } catch (err) {
        console.error("Error loading contacts list:", err);
      }
    };
    fetchUsers();
  }, [user]);

  // Load sent broadcast messages history when a list is active
  useEffect(() => {
    if (!activeList) {
      setSentBroadcasts([]);
      return;
    }

    const analyticsRef = collection(db, 'broadcasts', activeList.id, 'analytics');
    const q = query(analyticsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          text: data.text || '',
          createdAt: data.createdAt,
          recipients: data.recipients || []
        };
      });
      setSentBroadcasts(msgs);
    }, (error) => {
      console.error("Error loading broadcast messages history:", error);
    });

    return () => unsubscribe();
  }, [activeList]);

  const handleCreateList = async () => {
    if (!newListName.trim() || selectedUsers.length === 0) return;
    try {
      const listId = await createBroadcastList(newListName.trim(), selectedUsers);
      setNewListName('');
      setSelectedUsers([]);
      setIsCreating(false);
    } catch (e) {
      console.error("Error creating list:", e);
    }
  };

  const handleToggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSendMessage = async () => {
    if (!activeList || !messageText.trim()) return;
    const txt = messageText;
    setMessageText('');
    try {
      await sendBroadcastMessage(activeList.id, txt.trim());
    } catch (err) {
      console.error("Error broadcasting message:", err);
    }
  };

  const handleDeleteList = async (listId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to decommission this broadcast subnetwork? All historical analytics logs will be purged.")) {
      await deleteBroadcastList(listId);
      if (activeList?.id === listId) {
        setActiveList(null);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-zinc-100">
      <AnimatePresence>
        {/* VIEW 1: Active List Workspace (Broadcast Chat Room) */}
        {activeList ? (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col h-full"
          >
            {/* Room Header */}
            <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveList(null)}
                  className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl transition-colors border-0"
                  style={{ border: 'none', background: 'none' }}
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-100">{activeList.name}</h2>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-widest flex items-center gap-1">
                    <Users size={10} /> {activeList.recipients.length} Recipients fanned-out
                  </p>
                </div>
              </div>
            </div>

            {/* Broadcast Logs History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {sentBroadcasts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center max-w-xs mx-auto space-y-4">
                  <div className="w-12 h-12 bg-zinc-900/50 border border-zinc-850 rounded-2xl flex items-center justify-center text-zinc-600">
                    <Radio size={20} className="text-zinc-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Subnet Quiet</h3>
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-sans mt-1">
                      No broadcast packets have been dispatched on this list. Use the input below to initiate multi-destination fan-out.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="block text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest px-1">Sent Broadcast Packets</span>
                  {sentBroadcasts.map(bMsg => {
                    const readCount = bMsg.recipients?.filter((r: any) => r.status === 'read').length || 0;
                    const totalCount = bMsg.recipients?.length || activeList.recipients.length;
                    const rate = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0;

                    return (
                      <div 
                        key={bMsg.id}
                        onClick={() => setSelectedMsgForAnalytics(bMsg.id)}
                        className="p-4 bg-zinc-900/30 border border-zinc-900 hover:border-zinc-800 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                      >
                        <p className="text-xs text-zinc-300 leading-relaxed font-sans pr-4">{bMsg.text}</p>
                        
                        <div className="flex items-center justify-between pt-1 border-t border-zinc-950/40">
                          <span className="text-[9px] font-mono text-zinc-500">
                            {bMsg.createdAt?.toDate ? bMsg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase text-amber-500">
                              <BarChart2 size={10} />
                              <span>Read Rate: {rate}% ({readCount}/{totalCount})</span>
                            </div>
                            <span className="text-[9px] font-mono font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                              Details &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-zinc-900 bg-zinc-950">
              <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-850 rounded-2xl p-2 focus-within:border-zinc-800 transition-all">
                <button 
                  onClick={() => setShowTemplates(true)}
                  className="p-2 text-zinc-400 hover:text-amber-500 hover:bg-zinc-900 rounded-xl transition-all border-0"
                  style={{ border: 'none', background: 'none' }}
                  title="Insert Template"
                >
                  <BookTemplate size={16} />
                </button>
                
                <input 
                  type="text"
                  placeholder="Type payload to broadcast to all list contacts..."
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  className="flex-1 bg-transparent text-xs outline-none py-2 text-zinc-100 placeholder-zinc-600 font-sans"
                />

                <button 
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 text-black rounded-xl transition-all border-0"
                  style={{ border: 'none' }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>

            {/* Template selector overlay */}
            {showTemplates && (
              <BroadcastTemplates 
                isOpen={showTemplates}
                onClose={() => setShowTemplates(false)}
                onSelect={(content) => setMessageText(content)}
              />
            )}

            {/* Analytics details popup */}
            {selectedMsgForAnalytics && (
              <BroadcastAnalytics 
                broadcastId={activeList.id}
                messageId={selectedMsgForAnalytics}
                isOpen={!!selectedMsgForAnalytics}
                onClose={() => setSelectedMsgForAnalytics(null)}
              />
            )}
          </motion.div>
        ) : isCreating ? (
          /* VIEW 2: Create List Wizard */
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="flex flex-col h-full p-6 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsCreating(false)}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl transition-colors border-0"
                style={{ border: 'none', background: 'none' }}
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-100">Establish Broadcast Subnetwork</h2>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-widest">Create secure multicast fan-out channel</p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest px-1">Subnetwork Tag/Name</label>
                <input 
                  type="text"
                  placeholder="e.g., Security Taskforce Team"
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-900 focus:border-zinc-800 rounded-2xl p-4 text-xs font-mono outline-none text-zinc-100 placeholder-zinc-700 shadow-inner"
                />
              </div>

              {/* Contacts multi-select */}
              <div className="space-y-2.5 flex-1 flex flex-col">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Select Subnetwork Recipients</label>
                  <span className="text-[9px] font-mono text-amber-500 font-bold uppercase tracking-widest">{selectedUsers.length} Selected</span>
                </div>

                <div className="bg-zinc-900/10 border border-zinc-900 rounded-3xl p-4 space-y-2 overflow-y-auto max-h-60">
                  {availableUsers.length === 0 ? (
                    <div className="text-center py-6 text-[10px] font-mono text-zinc-600 uppercase">
                      No personnel nodes detected
                    </div>
                  ) : (
                    availableUsers.map(userItem => {
                      const isSelected = selectedUsers.includes(userItem.id);
                      return (
                        <div 
                          key={userItem.id}
                          onClick={() => handleToggleUserSelection(userItem.id)}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected 
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                              : 'bg-zinc-950/40 border-zinc-950 hover:bg-zinc-900/30 text-zinc-300'
                          }`}
                        >
                          <div>
                            <span className="block text-xs font-bold font-mono">{userItem.displayName}</span>
                            <span className="block text-[9px] text-zinc-500 font-mono">@{userItem.username}</span>
                          </div>
                          
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                            isSelected ? 'bg-amber-500 border-amber-500 text-black' : 'border-zinc-800 bg-zinc-905'
                          }`}>
                            {isSelected && <span className="text-[10px] font-bold">&check;</span>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setIsCreating(false)}
                className="flex-1 py-3 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 hover:bg-zinc-900 rounded-xl transition-all border-0 bg-none"
                style={{ border: 'none', background: 'none' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateList}
                disabled={!newListName.trim() || selectedUsers.length === 0}
                className="flex-1 py-3 bg-amber-500 text-black rounded-xl text-[10px] font-mono font-black uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-30 disabled:hover:bg-amber-500 shadow-lg shadow-amber-500/5 border-0"
                style={{ border: 'none' }}
              >
                Assemble Subnet
              </button>
            </div>
          </motion.div>
        ) : (
          /* VIEW 3: Lists Index Dashboard */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full"
          >
            {/* Index Header */}
            <div className="px-6 py-5 border-b border-zinc-900 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-3">
                <button 
                  onClick={onBack}
                  className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl transition-colors border-0"
                  style={{ border: 'none', background: 'none' }}
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-100">Broadcast Lists</h2>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-widest">Multicast secure packet delivery</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreating(true)}
                className="p-2 bg-amber-500 text-black rounded-xl hover:bg-amber-400 transition-colors border-0"
                style={{ border: 'none' }}
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Info Notice */}
            <div className="p-4 mx-6 mt-6 rounded-2xl bg-zinc-900/40 border border-zinc-900 flex gap-3 items-start">
              <Info size={14} className="text-amber-500/80 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                Broadcast lists allow you to send messages to multiple contacts simultaneously. The messages will appear as individual secure direct transmissions in each recipient's chat. Replies will be received individually.
              </p>
            </div>

            {/* Lists Index */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Synchronizing lists...</span>
                </div>
              ) : broadcastLists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center max-w-xs mx-auto space-y-4">
                  <div className="w-14 h-14 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-600">
                    <Radio size={22} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">No Active Broadcasts</h3>
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-sans mt-1">
                      You have not created any broadcast lists yet. Click the '+' button in the header to establish a multicast network.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <span className="block text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest px-1">Registered Broadcast Networks</span>
                  <div className="grid gap-3">
                    {broadcastLists.map(list => (
                      <div 
                        key={list.id}
                        onClick={() => setActiveList(list)}
                        className="p-4 bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 rounded-2xl hover:bg-zinc-900/60 transition-all cursor-pointer group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center text-amber-500">
                            <Radio size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-zinc-200 font-mono uppercase tracking-wide group-hover:text-amber-400 transition-colors">
                              {list.name}
                            </h4>
                            <span className="block text-[9px] text-zinc-500 font-mono mt-0.5 uppercase tracking-widest flex items-center gap-1">
                              <Users size={10} /> {list.recipients.length} Recipient nodes
                            </span>
                          </div>
                        </div>

                        <button 
                          onClick={(e) => handleDeleteList(list.id, e)}
                          className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-zinc-600 hover:text-red-400 rounded-xl transition-all border-0"
                          style={{ border: 'none', background: 'none' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
