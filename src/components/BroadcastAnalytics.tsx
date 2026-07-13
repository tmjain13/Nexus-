import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, CheckCheck, Clock, Bell, X, ShieldAlert } from 'lucide-react';
import { doc, onSnapshot, getDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useBroadcasts, BroadcastAnalytics as BroadcastAnalyticsType, BroadcastRecipientStatus } from '../hooks/useBroadcasts';

interface BroadcastAnalyticsProps {
  broadcastId: string;
  messageId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ResolvedRecipient extends BroadcastRecipientStatus {
  userName: string;
}

export function BroadcastAnalytics({ broadcastId, messageId, isOpen, onClose }: BroadcastAnalyticsProps) {
  const { user } = useAuth();
  const { remindNonReaders } = useBroadcasts();
  const [analytics, setAnalytics] = useState<BroadcastAnalyticsType | null>(null);
  const [resolvedRecipients, setResolvedRecipients] = useState<ResolvedRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);

  useEffect(() => {
    if (!isOpen || !broadcastId || !messageId) return;

    setLoading(true);
    setReminderSent(false);

    // 1. Listen to master analytics document
    const analyticsRef = doc(db, 'broadcasts', broadcastId, 'analytics', messageId);
    const unsubAnalytics = onSnapshot(analyticsRef, async (docSnap) => {
      if (!docSnap.exists()) {
        setLoading(false);
        return;
      }

      const data = docSnap.data() as BroadcastAnalyticsType;
      setAnalytics(data);

      // 2. Resolve recipient names and live message statuses
      const resolvedList: ResolvedRecipient[] = [];

      for (const recipient of data.recipients) {
        let liveStatus = recipient.status;
        let readAt = recipient.readAt;
        let deliveredAt = recipient.deliveredAt;

        try {
          // Listen/fetch live status from the actual message
          const msgRef = doc(db, 'chats', recipient.chatId, 'messages', recipient.messageId);
          const msgSnap = await getDoc(msgRef);
          if (msgSnap.exists()) {
            const msgData = msgSnap.data();
            // In typical chats, read status is indicated by status === 'read' or readBy contains peerId
            const isRead = msgData.status === 'read' || msgData.readBy?.includes(recipient.userId);
            const isDelivered = isRead || msgData.status === 'delivered' || msgData.deliveredTo?.includes(recipient.userId);

            if (isRead) {
              liveStatus = 'read';
              readAt = msgData.readAt || msgData.createdAt; // fallback to approximate time
            } else if (isDelivered) {
              liveStatus = 'delivered';
              deliveredAt = msgData.deliveredAt || msgData.createdAt;
            } else {
              liveStatus = 'sent';
            }
          }

          // Fetch recipient user profile name
          const userRef = doc(db, 'users', recipient.userId);
          const userSnap = await getDoc(userRef);
          const userName = userSnap.exists() ? (userSnap.data().displayName || userSnap.data().username) : `User ${recipient.userId.substring(0, 5)}`;

          resolvedList.push({
            ...recipient,
            status: liveStatus,
            readAt,
            deliveredAt,
            userName
          });
        } catch (e) {
          console.error("Error resolving recipient live details:", e);
          resolvedList.push({
            ...recipient,
            userName: `User ${recipient.userId.substring(0, 5)}`
          });
        }
      }

      setResolvedRecipients(resolvedList);
      setLoading(false);
    }, (err) => {
      console.error("Error loading broadcast analytics:", err);
      setLoading(false);
    });

    return () => unsubAnalytics();
  }, [isOpen, broadcastId, messageId]);

  if (!isOpen) return null;

  // Calculate stats
  const totalRecipients = resolvedRecipients.length;
  const readCount = resolvedRecipients.filter(r => r.status === 'read').length;
  const deliveredCount = resolvedRecipients.filter(r => r.status === 'read' || r.status === 'delivered').length;
  const pendingCount = totalRecipients - deliveredCount;

  const readPercentage = totalRecipients > 0 ? Math.round((readCount / totalRecipients) * 100) : 0;
  const deliveredPercentage = totalRecipients > 0 ? Math.round((deliveredCount / totalRecipients) * 100) : 0;

