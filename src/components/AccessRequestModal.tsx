import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Mic, MapPin, Bell, Shield, Check } from 'lucide-react';

interface AccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (permissions: {
    camera: boolean;
    microphone: boolean;
    geolocation: boolean;
    notifications: boolean;
  }) => void;
}

export const AccessRequestModal: React.FC<AccessRequestModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [permissions, setPermissions] = useState({
    camera: true,
    microphone: true,
    geolocation: false,
    notifications: true,
  });

  const handleToggle = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleApply = () => {
    onApply(permissions);
    onClose();
  };

  const permissionItems = [
    {
      key: 'camera' as const,
      name: 'Optical Sensor Access (Camera)',
      description: 'Used for secure peer-to-peer video streams and scanning qr matrix keys.',
      icon: <Camera size={18} />,
    },
    {
      key: 'microphone' as const,
      name: 'Vocal Audio Capture (Microphone)',
      description: 'Allows recording high-fidelity voice packets and starting quantum calls.',
      icon: <Mic size={18} />,
    },
    {
      key: 'geolocation' as const,
      name: 'Geospatial Location Relay',
      description: 'Shares coordinates on the tactical Enclave Map with trusted neural contacts.',
      icon: <MapPin size={18} />,
    },
    {
      key: 'notifications' as const,
      name: 'Direct Alerts & Notifications',
      description: 'Required to receive urgent push transmissions and incoming calls instantly.',
      icon: <Bell size={18} />,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 select-none">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-md bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl shadow-amber-500/5 backdrop-blur-xl z-50 overflow-hidden"
          >
            {/* Glowing top line accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/20 via-amber-500 to-amber-500/20" />

            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 shadow-lg shadow-amber-500/5">
                <Shield size={22} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white tracking-wide uppercase font-sans">
                  Quantum Device Access
                </h2>
                <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-mono font-bold mt-0.5">
                  Secure Clearance Protocol
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              To operate in the decentralized enclave, Nexus requires cryptographic and hardware authorizations. Configure your sensory relays below.
            </p>

            {/* List of Permissions */}
            <div className="space-y-4 mb-7">
              {permissionItems.map((item) => {
                const isEnabled = permissions[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => handleToggle(item.key)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isEnabled
                        ? 'bg-slate-800/40 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.03)]'
                        : 'bg-slate-800/10 border-slate-800 hover:border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 pr-4">
                      <div className={`p-2.5 rounded-xl transition-colors ${
                        isEnabled ? 'bg-amber-500/15 text-amber-500' : 'bg-slate-800 text-zinc-500'
                      }`}>
                        {item.icon}
                      </div>
                      <div className="text-left">
                        <h4 className={`text-xs font-bold transition-colors ${
                          isEnabled ? 'text-white' : 'text-zinc-400'
                        }`}>
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Styled custom toggle switch */}
                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 relative ${
                      isEnabled ? 'bg-amber-500' : 'bg-slate-800 border border-slate-700/50'
                    }`}>
                      <motion.div
                        layout
                        className="w-4 h-4 rounded-full bg-slate-950 flex items-center justify-center"
                        animate={{ x: isEnabled ? 16 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        {isEnabled && <Check size={8} className="text-amber-500" strokeWidth={4} />}
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions Button */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-zinc-400 hover:text-white text-xs font-bold rounded-2xl border border-slate-700/40 transition-colors cursor-pointer"
              >
                Decline
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-2xl transition-all shadow-lg shadow-amber-500/15 active:scale-98 cursor-pointer uppercase tracking-wider"
              >
                Apply Clearances
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AccessRequestModal;
