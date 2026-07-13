import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Share2, Clipboard, Trophy, Calendar, Zap, ShieldAlert, Heart } from 'lucide-react';
import { usePeaceMode } from '../hooks/usePeaceMode';

export function DailyReport() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    minutesInPeaceMode: 45,
    messagesSent: 12,
    focusSessions: 2,
    notificationsBlocked: 14,
    peaceScore: 88
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const today = new Date().toISOString().split('T')[0];
      try {
        const statsRef = doc(db, 'users', user.uid, 'peaceModeStats', today);
        const snap = await getDoc(statsRef);
        if (snap.exists()) {
          const data = snap.data();
          // Calculate score: Base 60. +10 per focus session, +1 per minute in Peace Mode, -1 per message sent (to gamify off-screen wellness)
          let calculatedScore = 70 + (data.focusSessions || 0) * 8 + Math.min(20, (data.minutesInPeaceMode || 0) * 0.5) - Math.min(20, (data.messagesSent || 0) * 0.5);
          calculatedScore = Math.min(100, Math.max(0, Math.round(calculatedScore)));
          
          setStats({
            minutesInPeaceMode: data.minutesInPeaceMode || 0,
            messagesSent: data.messagesSent || 0,
            focusSessions: data.focusSessions || 0,
            notificationsBlocked: data.notificationsBlocked || 0,
            peaceScore: calculatedScore
          });
        }
      } catch (err) {
        console.warn("Could not retrieve daily stats:", err);
      }
    };
    fetchStats();
  }, [user]);

  const handleShare = () => {
    const text = `🧘 My Enclave OS Peace Score today: ${stats.peaceScore}/100!\n⏰ Focused for ${stats.minutesInPeaceMode} minutes\n🚫 Blocked ${stats.notificationsBlocked} distractions\n📱 Join me in digital wellness.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <Heart size={14} className="text-amber-400" />
          <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-zinc-400">
            Wellness Report
          </span>
        </div>
        <span className="text-[9px] font-mono text-zinc-500 uppercase">Today</span>
      </div>

      {/* Main Score Section */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative flex items-center justify-center w-20 h-20 rounded-full border border-amber-500/20 bg-amber-500/5">
          <div className="text-center">
            <span className="text-3xl font-black font-mono tracking-tight text-amber-400">
              {stats.peaceScore}
            </span>
            <span className="text-[8px] font-mono uppercase text-zinc-500 block -mt-1">
              Score
            </span>
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/10 scale-105 pointer-events-none"
          />
        </div>

        <div>
          <h4 className="text-sm font-bold text-zinc-200 tracking-tight flex items-center gap-1.5">
            Tranquility Mastered <Sparkles size={12} className="text-amber-400" />
          </h4>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Your connection habits were highly focused today. Excellent boundary control.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-zinc-900/60 border border-zinc-850 rounded-2xl p-3.5">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
            Focus Time
          </span>
          <span className="text-lg font-bold font-mono text-zinc-200">
            {stats.minutesInPeaceMode} <span className="text-xs text-zinc-500 font-normal">m</span>
          </span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-850 rounded-2xl p-3.5">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
            Focus Sessions
          </span>
          <span className="text-lg font-bold font-mono text-zinc-200">
            {stats.focusSessions} <span className="text-xs text-zinc-500 font-normal">done</span>
          </span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-850 rounded-2xl p-3.5">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
            Messages Sent
          </span>
          <span className="text-lg font-bold font-mono text-zinc-200">
            {stats.messagesSent} <span className="text-xs text-zinc-500 font-normal">msgs</span>
          </span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-850 rounded-2xl p-3.5">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
            Distractions Blocked
          </span>
          <span className="text-lg font-bold font-mono text-zinc-200">
            {stats.notificationsBlocked} <span className="text-xs text-zinc-500 font-normal">silent</span>
          </span>
        </div>
      </div>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="w-full py-2.5 rounded-xl border border-amber-500/30 hover:bg-amber-500/5 text-amber-400 text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95"
      >
        {copied ? (
          <>Copied card to clipboard!</>
        ) : (
          <>
            <Share2 size={13} /> Share Peace Score Card
          </>
        )}
      </button>
    </div>
  );
}

export default DailyReport;
