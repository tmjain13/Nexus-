import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  Bell, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  Clock, 
  ToggleLeft,
  ToggleRight,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface CalendarRemindersProps {
  onClose?: () => void;
}

export function CalendarReminders({ onClose }: CalendarRemindersProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Settings states
  const [enablePush, setEnablePush] = useState(true);
  const [reminderOffset, setReminderOffset] = useState(15);
  const [morningDigest, setMorningDigest] = useState(true);
  const [conflictWarnings, setConflictWarnings] = useState(true);

  // Load custom user calendar settings from Firestore
  useEffect(() => {
    if (!user) return;
    
    const loadSettings = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'calendarSettings', 'notifications');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setEnablePush(data.enablePush ?? true);
          setReminderOffset(data.reminderOffset ?? 15);
          setMorningDigest(data.morningDigest ?? true);
          setConflictWarnings(data.conflictWarnings ?? true);
        }
      } catch (e) {
        console.error('Error loading calendar notification settings:', e);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaved(false);

    try {
      const docRef = doc(db, 'users', user.uid, 'calendarSettings', 'notifications');
      await setDoc(docRef, {
        enablePush,
        reminderOffset,
        morningDigest,
        conflictWarnings,
        updatedAt: new Date()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Error saving calendar settings:', e);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left max-w-xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/15 text-amber-500 rounded-xl">
            <Bell size={18} />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold tracking-widest text-white uppercase">Notification Center</h4>
            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Configure Scheduler & AI alerts</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-mono uppercase font-bold transition"
          >
            Close
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-6 text-slate-400 text-xs font-mono">
          LOADING SPECIFICATIONS...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Push Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-850 rounded-2xl">
            <div className="space-y-0.5">
              <h5 className="text-xs font-bold text-white uppercase font-mono tracking-wide">Event Push Alerts</h5>
              <p className="text-[9px] text-slate-500 font-mono">Receive push notices prior to event commencement</p>
            </div>
            <button 
              onClick={() => setEnablePush(!enablePush)}
              className="text-slate-400 hover:text-white transition"
            >
              {enablePush ? (
                <ToggleRight size={28} className="text-amber-500" />
              ) : (
                <ToggleLeft size={28} className="text-slate-600" />
              )}
            </button>
          </div>

          {/* Timing offset */}
          {enablePush && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-slate-950/20 border border-slate-850/80 rounded-2xl space-y-2.5"
            >
              <label className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest">Alert Timing Offset</label>
              <div className="flex gap-2">
                {[5, 15, 30, 60].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setReminderOffset(mins)}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-mono font-bold uppercase rounded-xl border transition",
                      reminderOffset === mins 
                        ? "bg-amber-500 border-amber-500 text-slate-950 font-black" 
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-750"
                    )}
                  >
                    {mins}m before
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Morning briefing digest */}
          <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-850 rounded-2xl">
            <div className="space-y-0.5">
              <h5 className="text-xs font-bold text-white uppercase font-mono tracking-wide">AI Morning Briefing Digest</h5>
              <p className="text-[9px] text-slate-500 font-mono">Generate summaries of today's operational schedule</p>
            </div>
            <button 
              onClick={() => setMorningDigest(!morningDigest)}
              className="text-slate-400 hover:text-white transition"
            >
              {morningDigest ? (
                <ToggleRight size={28} className="text-amber-500" />
              ) : (
                <ToggleLeft size={28} className="text-slate-600" />
              )}
            </button>
          </div>

          {/* Conflict warnings */}
          <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-850 rounded-2xl">
            <div className="space-y-0.5">
              <h5 className="text-xs font-bold text-white uppercase font-mono tracking-wide">Real-time Conflict Warnings</h5>
              <p className="text-[9px] text-slate-500 font-mono">Flag overlapping timelines when receiving meeting coordinates</p>
            </div>
            <button 
              onClick={() => setConflictWarnings(!conflictWarnings)}
              className="text-slate-400 hover:text-white transition"
            >
              {conflictWarnings ? (
                <ToggleRight size={28} className="text-amber-500" />
              ) : (
                <ToggleLeft size={28} className="text-slate-600" />
              )}
            </button>
          </div>

          {/* Save panel */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              {saved ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold animate-pulse">
                  <Check size={11} strokeWidth={3} /> Configuration Synchronized
                </span>
              ) : 'Changes are stored inside cloud profile'}
            </span>
            <button
              onClick={handleSave}
              className="p-2 px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[10px] font-mono uppercase font-black transition shadow-md cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
