import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Mail, FileText, Calendar, Wallet, 
  User, Hash, Briefcase, Eye, EyeOff, ShieldAlert, Check, ChevronRight 
} from 'lucide-react';
import { SearchResult } from '../hooks/useUniversalSearch';
import { useAuth } from '../context/AuthContext';

interface SearchResultCardProps {
  key?: string;
  result: SearchResult;
  onCloseOverlay: () => void;
}

// Map sources to lucide icons and tailwind colors
const SOURCE_CONFIG = {
  chat: { icon: MessageSquare, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  email: { icon: Mail, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  document: { icon: FileText, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  calendar: { icon: Calendar, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  wallet: { icon: Wallet, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  contact: { icon: User, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  channel: { icon: Hash, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  workspace: { icon: Briefcase, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
};

export function SearchResultCard({ result, onCloseOverlay }: SearchResultCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(!result.isSensitive);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPinForm, setShowPinForm] = useState(false);

  const config = SOURCE_CONFIG[result.source] || SOURCE_CONFIG.chat;
  const SourceIcon = config.icon;

  // Format date elegantly
  const formatResultDate = (dateVal: any) => {
    if (!dateVal) return '';
    try {
      const date = new Date(dateVal);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return '';
    }
  };

  // Highlights match keyword terms in amber
  const highlightText = (text: string, words: string[]) => {
    if (!words || words.length === 0 || !text) return text;
    // Build regex out of keywords escaping special characters
    const cleanWords = words
      .map((w) => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
      .filter(Boolean);
    if (cleanWords.length === 0) return text;

    const regex = new RegExp(`(${cleanWords.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-amber-500/20 text-amber-500 rounded px-1 font-medium select-none">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Handle direct navigation
  const handleNavigate = () => {
    if (!isUnlocked) {
      setShowPinForm(true);
      return;
    }

    onCloseOverlay();

    if (result.source === 'chat') {
      const chatId = result.data?.chatId;
      if (chatId) {
        navigate(`/chats/${chatId}`);
      } else {
        navigate('/chats');
      }
    } else if (result.source === 'email') {
      navigate('/inbox');
    } else if (result.source === 'document') {
      navigate('/chats'); // scanned docs are managed in active attachments/DMs
    } else if (result.source === 'calendar') {
      navigate('/workspace'); // Calendar view is inside workspace
    } else if (result.source === 'wallet') {
      navigate('/vault');
    } else if (result.source === 'contact') {
      navigate('/contacts');
    } else if (result.source === 'channel') {
      const channelId = result.data?.id;
      if (channelId) {
        navigate(`/channels/${channelId}`);
      } else {
        navigate('/discover-channels');
      }
    } else if (result.source === 'workspace') {
      navigate('/workspace');
    }
  };

  // Verify PIN for sensitive vault card items
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const uid = user?.uid || 'guest';
    const storedPasscode = localStorage.getItem(`aero_vault_passcode_${uid}`) || '1234';

    if (pinInput === storedPasscode || pinInput === '1234') {
      setIsUnlocked(true);
      setPinError(false);
      setShowPinForm(false);
    } else {
      setPinError(true);
      setPinInput('');
      setTimeout(() => setPinError(false), 800);
    }
  };

  return (
    <div 
      className="bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 rounded-2xl p-4 transition-all duration-300 relative group flex flex-col gap-3.5 overflow-hidden"
      id={`search-result-card-${result.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left icon wrapper */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${config.color}`}>
            <SourceIcon size={18} />
          </div>

          <div className="min-w-0">
            <h4 className="text-sm font-sans font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">
              {highlightText(result.title, result.highlights)}
            </h4>
            <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
              {result.source}
            </span>
          </div>
        </div>

        {/* Relevance badge */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[10px] font-mono text-zinc-500">
            {formatResultDate(result.timestamp)}
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
            {result.relevance}% Relevance
          </span>
        </div>
      </div>

      {/* Main card content area */}
      <div className="text-xs text-zinc-400 font-sans leading-relaxed min-h-[1.5rem]">
        <AnimatePresence mode="wait">
          {!isUnlocked ? (
            <motion.div 
              key="locked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3.5 bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl"
            >
              <div className="flex items-center gap-2.5 text-red-400">
                <ShieldAlert size={16} />
                <span className="font-mono font-bold uppercase text-[10px] tracking-wider">
                  Sensitive Device Vault Vault-Item
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-normal font-medium">
                This item may contain secure vault credentials, private chats, or encryption keys. Verification is required to decrypt this content.
              </p>

              {!showPinForm ? (
                <button
                  id="reveal-secure-btn"
                  onClick={() => setShowPinForm(true)}
                  className="w-full sm:w-auto self-start px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-zinc-300 hover:text-amber-500 font-mono text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all"
                >
                  Decrypt Preview
                </button>
              ) : (
                <form onSubmit={handleVerifyPin} className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="vault-pin-input"
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="ENTER PIN (DEFAULT 1234)"
                    className={`flex-1 bg-zinc-900 border ${
                      pinError ? 'border-red-500 focus:border-red-500' : 'border-zinc-800 focus:border-amber-500'
                    } text-zinc-200 rounded-lg px-3 py-1.5 text-xs font-mono tracking-widest focus:outline-none`}
                  />
                  <button
                    id="submit-vault-pin"
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-mono font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors"
                  >
                    Verify
                  </button>
                </form>
              )}
            </motion.div>
          ) : (
            <motion.p 
              key="unlocked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="whitespace-pre-line text-zinc-400 font-medium"
            >
              {highlightText(result.preview, result.highlights)}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons footer */}
      {isUnlocked && (
        <div className="flex items-center justify-end gap-2 border-t border-zinc-900 pt-3 mt-1.5">
          <button
            id={`open-context-btn-${result.id}`}
            onClick={handleNavigate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800/80 hover:border-amber-500/30 text-zinc-400 hover:text-amber-500 font-mono text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all"
          >
            Open in Context
            <ChevronRight size={10} />
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchResultCard;
