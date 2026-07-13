import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useInviteLink } from '../hooks/useInviteLink';
import { QRCodeDisplay } from './QRCodeDisplay';
import { ContactSync } from './ContactSync';
import { 
  X, 
  Copy, 
  Share2, 
  Check, 
  MessageSquare, 
  Send, 
  Mail, 
  Phone,
  Gift,
  Award,
  Users
} from 'lucide-react';

interface InviteFriendsModalProps {
  onClose: () => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

export function InviteFriendsModal({ onClose, onToast }: InviteFriendsModalProps) {
  const { user } = useAuth();
  const { inviteLink, referrals, loading, copyLink, shareLink } = useInviteLink();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'invite' | 'sync'>('invite');

  if (!user) return null;

  const handleCopy = async () => {
    const success = await copyLink();
    if (success) {
      setCopied(true);
      onToast("Invite link copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } else {
      onToast("Failed to copy link.", "error");
    }
  };

  const handleShare = async () => {
    const success = await shareLink();
    if (success && !navigator.share) {
      setCopied(true);
      onToast("Link copied (sharing not supported on this browser).", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const inviteText = inviteLink 
    ? `Join me on Enclave OS — the peaceful messenger. ${inviteLink.url}`
    : "Join me on Enclave OS — the peaceful messenger.";

  const encodedMessage = encodeURIComponent(inviteText);

  const socialShares = [
    {
      name: 'WhatsApp',
      icon: <MessageSquare className="w-5 h-5" />,
      url: `https://api.whatsapp.com/send?text=${encodedMessage}`,
      color: 'bg-green-500 hover:bg-green-600 text-white'
    },
    {
      name: 'Telegram',
      icon: <Send className="w-5 h-5 -rotate-12" />,
      url: `https://telegram.me/share/url?url=${encodeURIComponent(inviteLink?.url || '')}&text=${encodeURIComponent("Join me on Enclave OS — the peaceful messenger.")}`,
      color: 'bg-sky-500 hover:bg-sky-600 text-white'
    },
    {
      name: 'SMS',
      icon: <Phone className="w-5 h-5" />,
      url: `sms:?&body=${encodedMessage}`,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    {
      name: 'Email',
      icon: <Mail className="w-5 h-5" />,
      url: `mailto:?subject=${encodeURIComponent("Join me on Enclave OS")}&body=${encodedMessage}`,
      color: 'bg-rose-500 hover:bg-rose-600 text-white'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      {/* Background click to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      <motion.div
        initial={{ y: "100%", opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full sm:max-w-md bg-zinc-950 text-white rounded-t-[32px] sm:rounded-[32px] border border-zinc-850 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Gift className="text-amber-500" size={20} />
            <h2 className="text-[17px] font-bold text-zinc-100">Invite Friends</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 py-2 bg-zinc-900/40 flex border-b border-zinc-850">
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex-1 py-2.5 text-[11px] font-mono font-bold uppercase tracking-widest text-center border-b-2 transition-all ${
              activeTab === 'invite' 
                ? 'border-amber-500 text-amber-400 font-extrabold' 
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            My Invite Info
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex-1 py-2.5 text-[11px] font-mono font-bold uppercase tracking-widest text-center border-b-2 transition-all ${
              activeTab === 'sync' 
                ? 'border-amber-500 text-amber-400 font-extrabold' 
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Sync Friends
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-6">
          {activeTab === 'invite' ? (
            <>
              {/* QR Code Section */}
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                </div>
              ) : inviteLink ? (
                <QRCodeDisplay userId={user.uid} referralCode={inviteLink.code} />
              ) : (
                <div className="text-center text-zinc-400 p-4">
                  Failed to load invite link. Please try again.
                </div>
              )}

              {/* Share Link Section */}
              {inviteLink && (
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest px-1">
                    Your unique invitation URL
                  </label>
                  <div className="flex items-center gap-2 bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
                    <span className="text-[12px] font-mono text-amber-400 truncate flex-1 leading-tight select-all select-none">
                      {inviteLink.url}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-all cursor-pointer"
                      title="Copy URL"
                    >
                      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl transition-all cursor-pointer"
                      title="Share link"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Social Shares Row */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest px-1">
                  Invite via...
                </label>
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                  {socialShares.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all min-w-[70px] ${social.color}`}
                    >
                      {social.icon}
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider">{social.name}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Referral Stats Card */}
              <div className="bg-zinc-900/60 p-5 rounded-3xl border border-zinc-850 space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="text-amber-500" size={16} />
                  <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">
                    Invitation stats
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-zinc-950/40 rounded-2xl border border-zinc-850">
                    <p className="text-xl font-bold text-amber-400 font-mono">
                      {inviteLink?.clicks || 0}
                    </p>
                    <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                      Clicks
                    </p>
                  </div>
                  <div className="p-2.5 bg-zinc-950/40 rounded-2xl border border-zinc-850">
                    <p className="text-xl font-bold text-amber-400 font-mono">
                      {referrals?.totalJoined || referrals?.referredUsers?.length || 0}
                    </p>
                    <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                      Joined
                    </p>
                  </div>
                  <div className="p-2.5 bg-zinc-950/40 rounded-2xl border border-zinc-850">
                    <p className="text-xl font-bold text-amber-400 font-mono">
                      {referrals?.referredUsers?.length || 0}
                    </p>
                    <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                      Friends
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <ContactSync onContactAdded={(name) => onToast(`Connected with ${name}!`, "success")} />
          )}
        </div>
      </motion.div>
    </div>
  );
}
