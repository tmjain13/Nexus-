import React, { useState } from 'react';
import { useCalendar, CalendarAccount } from '../hooks/useCalendar';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Check, 
  AlertTriangle, 
  Globe, 
  Mail, 
  ShieldCheck 
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

interface CalendarConnectProps {
  onClose?: () => void;
}

const PROVIDERS = [
  { id: 'google', name: 'Google Calendar', color: '#ea4335', logo: '🔴' },
  { id: 'outlook', name: 'Outlook Calendar', color: '#0078d4', logo: '🔵' },
  { id: 'apple', name: 'Apple iCloud Calendar', color: '#8e8e93', logo: '⚪' }
];

const PRESET_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444'];

export function CalendarConnect({ onClose }: CalendarConnectProps) {
  const { accounts, connectAccount, disconnectAccount, toggleAccountActive, sync, loading } = useCalendar();
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [provider, setProvider] = useState<'google' | 'outlook' | 'apple'>('google');
  const [email, setEmail] = useState('');
  const [selectedColor, setSelectedColor] = useState('#f59e0b');
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      await connectAccount(provider, email, selectedColor);
      setEmail('');
      setShowConnectForm(false);
    } catch (e: any) {
      setError(e.message || 'Failed to connect calendar account.');
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    await sync();
    setTimeout(() => setSyncing(false), 1000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left max-w-xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/15 text-amber-500 rounded-xl">
            <Calendar size={18} />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold tracking-widest text-white uppercase">Calendar Accounts</h4>
            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Sync work & personal schedules</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSyncAll}
            disabled={syncing}
            className="p-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-mono uppercase font-bold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-mono uppercase font-bold transition"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Account List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            <RefreshCw size={16} className="animate-spin mx-auto mb-2" />
            Loading accounts...
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl p-6 bg-slate-950/40">
            <Calendar size={32} className="mx-auto text-slate-600 mb-2 animate-pulse" />
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">No Calendars Linked</p>
            <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Connect your Google Workspace, Outlook, or Apple calendar to enable real-time scheduling inside chat.
            </p>
          </div>
        ) : (
          accounts.map((acct) => (
            <div 
              key={acct.id} 
              className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-2xl hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: acct.color }}
                />
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                    {acct.provider === 'google' ? 'Google Calendar' : acct.provider === 'outlook' ? 'Outlook Calendar' : 'Apple Calendar'}
                    <span className="text-[7px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-black">Connected</span>
                  </h5>
                  <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{acct.email}</p>
                  {acct.lastSync && (
                    <p className="text-[8px] font-mono text-slate-500 mt-1">
                      Last sync: {format(acct.lastSync.toDate(), 'MMM d, h:mm a')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Active Checkbox toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={acct.isActive}
                    onChange={(e) => toggleAccountActive(acct.id, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-slate-950"></div>
                </label>

                <button 
                  onClick={() => disconnectAccount(acct.id)}
                  className="p-1.5 hover:bg-slate-800/80 text-slate-400 hover:text-red-400 rounded-lg transition"
                  title="Disconnect account"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Toggle Connect Form button */}
      {!showConnectForm ? (
        <button 
          onClick={() => setShowConnectForm(true)}
          className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-2xl text-xs font-mono uppercase tracking-wider font-bold transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus size={14} /> Connect New Calendar
        </button>
      ) : (
        <motion.form 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleConnect}
          className="p-4 bg-slate-950/80 border border-slate-850 rounded-2xl space-y-4 text-left"
        >
          <h5 className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest">Connect Account Integration</h5>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Select Account Provider</label>
              <div className="grid grid-cols-3 gap-2">
                {PROVIDERS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProvider(p.id as any)}
                    className={`p-2.5 rounded-xl border text-[10px] font-mono uppercase font-black transition flex flex-col items-center gap-1.5 ${provider === p.id ? 'border-amber-500 bg-amber-500/5 text-amber-400' : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'}`}
                  >
                    <span>{p.logo}</span>
                    <span>{p.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Account Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@company.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Color-coded Marker</label>
              <div className="flex gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-6 h-6 rounded-full transition transform active:scale-90 flex items-center justify-center ${selectedColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950' : ''}`}
                    style={{ backgroundColor: c }}
                  >
                    {selectedColor === c && <Check size={12} className="text-slate-950 font-bold" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-[10px] font-mono text-red-400 bg-red-400/10 p-2 rounded-lg flex items-center gap-1.5 border border-red-500/20">
              <AlertTriangle size={12} /> {error}
            </p>
          )}

          <div className="flex gap-2 justify-end pt-2 border-t border-slate-850">
            <button
              type="button"
              onClick={() => setShowConnectForm(false)}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 rounded-xl text-[10px] font-mono uppercase font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[10px] font-mono uppercase font-black transition flex items-center gap-1"
            >
              <Check size={11} strokeWidth={3} /> Authorize & Link
            </button>
          </div>
        </motion.form>
      )}

      <div className="p-4 bg-slate-950/40 rounded-2xl flex items-start gap-3 border border-slate-850">
        <ShieldCheck className="text-amber-500 shrink-0 mt-0.5" size={16} />
        <div>
          <h6 className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">Enterprise OAuth Encryption</h6>
          <p className="text-[9px] text-slate-400 leading-relaxed mt-1">
            Nexus Schedulers securely integrate OAuth tokens without retaining personal credentials on-disk. All bidirectional sync operations are end-to-end encrypted locally.
          </p>
        </div>
      </div>
    </div>
  );
}
