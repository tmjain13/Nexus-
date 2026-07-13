import React, { useState } from 'react';
import { Sparkles, Check, Loader2 } from 'lucide-react';
import { Channel } from '../types';
import { cn } from '../lib/utils';

interface SubscribeButtonProps {
  channel: Channel;
  isSubscribed: boolean;
  isOwner: boolean;
  onToggle: () => Promise<void>;
  className?: string;
}

export function SubscribeButton({ channel, isSubscribed, isOwner, onToggle, className }: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showPaymentMock, setShowPaymentMock] = useState(false);

  const handleAction = async () => {
    if (isOwner) return;
    setLoading(true);
    try {
      if (!isSubscribed && channel.monetization?.enabled) {
        // Show payment gateway mock first
        setShowPaymentMock(true);
      } else {
        await onToggle();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmMockPayment = async () => {
    setLoading(true);
    setShowPaymentMock(false);
    try {
      await onToggle();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isOwner) {
    return (
      <span className="px-4 py-2 border border-zinc-800 text-zinc-500 font-mono text-[10px] uppercase font-bold tracking-widest rounded-full select-none">
        Creator
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleAction}
        disabled={loading}
        className={cn(
          "px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50",
          isSubscribed
            ? "bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-300"
            : "bg-amber-500 text-black hover:bg-amber-400 font-black shadow-lg shadow-amber-500/10",
          className
        )}
      >
        {loading ? (
          <Loader2 size={13} className="animate-spin" />
        ) : isSubscribed ? (
          <>
            <Check size={13} strokeWidth={3} />
            <span>Subscribed</span>
          </>
        ) : (
          <>
            <span>
              {channel.monetization?.enabled 
                ? `Subscribe ${channel.monetization.currency === 'INR' ? '₹' : '$'}${channel.monetization.price}/mo`
                : 'Join Free'
              }
            </span>
          </>
        )}
      </button>

      {showPaymentMock && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-850 rounded-[28px] overflow-hidden p-6 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/35 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Premium Access Activation</h3>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Stripe Mock Gateway Integration</p>
              </div>

              <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-850 text-left space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-500 uppercase">Premium Channel</span>
                  <span className="text-zinc-200 font-bold">{channel.name}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-500 uppercase">Subscription Price</span>
                  <span className="text-amber-400 font-black">
                    {channel.monetization.currency === 'INR' ? '₹' : '$'}{channel.monetization.price} / month
                  </span>
                </div>
                <div className="h-[1px] bg-zinc-800 my-2" />
                <p className="text-[9px] font-mono text-zinc-500 text-center uppercase leading-normal">
                  90% paid to creator, 10% network operations fee. Includes 7-day trial period.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentMock(false)}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmMockPayment}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-sans font-black uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-amber-500/10"
                >
                  Authorize Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
