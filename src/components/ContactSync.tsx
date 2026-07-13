import React, { useState } from 'react';
import { useContactSync, ContactMatch } from '../hooks/useContactSync';
import { 
  Users, 
  Search, 
  Check, 
  AlertCircle, 
  Plus, 
  Info, 
  CheckCircle, 
  RefreshCw, 
  Mail, 
  Copy 
} from 'lucide-react';

interface ContactSyncProps {
  onContactAdded?: (displayName: string) => void;
}

export function ContactSync({ onContactAdded }: ContactSyncProps) {
  const {
    isSyncing,
    matchedUsers,
    error,
    isContactsApiSupported,
    syncPhoneContacts,
    matchPhoneNumbers,
    addMatchedContact,
    isGoogleSyncing,
    googleMatchedUsers,
    nonMatchedGoogleContacts,
    googleError,
    syncGoogleContacts,
  } = useContactSync();

  const [activeTab, setActiveTab] = useState<'google' | 'phone'>('google');
  const [manualInput, setManualInput] = useState('');
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [syncRun, setSyncRun] = useState(false);
  const [googleSyncRun, setGoogleSyncRun] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleAutoSync = async () => {
    setSyncRun(true);
    await syncPhoneContacts();
  };

  const handleManualSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    setSyncRun(true);
    const phones = manualInput
      .split(/[\n,;]+/)
      .map(p => p.trim())
      .filter(p => p.length >= 5);

    if (phones.length > 0) {
      await matchPhoneNumbers(phones);
    }
  };

  const handleGoogleSync = async () => {
    setGoogleSyncRun(true);
    await syncGoogleContacts();
  };

  const handleAddUser = async (matched: ContactMatch) => {
    const success = await addMatchedContact(matched);
    if (success) {
      setAddedIds(prev => [...prev, matched.userId]);
      if (onContactAdded) {
        onContactAdded(matched.displayName);
      }
    }
  };

  const handleConnectAll = async () => {
    const unadded = googleMatchedUsers.filter(u => !addedIds.includes(u.userId));
    for (const match of unadded) {
      await handleAddUser(match);
    }
  };

  const handleCopyInvite = (contact: any, index: number) => {
    const inviteLink = `${window.location.origin}/contacts?invite=true`;
    const message = `Hey ${contact.displayName}! Join me on Enclave OS, a secure private communication environment: ${inviteLink}`;
    
    navigator.clipboard.writeText(message);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="p-5 bg-white dark:bg-[#1f2c34] rounded-[28px] border border-zinc-100 dark:border-zinc-800 shadow-xl max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
          <Users size={18} />
        </div>
        <div>
          <h3 className="text-[14px] font-bold text-zinc-900 dark:text-[#e9edef] leading-tight">Find Friends</h3>
          <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Contact Synchronization</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-100/80 dark:bg-zinc-900/50 p-1 rounded-xl mb-4 border border-zinc-200/20">
        <button
          onClick={() => setActiveTab('google')}
          className={`flex-1 py-2 text-center rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'google'
              ? 'bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          Google Sync
        </button>
        <button
          onClick={() => setActiveTab('phone')}
          className={`flex-1 py-2 text-center rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'phone'
              ? 'bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          Phone Sync
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'google' ? (
        <div className="space-y-4">
          <div className="p-3 bg-zinc-50 dark:bg-[#111b21] rounded-xl border border-zinc-100 dark:border-zinc-800 flex gap-2.5 items-start">
            <Mail size={16} className="text-zinc-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-zinc-500 dark:text-[#8696a0] leading-normal font-sans">
              <strong>Google integration:</strong> Securely retrieve contacts from your Google account. We match contacts in real-time using secure email or phone checks.
            </p>
          </div>

          {!googleSyncRun && !isGoogleSyncing ? (
            <button
              onClick={handleGoogleSync}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 font-bold rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              <Users size={14} /> Sync Google Contacts
            </button>
          ) : isGoogleSyncing ? (
            <div className="py-6 flex flex-col items-center justify-center gap-3">
              <RefreshCw size={24} className="text-emerald-500 animate-spin" />
              <p className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                Importing Google Contacts...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Reset / Resync button */}
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-[#111b21] px-3 py-2 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Google Connected</span>
                <button
                  onClick={handleGoogleSync}
                  className="p-1 px-2.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Resync
                </button>
              </div>

              {googleError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl flex gap-2 text-[11px] font-sans border border-red-200/20">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{googleError}</span>
                </div>
              )}

              {/* Matched Google Contacts */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                    Matched Users ({googleMatchedUsers.length})
                  </h4>
                  {googleMatchedUsers.length > 0 && googleMatchedUsers.some(u => !addedIds.includes(u.userId)) && (
                    <button
                      onClick={handleConnectAll}
                      className="text-[9px] font-mono font-bold text-[#25D366] hover:text-emerald-500 uppercase tracking-widest cursor-pointer"
                    >
                      Connect All
                    </button>
                  )}
                </div>

                {googleMatchedUsers.length === 0 ? (
                  <p className="text-[11px] font-sans text-zinc-400 dark:text-zinc-500 italic text-center py-3 bg-zinc-50 dark:bg-[#111b21] rounded-xl border border-zinc-100 dark:border-zinc-800">
                    None of your Google Contacts are on Enclave yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar pr-1">
                    {googleMatchedUsers.map((matched) => {
                      const isAdded = addedIds.includes(matched.userId);
                      return (
                        <div
                          key={matched.userId}
                          className="flex items-center justify-between gap-3 p-2 bg-zinc-50 dark:bg-[#111b21] rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={matched.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${matched.username}`}
                              alt={matched.displayName}
                              className="w-8 h-8 rounded-full border border-zinc-200/50 object-cover"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-900 dark:text-[#e9edef] truncate leading-tight">
                                {matched.displayName}
                              </p>
                              <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest mt-0.5">
                                @{matched.username}
                              </p>
                            </div>
                          </div>

                          {isAdded ? (
                            <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-widest pr-1">
                              <CheckCircle size={11} /> Connected
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddUser(matched)}
                              className="px-3 py-1.5 bg-zinc-900 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 hover:bg-zinc-800 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={10} /> Connect
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Other Google Contacts (Invite List) */}
              {nonMatchedGoogleContacts.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-2">
                    Invite to Enclave ({nonMatchedGoogleContacts.length})
                  </h4>
                  <div className="space-y-2 max-h-44 overflow-y-auto no-scrollbar pr-1">
                    {nonMatchedGoogleContacts.map((contact, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 p-2 bg-zinc-50 dark:bg-[#111b21] rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={contact.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${contact.displayName}`}
                            alt={contact.displayName}
                            className="w-8 h-8 rounded-full border border-zinc-200/50 object-cover"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-900 dark:text-[#e9edef] truncate leading-tight">
                              {contact.displayName}
                            </p>
                            <p className="text-[9px] font-mono text-zinc-400 truncate tracking-widest mt-0.5">
                              {contact.emails?.[0] || contact.phones?.[0] || 'Google Account'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCopyInvite(contact, idx)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer border ${
                            copiedIndex === idx
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                              : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-[#aebac1] hover:bg-zinc-50'
                          }`}
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check size={10} /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={10} /> Invite
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-zinc-50 dark:bg-[#111b21] rounded-xl border border-zinc-100 dark:border-zinc-800 flex gap-2.5 items-start">
            <Info size={16} className="text-zinc-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-zinc-500 dark:text-[#8696a0] leading-normal font-sans">
              <strong>Privacy first:</strong> We only check cryptographically secure hashes (SHA-256) of phone numbers. Your raw contacts never leave your device.
            </p>
          </div>

          {/* Auto Sync if API is supported */}
          {isContactsApiSupported() ? (
            <button
              onClick={handleAutoSync}
              disabled={isSyncing}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-zinc-950 font-bold rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Syncing...
                </>
              ) : (
                <>
                  <Users size={14} /> Sync Device Contacts
                </>
              )}
            </button>
          ) : (
            <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-[10px] font-mono font-bold text-amber-600 uppercase tracking-wider text-center">
              Automatic contact API not supported on this device. Use manual option below:
            </div>
          )}

          {/* Manual Input form */}
          <form onSubmit={handleManualSync} className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-1">
              Enter phone numbers (one per line or comma-separated)
            </label>
            <textarea
              placeholder="+1 555-123-4567&#10;+44 7911 123456"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              disabled={isSyncing}
              className="w-full h-20 p-3 bg-zinc-50 dark:bg-[#111b21] border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[12px] text-zinc-800 dark:text-[#e9edef] outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-zinc-400 placeholder:font-mono font-sans resize-none"
            />
            <button
              type="submit"
              disabled={isSyncing || !manualInput.trim()}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-zinc-950 font-black rounded-2xl text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isSyncing ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <>
                  <Search size={14} /> Find Matches
                </>
              )}
            </button>
          </form>

          {/* Results */}
          {syncRun && !isSyncing && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <h4 className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-2.5">
                Matched Users ({matchedUsers.length})
              </h4>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl flex gap-2 text-[11px] font-sans">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {matchedUsers.length === 0 ? (
                <p className="text-[11px] font-sans text-zinc-400 dark:text-zinc-500 italic text-center py-4">
                  No matching friends found on Enclave OS yet. Generate your invite link below to invite them!
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar pr-1">
                  {matchedUsers.map((matched) => {
                    const isAdded = addedIds.includes(matched.userId);
                    return (
                      <div
                        key={matched.userId}
                        className="flex items-center justify-between gap-3 p-2 bg-zinc-50 dark:bg-[#111b21] rounded-xl border border-zinc-100 dark:border-zinc-800"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={matched.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${matched.username}`}
                            alt={matched.displayName}
                            className="w-8 h-8 rounded-full border border-zinc-200"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-900 dark:text-[#e9edef] truncate leading-tight">
                              {matched.displayName}
                            </p>
                            <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest mt-0.5">
                              @{matched.username}
                            </p>
                          </div>
                        </div>

                        {isAdded ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#25D366] uppercase tracking-widest">
                            <CheckCircle size={12} /> Connected
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddUser(matched)}
                            className="px-3 py-1.5 bg-zinc-900 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 hover:bg-zinc-800 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={10} /> Connect
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
