import React, { useEffect } from 'react';
import { Phone, PhoneOff, Video, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { declineCall } from '../lib/webrtc';
import { playNotificationSound } from '../lib/tones';
import { cn } from '../lib/utils';
import type { IncomingCall } from '../hooks/useCallSignaling';

export default function IncomingCallModal({
  call,
  onDismiss,
}: {
  call: IncomingCall;
  onDismiss: () => void;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    // Loop a ringtone while modal is open
    playNotificationSound('Default');
    const interval = setInterval(() => playNotificationSound('Default'), 3500);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = () => {
    onDismiss();
    navigate(`/call/${call.id}?type=${call.type}&role=callee`);
  };

  const handleDecline = async () => {
    await declineCall(call.id);
    onDismiss();
  };

  const callerAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${call.callerName || 'Operator'}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.95 }}
      id="incoming-call-modal"
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[250] w-[92%] max-w-md
                 bg-[#101c26]/90 backdrop-blur-xl text-white rounded-2xl 
                 shadow-[0_20px_50px_rgba(0,168,132,0.15)] p-4 flex items-center gap-4
                 border border-teal-500/20"
    >
      {/* Pulse background overlay */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none border border-teal-500/10 animate-pulse" />

      {/* Pulsing visual avatar node */}
      <div className="relative w-14 h-14 rounded-full shrink-0">
        <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping opacity-60" />
        <div className="relative w-full h-full rounded-full bg-[#1e2a35] border border-teal-500/30 overflow-hidden flex items-center justify-center">
          <img
            src={callerAvatar}
            alt={call.callerName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Info Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-semibold text-sm truncate text-white leading-tight">
            {call.callerName}
          </span>
          <span className="bg-teal-500/10 text-teal-400 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border border-teal-500/20 flex items-center gap-0.5 shrink-0">
            <ShieldAlert size={10} /> Secure Node
          </span>
        </div>
        <p className="text-xs text-[#8696a0] font-mono uppercase tracking-wider flex items-center gap-1">
          {call.type === 'video' ? (
            <>
              <Video size={12} className="text-teal-400" /> Incoming Video call...
            </>
          ) : (
            <>
              <Phone size={12} className="text-teal-400" /> Incoming Voice call...
            </>
          )}
        </p>
      </div>

      {/* Call Actions */}
      <div className="flex gap-2.5 shrink-0 relative z-10">
        <button
          id="btn-decline-call"
          onClick={handleDecline}
          title="Decline"
          className="w-11 h-11 rounded-full bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-md"
        >
          <PhoneOff size={18} />
        </button>
        <button
          id="btn-accept-call"
          onClick={handleAccept}
          title="Accept"
          className="w-11 h-11 rounded-full bg-[#00a884] hover:bg-[#009675] border border-[#00a884] text-white flex items-center justify-center active:scale-40 transition-all cursor-pointer shadow-lg shadow-teal-500/20 active:scale-95"
        >
          <Phone size={18} />
        </button>
      </div>
    </motion.div>
  );
}
