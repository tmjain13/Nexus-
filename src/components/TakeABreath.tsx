import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ShieldAlert, Heart, Settings } from 'lucide-react';
import { useMessageLimit } from '../hooks/useMessageLimit';

const QUOTES = [
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
  { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
  { text: "Quiet the mind and the soul will speak.", author: "Ma Jaya Sati Bhagavati" },
  { text: "Within you, there is a stillness and a sanctuary to which you can retreat at any time.", author: "Hermann Hesse" }
];

interface TakeABreathProps {
  onSettingsClick?: () => void;
}

export function TakeABreath({ onSettingsClick }: TakeABreathProps) {
  const { resetHour } = useMessageLimit();
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [secondsLeft, setSecondsLeft] = useState(60);

  // Quote rotation
  useEffect(() => {
    const qInterval = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % QUOTES.length);
    }, 8000);
    return () => clearInterval(qInterval);
  }, []);

  // Breath rhythm controller (4s inhale, 2s hold, 4s exhale = 10s cycle)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const runCycle = () => {
      setBreathPhase('inhale');
      timer = setTimeout(() => {
        setBreathPhase('hold');
        timer = setTimeout(() => {
          setBreathPhase('exhale');
          timer = setTimeout(runCycle, 4000);
        }, 2000);
      }, 4000);
    };

    runCycle();
    return () => clearTimeout(timer);
  }, []);

  // Countdown for unlocking resume button
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  return (
    <div className="fixed inset-0 z-[300] bg-gradient-to-b from-zinc-950 via-slate-900 to-zinc-950 flex flex-col items-center justify-between p-8 text-center select-none overflow-hidden">
      {/* Top Header */}
      <div className="pt-8">
        <div className="flex items-center gap-2 justify-center text-amber-400 font-mono text-[10px] uppercase font-bold tracking-widest">
          <Heart size={12} className="animate-pulse" /> Digital Sanctuary Active
        </div>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight mt-1 font-sans">
          Mindful Connection Limit Reached
        </h1>
        <p className="text-zinc-500 text-xs max-w-xs mx-auto mt-1 font-mono">
          You've sent your hourly message quota. Pause, breathe, and align.
        </p>
      </div>

      {/* Center Breathing Animation */}
      <div className="relative flex flex-col items-center justify-center my-auto">
        {/* Expanding Breathing Glow Circle */}
        <motion.div
          animate={{
            scale: breathPhase === 'inhale' ? 1.5 : breathPhase === 'hold' ? 1.5 : 1,
            opacity: breathPhase === 'inhale' ? 0.8 : breathPhase === 'hold' ? 1 : 0.4,
          }}
          transition={{
            duration: breathPhase === 'hold' ? 2 : 4,
            ease: "easeInOut"
          }}
          className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-amber-500/20 to-sky-500/20 blur-xl"
        />

        <motion.div
          animate={{
            scale: breathPhase === 'inhale' ? 1.4 : breathPhase === 'hold' ? 1.4 : 1,
          }}
          transition={{
            duration: breathPhase === 'hold' ? 2 : 4,
            ease: "easeInOut"
          }}
          className="relative w-28 h-28 rounded-full border-2 border-dashed border-amber-400/40 flex items-center justify-center"
        >
          <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-amber-400">
            {breathPhase === 'inhale' && 'Inhale'}
            {breathPhase === 'hold' && 'Hold'}
            {breathPhase === 'exhale' && 'Exhale'}
          </div>
        </motion.div>
      </div>

      {/* Quotes section */}
      <div className="max-w-md px-6 my-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={quoteIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-2"
          >
            <p className="text-sm italic text-zinc-300 font-sans tracking-wide leading-relaxed">
              "{QUOTES[quoteIdx].text}"
            </p>
            <span className="text-[10px] text-amber-500 font-mono uppercase tracking-widest">
              — {QUOTES[quoteIdx].author}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="pb-8 w-full max-w-xs flex flex-col gap-4">
        {secondsLeft > 0 ? (
          <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
            Sanctuary timer: <span className="text-amber-400">{secondsLeft}s</span> left
          </div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={resetHour}
            className="w-full py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold font-mono uppercase tracking-widest transition-all shadow-lg shadow-amber-500/10 active:scale-95"
          >
            Resume Messaging
          </motion.button>
        )}

        <button
          onClick={onSettingsClick}
          className="flex items-center gap-2 justify-center text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
        >
          <Settings size={12} /> Adjust limits in Settings
        </button>
      </div>
    </div>
  );
}

export default TakeABreath;
