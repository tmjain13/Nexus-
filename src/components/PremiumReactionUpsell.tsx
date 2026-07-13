import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Crown, 
  Heart, 
  Zap, 
  Music,
  Lock
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

interface PremiumReactionUpsellProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function PremiumReactionUpsell({ onClose, onSuccess }: PremiumReactionUpsellProps) {
  const { upgrade } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const benefits = [
    {
      icon: <Zap className="w-5 h-5 text-amber-500 animate-pulse" />,
      title: 'Unlimited Super Reactions',
      desc: 'Bypass the daily limit of 3 reactions and react with dynamic animations instantly.',
      badge: 'Unlimited'
    },
    {
      icon: <Heart className="w-5 h-5 text-amber-500 animate-bounce" />,
      title: 'Screen-Wide Particle Storms',
      desc: 'Create immersive sparks, confetti and fireworks on other users screens.',
      badge: 'All Effects'
    },
    {
      icon: <Music className="w-5 h-5 text-amber-500" />,
      title: 'Audio sound effects',
      desc: 'Play subtle high-fidelity popping, chime or whoosh sounds with reactions.',
      badge: 'Sound Enabled'
    },
    {
      icon: <Crown className="w-5 h-5 text-amber-500" />,
      title: 'Upload Custom GIFs & Videos',
      desc: 'Make your own reactions using personalized loops or funny clips.',
      badge: 'Custom Upload'
    }
  ];

  const handleSubscribe = async () => {
    setIsProcessing(true);
    // Simulate payment authorization
    setTimeout(async () => {
      const success = await upgrade(selectedPlan);
      setIsProcessing(false);
      if (success) {
        setIsSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 2000);
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[1000] overflow-hidden flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
      {/* Background Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* Main Container */}
      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.5 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative bg-zinc-950 text-zinc-100 w-full max-w-md sm:rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] z-10 rounded-t-3xl border border-zinc-800"
      >
        {/* Close Button */}
        {!isProcessing && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 text-zinc-500 hover:text-zinc-200 rounded-full hover:bg-zinc-900 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center p-12 text-center flex-1 space-y-6 bg-gradient-to-b from-amber-500/10 to-zinc-950">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/30"
            >
              <Check className="w-10 h-10 text-black stroke-[3px]" />
            </motion.div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">Supercharged Activated!</h2>
              <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                Unlimited Super Reactions, screen bursts, custom loops, and sound effects are now unlocked!
              </p>
            </div>

            <div className="w-full max-w-xs bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20 text-xs font-mono text-amber-400 flex items-center gap-2 justify-center">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              STRIKING THE UNANIMOUS PROTOCOLS...
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 pb-4 bg-gradient-to-b from-amber-950/20 to-zinc-950 border-b border-zinc-900 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center mb-3 shadow-md shadow-amber-500/20">
                <Crown className="w-7 h-7 text-black stroke-[2px]" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Unlock Super Reactions
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                You've hit the daily free limit of 3 Super Reactions. Upgrade to Nexus Premium to express yourself without boundaries.
              </p>
            </div>

            {/* Benefits list */}
            <div className="flex-1 overflow-y-auto px-6 py-2 divide-y divide-zinc-900 max-h-[300px]">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/10">
                    {benefit.icon}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-semibold text-white leading-tight">
                        {benefit.title}
                      </h4>
                      <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full shrink-0 border border-amber-500/20">
                        {benefit.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Upgrade Plan Selector */}
            <div className="p-6 bg-[#0c0c0e] border-t border-zinc-900 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlan('monthly')}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    selectedPlan === 'monthly'
                      ? 'border-amber-500 bg-amber-500/5'
                      : 'border-zinc-800 bg-zinc-900/50'
                  }`}
                  style={{ background: 'none' }}
                >
                  <div>
                    <p className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase font-mono">Monthly</p>
                    <p className="text-base font-bold text-white mt-1">₹79<span className="text-xs font-normal text-zinc-500">/mo</span></p>
                  </div>
                  <p className="text-[9px] text-zinc-500 mt-2">Billed monthly</p>
                  {selectedPlan === 'monthly' && (
                    <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center">
                      <Check className="w-2 h-2 text-black stroke-[3px]" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlan('annual')}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    selectedPlan === 'annual'
                      ? 'border-amber-500 bg-amber-500/5'
                      : 'border-zinc-800 bg-zinc-900/50'
                  }`}
                  style={{ background: 'none' }}
                >
                  <span className="absolute top-0 right-0 bg-amber-500 text-black text-[7px] font-mono font-black uppercase px-1.5 py-0.5 rounded-bl-lg">
                    SAVE 20%
                  </span>
                  <div>
                    <p className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase font-mono">Annual</p>
                    <p className="text-base font-bold text-white mt-1">₹799<span className="text-xs font-normal text-zinc-500">/yr</span></p>
                  </div>
                  <p className="text-[9px] text-zinc-500 mt-2">₹66.50/mo equivalent</p>
                  {selectedPlan === 'annual' && (
                    <div className="absolute top-2.5 right-6 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center">
                      <Check className="w-2 h-2 text-black stroke-[3px]" />
                    </div>
                  )}
                </button>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSubscribe}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-black font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-amber-500/10 hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                style={{ border: 'none' }}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Upgrading Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Unlimited Super Reactions</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p className="text-[9px] text-center text-zinc-500 leading-snug">
                Restores standard cloud security. Cancel anytime in account details. By subscribing you agree to the standard EULA policies.
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
