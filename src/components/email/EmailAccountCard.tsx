import React from 'react';
import { 
  RefreshCw, Link2Off, CheckCircle, Mail, AlertTriangle 
} from 'lucide-react';
import { EmailAccount } from '../../hooks/useEmailAccounts';

export interface EmailAccountCardProps {
  account: EmailAccount;
  onDisconnect: (id: string) => any;
  onSync: (id: string) => any;
}

export const EmailAccountCard: React.FC<EmailAccountCardProps> = ({ account, onDisconnect, onSync }) => {
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gmail':
        return (
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center font-bold text-red-500">
            G
          </div>
        );
      case 'outlook':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-blue-500">
            O
          </div>
        );
      case 'yahoo':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-500">
            Y
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-slate-400" />
          </div>
        );
    }
  };

  const formatLastSync = (timestamp: any) => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
  };

  return (
    <div 
      className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md"
      id={`email-account-card-${account.id}`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {getProviderIcon(account.provider)}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-white truncate">{account.displayName}</h4>
            {account.isActive ? (
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-medium">
                <CheckCircle className="w-2.5 h-2.5" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded-full font-medium">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>Error</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 truncate mt-0.5">{account.email}</p>
          <p className="text-[10px] text-slate-500 mt-1">
            Last synced: <span className="text-slate-400">{formatLastSync(account.lastSync)}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        <button
          onClick={() => onSync(account.id)}
          className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center justify-center"
          title="Sync mailbox"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDisconnect(account.id)}
          className="p-2 rounded-lg bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/20 text-red-400 hover:text-red-300 transition flex items-center justify-center gap-1.5 text-xs font-semibold"
          title="Disconnect account"
        >
          <Link2Off className="w-4 h-4" />
          <span>Disconnect</span>
        </button>
      </div>
    </div>
  );
}
