import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, Paperclip, Minimize2, Maximize2, Sparkles, AlertCircle 
} from 'lucide-react';
import { EmailAccount } from '../../hooks/useEmailAccounts';
import { EmailAttachment } from '../../hooks/useEmailInbox';
import { useEmailCompose } from '../../hooks/useEmailCompose';
import { useAuth } from '../../context/AuthContext';

interface EmailComposerProps {
  accounts: EmailAccount[];
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  replyToThreadId?: string;
  onClose: () => void;
}

export function EmailComposer({
  accounts,
  initialTo = '',
  initialSubject = '',
  initialBody = '',
  replyToThreadId,
  onClose
}: EmailComposerProps) {
  const { user } = useAuth();
  const { sendEmail, sending } = useEmailCompose();
  
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [toInput, setToInput] = useState(initialTo);
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Attachments State
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Smart Compose State
  const [suggestion, setSuggestion] = useState('');
  const [showHint, setShowHint] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // AI Smart Compose logic
  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setBody(val);
    setSuggestion('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const words = val.trim().split(/\s+/);
    if (words.length >= 3 && val.endsWith(' ')) {
      typingTimeoutRef.current = setTimeout(async () => {
        try {
          // Fetch suggestions from our secure server endpoint
          const token = await user?.getIdToken();
          const response = await fetch('/api/ai/smart-compose', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ prompt: val.slice(-150) }),
          });
          if (response.ok) {
            const data = await response.json();
            if (data.suggestion && data.suggestion.length > 0) {
              setSuggestion(data.suggestion);
              setShowHint(true);
              setTimeout(() => setShowHint(false), 3000);
            }
          }
        } catch (err) {
          console.error("Smart compose fetch error:", err);
        }
      }, 300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && suggestion) {
      e.preventDefault();
      setBody(prev => prev + suggestion);
      setSuggestion('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: EmailAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      // Generate a nice dummy object URL for simulation
      const url = URL.createObjectURL(f);
      newAttachments.push({
        filename: f.name,
        mimeType: f.type || 'application/octet-stream',
        size: f.size,
        url: url
      });
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) return;
    if (!toInput) return;

    const activeAccount = accounts.find(a => a.id === selectedAccountId);
    if (!activeAccount) return;

    const formattedTo = toInput.split(',').map(email => {
      const clean = email.trim();
      return { name: clean.split('@')[0], email: clean };
    });

    try {
      await sendEmail({
        accountId: selectedAccountId,
        senderEmail: activeAccount.email,
        senderName: activeAccount.displayName,
        to: formattedTo,
        cc: ccInput ? ccInput.split(',').map(e => e.trim()) : undefined,
        bcc: bccInput ? bccInput.split(',').map(e => e.trim()) : undefined,
        subject: subject || '(No Subject)',
        body: body,
        attachments: attachments,
        replyToThreadId: replyToThreadId
      });
      onClose();
    } catch (err) {
      console.error("Failed to send email:", err);
    }
  };

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-4 right-4 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 flex items-center justify-between p-3"
        id="email-composer-minimized"
      >
        <span className="text-xs font-semibold text-slate-200 truncate max-w-[150px]">
          {subject || 'Draft Email'}
        </span>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMinimized(false)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <div 
      className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 w-full h-full sm:w-[540px] sm:h-[580px] bg-slate-900 border border-slate-800 sm:rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
      id="email-composer-overlay"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="text-sm font-semibold text-white">
            {replyToThreadId ? 'Reply to Thread' : 'New Email Message'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSend} className="flex-1 flex flex-col min-h-0 p-4">
        {/* Account Selector */}
        <div className="flex items-center gap-2.5 mb-3">
          <label className="text-xs text-slate-400 w-12 shrink-0">From:</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-1.5 text-slate-200 outline-none focus:border-amber-500 transition"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.displayName} ({acc.email})
              </option>
            ))}
          </select>
        </div>

        {/* Recipients input */}
        <div className="flex items-center gap-2.5 mb-3">
          <label className="text-xs text-slate-400 w-12 shrink-0">To:</label>
          <input
            type="text"
            required
            placeholder="recipient@example.com (comma separated)"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-1.5 text-slate-200 outline-none focus:border-amber-500 transition"
          />
          <button
            type="button"
            onClick={() => setShowCcBcc(!showCcBcc)}
            className="text-[10px] text-amber-500 font-semibold px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition"
          >
            Cc/Bcc
          </button>
        </div>

        {/* CC and BCC */}
        {showCcBcc && (
          <div className="space-y-3 mb-3 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <label className="text-xs text-slate-400 w-12 shrink-0">Cc:</label>
              <input
                type="text"
                placeholder="cc@example.com"
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-1.5 text-slate-200 outline-none focus:border-amber-500 transition"
              />
            </div>
            <div className="flex items-center gap-2.5">
              <label className="text-xs text-slate-400 w-12 shrink-0">Bcc:</label>
              <input
                type="text"
                placeholder="bcc@example.com"
                value={bccInput}
                onChange={(e) => setBccInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-1.5 text-slate-200 outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>
        )}

        {/* Subject */}
        <div className="flex items-center gap-2.5 mb-3">
          <label className="text-xs text-slate-400 w-12 shrink-0">Subject:</label>
          <input
            type="text"
            placeholder="Enter email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-1.5 text-slate-200 outline-none focus:border-amber-500 transition font-semibold"
          />
        </div>

        {/* Body Editor Container */}
        <div className="flex-1 relative flex flex-col min-h-0 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden mb-3">
          {/* Smart Compose Hint Badge */}
          {suggestion && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500/15 border border-amber-500/20 text-[10px] text-amber-500 px-2 py-0.5 rounded-full font-medium shadow animate-pulse z-10">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Press <b>Tab</b> or <b>→</b> to auto-complete</span>
            </div>
          )}

          {/* Text Area */}
          <div className="flex-1 relative min-h-0">
            <textarea
              ref={bodyRef}
              required
              placeholder="Start drafting your email here..."
              value={body}
              onChange={handleBodyChange}
              onKeyDown={handleKeyDown}
              className="w-full h-full bg-transparent text-xs text-slate-300 p-4.5 outline-none resize-none overflow-y-auto leading-relaxed"
            />
            {/* suggestion overlay */}
            {suggestion && (
              <div 
                className="absolute left-4.5 top-4.5 pointer-events-none text-xs text-slate-500 font-mono italic whitespace-pre-wrap select-none leading-relaxed"
                style={{ 
                  color: '#64748b', 
                  opacity: 0.6,
                  paddingTop: '0.2rem',
                  lineHeight: '1.625'
                }}
              >
                {/* Pad the ghost text correctly behind user cursor using a helper calculation */}
                <span className="invisible">{body}</span>
                <span>{suggestion}</span>
              </div>
            )}
          </div>
        </div>

        {/* File attachment row */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 max-h-24 overflow-y-auto p-1 bg-slate-950 border border-slate-800/80 rounded-lg">
            {attachments.map((file, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-1.5 text-[10px] bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300"
              >
                <Paperclip className="w-2.5 h-2.5 text-amber-500" />
                <span className="truncate max-w-[120px]">{file.filename}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="text-slate-500 hover:text-red-400 transition ml-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-between border-t border-slate-800/50 pt-3">
          <div className="flex items-center gap-1.5">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-amber-500 hover:bg-slate-900 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attach Files</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-xs font-semibold transition"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={sending || !toInput}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/10 transition"
            >
              {sending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Mail</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
