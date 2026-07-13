import React, { useState } from 'react';
import { 
  X, Wallet, DollarSign, ArrowUpRight, TrendingUp, 
  HelpCircle, CheckCircle, RefreshCw, Loader2, Sparkles 
} from 'lucide-react';
import { Channel } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

interface ChannelRevenueProps {
  channel: Channel;
  onClose: () => void;
  onUpdateChannel?: (updatedChannel: Channel) => void;
}

export function ChannelRevenue({ channel, onClose, onUpdateChannel }: ChannelRevenueProps) {
  const [withdrawing, setWithdrawing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const pendingAmount = channel.monetization?.payoutPending || 0;
  const totalRevenue = channel.monetization?.revenue || 0;

  const handleWithdraw = async () => {
    if (pendingAmount <= 0) return;

    setWithdrawing(true);
    // Simulate real bank processing for MVP
    setTimeout(async () => {
      try {
        const channelRef = doc(db, 'channels', channel.id);
        
        const updatedMonetization = {
          ...channel.monetization,
          payoutPending: 0
        };

        await updateDoc(channelRef, {
          'monetization.payoutPending': 0
        });

        if (onUpdateChannel) {
          onUpdateChannel({
            ...channel,
            monetization: updatedMonetization
          });
        }

        setWithdrawing(false);
        setSuccessMsg(true);
      } catch (err) {
        setWithdrawing(false);
        console.error("Payout withdrawal failed:", err);
      }
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm text-zinc-100">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-900 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-xl flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">Payout & Creator Capital</h2>
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Finances for @{channel.handle}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 progress-scroll text-left">
          {/* Main Earnings Panel */}
          <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-zinc-900 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-amber-500 pointer-events-none">
              <Wallet size={120} />
            </div>

            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Withdrawable Balance</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400">
                ₹{pendingAmount.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">INR</span>
            </div>

            <p className="text-[9px] font-mono text-zinc-500 uppercase mt-3 leading-relaxed">
              90% net creator profit accrued. 10% platform service split is deducted automatically.
            </p>

            <button
              onClick={handleWithdraw}
              disabled={pendingAmount <= 0 || withdrawing}
              className="w-full mt-6 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-35 disabled:hover:bg-amber-500 text-black font-sans font-black text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
            >
              {withdrawing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Processing Transfer...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight size={14} strokeWidth={3} />
                  <span>Withdraw Earnings</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/40 border border-zinc-900/50 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Gross Revenue</span>
              <span className="text-base font-bold text-zinc-200 mt-2">
                ₹{totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-900/50 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Active Subscribers</span>
              <span className="text-base font-bold text-zinc-200 mt-2">
                {channel.subscribers}
              </span>
            </div>
          </div>

          {/* Help Notice */}
          <div className="p-4 border border-dashed border-zinc-850 bg-zinc-950/40 rounded-2xl flex gap-3 text-left">
            <HelpCircle size={16} className="text-zinc-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Operational Procedures</h4>
              <p className="text-[9px] font-sans text-zinc-500 leading-relaxed">
                Earnings are distributed on a T+1 rolling basis to your connected banking infrastructure. Settlement accounts can be updated inside core messenger configurations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal Simulation */}
      {successMsg && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-850 rounded-[28px] p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Transfer Dispatched Successfully</h3>
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Authorized IMPS Transaction Code: #6079</p>
            </div>
            <p className="text-[10px] font-mono text-zinc-400 uppercase leading-relaxed bg-zinc-900/50 border border-zinc-850 p-3 rounded-xl">
              Funds will reflect in your linked nodal account within 10-15 minutes.
            </p>
            <button
              onClick={() => setSuccessMsg(false)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-sans font-black uppercase tracking-wider rounded-xl transition-all"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
