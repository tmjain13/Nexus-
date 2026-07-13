import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

interface PremiumBadgeProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isGoldCheck?: boolean;
  className?: string;
}

export function PremiumBadge({ 
  showText = true, 
  size = 'md', 
  isGoldCheck = false,
  className = '' 
}: PremiumBadgeProps) {
  const { isPremium } = useSubscription();

  if (!isPremium) return null;

  if (isGoldCheck) {
    return (
      <span 
        className={`inline-flex items-center justify-center rounded-full bg-amber-500 text-zinc-950 font-black shadow-sm shrink-0 select-none ${
          size === 'sm' ? 'w-3.5 h-3.5 text-[8px]' : size === 'lg' ? 'w-5 h-5 text-[11px]' : 'w-4 h-4 text-[9px]'
        } ${className}`}
        title="Verified Premium User"
      >
        <Check className="w-[75%] h-[75%] stroke-[3.5px]" />
      </span>
    );
  }

  const paddingClass = size === 'sm' ? 'px-1.5 py-0.5 text-[8px]' : size === 'lg' ? 'px-2.5 py-1 text-[11px]' : 'px-2 py-0.5 text-[10px]';

  return (
    <span 
      className={`inline-flex items-center gap-1 bg-amber-500/20 text-amber-500 dark:text-amber-400 font-mono font-bold uppercase tracking-widest rounded-full select-none ${paddingClass} ${className}`}
    >
      <Sparkles className={size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'} />
      {showText && <span>Premium</span>}
    </span>
  );
}
export default PremiumBadge;
