import React, { useState } from 'react';
import { Hourglass } from 'lucide-react';
import { useMessageExpiry, ExpiringMessage } from '../hooks/useMessageExpiry';

interface ExpiryIndicatorProps {
  message: ExpiringMessage;
}

export const ExpiryIndicator: React.FC<ExpiryIndicatorProps> = ({ message }) => {
  const { timeLeft, color, isExpired } = useMessageExpiry(message);
  const [showTooltip, setShowTooltip] = useState(false);

  if (isExpired || !message.expiresAt) return null;

  const colorClasses = {
    gray: 'text-zinc-500',
    amber: 'text-amber-500',
    red: 'text-red-500 animate-pulse'
  };

  const exactTimeStr = () => {
    try {
      let d: Date;
      if (message.expiresAt.toMillis) {
        d = new Date(message.expiresAt.toMillis());
      } else if (message.expiresAt.seconds) {
        d = new Date(message.expiresAt.seconds * 1000);
      } else {
        d = new Date(message.expiresAt);
      }
      return `Expires at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} (${d.toLocaleDateString()})`;
    } catch {
      return 'Expires soon';
    }
  };

  return (
    <div 
      className="relative inline-flex items-center cursor-help select-none"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Hourglass size={12} className={`${colorClasses[color]} transition-colors`} />
      
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-1 z-50 bg-slate-950 border border-zinc-800 rounded-xl p-2.5 text-[10px] text-zinc-300 shadow-2xl min-w-[180px] text-center font-sans">
          <div className="font-bold text-zinc-100 flex items-center justify-center gap-1">
            <Hourglass size={10} className={color === 'red' ? 'animate-pulse text-red-500' : 'text-amber-500'} />
            <span>{timeLeft} left</span>
          </div>
          <div className="opacity-80 mt-1">{exactTimeStr()}</div>
        </div>
      )}
    </div>
  );
};
