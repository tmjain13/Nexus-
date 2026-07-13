import React, { useState, useEffect } from 'react';
import { 
  Mail, Star, Search, Filter, Archive, Trash2, Plus, RefreshCw, Sparkles, AlertCircle 
} from 'lucide-react';
import { useEmailInbox, EmailThread } from '../../hooks/useEmailInbox';
import { useEmailAccounts } from '../../hooks/useEmailAccounts';
import { EmailThreadView } from './EmailThreadView';
import { EmailComposer } from './EmailComposer';
import { EmailSearch } from './EmailSearch';
import { EmailLabels } from './EmailLabels';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export function UnifiedInbox() {
  const { user } = useAuth();
  const { accounts, loading: loadingAccounts, sync } = useEmailAccounts();
  
  // Selected account filter
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string | null>(null);
  
  // Real-time hooks
  const { 
    threads, 
    loading: loadingThreads, 
    markThreadRead, 
    starThread, 
    archiveThread, 
    deleteThread,
    updateThreadLabels
  } = useEmailInbox(selectedAccountFilter);

  // Email Compose states
  const [showComposer, setShowComposer] = useState(false);
  const [composeParams, setComposeParams] = useState<{
    initialTo?: string;
    initialSubject?: string;
    initialBody?: string;
    replyToThreadId?: string;
  }>({});

  // Active viewing thread state
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'all' | 'emails' | 'chats'>('all');
  
  // Active folder/label state
  const [activeLabelFilter, setActiveLabelFilter] = useState<string>('Inbox');

  // Custom tags management state
  const [customLabels, setCustomLabels] = useState<string[]>(['Work', 'Personal', 'Travel']);

  // Chats context for global and AI searches
  const [chatsContext, setChatsContext] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const qChats = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
    const unsubChats = onSnapshot(qChats, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setChatsContext(prev => [...list, ...prev.filter(p => p.isGroup)]);
    });

    const qGroups = query(collection(db, 'groupChat'), where('participants', 'array-contains', user.uid));
    const unsubGroups = onSnapshot(qGroups, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, isGroup: true, ...d.data() }));
      setChatsContext(prev => [...prev.filter(p => !p.isGroup), ...list]);
    });

    return () => {
      unsubChats();
      unsubGroups();
    };
  }, [user]);

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleOpenThread = (threadId: string) => {
    setActiveThreadId(threadId);
    markThreadRead(threadId, true);
  };

  const handleReplyToThread = async (replyText: string) => {
    if (!activeThread) return;
    const lastMsg = activeThread.messages[activeThread.messages.length - 1];
    if (!lastMsg) return;

    setComposeParams({
      initialTo: lastMsg.from.email,
      initialSubject: `Re: ${activeThread.subject}`,
      initialBody: `\n\nOn ${new Date(lastMsg.receivedAt).toLocaleString()}, ${lastMsg.from.name} wrote:\n> ${lastMsg.body.replace(/\n/g, '\n> ')}`,
      replyToThreadId: activeThread.id
    });
    
    setShowComposer(true);
  };

  const handleComposeNew = () => {
    setComposeParams({});
    setShowComposer(true);
  };

  const handleAddLabel = (newLabel: string) => {
    if (!customLabels.includes(newLabel)) {
      setCustomLabels([...customLabels, newLabel]);
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setCustomLabels(customLabels.filter(l => l !== labelToRemove));
    if (activeLabelFilter === labelToRemove) {
      setActiveLabelFilter('Inbox');
    }
  };

  // Filter threads by search, scope and labels
  const filteredThreads = threads.filter(thread => {
    // 1. Label filter
    const firstMsg = thread.messages[0];
    const labels = firstMsg?.labels || [];
    
    if (activeLabelFilter === 'Starred') {
      if (!firstMsg?.isStarred) return false;
    } else if (activeLabelFilter === 'Archive') {
      if (!labels.includes('Archive')) return false;
    } else {
      // General labels (Inbox, Sent, Promotions, Social, Updates, Forums or Custom Labels)
      if (!labels.includes(activeLabelFilter)) {
        // Fallback auto-classification if label is empty but subject/body matches characteristics
        if (activeLabelFilter === 'Promotions' && (thread.subject.toLowerCase().includes('offer') || thread.subject.toLowerCase().includes('deal') || thread.subject.toLowerCase().includes('promo'))) {
          return true;
        }
        if (activeLabelFilter === 'Social' && (thread.subject.toLowerCase().includes('invite') || thread.subject.toLowerCase().includes('friend') || thread.subject.toLowerCase().includes('social'))) {
          return true;
        }
        return false;
      }
    }

    // 2. Search query filter
    if (searchQuery.trim() !== '') {
      // Skip if scope is Chats only
      if (searchScope === 'chats') return false;

      const queryText = searchQuery.toLowerCase();
      const subjectMatch = thread.subject.toLowerCase().includes(queryText);
      const participantMatch = thread.participants.some(p => p.toLowerCase().includes(queryText));
      const bodyMatch = thread.messages.some(m => m.body.toLowerCase().includes(queryText));
      return subjectMatch || participantMatch || bodyMatch;
    }

    return true;
  });

  const getProviderTagColor = (provider: string) => {
    switch (provider) {
      case 'gmail': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'outlook': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'yahoo': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (activeThread) {
    return (
      <EmailThreadView
        thread={activeThread}
        onBack={() => setActiveThreadId(null)}
        onStar={(id, starred) => starThread(id, starred)}
        onArchive={(id) => {
          archiveThread(id);
          setActiveThreadId(null);
        }}
        onDelete={(id) => {
          deleteThread(id);
          setActiveThreadId(null);
        }}
        onReply={handleReplyToThread}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950" id="unified-email-inbox">
      {/* Search & Header */}
      <div className="p-4 border-b border-slate-900 bg-slate-900/40 space-y-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-500" />
            <h1 className="text-base font-bold text-white tracking-wide">Unified Inbox</h1>
          </div>
          {accounts.length > 0 && (
            <button
              onClick={handleComposeNew}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow shadow-amber-500/10 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Compose</span>
            </button>
          )}
        </div>

        {/* Global/AI Search component */}
        <EmailSearch
          emailsContext={threads}
          chatsContext={chatsContext}
          onSearch={(queryText, scope) => {
            setSearchQuery(queryText);
            setSearchScope(scope);
          }}
        />
      </div>

      {/* Main Mail Grid Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Side: Sidebar Organization */}
        {accounts.length > 0 && (
          <div className="hidden md:block w-64 border-r border-slate-900 bg-slate-950 p-3 overflow-y-auto shrink-0">
            {/* Account Selector */}
            <div className="mb-4">
              <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 pl-1 mb-1.5 block">Active Node</label>
              <select
                value={selectedAccountFilter || ''}
                onChange={(e) => setSelectedAccountFilter(e.target.value || null)}
                className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-2.5 py-2 text-slate-200 outline-none focus:border-amber-500 transition cursor-pointer"
              >
                <option value="">All Accounts Combined</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.email}</option>
                ))}
              </select>
            </div>

            <EmailLabels
              activeLabel={activeLabelFilter}
              onSelectLabel={(lbl) => {
                setActiveLabelFilter(lbl);
                setActiveThreadId(null);
              }}
              customLabels={customLabels}
              onAddLabel={handleAddLabel}
              onRemoveLabel={handleRemoveLabel}
            />
          </div>
        )}

        {/* Right Side: Threads list */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-950/20">
          {/* Mobile Labels Row (Shown only if not desktop) */}
          {accounts.length > 0 && (
            <div className="md:hidden flex gap-1.5 overflow-x-auto scrollbar-none p-3 border-b border-slate-900/60 bg-slate-950">
              {['Inbox', 'Starred', 'Sent', 'Archive', 'Promotions', 'Social'].map((lbl) => (
                <button
                  key={lbl}
                  onClick={() => {
                    setActiveLabelFilter(lbl);
                    setActiveThreadId(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition whitespace-nowrap cursor-pointer ${
                    activeLabelFilter === lbl
                      ? 'bg-amber-500/15 text-amber-500 border border-amber-500/25'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-850'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          )}

          {loadingAccounts || loadingThreads ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : accounts.length === 0 ? (
            /* Empty Connected State */
            <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                <Mail className="w-7 h-7 text-amber-500 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white">Unified Inbox Offline</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Link your Gmail, Outlook, or Yahoo account inside Profile Settings to sync your emails alongside your chat sessions.
              </p>
            </div>
          ) : filteredThreads.length === 0 ? (
            /* Empty Filtered State */
            <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center mb-3">
                <Filter className="w-5 h-5 text-slate-500" />
              </div>
              <h3 className="text-sm font-semibold text-white">No Emails Found</h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery ? "No emails match your search query." : `You have no emails inside category '${activeLabelFilter}'.`}
              </p>
            </div>
          ) : (
            /* Threads List */
            <div className="divide-y divide-slate-900/60 p-3 space-y-2">
              {filteredThreads.map(thread => {
                const firstMsg = thread.messages[0];
                const lastMsg = thread.messages[thread.messages.length - 1] || firstMsg;
                if (!firstMsg) return null;

                const isUnread = thread.isUnread;
                const provider = firstMsg.accountId.split('_')[0] || 'imap';

                return (
                  <div
                    key={thread.id}
                    onClick={() => handleOpenThread(thread.id)}
                    className={`group relative p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-start gap-3 ${
                      isUnread 
                        ? 'bg-slate-900/60 border-amber-500/25 shadow-sm shadow-amber-500/5' 
                        : 'bg-slate-900/15 border-slate-900 hover:border-slate-850 hover:bg-slate-900/35'
                    }`}
                    id={`email-thread-item-${thread.id}`}
                  >
                    {/* Status Indicator Bar */}
                    {isUnread && (
                      <div className="absolute left-0 top-3.5 bottom-3.5 w-1 rounded-r-md bg-amber-500" />
                    )}

                    {/* Left Column: Initials Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-750 flex items-center justify-center font-bold text-slate-300 text-xs">
                        {firstMsg.from.name.slice(0, 2).toUpperCase()}
                      </div>
                      {/* Envelope Corner Badge */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-slate-700/60 flex items-center justify-center">
                        <Mail className="w-2.5 h-2.5 text-amber-500" />
                      </div>
                    </div>

                    {/* Right Column: Main Text */}
                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs truncate ${isUnread ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                          {firstMsg.from.name}
                        </span>
                        {/* Provider Badge */}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold tracking-wider ${getProviderTagColor(provider)}`}>
                          {provider}
                        </span>
                      </div>

                      <h4 className={`text-xs truncate mt-1 ${isUnread ? 'font-bold text-white' : 'font-semibold text-slate-300'}`}>
                        {thread.subject}
                      </h4>

                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 break-all pr-4">
                        {lastMsg.body}
                      </p>
                    </div>

                    {/* Hover Actions Bar */}
                    <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          starThread(thread.id, !firstMsg.isStarred);
                        }}
                        className={`p-1.5 rounded-lg bg-slate-950 border border-slate-850 transition cursor-pointer ${
                          firstMsg.isStarred ? 'text-amber-500' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveThread(thread.id);
                        }}
                        className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteThread(thread.id);
                        }}
                        className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 hover:text-red-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Standard Time Display */}
                    <span className="absolute right-3.5 bottom-3.5 text-[10px] text-slate-500 font-mono group-hover:opacity-0 transition">
                      {formatTime(thread.lastMessageAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pop-up Composers */}
      {showComposer && (
        <EmailComposer
          accounts={accounts}
          initialTo={composeParams.initialTo}
          initialSubject={composeParams.initialSubject}
          initialBody={composeParams.initialBody}
          replyToThreadId={composeParams.replyToThreadId}
          onClose={() => setShowComposer(false)}
        />
      )}
    </div>
  );
}
