import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Search, ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useScheduledMessages, ScheduledMessage } from '../hooks/useScheduledMessages';
import { ScheduledMessageItem } from './ScheduledMessageItem';
import { SchedulePicker } from './SchedulePicker';

interface ScheduledMessagesScreenProps {
  onBack: () => void;
}

export function ScheduledMessagesScreen({ onBack }: ScheduledMessagesScreenProps) {
  const { user } = useAuth();
  const { scheduled, loading, cancelScheduled, editScheduled, sendScheduledNow } = useScheduledMessages();
  const [chatNames, setChatNames] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMsg, setEditingMsg] = useState<ScheduledMessage | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  // Resolve chat names dynamically
  useEffect(() => {
    if (!user) return;

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const map: Record<string, string> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.isGroup || data.type === 'group') {
          map[doc.id] = data.groupName || data.name || 'Multicast Group';
        } else {
          // Find the peer participant (not current user)
          const peerId = data.participants?.find((p: string) => p !== user.uid);
          map[doc.id] = data.peerName || data.name || `Direct Channel (${peerId?.substring(0, 5)})`;
        }
      });
      setChatNames(map);
    }, (err) => {
      console.error("Error loading chat names map:", err);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredMessages = scheduled.filter(msg => {
    const chatName = chatNames[msg.chatId] || 'Secure Channel';
    return (
      msg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chatName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleEditClick = (msg: ScheduledMessage) => {
    setEditingMsg(msg);
    setShowPicker(true);
  };

  const handleReschedule = (newDate: Date, recurrence: { frequency: 'daily' | 'weekly' | 'monthly' } | null) => {
    if (editingMsg) {
      editScheduled(editingMsg.id, { 
        scheduledAt: newDate, 
        recurrence 
      }, editingMsg.chatId);
      setEditingMsg(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-zinc-100">
      {/* Header */}
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
            <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-zinc-100">Transmission Dispatch Queue</h2>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-widest">Global scheduled messages log</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/15 rounded-full font-mono text-[9px] font-bold uppercase tracking-widest">
          <Clock size={10} className="animate-pulse" />
          <span>{scheduled.length} Queued</span>
        </div>
      </div>

      {/* Search area */}
      <div className="p-4 border-b border-zinc-900 bg-zinc-950/40">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-3.5 text-zinc-500" />
          <input 
            type="text"
            placeholder="Search pending transmissions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-900 focus:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none transition-all placeholder-zinc-600 font-mono text-zinc-100"
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Connecting to transceiver...</span>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center max-w-xs mx-auto space-y-4">
            <div className="w-14 h-14 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-600">
              <Calendar size={22} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">No Transmissions Logged</h3>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-sans mt-1">
                {searchQuery ? "No pending despatches match your search filters." : "You do not have any scheduled transmissions queued at this moment."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3.5">
            {filteredMessages.map(msg => (
              <ScheduledMessageItem 
                key={msg.id}
                message={msg}
                chatName={chatNames[msg.chatId] || 'Secure Channel'}
                onSendNow={sendScheduledNow}
                onCancel={(id, cid) => cancelScheduled(id, cid)}
                onEdit={handleEditClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Picker Modal for Rescheduling */}
      <AnimatePresence>
        {showPicker && editingMsg && (
          <SchedulePicker 
            isOpen={showPicker}
            onClose={() => {
              setShowPicker(false);
              setEditingMsg(null);
            }}
            onSchedule={handleReschedule}
            peerName={chatNames[editingMsg.chatId] || 'Secure Channel'}
            peerId={editingMsg.chatId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
