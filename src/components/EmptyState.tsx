import React from 'react';
import { motion } from 'motion/react';
import { MessageSquareOff, Sparkles, Terminal, Cpu } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-chats' | 'no-search' | 'welcome';
  searchTerm?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, searchTerm }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center select-none max-w-sm mx-auto">
      {type === 'no-chats' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          {/* Animated Ambient Radar Sphere */}
          <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.05, 0.3] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-amber-500/10 border border-amber-500/20"
            />
            <motion.div
              animate={{ scale: [1.2, 0.9, 1.2], opacity: [0.1, 0.3, 0.1] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              className="absolute w-14 h-14 rounded-full bg-amber-500/5 border border-amber-500/10"
            />
            <div className="relative w-12 h-12 rounded-xl bg-slate-850 flex items-center justify-center border border-slate-750">
              <MessageSquareOff className="text-amber-500/80" size={20} />
            </div>
          </div>
          
          <h3 className="text-sm font-semibold text-zinc-100 font-sans tracking-wide uppercase">
            No active frequencies
          </h3>
          <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
            Your secure enclaves and direct neural links will be listed here. Sync your contacts or start a new conversation to initialize.
          </p>
        </motion.div>
      )}

      {type === 'no-search' && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <div className="w-14 h-14 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-center mb-5 text-zinc-500">
            <Terminal size={20} />
          </div>
          <h3 className="text-sm font-semibold text-zinc-300 font-sans tracking-wide">
            Matrix Query Failed
          </h3>
          <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
            No nodes matching <span className="text-amber-500 font-mono">"{searchTerm}"</span> were detected. Verify spelling or filter protocols.
          </p>
        </motion.div>
      )}

      {type === 'welcome' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
            {/* Spinning orbital ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
              className="absolute inset-0 rounded-full border-t border-b border-amber-500/20 border-l-transparent border-r-transparent"
            />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Cpu className="text-slate-950 animate-pulse" size={26} />
            </div>
          </div>
          
          <h2 className="text-base font-extrabold text-white tracking-widest uppercase">
            Initialize Nexus
          </h2>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed max-w-[280px]">
            Welcome to the secure grid. Redefining quantum-encrypted peer communication.
          </p>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 40 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="h-0.5 bg-amber-500 mt-5"
          />
        </motion.div>
      )}
    </div>
  );
};

export default EmptyState;