  // Chart data
  const chartData = [
    { name: 'Pending', count: pendingCount, color: '#4b5563' }, // gray-600
    { name: 'Delivered', count: deliveredCount - readCount, color: '#3b82f6' }, // blue-500
    { name: 'Read', count: readCount, color: '#f59e0b' } // amber-500
  ];

  const handleSendReminder = async () => {
    setSendingReminder(true);
    try {
      await remindNonReaders(
        broadcastId, 
        messageId, 
        `REMINDER: Did you review the previous transmission: "${analytics?.text ? (analytics.text.substring(0, 40) + '...') : ''}"? Please acknowledge.`
      );
      setReminderSent(true);
    } catch (e) {
      console.error("Reminder failure:", e);
    } finally {
      setSendingReminder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/10">
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-mono">Transmission Intelligence</h3>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-widest">Real-time delivery receipts & analytics</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg transition-colors border-0"
            style={{ border: 'none', background: 'none' }}
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Resolving receipt status...</span>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-6 space-y-6">
            {/* Original Message Preview */}
            <div className="p-4 bg-zinc-900/20 rounded-2xl border border-zinc-900/60 space-y-1.5">
              <span className="block text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Broadcast Payload</span>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">{analytics?.text}</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3.5">
              <div className="p-4 bg-zinc-900/30 border border-zinc-900 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Recipients</span>
                  <Users size={12} />
                </div>
                <div className="mt-3">
                  <span className="block text-2xl font-bold font-mono text-zinc-100">{totalRecipients}</span>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Subscribers</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/30 border border-zinc-900 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Delivered</span>
                  <Clock size={12} className="text-blue-500" />
                </div>
                <div className="mt-3">
                  <span className="block text-2xl font-bold font-mono text-zinc-100">{deliveredPercentage}%</span>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">{deliveredCount} of {totalRecipients}</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/30 border border-zinc-900 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Read Rate</span>
                  <CheckCheck size={12} className="text-amber-500" />
                </div>
                <div className="mt-3">
                  <span className="block text-2xl font-bold font-mono text-zinc-100">{readPercentage}%</span>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">{readCount} of {totalRecipients}</span>
                </div>
              </div>
            </div>

            {/* Visual Charts */}
            <div className="h-44 bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 flex flex-col">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-4">Receipt Distribution</span>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }} width={70} />
                    <Bar dataKey="count" radius={6} barSize={14}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recipients List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Recipient Logs</span>
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Live Sync Status</span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
                {resolvedRecipients.map(rec => (
                  <div key={rec.userId} className="flex items-center justify-between p-3 bg-zinc-900/10 border border-zinc-900 rounded-xl">
                    <div>
                      <span className="block text-xs font-bold text-zinc-300 font-mono">{rec.userName}</span>
                      <span className="block text-[9px] text-zinc-500 font-mono">ID: {rec.userId.substring(0, 10)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {rec.status === 'read' ? (
                        <div className="flex items-center gap-1.5 text-amber-500 font-mono text-[10px] font-bold uppercase tracking-wider">
                          <CheckCheck size={12} />
                          <span>Acknowledged</span>
                        </div>
                      ) : rec.status === 'delivered' ? (
                        <div className="flex items-center gap-1.5 text-blue-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                          <CheckCheck size={12} className="text-zinc-500" />
                          <span>Delivered</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px] font-bold uppercase tracking-wider">
                          <Clock size={11} className="animate-spin" style={{ animationDuration: '4s' }} />
                          <span>Dispatched</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions: Remind Non Readers */}
            {readCount < totalRecipients && (
              <div className="pt-2">
                {reminderSent ? (
                  <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/15 rounded-2xl flex items-center justify-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest">
                    <CheckCheck size={12} />
                    <span>Nudges successfully broadcasted to non-readers</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSendReminder}
                    disabled={sendingReminder}
                    className="w-full py-3.5 bg-amber-500 text-black hover:bg-amber-400 rounded-2xl text-[10px] font-mono font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 border-0"
                    style={{ border: 'none' }}
                  >
                    <Bell size={12} />
                    {sendingReminder ? "Broadcasting Reminders..." : `Remind Non-Readers (${totalRecipients - readCount})`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
