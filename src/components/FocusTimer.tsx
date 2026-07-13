import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Square, Volume2, CloudRain, TreePine, Waves, Sparkles, Flame, Moon, Compass, Trophy } from 'lucide-react';
import { useFocusTimer } from '../hooks/useFocusTimer';

interface FocusTimerProps {
  onClose?: () => void;
}

export function FocusTimer({ onClose }: FocusTimerProps) {
  const {
    timeLeft,
    initialDuration,
    isRunning,
    isCompleted,
    selectedSound,
    setSelectedSound,
    distractions,
    start,
    pause,
    end,
    setIsCompleted
  } = useFocusTimer();

  const [presetDuration, setPresetDuration] = useState<number>(30); // Default 30 mins

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const progress = initialDuration > 0 ? (timeLeft / initialDuration) * 100 : 100;

  const handleStart = () => {
    start(presetDuration, selectedSound);
  };

  const handleCompleteClose = () => {
    setIsCompleted(false);
    end();
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-[250] bg-zinc-950/95 backdrop-blur-2xl flex flex-col justify-between p-8 text-center select-none overflow-hidden">
      {/* Complete screen */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 bg-zinc-950 z-[260] flex flex-col items-center justify-center p-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 mb-6"
            >
              <Trophy size={32} />
            </motion.div>

            <h2 className="text-2xl font-bold text-zinc-100 font-sans tracking-tight">
              Focus Achieved
            </h2>
            <p className="text-zinc-400 text-xs mt-2 font-mono max-w-xs leading-relaxed">
              Congratulations. You stayed present and silenced the noise.
            </p>

            {/* Stats Card */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 w-full max-w-xs mt-8 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-zinc-800/60 pb-3">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Duration</span>
                <span className="text-xs font-bold font-mono text-amber-400">{Math.round(initialDuration / 60)} min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Distractions Blocked</span>
                <span className="text-xs font-bold font-mono text-zinc-300">0 distractions</span>
              </div>
            </div>

            <button
              onClick={handleCompleteClose}
              className="mt-12 py-3 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold font-mono uppercase tracking-widest transition-all active:scale-95"
            >
              Close Sanctuary
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="pt-6">
        <div className="flex items-center gap-2 justify-center text-amber-500 font-mono text-[9px] uppercase font-bold tracking-widest">
          <Moon size={11} className="animate-pulse" /> Focus Sanctuary
        </div>
        <p className="text-zinc-500 text-[10px] font-mono mt-1">
          Enclave OS Digital Wellness Module
        </p>
      </div>

      {/* Main Timer Area */}
      <div className="my-auto flex flex-col items-center justify-center relative">
        {/* Simple Breathing Circle and Progress */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="110"
              className="stroke-zinc-900 fill-none"
              strokeWidth="4"
            />
            {isRunning && (
              <motion.circle
                cx="128"
                cy="128"
                r="110"
                className="stroke-amber-500 fill-none"
                strokeWidth="4"
                strokeDasharray="691"
                animate={{ strokeDashoffset: 691 - (691 * progress) / 100 }}
                transition={{ duration: 0.5, ease: "linear" }}
              />
            )}
          </svg>

          {/* Pulse breathing sphere */}
          <motion.div
            animate={{
              scale: isRunning ? [1, 1.15, 1] : 1,
              opacity: isRunning ? [0.6, 0.9, 0.6] : 0.8
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-48 h-48 rounded-full bg-zinc-900/45 border border-zinc-850 flex flex-col items-center justify-center relative z-10"
          >
            {isRunning ? (
              <div className="flex flex-col items-center justify-center">
                <span className="text-4xl font-black font-mono tracking-tight text-zinc-100">
                  {formattedTime}
                </span>
                <span className="text-[9px] font-mono uppercase text-amber-400 tracking-widest mt-2">
                  Breathe
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <button
                    onClick={() => setPresetDuration(Math.max(5, presetDuration - 5))}
                    className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold hover:bg-zinc-700 active:scale-95 text-zinc-400 hover:text-zinc-100"
                  >
                    -
                  </button>
                  <span className="text-4xl font-black font-mono tracking-tight text-zinc-100">
                    {presetDuration}
                  </span>
                  <button
                    onClick={() => setPresetDuration(presetDuration + 5)}
                    className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold hover:bg-zinc-700 active:scale-95 text-zinc-400 hover:text-zinc-100"
                  >
                    +
                  </button>
                </div>
                <span className="text-[9px] font-mono uppercase text-zinc-500 tracking-widest mt-2">
                  minutes
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Audio Ambient Selector and Active Controls */}
      <div className="pb-6 flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
        {!isRunning && (
          <div className="w-full">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-3">
              Ambient Audio
            </span>
            <div className="flex justify-center gap-3">
              {[
                { id: 'none', label: 'Silence', icon: <Volume2 size={14} /> },
                { id: 'rain', label: 'Rain', icon: <CloudRain size={14} /> },
                { id: 'forest', label: 'Forest', icon: <TreePine size={14} /> },
                { id: 'waves', label: 'Waves', icon: <Waves size={14} /> }
              ].map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => setSelectedSound(sound.id as any)}
                  className={`px-3 py-2 rounded-xl border text-[11px] font-mono uppercase tracking-wider flex items-center gap-2 transition-all ${
                    selectedSound === sound.id
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-800'
                  }`}
                >
                  {sound.icon} {sound.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4 w-full">
          {isRunning ? (
            <button
              onClick={end}
              className="flex-1 py-3.5 rounded-2xl border border-red-500/20 hover:bg-red-950/10 text-red-400 text-xs font-bold font-mono uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <Square size={14} /> End Focus
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-bold font-mono uppercase tracking-widest transition-all"
              >
                Exit
              </button>
              <button
                onClick={handleStart}
                className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold font-mono uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
              >
                <Play size={14} fill="currentColor" /> Start Focus
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default FocusTimer;
