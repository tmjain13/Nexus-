import React, { useState, useEffect } from 'react';
import { Gift, X, ChevronRight } from 'lucide-react';

interface InviteBannerProps {
  contactsCount: number;
  onInviteClick: () => void;
}

export function InviteBanner({ contactsCount, onInviteClick }: InviteBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem('enclave_invite_banner_dismissed') === 'true';
    setIsDismissed(dismissed);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('enclave_invite_banner_dismissed', 'true');
    setIsDismissed(true);
  };

  if (isDismissed || contactsCount >= 3) {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/35 rounded-2xl p-4 relative overflow-hidden my-3 mx-4">
      {/* Absolute Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 p-1 hover:bg-amber-500/10 rounded-lg transition-all cursor-pointer"
        title="Dismiss banner"
      >
        <X size={15} />
      </button>

      <div className="flex gap-3.5 pr-6 items-start">
        <div className="p-2.5 bg-amber-500/15 text-amber-500 rounded-xl mt-0.5 shrink-0 flex items-center justify-center">
          <Gift size={20} className="animate-pulse" />
        </div>
        
        <div className="flex-1">
          <h4 className="text-[13px] font-black text-amber-500 font-mono uppercase tracking-wider">
            Invite Friends to Enclave
          </h4>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-1 leading-normal font-sans">
            Build your secure network. You currently have {contactsCount} contact{contactsCount !== 1 ? 's' : ''}. Add at least 3 friends to get the most out of Enclave OS.
          </p>

          <button
            onClick={onInviteClick}
            className="mt-3 py-1.5 px-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-zinc-950 text-[10px] font-mono font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm"
          >
            Invite Now <ChevronRight size={12} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
