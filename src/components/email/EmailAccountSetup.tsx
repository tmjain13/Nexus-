import React, { useState } from 'react';
import { 
  Plus, Mail, ShieldAlert, ArrowLeft, KeyRound, Globe, Server, CheckCircle2 
} from 'lucide-react';
import { useEmailAccounts, EmailAccount } from '../../hooks/useEmailAccounts';
import { EmailAccountCard } from './EmailAccountCard';

interface EmailAccountSetupProps {
  onClose?: () => void;
}

export function EmailAccountSetup({ onClose }: EmailAccountSetupProps) {
  const { accounts, loading, connect, disconnect, sync } = useEmailAccounts();
  const [isAdding, setIsAdding] = useState(false);
  const [provider, setProvider] = useState<'gmail' | 'outlook' | 'yahoo' | 'imap'>('gmail');
  
  // Form State
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState(993);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(465);
  const [useSsl, setUseSsl] = useState(true);
  
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setConnecting(true);

    if (!email || !displayName) {
      setError('Please fill in all required fields');
      setConnecting(false);
      return;
    }

    try {
      const customSettings = provider === 'imap' ? {
        imapHost,
        imapPort: Number(imapPort),
        smtpHost,
        smtpPort: Number(smtpPort),
        useSsl
      } : undefined;

      await connect(provider, email, displayName, customSettings);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsAdding(false);
        // Clear form
        setEmail('');
        setDisplayName('');
        setPassword('');
        setImapHost('');
        setImapPort(993);
        setSmtpHost('');
        setSmtpPort(465);
        setUseSsl(true);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to connect. Please check credentials.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl" id="email-setup-panel">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Mail className="w-5.5 h-5.5 text-amber-500" />
            <span>Email Integration Setup</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Link your mailboxes to experience Unified Messenger Inbox</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 transition"
          >
            Done
          </button>
        )}
      </div>

      {success ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-scaleIn">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-amber-500 animate-bounce" />
          </div>
          <h3 className="text-lg font-bold text-white">Inbox Linked Successfully!</h3>
          <p className="text-xs text-slate-400 mt-1">Fetching latest conversation threads...</p>
        </div>
      ) : isAdding ? (
        /* Connecting Account Form */
        <form onSubmit={handleConnect} className="flex-1 flex flex-col min-h-0 animate-fadeIn">
          <div className="flex items-center justify-between mb-5">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Accounts</span>
            </button>
            <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {provider} Account
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 flex items-center gap-2.5 text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {/* Provider Selector Tabs */}
            <div className="grid grid-cols-4 gap-1.5 bg-slate-900/50 p-1 rounded-xl border border-slate-900">
              {(['gmail', 'outlook', 'yahoo', 'imap'] as const).map((prov) => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => {
                    setProvider(prov);
                    setError('');
                  }}
                  className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition ${
                    provider === prov 
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {prov}
                </button>
              ))}
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold">Your Display Name</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-amber-500 text-xs rounded-xl px-4 py-3 text-slate-200 outline-none transition"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold">Email Address</label>
              <input
                type="email"
                required
                placeholder="e.g. johndoe@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-amber-500 text-xs rounded-xl px-4 py-3 text-slate-200 outline-none transition"
              />
            </div>

            {/* Password / App Passkey */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold">
                {provider === 'imap' ? 'IMAP Password' : 'App-Specific Password'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-amber-500 text-xs rounded-xl pl-10 pr-4 py-3 text-slate-200 outline-none transition"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                For security, we recommend using an App Password generated from your provider's security portal.
              </p>
            </div>

            {/* Custom IMAP Settings */}
            {provider === 'imap' && (
              <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 animate-fadeIn">
                <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2 mb-2">
                  <Server className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-200">Server Configuration</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">IMAP Server Host</label>
                    <input
                      type="text"
                      required
                      placeholder="imap.yourserver.com"
                      value={imapHost}
                      onChange={(e) => setImapHost(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-amber-500 transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Port</label>
                    <input
                      type="number"
                      required
                      value={imapPort}
                      onChange={(e) => setImapPort(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">SMTP Server Host</label>
                    <input
                      type="text"
                      required
                      placeholder="smtp.yourserver.com"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-amber-500 transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Port</label>
                    <input
                      type="number"
                      required
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useSsl"
                    checked={useSsl}
                    onChange={(e) => setUseSsl(e.target.checked)}
                    className="rounded border-slate-800 text-amber-500 focus:ring-0 focus:ring-offset-0 bg-slate-950 w-4 h-4"
                  />
                  <label htmlFor="useSsl" className="text-xs text-slate-400 font-semibold">Use SSL Secure Connection</label>
                </div>
              </div>
            )}
          </div>

          {/* Connect Button */}
          <div className="border-t border-slate-900 pt-4 mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 py-3 rounded-xl border border-slate-850 hover:bg-slate-900 text-xs text-slate-400 hover:text-white font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={connecting}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/10"
            >
              {connecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Connecting Securely...</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Connect Mailbox</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Connected Accounts Listing */
        <div className="flex-1 flex flex-col min-h-0 animate-fadeIn">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-900/20 border border-dashed border-slate-850 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
                <Mail className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">No Linked Email Accounts</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Connect your work or personal email address to enjoy a Unified Messenger Experience inside Aero.
              </p>
              <button
                onClick={() => setIsAdding(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/10 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Link First Inbox</span>
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-slate-400 font-bold">Connected Inbox ({accounts.length})</span>
                <button
                  onClick={() => setIsAdding(true)}
                  className="text-xs text-amber-500 font-bold hover:text-amber-400 transition flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Account</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 min-h-0">
                {accounts.map(acc => (
                  <EmailAccountCard
                    key={acc.id}
                    account={acc}
                    onDisconnect={(id) => disconnect(id)}
                    onSync={(id) => sync(id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
