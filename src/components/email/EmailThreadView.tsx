import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Star, Reply, Archive, Trash2, Mail, Sparkles, CheckCircle2, 
  Send, Paperclip 
} from 'lucide-react';
import { EmailThread, EmailMessage } from '../../hooks/useEmailInbox';
import { EmailAttachmentViewer } from './EmailAttachmentViewer';
import { useAuth } from '../../context/AuthContext';

interface EmailThreadViewProps {
  thread: EmailThread;
  onBack: () => void;
  onStar: (threadId: string, isStarred: boolean) => void;
  onArchive: (threadId: string) => void;
  onDelete: (threadId: string) => void;
  onReply: (replyBody: string) => void;
}

export function EmailThreadView({
  thread,
  onBack,
  onStar,
  onArchive,
  onDelete,
  onReply
}: EmailThreadViewProps) {
  const { user } = useAuth();
  
  // Local state for UI
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  
  const [replyText, setReplyText] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);

  const firstMsg = thread.messages[0];
  const lastMsg = thread.messages[thread.messages.length - 1];

  // Fetch AI Smart Replies on load
  useEffect(() => {
    const fetchSmartReplies = async () => {
      if (!lastMsg) return;
      setLoadingReplies(true);
      try {
        const token = await user?.getIdToken();
        const response = await fetch('/api/ai/email/smart-replies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            subject: thread.subject,
            body: lastMsg.body
          })
        });
        if (response.ok) {
          const replies = await response.json();
          setSmartReplies(replies);
        }
      } catch (err) {
        console.error("Failed to load smart replies:", err);
      } finally {
        setLoadingReplies(false);
      }
    };

    fetchSmartReplies();
  }, [thread.id, lastMsg, user]);

  const handleSummarize = async () => {
    if (!lastMsg) return;
    setLoadingSummary(true);
    setSummary('');
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/ai/email/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ body: lastMsg.body })
      });
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply(replyText);
    setReplyText('');
    setShowReplyForm(false);
  };

  const handleSmartReplyClick = (reply: string) => {
    setReplyText(reply);
    setShowReplyForm(true);
  };

  const formatEmailDate = (date: any) => {
    const d = new Date(date);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950" id={`email-thread-view-${thread.id}`}>
      {/* Control bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onStar(thread.id, !(firstMsg?.isStarred))}
            className={`p-2 rounded-lg hover:bg-slate-800 transition ${
              firstMsg?.isStarred ? 'text-amber-500' : 'text-slate-400 hover:text-white'
            }`}
            title="Star email"
          >
            <Star className="w-4 h-4 fill-current" />
          </button>
          <button
            onClick={() => onArchive(thread.id)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(thread.id)}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
            title="Delete thread"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Subject Heading */}
        <div className="bg-slate-900/60 border border-slate-900 p-4 rounded-xl flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] bg-slate-800 text-amber-500 px-2 py-0.5 rounded border border-slate-700 font-mono tracking-wider font-semibold uppercase">
              Email Conversation
            </span>
            <h1 className="text-base font-semibold text-white mt-1.5 leading-snug">{thread.subject}</h1>
          </div>
          <button
            onClick={handleSummarize}
            disabled={loadingSummary}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs text-amber-500 transition flex items-center gap-1.5 flex-shrink-0 shadow"
          >
            {loadingSummary ? (
              <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>AI Summarize</span>
          </button>
        </div>

        {/* AI Summary Card */}
        {summary && (
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 animate-scaleIn">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 mb-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>AI Summary (TL;DR)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">{summary}</p>
          </div>
        )}

        {/* Messages Thread list */}
        <div className="space-y-4">
          {thread.messages.map((msg, index) => {
            const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(msg.from.name)}`;
            return (
              <div 
                key={msg.id}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 transition-all duration-300 hover:border-slate-600/80 shadow-md"
                id={`email-message-${msg.id}`}
              >
                {/* Message Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar with Envelope corner icon */}
                    <div className="relative">
                      <img 
                        src={avatarUrl} 
                        alt={msg.from.name} 
                        className="w-10 h-10 rounded-full border border-slate-700/80 bg-slate-900 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                        <Mail className="w-3 h-3 text-amber-500" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-white">{msg.from.name}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">&lt;{msg.from.email}&gt;</p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatEmailDate(msg.receivedAt)}
                  </span>
                </div>

                {/* Message Body (using safe HTML fallback renderer) */}
                <div className="text-slate-300 text-xs leading-relaxed prose-sm break-words whitespace-pre-wrap pl-1 mb-3">
                  {msg.bodyHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: msg.bodyHtml }} />
                  ) : (
                    msg.body
                  )}
                </div>

                {/* Attachments Section */}
                <EmailAttachmentViewer attachments={msg.attachments} />
              </div>
            );
          })}
        </div>

        {/* AI suggested replies row */}
        {smartReplies.length > 0 && (
          <div className="space-y-2 pt-2 animate-fadeIn">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Smart Replies</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {smartReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSmartReplyClick(reply)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/30 text-slate-300 hover:text-white text-xs font-medium text-left transition shadow"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reply trigger / quick reply form */}
        <div className="pt-2">
          {!showReplyForm ? (
            <button
              onClick={() => setShowReplyForm(true)}
              className="w-full py-3.5 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-850 text-xs font-bold text-slate-300 hover:text-white transition flex items-center justify-center gap-2 shadow"
            >
              <Reply className="w-4 h-4 text-amber-500" />
              <span>Click here to Reply...</span>
            </button>
          ) : (
            <form onSubmit={handleSendReply} className="bg-slate-900 border border-slate-850 rounded-xl p-4 animate-fadeIn shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Reply className="w-4 h-4 text-amber-500" />
                  <span>Replying as: {firstMsg?.to?.[0]?.name || user?.displayName || 'User'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <textarea
                required
                placeholder="Draft your reply here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl p-3 h-28 outline-none focus:border-amber-500 resize-none transition"
              />

              <div className="flex items-center justify-between mt-3">
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Replies are securely saved to the email thread</span>
                </div>

                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reply</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
