import React, { useState } from 'react';
import { Search, Sparkles, MessageSquare, Mail, Layers, Loader2, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

interface EmailSearchProps {
  onSearch: (query: string, scope: 'all' | 'emails' | 'chats') => void;
  emailsContext: any[]; // EmailThread array to query over
  chatsContext: any[];  // Chats array to query over
}

export const EmailSearch: React.FC<EmailSearchProps> = ({
  onSearch,
  emailsContext = [],
  chatsContext = []
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'all' | 'emails' | 'chats'>('all');
  const [aiSearchMode, setAiSearchMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiMatches, setAiMatches] = useState<any[]>([]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, scope);
  };

  const handleScopeChange = (newScope: 'all' | 'emails' | 'chats') => {
    setScope(newScope);
    onSearch(query, newScope);
  };

  const triggerNeuralAiSearch = async () => {
    if (!query.trim()) return;
    setAiLoading(true);
    setAiResponse(null);
    setAiMatches([]);

    try {
      // Limit size of email and chat data to stay within safe model token sizes
      const emailsSample = emailsContext.slice(0, 15).map(t => ({
        id: t.id,
        subject: t.subject,
        participants: t.participants,
        snippet: t.messages?.[0]?.body?.slice(0, 300) || '',
        receivedAt: t.lastMessageAt
      }));

      const chatsSample = chatsContext.slice(0, 15).map(c => ({
        id: c.id,
        name: c.groupName || c.peerName || 'Direct Chat',
        snippet: c.lastMessage?.text || '',
        updatedAt: c.lastMessage?.createdAt
      }));

      const response = await fetch('/api/ai/email/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          emails: emailsSample,
          chats: chatsSample,
          scope: scope
        })
      });

      if (!response.ok) {
        throw new Error('AI Search response failed');
      }

      const data = await response.json();
      setAiResponse(data.answer || 'No AI interpretation found.');
      setAiMatches(data.matchedIds || []);
    } catch (err) {
      console.error('Peace AI Neural Search Error:', err);
      setAiResponse('Neural sync failed. Unable to synthesize smart query results at this moment.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4.5 space-y-4 shadow-xl" id="neural-search-panel">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Neural Relay Search</h3>
        </div>
        <button
          onClick={() => {
            setAiSearchMode(!aiSearchMode);
            setAiResponse(null);
          }}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
            aiSearchMode 
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10' 
              : 'bg-slate-950 text-amber-500 border border-amber-500/10 hover:border-amber-500/20'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>AI Search</span>
        </button>
      </div>

      {/* Query Form */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!aiSearchMode) {
              onSearch(e.target.value, scope);
            }
          }}
          placeholder={
            aiSearchMode 
              ? "Ask AI: 'Show me emails from John about the project'..." 
              : "Search global relays, matrices, transmission logs..."
          }
          className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-200 outline-none focus:border-amber-500/50 transition font-medium"
        />
        {aiSearchMode ? (
          <button
            type="button"
            onClick={triggerNeuralAiSearch}
            disabled={aiLoading || !query.trim()}
            className="absolute right-2 top-2 p-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-600 disabled:opacity-40 transition cursor-pointer flex items-center justify-center"
          >
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <div className="absolute right-3 top-3 flex items-center justify-center text-slate-500">
            <Search className="w-3.5 h-3.5" />
          </div>
        )}
      </form>

      {/* Scope Toggles */}
      <div className="flex gap-1.5 border-t border-slate-850 pt-3">
        {(['all', 'emails', 'chats'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleScopeChange(s)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
              scope === s
                ? 'bg-slate-950 text-amber-500 border border-amber-500/30 font-extrabold'
                : 'bg-transparent text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            {s === 'all' && <Layers className="w-3 h-3" />}
            {s === 'emails' && <Mail className="w-3 h-3 text-amber-500/60" />}
            {s === 'chats' && <MessageSquare className="w-3 h-3 text-blue-400/60" />}
            <span>{s === 'all' ? 'All Channels' : s === 'emails' ? 'Emails Only' : 'Chats Only'}</span>
          </button>
        ))}
      </div>

      {/* AI Response Block */}
      <AnimatePresence>
        {aiSearchMode && (aiResponse || aiLoading) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-950 border border-amber-500/10 rounded-xl p-3.5 text-xs space-y-2 overflow-hidden mt-2"
          >
            <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="font-bold text-amber-500 uppercase tracking-widest text-[9px]">Peace AI Interpretation</span>
            </div>

            {aiLoading ? (
              <div className="flex items-center gap-2.5 py-4 text-slate-500 italic">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span>Synchronizing neural data and ranking matches...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-300 leading-relaxed font-medium">
                  {aiResponse}
                </p>
                {aiMatches.length > 0 && (
                  <div className="space-y-1.5 border-t border-slate-900 pt-2.5">
                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Direct Relay Matches:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {aiMatches.map((id) => (
                        <span key={id} className="px-2 py-0.5 rounded bg-amber-500/5 border border-amber-500/20 text-[9px] font-mono font-semibold text-amber-400">
                          ID: {id.slice(0, 8)}...
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
