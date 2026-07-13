import React from 'react';
import { motion } from 'motion/react';

interface ZenBackgroundProps {
  theme?: string; // 'blue' | 'green' | 'purple'
  children?: React.ReactNode;
}

const GRADIENTS = {
  blue: 'from-sky-950 via-zinc-900 to-slate-950',
  green: 'from-emerald-950 via-zinc-900 to-stone-950',
  purple: 'from-purple-950 via-zinc-900 to-zinc-950'
};

export function ZenBackground({ theme = 'blue', children }: ZenBackgroundProps) {
  const gradientClass = GRADIENTS[theme as keyof typeof GRADIENTS] || GRADIENTS.blue;

  return (
    <div className={`relative w-full h-full bg-gradient-to-b ${gradientClass} overflow-hidden transition-all duration-1000`}>
      {/* Floating Zen Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-amber-400/20 blur-md"
            style={{
              width: `${Math.random() * 80 + 40}px`,
              height: `${Math.random() * 80 + 40}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, Math.random() * 20 - 10, 0],
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      {children}
    </div>
  );
}
export default ZenBackground;
