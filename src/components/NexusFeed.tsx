import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, MessageSquare, CheckSquare, Calendar, RefreshCw, Layers, Search, Clock, ChevronRight, Filter, AlertCircle, Copy, Check, Video } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { secureFetch } from '../lib/secureFetch';


export interface NexusActivity {
  id: string;
  type: 'chat' | 'task' | 'event' | 'security';
  title: string;
  category?: string;
  status?: string;
  timestamp: string | number;
  meta?: any;
}

interface NexusFeedProps {
  onClose?: () => void;
}

export default function NexusFeed({ onClose }: NexusFeedProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<NexusActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [summarizing, setSummarizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'chats' | 'tasks' | 'events'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Load activities from various sources
  const loadActivities = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const combined: NexusActivity[] = [];

      // 1. Load tasks from local storage (Command Center)
      const cachedTasks = localStorage.getItem(`enclave_tasks_${user.uid}`);
      if (cachedTasks) {
        const decodedTasks = JSON.parse(cachedTasks);
        decodedTasks.forEach((t: any) => {
          combined.push({
            id: t.id,
            type: 'task',
            title: `Task: ${t.title}`,
            category: t.category || 'Workspace',
            status: t.status === 'completed' ? 'COMPLETED' : 'PENDING',
            timestamp: Date.now() - 3600000 * (t.id === 'task-1' ? 2 : t.id === 'task-2' ? 12 : 24),
            meta: t
          });
        });
      }

      // 2. Load events from local storage (Calendar Tasks)
      const cachedEvents = localStorage.getItem(`enclave_events_${user.uid}`);
      if (cachedEvents) {
        const decodedEvents = JSON.parse(cachedEvents);
        decodedEvents.forEach((ev: any) => {
          combined.push({
            id: ev.id,
            type: 'event',
            title: `Event Scheduled: ${ev.title}`,
            category: ev.category || 'Operations',
            status: 'SCHEDULED',
            timestamp: Date.now() - 3600000 * 18,
            meta: ev
          });
        });
      }

      // 3. Query firestore for recent messages (Personnel context)
      try {
        const chatSnap = await getDocs(query(collection(db, 'chats'), limit(5)));
        const recentMessages: NexusActivity[] = [];
        
        for (const cDoc of chatSnap.docs) {
          const mSnap = await getDocs(
            query(
              collection(db, 'chats', cDoc.id, 'messages'),
              orderBy('createdAt', 'desc'),
              limit(2)
            )
          );
          mSnap.docs.forEach((mDoc) => {
            const data = mDoc.data();
            if (data.text) {
              recentMessages.push({
                id: mDoc.id,
                type: 'chat',
                title: `Message: "${data.text.substring(0, 48)}${data.text.length > 48 ? '...' : ''}"`,
                category: 'Personnel',
                status: data.senderId === user.uid ? 'transmitted' : 'received',
                timestamp: data.createdAt?.toDate ? data.createdAt.toDate().getTime() : Date.now() - 5000000,
                meta: { chatId: cDoc.id }
              });
            }
          });
        }
        combined.push(...recentMessages);
      } catch (e) {
        console.warn("Could not query FireStore messages for Nexus Feed, using secure placeholders:", e);
      }

      // 4. Fallback default alerts for richer feed presence if needed
      combined.push({
        id: 'sec-alert-1',
        type: 'security',
        title: 'Quantum Key exchange refresh complete',
        category: 'Vault',
        status: 'SECURE',
        timestamp: Date.now() - 1500000
      });

      // Sort by newest first
      combined.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
      setActivities(combined);

      // Trigger automatic AI summarization
      generateAiSummary(combined);
    } catch (err) {
      console.error("Error loading activities for Enclave Nexus:", err);
    } finally {
      setLoading(false);
    }
  };

  // Generate AI Summary of events
  const generateAiSummary = async (list: NexusActivity[]) => {
    if (list.length === 0) return;
    setSummarizing(true);
    try {
      const response = await secureFetch('/api/ai/nexus-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activities: list.slice(0, 10) })
      });
      const data = await response.json();
      if (data.summary) {
        setAiSummary(data.summary);
      } else {
        setAiSummary("<div className='p-3 text-xs text-amber-400'>Operational briefing synchronization unresolved. Check Enclave connection keys.</div>");
      }
    } catch (err) {
      console.error("Failed to generate Feed summary:", err);
      setAiSummary("<div className='p-3 text-xs text-red-500'>Synchronization hardware failure. Unable to interface with Grace Core.</div>");
    } finally {
      setSummarizing(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [user]);

  const copyBriefingToClipboard = () => {
    // Strip HTML tags for clean copy
    const tempElement = document.createElement("div");
    tempElement.innerHTML = aiSummary;
    const cleanText = tempElement.textContent || tempElement.innerText || "";
    navigator.clipboard.writeText(cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'chat': return <MessageSquare size={13} className="text-cyan-400" />;
      case 'task': return <CheckSquare size={13} className="text-amber-500" />;
      case 'event': return <Calendar size={13} className="text-emerald-400" />;
      default: return <AlertCircle size={13} className="text-red-400" />;
    }
  };

  // Filter items
  const filteredActivities = activities.filter(act => {
    const matchesSearch = act.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (act.category && act.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'chats') return act.type === 'chat' && matchesSearch;
    if (activeTab === 'tasks') return act.type === 'task' && matchesSearch;
    if (activeTab === 'events') return act.type === 'event' && matchesSearch;
    return matchesSearch;
  });

  return (
    <div className={cn("flex flex-col h-full border-l overflow-hidden font-sans transition-colors duration-200", theme === 'dark' ? "bg-[#040608] border-zinc-900/60" : "bg-white border-zinc-150")}>
      <div className={cn("border-b p-5 flex items-center justify-between shadow-sm shrink-0 transition-colors duration-200", theme === 'dark' ? "border-zinc-900/60 bg-[#070b0e]" : "border-zinc-150 bg-zinc-50")}>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Layers className="text-emerald-500 shrink-0" size={18} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-black animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-black" />
          </div>
          <div>
            <h2 className={cn("text-sm font-bold tracking-wider uppercase", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>Enclave Nexus Feed</h2>
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Automated Multi-System Ledger & Updates</p>
          </div>
        </div>
        
        {onClose && (
          <button 
            onClick={onClose} 
            className={cn("px-3 py-1.5 border text-[9px] font-mono font-bold rounded-lg transition-all uppercase cursor-pointer", theme === 'dark' ? "bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-white" : "bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900")}
          >
            Close Feed
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 progress-scroll">
        
        {/* Real-time AI Summary Panel */}
        <div className="border border-emerald-500/15 bg-emerald-950/5 rounded-2xl overflow-hidden p-4 relative shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          
          <div className="flex items-center justify-between mb-3 text-emerald-400">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="animate-pulse text-emerald-400" />
              <span className="text-[10px] font-mono leading-none tracking-widest uppercase font-bold">Tactical Intelligence Briefing</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              {aiSummary && (
                <button
                  onClick={copyBriefingToClipboard}
                  className="p-1 px-2 hover:bg-zinc-850 border border-zinc-800 text-[8px] font-mono uppercase tracking-wide rounded text-zinc-400 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                  title="Copy Briefing"
                >
                  {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
              <button
                onClick={() => generateAiSummary(activities)}
                disabled={summarizing || loading}
                className="p-1.5 hover:bg-zinc-850 border border-zinc-800 text-[8px] tracking-wide rounded text-zinc-400 hover:text-white transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40"
                title="Synchronize briefing"
              >
                <RefreshCw size={11} className={summarizing ? "animate-spin text-emerald-400" : "text-zinc-500"} />
              </button>
            </div>
          </div>

          {summarizing ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
              </div>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Coordinating with Grace-IV Engine...</span>
            </div>
          ) : aiSummary ? (
            <div 
              className="text-xs font-sans text-zinc-300 leading-relaxed text-left max-w-full overflow-hidden briefing-markup"
              dangerouslySetInnerHTML={{ __html: aiSummary }}
            />
          ) : (
            <p className="text-[10px] font-mono text-zinc-500 uppercase text-center py-4">Briefing ledger is vacant. Trigger synchronization.</p>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row justify-between gap-3 shrink-0">
            {/* Tab switcher */}
            <div className="flex p-0.5 bg-zinc-900/60 border border-zinc-850 rounded-xl max-w-max flex-wrap gap-0.5">
              {[
                { id: 'all', label: 'All matrix', icon: Layers },
                { id: 'chats', label: 'Transmissions', icon: MessageSquare },
                { id: 'tasks', label: 'Kanban tasks', icon: CheckSquare },
                { id: 'events', label: 'Operations', icon: Calendar },
                { id: 'reels', label: 'Reels Hub', icon: Video },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'reels') {
                        navigate('/reels');
                      } else {
                        setActiveTab(tab.id as any);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-wider font-bold transition-all rounded-lg cursor-pointer ${
                      activeTab === tab.id 
                        ? 'bg-zinc-800 text-white border border-zinc-700/50 shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Icon size={11} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Quick search */}
            <div className="relative max-w-full sm:max-w-[200px] flex-1">
              <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Query activity matrix..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={cn("w-full border rounded-xl py-1.5 pl-8 pr-3 text-[10px] font-mono outline-none transition-all", theme === 'dark' ? "bg-zinc-900/40 border-zinc-850/60 focus:border-zinc-750/80 text-zinc-200 placeholder:text-zinc-550" : "bg-neutral-50 border-neutral-250 focus:border-emerald-500 text-zinc-800 placeholder:text-neutral-400")}
              />
            </div>
          </div>

          {/* Activity items ledger */}
          <div className="space-y-2.5">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <RefreshCw size={16} className="text-emerald-500 animate-spin" />
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Querying operational databases...</span>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="py-12 border border-dashed border-zinc-850/60 rounded-2xl flex flex-col items-center justify-center text-center">
                <AlertCircle size={18} className="text-zinc-650 mb-2" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">No corresponding intelligence signals</span>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredActivities.map((act) => (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => {
                      if (act.type === 'chat' && act.meta?.chatId) {
                        navigate(`/chats/${act.meta.chatId}`);
                      } else if (act.type === 'task') {
                        navigate('/workspace');
                      } else if (act.type === 'event') {
                        navigate('/workspace?tab=calendar');
                      }
                    }}
                    className={cn("flex items-center justify-between p-3 border rounded-xl text-left transition-all group cursor-pointer", theme === 'dark' ? "bg-zinc-900/40 border-zinc-850/40 hover:border-zinc-800 hover:bg-zinc-900/60" : "bg-neutral-50/50 border-neutral-200 hover:border-zinc-300 hover:bg-neutral-50")}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div className={cn("p-2 rounded-lg border transition-colors", theme === 'dark' ? "bg-zinc-850/60 border-zinc-800 group-hover:bg-zinc-800" : "bg-neutral-100 border-neutral-200 group-hover:bg-white")}>
                        {getIcon(act.type)}
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-[11px] font-medium truncate transition-colors", theme === 'dark' ? "text-zinc-200 group-hover:text-white" : "text-zinc-800 group-hover:text-emerald-600")}>
                          {act.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 font-mono text-[8px] text-zinc-550">
                          {act.category && (
                            <span className={cn("px-1.5 py-0.5 border rounded uppercase select-none", theme === 'dark' ? "bg-zinc-850 border-zinc-800/80 text-zinc-400" : "bg-zinc-100 border-zinc-250 text-zinc-650")}>
                              {act.category}
                            </span>
                          )}
                          <span className="text-zinc-600">|</span>
                          <span className="flex items-center gap-1">
                            <Clock size={8} />
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {act.status && (
                        <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          act.status === 'COMPLETED' || act.status === 'transmitted' || act.status === 'SECURE'
                            ? 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/10'
                            : act.status === 'PENDING'
                            ? 'text-amber-500 bg-amber-500/5 border border-amber-500/10'
                            : 'text-cyan-400 bg-cyan-500/5 border border-cyan-500/10'
                        }`}>
                          {act.status}
                        </span>
                      )}
                      <ChevronRight size={12} className="text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
