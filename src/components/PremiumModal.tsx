import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sticker, 
  Grid2x2, 
  Palette, 
  Bell, 
  Sparkles, 
  Pin, 
  X, 
  ChevronRight, 
  Check, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

interface PremiumModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function PremiumModal({ onClose, onSuccess }: PremiumModalProps) {
  const { upgrade } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const features = [
    {
      icon: <Sticker className="w-5 h-5 text-amber-500" />,
      title: 'Exclusive Premium Stickers',
      desc: 'Send high-fidelity animated and static premium stickers.',
      badge: '50+ Packs'
    },
    {
      icon: <Grid2x2 className="w-5 h-5 text-amber-500" />,
      title: 'Custom App Icons',
      desc: 'Style your home screen with 12 handcrafted premium styles & custom upload.',
      badge: '12+ Styles'
    },
    {
      icon: <Palette className="w-5 h-5 text-amber-500" />,
      title: 'Bespoke Color Themes',
      desc: 'Unlock 20+ specialized dark/light/nature themes & custom color builder.',
      badge: '20+ Themes'
    },
    {
      icon: <Bell className="w-5 h-5 text-amber-500" />,
      title: 'Exclusive Notification Tones',
      desc: 'Upgrade your ringtones with 15 crisp high-quality audio files.',
      badge: '15 Ringtones'
    },
    {
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      title: 'Upgraded Chat Folders',
      desc: 'Organize chats into tabs (Unread, Groups, Work, Personal) & density customization.',
      badge: 'Smart Folders'
    },
    {
      icon: <Pin className="w-5 h-5 text-amber-500" />,
      title: 'Supercharged Pin Limits',
      desc: 'Pin up to 10 chats (instead of 3) to keep essential conversations at your fingertips.',
      badge: 'Pin 10 Chats'
    }
  ];

  const handleSubscribe = async () => {
    setIsProcessing(true);
    // Simulate high-fidelity modern payment processor animation (Stripe / Razorpay mock)
    setTimeout(async () => {
      const success = await upgrade(selectedPlan);
      setIsProcessing(false);
      if (success) {
        setIsSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 2200);
      }
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[999] overflow-hidden flex items-end justify-center sm:items-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      {/* Background Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* Main Bottom Sheet / Centered Card */}
      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.5 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 w-full max-w-lg sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] z-10 rounded-t-3xl border-t sm:border border-zinc-200 dark:border-zinc-800"
      >
        {/* Close Button */}
        {!isProcessing && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center p-12 text-center flex-1 space-y-6 bg-gradient-to-b from-amber-500/5 to-white dark:to-zinc-900">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20"
            >
              <Check className="w-10 h-10 text-white stroke-[3px]" />
            </motion.div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Welcome to Premium!</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
                Your Enclave OS Premium subscription has been successfully activated. Enjoy your premium superpowers!
              </p>
            </div>

            <div className="w-full max-w-xs bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20 text-xs font-mono text-amber-600 dark:text-amber-400 flex items-center gap-2 justify-center">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              PROVISIONING PREMIUM FEATURES...
            </div>
          </div>
        ) : (
          <>
            {/* Header / Brand visual block */}
            <div className="p-6 pb-4 bg-gradient-to-b from-amber-50/70 to-white dark:from-zinc-800/20 dark:to-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center mb-3 shadow-md shadow-amber-500/20 animate-pulse">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Enclave OS Premium</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
                Supercharge your secure communication environment with exclusive personalization and utility features.
              </p>
            </div>

            {/* Scrollable Features List */}
            <div className="flex-1 overflow-y-auto px-6 py-2 divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-[350px]">
              {features.map((feat, index) => (
                <div key={index} className="flex items-center gap-4 py-3.5 group">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 flex items-center justify-center shrink-0">
                    {feat.icon}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                        {feat.title}
                      </h4>
                      <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full shrink-0">
                        {feat.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                      {feat.desc}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors shrink-0" />
                </div>
              ))}
            </div>

            {/* Price Plans & Checkout Call-to-action */}
            <div className="p-6 bg-zinc-50 dark:bg-[#1c1c1e] border-t border-zinc-150 dark:border-zinc-800 space-y-4">
              {/* Plan Switcher Grid */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlan('monthly')}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    selectedPlan === 'monthly'
                      ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                  }`}
                  style={{ background: 'none' }}
                >
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase font-mono">Monthly Plan</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white mt-1">₹79<span className="text-xs font-normal text-zinc-500">/mo</span></p>
                  </div>
                  <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-2">Billed monthly</p>
                  {selectedPlan === 'monthly' && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlan('annual')}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    selectedPlan === 'annual'
                      ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                  }`}
                  style={{ background: 'none' }}
                >
                  <span className="absolute top-0 right-0 bg-amber-500 text-zinc-950 text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded-bl-xl shadow-sm">
                    SAVE 20%
                  </span>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase font-mono">Annual Plan</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white mt-1">₹799<span className="text-xs font-normal text-zinc-500">/yr</span></p>
                  </div>
                  <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-2">₹66.50/month equivalent</p>
                  {selectedPlan === 'annual' && (
                    <div className="absolute top-2 right-6 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                    </div>
                  )}
                </button>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSubscribe}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white font-semibold py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-amber-500/10 hover:shadow-lg flex items-center justify-center gap-2 text-[14px]"
                style={{ border: 'none' }}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Processing Secure Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Start Your Free Month Trial</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Legal Note */}
              <p className="text-[9px] text-center text-zinc-400 dark:text-zinc-500 leading-snug font-sans">
                Subscription renews automatically until canceled. You can manage, pause, or cancel auto-renewal at any time in your Settings page. By continuing, you agree to Enclave OS's <a href="#" className="underline hover:text-zinc-500">Terms of Service</a> & <a href="#" className="underline hover:text-zinc-500">Privacy Policy</a>.
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
