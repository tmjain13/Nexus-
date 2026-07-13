import React from 'react';
import { ArrowLeft, ShieldCheck, BarChart3, Wallet, Users, Settings } from 'lucide-react';
import { Channel } from '../types';
import { SubscribeButton } from './SubscribeButton';

interface ChannelHeaderProps {
  channel: Channel;
  isSubscribed: boolean;
  isOwner: boolean;
  onBack: () => void;
  onToggleSubscribe: () => Promise<void>;
  onOpenAnalytics?: () => void;
  onOpenRevenue?: () => void;
  onOpenSettings?: () => void;
}

export function ChannelHeader({
  channel,
  isSubscribed,
  isOwner,
  onBack,
  onToggleSubscribe,
  onOpenAnalytics,
  onOpenRevenue,
  onOpenSettings
}: ChannelHeaderProps) {
  return (
    <div className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="relative">
          <img 
            src={channel.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${channel.handle}`}
            alt={channel.name}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl object-cover border border-zinc-800 bg-zinc-900"
          />
          {channel.privacy === 'private' && (
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-zinc-900 text-[8px] font-mono border border-zinc-800 rounded text-zinc-500 uppercase tracking-widest">
              PVT
            </span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-bold text-zinc-100 uppercase tracking-wide">
              {channel.name}
            </h1>
            {/* Verified badge for official/owner channels */}
            <ShieldCheck size={16} className="text-amber-500 shrink-0 fill-amber-500/10" />
          </div>
          
          <p className="text-xs font-mono text-zinc-500 leading-none">
            @{channel.handle}
          </p>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 uppercase tracking-widest pt-1">
            <Users size={11} className="text-amber-500/70" />
            <span>{channel.subscribers} Subscribers</span>
            {channel.monetization?.enabled && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-amber-500 font-bold">Premium</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {isOwner && (
          <>
            {onOpenAnalytics && (
              <button
                onClick={onOpenAnalytics}
                className="p-2.5 hover:bg-zinc-900/60 border border-zinc-850 hover:border-zinc-800 text-zinc-400 hover:text-amber-500 rounded-xl transition-all flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                title="View Analytics"
              >
                <BarChart3 size={15} />
                <span className="hidden sm:inline">Analytics</span>
              </button>
            )}

            {onOpenRevenue && channel.monetization?.enabled && (
              <button
                onClick={onOpenRevenue}
                className="p-2.5 hover:bg-zinc-900/60 border border-zinc-850 hover:border-zinc-800 text-zinc-400 hover:text-amber-500 rounded-xl transition-all flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                title="Payout Dashboard"
              >
                <Wallet size={15} />
                <span className="hidden sm:inline">Finance</span>
              </button>
            )}

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-2.5 hover:bg-zinc-900/60 border border-zinc-850 hover:border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                title="Channel Settings"
              >
                <Settings size={15} />
              </button>
            )}
          </>
        )}

        <SubscribeButton 
          channel={channel} 
          isSubscribed={isSubscribed} 
          isOwner={isOwner} 
          onToggle={onToggleSubscribe}
        />
      </div>
    </div>
  );
}
