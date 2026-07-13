import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ShieldClose, X } from 'lucide-react';
import { DisappearingTimer } from '../hooks/useDisappearingMessages';

interface DisappearingMessageToggleProps {
  isOpen: boolean;
  onClose: () => void;
  currentTimer: DisappearingTimer;
  onSave: (timer: DisappearingTimer) => Promise<void>;
  isAdminOrDM: boolean;
}

const TIMER_OPTIONS = [
  { value: 0, label: 'Off', description: 'Messages stay in this chat indefinitely' },
  { value: 5, label: '5 Seconds', description: 'Great for super secret temporary snaps' },
  { value: 60, label: '1 Minute', description: 'Vanishes shortly after being read' },
  { value: 3600, label: '1 Hour', description: 'Keeps history clean and ephemeral' },
  { value: 86400, label: '24 Hours', description: 'Classic daily self-cleaning protocol' },
  { value: 604800, label: '7 Days', description: 'Ideal weekly cleanup standard' },
  { value: 7776000, label: '90 Days', description: 'Long-term clean slate policy' },
] as const;

export const DisappearingMessageToggle: React.FC<DisappearingMessageToggleProps> = ({
  isOpen,
  onClose,
  currentTimer,
  onSave,
  isAdminOrDM
}) => {
  const [selected, setSelected] = React.useState<DisappearingTimer>(currentTimer);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setSelected(currentTimer);
  }, [currentTimer, isOpen]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(selected);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="disappearing-modal-overlay" className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 text-left text-zinc-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
              <div className="flex items-center gap-2.5">
                <Clock className="text-amber-500 w-5 h-5" />
                <div>
                  <h3 className="text-sm font-black font-mono tracking-wider uppercase text-zinc-100">Disappearing Messages</h3>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Privacy & Ephemerality</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-zinc-900 rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer border-none bg-transparent"
              >
                <X size={16} />
              </button>
            </div>

            {!isAdminOrDM ? (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex gap-2.5">
                <ShieldClose className="shrink-0 w-4 h-4 mt-0.5" />
                <span>Only administrators can change disappearing message protocols in this group.</span>
              </div>
            ) : (
              <>
                {/* Options List */}
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {TIMER_OPTIONS.map((opt) => {
                    const isSelected = selected === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setSelected(opt.value)}
                        className={`w-full p-3 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-amber-500/10 border-amber-500 text-zinc-100' 
                            : 'bg-zinc-900/40 border-zinc-900 hover:bg-zinc-900/80 text-zinc-400 hover:text-zinc-200'
                        }`}
                        style={{ borderStyle: 'solid' }}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-amber-500' : 'border-zinc-700'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold">{opt.label}</span>
                          <span className="text-[10px] opacity-70 leading-relaxed">{opt.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Info Box */}
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-[10px] text-zinc-400 leading-relaxed">
                  When enabled, new messages sent in this chat will automatically vanish for all participants after their designated duration. Existing messages are not affected.
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 rounded-2xl text-xs font-bold tracking-wider hover:text-zinc-100 transition-all border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-zinc-950 rounded-2xl text-xs font-extrabold tracking-wider transition-all border-none cursor-pointer"
                  >
                    {saving ? 'Applying...' : 'Apply Protocol'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
