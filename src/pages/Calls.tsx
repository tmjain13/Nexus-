import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { secureFetch } from '../lib/secureFetch';
import { db } from '../lib/firebase';
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { 
  ArrowLeft,
  Phone, 
  Video, 
  PhoneMissed, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Info,
  Clock,
  Search,
  Mic,
  Voicemail,
  Play,
  Square,
  Disc,
  MessageSquare,
  Check,
  PhoneOff,
  User,
  Volume2,
  MicOff,
  Wifi,
  Sparkles,
  FileText,
  Calendar,
  X,
  Plus,
  Repeat,
  Send
} from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import CallTrendChart from '../components/CallTrendChart';
import CallTypeChart from '../components/CallTypeChart';

export default function Calls() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [calls, setCalls] = useState<any[]>([]);
  const [chartCalls, setChartCalls] = useState<any[]>([]);
  const [selectedCallIds, setSelectedCallIds] = useState<Set<string>>(new Set());

  const toggleCallSelection = (e: React.MouseEvent, callId: string) => {
    e.stopPropagation();
    const next = new Set(selectedCallIds);
    if (next.has(callId)) next.delete(callId);
    else next.add(callId);
    setSelectedCallIds(next);
  };
    
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'incoming' | 'outgoing' | 'missed' | 'completed'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [screeningCallId, setScreeningCallId] = useState<string | null>(null);
  const [recordingCallId, setRecordingCallId] = useState<string | null>(null);
  const [voicemailState, setVoicemailState] = useState<Record<string, 'recording' | 'playing' | 'idle'>>({});
  const [mutedCallId, setMutedCallId] = useState<string | null>(null);
  const [muteNotification, setMuteNotification] = useState<{ id: string, message: string } | null>(null);
  
  const [callSummaries, setCallSummaries] = useState<Record<string, string>>({});
  const [generatingSummary, setGeneratingSummary] = useState<Record<string, boolean>>({});
  
  // High-fidelity Holographic AR Calling and live real-time translation state
  const [arFilters, setArFilters] = useState<Record<string, 'hologram' | 'cyber' | 'infrared' | 'vector' | 'none'>>({});
  const [showARCamera, setShowARCamera] = useState<Record<string, boolean>>({});
  const [speechTranslations, setSpeechTranslations] = useState<Record<string, string[]>>({});
  const [translationActive, setTranslationActive] = useState<Record<string, boolean>>({});
  const [callTargetLanguage, setCallTargetLanguage] = useState('Spanish');

  const [voicemailTranscripts, setVoicemailTranscripts] = useState<Record<string, string>>({});
  const [generatingTranscript, setGeneratingTranscript] = useState<Record<string, boolean>>({});

  const [audioEffects, setAudioEffects] = useState<Record<string, { noiseSuppression: boolean, modulation: string }>>({});
  const [qualityData, setQualityData] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQualityData(prev => {
        const newData = [...prev, {
          time: new Date().toLocaleTimeString(),
          latency: Math.floor(Math.random() * 40) + 15,
          packetLoss: Math.random() < 0.1 ? Math.random() * 2 : 0
        }].slice(-20);
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const activeTranslatingCallIds = Object.keys(translationActive).filter(id => translationActive[id]);
    if (activeTranslatingCallIds.length === 0) return;

    const phrases: Record<string, string[]> = {
      Spanish: [
        "Holograma en línea. Señal de audio decodificada.",
        "Módulo de traducción de IA activado.",
        "Sincronizando flujos cuánticos de voz.",
         "Espero que nuestra conexión cuántica sea estable.",
         "Estamos transmitiendo en un canal seguro y privado."
      ],
      French: [
        "Hologramme en ligne. Signal audio décodé.",
        "Module de traduction IA activé.",
        "Synchronisation des flux quantiques de voix.",
        "J'espère que notre connexion quantique est stable.",
        "Nous transmettons sur un canal sécurisé et privé."
      ],
      German: [
        "Hologramm online. Audiosignal decodiert.",
        "KI-Übersetzungsmodul aktiviert.",
        "Synchronisierung quantenbasierter Sprachströme.",
        "Ich hoffe, unsere Quantenverbindung ist stabil.",
        "Wir übertragen auf einem sicheren und privaten Kanal."
      ],
      Japanese: [
        "ホログラムオンライン。音声信号をデコードしました。",
        "AI翻訳モジュールが有効化されました。",
        "量子音声ストリームの同期中。",
        "量子接続が安定していることを願っています。",
        "私たちは安全でプライベートなチャネルで送信しています。"
      ],
      Hindi: [
        "होलोग्राम ऑनलाइन। ऑडियो सिग्नल डिकोड किया गया।",
        "एआई अनुवाद मॉड्यूल सक्रिय है।",
        "क्वांटम वॉयस स्ट्रीम सिंक हो रहे हैं।",
        "मुझे आशा है कि हमारा क्वांटम कनेक्शन स्थिर है।",
        "हम एक सुरक्षित और निजी चैनल पर संचार कर रहे हैं।"
      ]
    };

    const interval = setInterval(() => {
      activeTranslatingCallIds.forEach(id => {
        const lang = callTargetLanguage;
        const choices = phrases[lang] || phrases['Spanish'];
        const randomPhrase = choices[Math.floor(Math.random() * choices.length)];
        
        setSpeechTranslations(prev => {
          const current = prev[id] || [];
          return {
            ...prev,
            [id]: [...current, `[AI Translating - ${lang}]: "${randomPhrase}"`].slice(-4)
          };
        });
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [translationActive, callTargetLanguage]);

  const CallQualityChart = ({ data }: { data: any[] }) => (
    <div className="h-32 w-full mt-4 bg-zinc-50 dark:bg-zinc-800/20 rounded-xl border border-zinc-100 dark:border-zinc-800 p-2">
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Network Telemetry</span>
        <div className="flex gap-4">
           <div className="flex items-center gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-wa-primary" />
             <span className="text-[8px] font-mono text-zinc-400">LATENCY: {data[data.length-1]?.latency}ms</span>
           </div>
           <div className="flex items-center gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
             <span className="text-[8px] font-mono text-zinc-400">LOSS: {data[data.length-1]?.packetLoss?.toFixed(1)}%</span>
           </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#25d366" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#25d366" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', fontSize: '10px', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
          />
          <Area 
            type="monotone" 
            dataKey="latency" 
            stroke="#25d366" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorLatency)" 
            isAnimationActive={false}
          />
          <Area 
            type="monotone" 
            dataKey="packetLoss" 
            stroke="#f87171" 
            fill="#f87171" 
            fillOpacity={0.1}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  const TopicDistributionChart = ({ summaries }: { summaries: Record<string, string> }) => {
    const text = Object.values(summaries).join(' ').toLowerCase();
    const words: string[] = text.match(/\b(\w+)\b/g) || [];
    const stopWords = ['the', 'a', 'to', 'and', 'in', 'of', 'i', 'did', 'we', 'with'];
    const frequencies: Record<string, number> = {};
    
    words.forEach(word => {
        if (word.length > 3 && !stopWords.includes(word)) {
            frequencies[word] = (frequencies[word] || 0) + 1;
        }
    });

    const data = Object.entries(frequencies)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

    return (
        <div className="h-40 w-full mt-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm">
            <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-4">Top Discussed Topics</h4>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <XAxis dataKey="name" hide />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', fontSize: '10px', color: '#fff' }}/>
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {data.map((entry, index) => <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#25d366' : '#18181b'} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
  };

  const [callNotes, setCallNotes] = useState<Record<string, string>>({}); // Test
  const [savingNote, setSavingNote] = useState<Record<string, boolean>>({});

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    contactId: '',
    title: 'Voice Call',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    recurrence: 'none'
  });
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users'), limit(50));
    onSnapshot(q, (snap) => {
      setContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.id !== user.uid));
    });
  }, [user]);

  const scheduleCall = async () => {
    if (!user || !scheduleData.contactId) return;
    setScheduling(true);
    try {
      // 1. Create Google Calendar Event
      const startTime = new Date(scheduleData.date);
      const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 min duration
      
      const event: any = {
        summary: scheduleData.title,
        description: `Scheduled call via Signal Messenger`,
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() }
      };

      if (scheduleData.recurrence !== 'none') {
        const freq = scheduleData.recurrence === 'daily' ? 'DAILY' : 'WEEKLY';
        event.recurrence = [`RRULE:FREQ=${freq}`];
      }

      // We'll use a placeholder for the actual API call logic which would reside in a server route
      // or using the gapi client if initialized. Since we are in a full-stack context, 
      // ideally we'd have a server route. 
      // For now, we simulate the success of the calendar event creation.
      
      // 2. Send 'meeting request' message to contact
      const chatId = [user.uid, scheduleData.contactId].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        await import('firebase/firestore').then(({ setDoc }) => {
          setDoc(chatRef, {
            participants: [user.uid, scheduleData.contactId],
            isGroup: false,
            updatedAt: new Date()
          });
        });
      }

      await import('firebase/firestore').then(({ addDoc, collection, serverTimestamp }) => {
        addDoc(collection(db, `chats/${chatId}/messages`), {
          senderId: user.uid,
          text: `📅 Scheduled Call Request: ${scheduleData.title}\nTime: ${format(startTime, 'PPP p')}${scheduleData.recurrence !== 'none' ? ` (${scheduleData.recurrence})` : ''}`,
          type: 'text',
          createdAt: serverTimestamp(),
          isSystem: true
        });
      });

      setShowScheduleModal(false);
    } catch (err) {
      console.error("Scheduling failed", err);
    } finally {
      setScheduling(false);
    }
  };

  const generateCallSummary = async (e: React.MouseEvent, callId: string, duration: number) => {
    e.stopPropagation();
    setGeneratingSummary(prev => ({ ...prev, [callId]: true }));
    
    // In a real application, you would first transcribe the call recording here.
    // For this integration, we are using a mock transcript.
    const mockTranscript = "Participant A: Hey, did we update the project plan? Participant B: Yes, I added the new requirements. Participant A: Great, let's proceed with the implementation.";
    
    try {
        const response = await secureFetch('/api/ai/summarize-call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: mockTranscript })
        });
        const data = await response.json();
        setCallSummaries(prev => ({
            ...prev,
            [callId]: data.summary
        }));
    } catch (err) {
        console.error("Summary failed:", err);
    } finally {
        setGeneratingSummary(prev => ({ ...prev, [callId]: false }));
    }
  };

  const transcribeVoicemail = async (e: React.MouseEvent, callId: string) => {
    e.stopPropagation();
    setGeneratingTranscript(prev => ({ ...prev, [callId]: true }));
    // Simulate AI transcription
    setTimeout(() => {
      setVoicemailTranscripts(prev => ({
        ...prev,
        [callId]: "Hey, it's me. I was just calling to confirm our meeting tomorrow at 10 AM. Let me know if that still works for you. Thanks!"
      }));
      setGeneratingTranscript(prev => ({ ...prev, [callId]: false }));
    }, 2000);
  };

  const toggleMute = (e: React.MouseEvent, callId: string) => {
    e.stopPropagation();
    const isNowMuted = mutedCallId !== callId;
    setMutedCallId(isNowMuted ? callId : null);
    setMuteNotification({
      id: callId,
      message: isNowMuted ? 'Microphone muted' : 'Microphone unmuted'
    });
    setTimeout(() => setMuteNotification(null), 2000);
  };

  const handleToggleRecording = (e: React.MouseEvent, callId: string, isVideo: boolean) => {
    e.stopPropagation();
    if (recordingCallId === callId) {
      setRecordingCallId(null);
    } else {
      setRecordingCallId(callId);
    }
  };

  const getCallQuality = (callId: string) => {
    // Simulate call quality based on call id
    const val = callId.charCodeAt(0) % 4;
    if (val === 0) return { label: 'Excellent', color: 'text-green-500', bars: 4, icon: Wifi };
    if (val === 1) return { label: 'Good', color: 'text-blue-500', bars: 3, icon: Wifi };
    if (val === 2) return { label: 'Fair', color: 'text-yellow-500', bars: 2, icon: Wifi };
    return { label: 'No Quality', color: 'text-red-500', bars: 0, icon: PhoneOff };
  };

  const SignalBars = ({ bars }: { bars: number }) => (
    <div className="flex items-end gap-0.5 h-3">
      {[1, 2, 3, 4].map((i) => (
        <div 
          key={i} 
          className={cn(
            "w-0.5 rounded-full transition-all",
            i <= bars ? "bg-current" : "bg-zinc-200 dark:bg-zinc-800"
          )}
          style={{ height: `${25 * i}%` }}
        />
      ))}
    </div>
  );

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'calls'),
      where('participants', 'array-contains', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const callData = await Promise.all(snapshot.docs.map(async (callDoc) => {
        const data = callDoc.data();
        const peerId = data.callerId === user.uid ? data.receiverId : data.callerId;
        
        // Fetch peer info
        const peerSnap = await getDoc(doc(db, 'users', peerId));
        const peerData = peerSnap.exists() ? peerSnap.data() : { displayName: 'Unknown Contact', username: 'unknown' };

        if (data.notes) {
          setCallNotes(prev => ({ ...prev, [callDoc.id]: data.notes }));
        }

        return {
          id: callDoc.id,
          ...data,
          peer: peerData,
          peerId: peerId,
        };
      }));
      setCalls(callData);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  // Fetch chart data for last 30 days
  useEffect(() => {
    if (!user) return;
    const thirtyDaysAgo = subDays(new Date(), 30);
    const q = query(
      collection(db, 'calls'),
      where('participants', 'array-contains', user.uid),
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setChartCalls(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    return unsub;
  }, [user]);

  const filteredCalls = calls.filter(call => {
    const matchesSearch = call.peer.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const isIncoming = call.receiverId === user?.uid;
    
    let matchesFilter = true;
    if (filterType === 'missed') {
      matchesFilter = call.status === 'missed';
    } else if (filterType === 'completed') {
      matchesFilter = call.status === 'completed';
    } else if (filterType === 'incoming') {
      matchesFilter = isIncoming;
    } else if (filterType === 'outgoing') {
      matchesFilter = !isIncoming;
    }

    const matchesDate = (!startDate || (call.createdAt?.toDate && call.createdAt.toDate() >= new Date(startDate))) &&
                        (!endDate || (call.createdAt?.toDate && call.createdAt.toDate() <= new Date(endDate)));

    return matchesSearch && matchesFilter && matchesDate;
  });

  const groupedCalls = filteredCalls.reduce((groups: any, call) => {
    let dateStr = 'Unknown Date';
    if (call.createdAt && call.createdAt.toDate) {
      const date = call.createdAt.toDate();
      if (isToday(date)) dateStr = 'Today';
      else if (isYesterday(date)) dateStr = 'Yesterday';
      else dateStr = 'Previous Dates';
    } else {
      dateStr = 'Today';
    }
    
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(call);
    return groups;
  }, {});

  const updateCallStatus = async (callId: string, status: string) => {
    try {
      await import('firebase/firestore').then(({ updateDoc, doc }) => {
        updateDoc(doc(db, 'calls', callId), { status });
      });
    } catch (e) {
      console.error(e);
    }
  };

  const saveCallNote = async (callId: string) => {
    const note = callNotes[callId];
    if (!note) return;
    setSavingNote(prev => ({ ...prev, [callId]: true }));
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'calls', callId), { notes: note });
      setSavingNote(prev => ({ ...prev, [callId]: false }));
    } catch (err) {
      console.error("Save note failed", err);
      setSavingNote(prev => ({ ...prev, [callId]: false }));
    }
  };

  const toggleVoicemail = (callId: string, action: 'recording' | 'playing' | 'idle') => {
    setVoicemailState(prev => ({ ...prev, [callId]: action }));
    if (action === 'recording') {
      setTimeout(() => {
        setVoicemailState(prev => ({ ...prev, [callId]: 'idle' }));
        import('firebase/firestore').then(({ updateDoc, doc }) => {
          updateDoc(doc(db, 'calls', callId), { hasVoicemail: true });
        });
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-[#111b21] font-sans relative overflow-hidden">
      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

      <AnimatePresence>
        {muteNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="absolute top-8 left-1/2 z-50 bg-zinc-950 text-white font-mono text-[10px] font-bold px-4 py-2 uppercase tracking-widest shadow-xl h-[32px] flex items-center justify-center whitespace-nowrap"
          >
            {muteNotification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="px-4 pt-4 pb-3 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0 flex flex-col gap-3.5 bg-white dark:bg-[#202c33] z-20">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button 
              onClick={() => navigate('/chats')}
              className="p-1 -ml-1 text-[#54656f] dark:text-[#aebac1] hover:text-wa-primary transition-colors cursor-pointer"
              title="Back to chats"
              style={{ border: 'none', background: 'none' }}
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <h1 className="text-[19px] font-medium text-zinc-900 dark:text-[#e9edef]">Calls History</h1>
            <span className="flex items-center gap-1 text-[9px] bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
               <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
               Secure
            </span>
          </div>
          <button 
            onClick={() => setShowScheduleModal(true)}
            className="bg-wa-primary text-white border border-wa-primary px-3 py-1.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-2 hover:bg-wa-primary/90 transition-colors uppercase tracking-widest shadow-sm cursor-pointer"
            style={{ border: 'none' }}
          >
            <Calendar size={12} /> Schedule
          </button>
        </div>
        
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={16} />
          <input
            type="text"
            placeholder="Search calls..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#f0f2f5] dark:bg-[#111b21] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-[#e9edef] rounded-full py-2.5 pl-10 pr-4 text-[13px] font-medium focus:ring-1 focus:ring-wa-primary/40 focus:border-wa-primary outline-none transition-all placeholder:text-zinc-400 dark:placeholder-zinc-500 shadow-sm"
          />
        </div>
        
        <div className="flex w-full gap-2 overflow-x-auto pb-1 no-scrollbar flex-nowrap">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-2 rounded-full border border-zinc-200 text-[10px] font-mono text-zinc-500" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-2 rounded-full border border-zinc-200 text-[10px] font-mono text-zinc-500" />
          <button
              onClick={() => {
                const csvRows = [
                  ['Date', 'Peer', 'Type', 'Duration', 'Status'],
                  ...filteredCalls.map(c => [
                     c.createdAt?.toDate ? format(c.createdAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : '',
                     `"${c.peer.displayName.replace(/"/g, '""')}"`,
                     c.type,
                     c.duration ? `${Math.floor(c.duration/60)}m ${c.duration%60}s` : '0m 0s',
                     c.status
                  ])
                ];
                const csvContent = csvRows.map(e => e.join(',')).join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.setAttribute('href', url);
                a.setAttribute('download', 'call_history.csv');
                a.click();
              }}
              className="px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest whitespace-nowrap transition-colors border bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-2"
          >
            <FileText size={12} /> Export CSV
          </button>
          {['all', 'missed', 'incoming', 'outgoing'].map((f) => (
             <button
                key={f}
                onClick={() => setFilterType(f as any)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest whitespace-nowrap transition-colors border",
                  filterType === f ? "bg-zinc-950 text-white border-zinc-950 shadow-sm" : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
                )}
             >
               {f}
             </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20 relative z-0">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center h-40">
             <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-3"></div>
             <div className="text-zinc-400 font-mono text-[10px] uppercase font-bold tracking-widest">Scanning Frequencies...</div>
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full">
            <div className="w-16 h-16 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-300 mb-4 shadow-sm">
              <Phone size={24} />
            </div>
            <p className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-widest">No Transmissions Found</p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            <CallTrendChart calls={chartCalls} />
            <div className="grid grid-cols-2 gap-4 h-44">
               <TopicDistributionChart summaries={callSummaries} />
               <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm h-full">
                  <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-4">Voice vs Video Calls</h4>
                  <CallTypeChart calls={chartCalls} />
               </div>
            </div>
            
            {selectedCallIds.size > 0 && (
               <div className="sticky top-0 z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-lg flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-zinc-500 uppercase">{selectedCallIds.size} Selected</span>
                  <div className="flex gap-2">
                     <button onClick={() => { /* Implement bulk archive */ setSelectedCallIds(new Set()); }} className="text-xs font-mono font-bold text-zinc-900 bg-zinc-100 px-3 py-1.5 rounded-full hover:bg-zinc-200">Archive</button>
                     <button onClick={async () => {
                        const { deleteDoc } = await import('firebase/firestore');
                        await Promise.all(Array.from(selectedCallIds).map((id: string) => deleteDoc(doc(db, 'calls', id))));
                        setSelectedCallIds(new Set());
                     }} className="text-xs font-mono font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100">Delete</button>
                  </div>
               </div>
            )}
             
            <AnimatePresence>
              {Object.entries(groupedCalls).map(([date, callsInGroup]: [string, any]) => (
                <div key={date}>
                   <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1">{date}</h3>
                   <div className="space-y-2">
                     {callsInGroup.map((call: any) => {
                       const isMissed = call.status === 'missed';
                       const isIncoming = call.receiverId === user?.uid;
                       const CallIcon = call.type === 'video' ? Video : Phone;
                       const isExpanded = expandedCallId === call.id;
                       const isRinging = call.status === 'ringing';
                       const inProgress = call.status === 'in-progress';
                       const isScreening = screeningCallId === call.id;

                       return (
                         <motion.div
                           key={call.id}
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className={cn(
                             "relative flex justify-between flex-col overflow-hidden bg-white dark:bg-zinc-900 border transition-all cursor-pointer group mb-1",
                             isExpanded || isRinging || inProgress ? "rounded-2xl" : "rounded-xl",
                             isRinging ? "border-wa-primary shadow-[0_0_20px_rgba(37,211,102,0.1)] ring-1 ring-wa-primary" : inProgress ? "border-blue-500 shadow-md ring-1 ring-blue-500" : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700",
                             isExpanded && !(isRinging || inProgress) ? "shadow-md bg-zinc-50 dark:bg-zinc-800/50" : ""
                           )}
                           onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                         >
                           {/* Active Call Status Bar */}
                           {(isRinging || inProgress || call.status === 'busy') && (
                             <div className={cn(
                               "px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-center flex items-center justify-center gap-2 border-b",
                               isRinging ? "bg-wa-primary text-white border-transparent" : inProgress ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800/30" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800/30"
                             )}>
                               {inProgress && recordingCallId === call.id ? (
                                  <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                    <span>Recording • Participants notified</span>
                                  </motion.div>
                               ) : (
                                  <div className="flex items-center gap-2">
                                    {isRinging ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}><PhoneIncoming size={12} /></motion.div> : inProgress ? <div className={getCallQuality(call.id).color}><SignalBars bars={getCallQuality(call.id).bars} /></div> : <PhoneOff size={12} />}
                                    <span>{isRinging ? "Ringing..." : inProgress ? "Call in progress" : "Call ended"}</span>
                                    <span className="opacity-50 mx-1">|</span>
                                    <span className="font-numeric">{isRinging ? "Encrypted..." : inProgress ? "0:12" : "Timed Out"}</span>
                                  </div>
                               )}
                             </div>
                           )}

                           <div className="flex items-center gap-4 p-4">
                             <div className="relative shrink-0">
                               <img 
                                 src={call.peer.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${call.peer.username}`} 
                                 className="w-13 h-13 rounded-full border-2 border-white dark:border-zinc-800 object-cover shadow-sm bg-zinc-100"
                               />
                               <div className={cn(
                                 "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900 transition-colors",
                                 isMissed ? "bg-red-500 text-white" : isIncoming ? "bg-wa-primary text-white" : "bg-zinc-400 text-white"
                               )}>
                                 {isMissed ? <PhoneMissed size={10} strokeWidth={3} /> : (isIncoming ? <PhoneIncoming size={10} strokeWidth={3} /> : <PhoneOutgoing size={10} strokeWidth={3} />)}
                               </div>
                             </div>

                             <div className="flex-1 min-w-0">
                               <div className="flex items-center justify-between gap-2 mb-0.5">
                                 <h4 className={cn(
                                   "font-bold truncate text-[16px] tracking-tight",
                                   isMissed ? "text-red-500" : "text-zinc-900 dark:text-zinc-100"
                                 )}>
                                   {call.peer.displayName}
                                 </h4>
                                 {!contacts.some(c => c.id === call.peerId) && (
                                     <button className="text-zinc-400 hover:text-wa-primary transition-colors">
                                       <Plus size={14} />
                                     </button>
                                 )}
                                 <span className="text-[11px] font-medium text-zinc-400 shrink-0">
                                   {call.createdAt?.toDate ? format(call.createdAt.toDate(), 'h:mm a') : 'just now'}
                                 </span>
                               </div>
                               
                               <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium tracking-tight">
                                 <div className={cn(
                                   "flex items-center gap-1.5 px-2 py-0.5 rounded-full border",
                                   isMissed ? "bg-red-50 border-red-100 text-red-500" : "bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-500"
                                 )}>
                                   <CallIcon size={12} />
                                   <span className="capitalize">{call.type} Call</span>
                                   <span className="opacity-30">•</span>
                                   <span>{isMissed ? "Missed" : isIncoming ? "Incoming" : "Outgoing"}</span>
                                 </div>
                                 
                                 {call.duration !== undefined && call.duration > 0 && (
                                   <span className="text-zinc-400 flex items-center gap-1">
                                     <Clock size={11} />
                                     {Math.floor(call.duration / 60)}m {call.duration % 60}s
                                   </span>
                                 )}

                                 {call.status === 'completed' && (
                                   <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full", 
                                     getCallQuality(call.id).label === 'No Quality' ? "bg-red-50 text-red-600" : "text-zinc-400"
                                   )}>
                                     <SignalBars bars={getCallQuality(call.id).bars} />
                                     <span className="font-bold text-[9px] uppercase tracking-wider">{getCallQuality(call.id).label} Connection</span>
                                   </div>
                                 )}
                               </div>
                             </div>
                             
                             {!isExpanded && !isRinging && !inProgress && (
                               <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="p-2.5 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-wa-primary hover:bg-wa-primary/10 transition-all">
                                    <Info size={18} />
                                  </button>
                               </div>
                             )}
                           </div>

                           {/* Expanded Action Menu */}
                           <AnimatePresence>
                             {isExpanded && !isRinging && !inProgress && (
                               <motion.div 
                                 initial={{ height: 0, opacity: 0 }}
                                 animate={{ height: 'auto', opacity: 1 }}
                                 exit={{ height: 0, opacity: 0 }}
                                 className="px-4 pb-4 overflow-hidden"
                               >
                                 {/* Personal Notes Section */}
                                 <div className="bg-white border border-zinc-200 rounded-xl p-4 mt-3 mb-3 shadow-sm" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between mb-3">
                                       <div className="flex items-center gap-2 text-zinc-900">
                                         <FileText size={14} className="text-wa-primary" />
                                         <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">Private Call Notes</h5>
                                       </div>
                                       {(callNotes[call.id] || '').trim().length > 0 && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); saveCallNote(call.id); }}
                                            disabled={savingNote[call.id]}
                                            className="text-[9px] font-mono font-bold text-wa-primary uppercase tracking-widest hover:underline disabled:opacity-50"
                                          >
                                             {savingNote[call.id] ? "Saving..." : "Save Notes"}
                                          </button>
                                       )}
                                    </div>
                                    <textarea 
                                       value={callNotes[call.id] || ''}
                                       onChange={(e) => setCallNotes(prev => ({ ...prev, [call.id]: e.target.value }))}
                                       placeholder="Add personal notes reflection after this transmission..."
                                       className="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-[12px] font-medium outline-none focus:ring-1 focus:ring-wa-primary/30 min-h-[80px] resize-none"
                                    />
                                 </div>
                                 <div className="flex flex-col gap-2 pt-3 border-t border-zinc-100">
                                   <div className="flex items-center gap-2">
                                      <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/call/new?type=${call.type}&to=${call.peerId}`);
                                          }}
                                          className="flex-1 p-2.5 bg-[#00a884] hover:bg-[#009675] text-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-[#00a884]"
                                       >
                                         <Phone size={14} /> Redial
                                       </button>
                                       <button className="flex-1 p-2.5 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-900 shadow-sm rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                        <MessageSquare size={14} /> Message
                                      </button>
                                      
                                      {isMissed && !isIncoming && !call.hasVoicemail && (
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); toggleVoicemail(call.id, 'recording'); }}
                                            className={cn(
                                              "flex-1 p-2.5 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm",
                                              voicemailState[call.id] === 'recording' ? "bg-red-500 text-white border-red-600 animate-pulse" : "bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300"
                                            )}
                                         >
                                            <Mic size={14} /> {voicemailState[call.id] === 'recording' ? "Recording... (3s)" : "Voicemail"}
                                         </button>
                                      )}

                                      {call.hasVoicemail && (
                                          <button 
                                            onClick={(e) => { 
                                              e.stopPropagation(); 
                                              toggleVoicemail(call.id, voicemailState[call.id] === 'playing' ? 'idle' : 'playing'); 
                                            }}
                                            className={cn(
                                              "flex-1 p-2.5 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm",
                                              voicemailState[call.id] === 'playing' ? "bg-zinc-950 text-white border-zinc-950" : "bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300"
                                            )}
                                         >
                                            {voicemailState[call.id] === 'playing' ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />} 
                                            {voicemailState[call.id] === 'playing' ? "Playing (0:15)" : "Listen"}
                                         </button>
                                      )}
                                      
                                      {call.status === 'completed' && (
                                         <button 
                                            onClick={(e) => generateCallSummary(e, call.id, call.duration || 0)}
                                            disabled={generatingSummary[call.id]}
                                            className="flex-1 p-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl border border-zinc-950 text-[10px] shadow-sm font-mono font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                         >
                                            <Sparkles size={14} className={generatingSummary[call.id] ? "animate-spin" : ""} /> {generatingSummary[call.id] ? "Summarizing..." : "Summarize"}
                                         </button>
                                      )}
                                      
                                      {call.hasVoicemail && (
                                         <button 
                                            onClick={(e) => transcribeVoicemail(e, call.id)}
                                            disabled={generatingTranscript[call.id]}
                                            className="flex-1 p-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl border border-zinc-950 text-[10px] shadow-sm font-mono font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                         >
                                            <FileText size={14} className={generatingTranscript[call.id] ? "animate-pulse" : ""} /> {generatingTranscript[call.id] ? "Transcribing..." : "Transcribe"}
                                         </button>
                                      )}
                                   </div>
                                   
                                   {callSummaries[call.id] && (
                                      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 mt-2 shadow-sm">
                                        <div className="flex items-center gap-2 text-zinc-900 mb-2">
                                          <Sparkles size={14} />
                                          <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">AI Summary</h5>
                                        </div>
                                        <p className="text-[13px] text-zinc-700 font-medium leading-relaxed">{callSummaries[call.id]}</p>
                                      </div>
                                   )}

                                   {voicemailTranscripts[call.id] && (
                                      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 mt-2 shadow-sm">
                                        <div className="flex items-center gap-2 text-zinc-900 mb-2">
                                          <FileText size={14} />
                                          <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">Voicemail Transcript</h5>
                                        </div>
                                        <p className="text-[13px] text-zinc-700 font-medium leading-relaxed">"{voicemailTranscripts[call.id]}"</p>
                                      </div>
                                   )}
                                 </div>
                               </motion.div>
                             )}

                             {isRinging && (
                               <motion.div 
                                 initial={{ height: 0, opacity: 0 }}
                                 animate={{ height: 'auto', opacity: 1 }}
                                 className="px-4 pb-4 pt-1 overflow-hidden"
                               >
                                 <div className="flex flex-col gap-3">
                                   {isScreening ? (
                                      <div className="bg-zinc-100 rounded-xl p-4 text-xs font-medium text-zinc-900 space-y-2 border border-zinc-200/60 shadow-inner">
                                         <p className="flex items-center gap-2 font-mono uppercase tracking-widest font-bold text-[10px] border-b border-zinc-200 pb-2 mb-2"><Volume2 size={12} className="animate-pulse" /> Live Transcript Screening</p>
                                         <p className="!mt-3 text-[13px]">"Hi, it's me. Can you pick up? I have a question about the meeting tomorrow..."</p>
                                      </div>
                                   ) : (
                                       isIncoming && (
                                         <button 
                                           onClick={(e) => { e.stopPropagation(); setScreeningCallId(call.id); }}
                                           className="w-full p-2.5 bg-white border border-zinc-200 text-zinc-900 rounded-xl text-[10px] font-mono uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 hover:bg-zinc-50 shadow-sm"
                                         >
                                           <User size={14} /> Screen Audio
                                         </button>
                                       )
                                   )}
                                   <div className="flex gap-2">
                                     <button onClick={(e) => { e.stopPropagation(); updateCallStatus(call.id, 'missed'); setScreeningCallId(null); }} className="flex-1 p-2.5 bg-white border border-red-200 text-red-500 rounded-xl text-[10px] font-mono uppercase tracking-widest shadow-sm font-bold hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-2"><PhoneOff size={14} /> Decline</button>
                                     <button onClick={(e) => { e.stopPropagation(); updateCallStatus(call.id, 'in-progress'); setScreeningCallId(null); }} className="flex-1 p-2.5 bg-zinc-950 text-white rounded-xl border border-zinc-950 text-[10px] font-mono uppercase tracking-widest shadow-sm font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"><Phone size={14} fill="currentColor" /> {isScreening ? "Pick Up" : "Accept"}</button>
                                   </div>
                                 </div>
                               </motion.div>
                             )}

                             {inProgress && (
                               <motion.div 
                                 initial={{ height: 0, opacity: 0 }}
                                 animate={{ height: 'auto', opacity: 1 }}
                                 className="px-4 pb-4 pt-1 overflow-hidden"
                               >
                                  <div className="flex items-center justify-between gap-2 mb-3 px-2">
                                    <div className={cn("flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest", getCallQuality(call.id).color)}>
                                      <Wifi size={10} className="animate-pulse" /> {getCallQuality(call.id).label} Net
                                    </div>
                                    <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                                      Encrypted
                                    </div>
                                  </div>

                                  {/* AR Hologram Calling interface */}
                                  <div className="mb-4 mt-1 bg-zinc-950 dark:bg-black rounded-2xl border border-zinc-800 relative overflow-hidden h-52 flex flex-col justify-between shadow-2xl p-3">
                                    {/* Futuristic scanline and grain layers */}
                                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_60%,rgba(0,0,0,0.8)_100%)] z-10" />
                                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] opacity-60 z-20" style={{ backgroundSize: "100% 4px, 6px 100%" }} />

                                    {/* Pulsing scanning bar */}
                                    <div className="absolute inset-x-0 w-full h-0.5 bg-cyan-400/35 shadow-[0_0_8px_rgba(34,211,238,0.5)] z-20 animate-scan pointer-events-none" />

                                    {/* glow tint according to the active AR filter */}
                                    {(arFilters[call.id] === 'hologram' || !arFilters[call.id]) && <div className="absolute inset-0 pointer-events-none bg-cyan-500/5 z-0" />}
                                    {arFilters[call.id] === 'cyber' && <div className="absolute inset-0 pointer-events-none bg-emerald-500/5 z-0 animate-pulse" />}
                                    {arFilters[call.id] === 'infrared' && <div className="absolute inset-0 pointer-events-none bg-red-600/10 z-0" />}
                                    {arFilters[call.id] === 'vector' && <div className="absolute inset-0 pointer-events-none bg-indigo-500/5 z-0" />}

                                    {/* UI overlay header */}
                                    <div className="relative z-30 flex items-start justify-between w-full">
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 bg-cyan-950/75 border border-cyan-500/35 text-cyan-400 font-mono font-bold text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full select-none shadow">
                                          <Sparkles size={10} className="animate-spin-slow" /> AR HUD Active
                                        </div>
                                        <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-1 font-bold">
                                          FILTER: {arFilters[call.id] || 'hologram'}
                                        </div>
                                      </div>

                                      {/* Mode controllers */}
                                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Cycle filters
                                            const filters: Array<'hologram'|'cyber'|'infrared'|'vector'|'none'> = ['hologram', 'cyber', 'infrared', 'vector', 'none'];
                                            const current = arFilters[call.id] || 'hologram';
                                            const nextIdx = (filters.indexOf(current) + 1) % filters.length;
                                            setArFilters(prev => ({ ...prev, [call.id]: filters[nextIdx] }));
                                          }}
                                          className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-[8px] font-mono font-bold uppercase tracking-widest rounded-md text-zinc-400 hover:text-white hover:border-zinc-700 transition cursor-pointer"
                                        >
                                          Cycle Filter
                                        </button>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setTranslationActive(prev => ({ ...prev, [call.id]: !prev[call.id] }));
                                          }}
                                          className={cn(
                                            "px-2 py-1 border text-[8px] font-mono font-bold uppercase tracking-widest rounded-md transition cursor-pointer",
                                            translationActive[call.id] ? "bg-indigo-950 border-indigo-500/40 text-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.3)]" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                                          )}
                                        >
                                          Live Translate
                                        </button>
                                      </div>
                                    </div>

                                    {/* Holographic Projection Object / Center illustration */}
                                    <div className="relative z-10 flex flex-col items-center justify-center flex-1 py-1">
                                      <div className="relative flex items-center justify-center animate-pulse">
                                        {/* Outer glowing quantum orbital rings */}
                                        <motion.div 
                                          animate={{ rotate: 360 }} 
                                          transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
                                          className={cn(
                                            "absolute w-24 h-24 rounded-full border border-dashed pointer-events-none flex items-center justify-center",
                                            arFilters[call.id] === 'cyber' ? "border-emerald-500/20" : arFilters[call.id] === 'infrared' ? "border-red-500/20" : "border-cyan-500/20"
                                          )}
                                        >
                                          <div className={cn("w-20 h-20 rounded-full border border-dotted", arFilters[call.id] === 'cyber' ? "border-emerald-500/10" : "border-cyan-500/10")} />
                                        </motion.div>

                                        {/* Moving avatar representation */}
                                        <motion.div
                                          animate={{ scale: [1, 1.03, 1], y: [0, -2, 0] }}
                                          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                          className="relative"
                                        >
                                          <img 
                                            src={call.peer.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${call.peer.username}`} 
                                            className={cn(
                                              "w-16 h-16 rounded-full border-2 border-cyan-500/40 object-cover bg-zinc-900 shadow-2xl relative z-10",
                                              arFilters[call.id] === 'cyber' && "grayscale contrast-125 saturate-150 border-emerald-500 hue-rotate-60",
                                              arFilters[call.id] === 'infrared' && "grayscale contrast-200 saturate-200 border-red-500 hue-rotate-[140deg]",
                                              arFilters[call.id] === 'vector' && "grayscale border-indigo-400 contrast-100 opacity-60"
                                            )}
                                          />
                                          {/* Pulse rings */}
                                          <span className="absolute inset-0 rounded-full border border-cyan-500/40 animate-ping opacity-45 pointer-events-none" />
                                        </motion.div>
                                      </div>

                                      {/* Dynamic scrolling real-time foreign translated subtitles */}
                                      {translationActive[call.id] && (
                                        <div className="absolute bottom-1 inset-x-0 flex flex-col items-center justify-end px-4 z-40 select-none">
                                          <div className="bg-black/85 border border-indigo-500/35 px-2.5 py-1 rounded-xl shadow-lg backdrop-blur text-center max-w-full">
                                            <p className="text-[9px] font-semibold text-indigo-200 font-mono leading-relaxed truncate">
                                              {speechTranslations[call.id]?.length > 0 
                                                ? speechTranslations[call.id][speechTranslations[call.id].length - 1] 
                                                : `[AI Connecting ${callTargetLanguage} Engine...]`}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Holographic system metrics footer */}
                                    <div className="relative z-30 flex items-center justify-between w-full pt-1 opacity-70">
                                      <span className="text-[7.5px] font-mono text-cyan-500/80 uppercase tracking-widest font-black">projection node 709L</span>
                                      {translationActive[call.id] && (
                                        <select
                                          value={callTargetLanguage}
                                          onChange={(e) => setCallTargetLanguage(e.target.value)}
                                          className="text-[7px] font-mono font-black uppercase tracking-widest border border-zinc-800 bg-black text-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 p-0.5 rounded cursor-pointer"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {['Spanish', 'French', 'German', 'Japanese', 'Hindi'].map(lang => (
                                            <option key={lang} value={lang}>{lang}</option>
                                          ))}
                                        </select>
                                      )}
                                    </div>
                                  </div>

                                  {/* Call Quality Monitor */}
                                  <CallQualityChart data={qualityData} />

                                  {/* Call Effects Panel */}
                                  <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-3">
                                     <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                           <Sparkles size={14} className="text-wa-primary" />
                                           <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">AI Call Effects</h5>
                                        </div>
                                        <span className="text-[8px] bg-wa-primary/10 text-wa-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Real-time</span>
                                     </div>
                                     
                                     <div className="grid grid-cols-2 gap-2">
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const current = audioEffects[call.id] || { noiseSuppression: false, modulation: 'none' };
                                            setAudioEffects(prev => ({ 
                                              ...prev, 
                                              [call.id]: { ...current, noiseSuppression: !current.noiseSuppression } 
                                            }));
                                          }}
                                          className={cn(
                                            "p-2 rounded-lg text-[9px] font-mono font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2",
                                            audioEffects[call.id]?.noiseSuppression ? "bg-wa-primary text-white border-wa-primary" : "bg-white text-zinc-500 border-zinc-100 hover:border-zinc-200"
                                          )}
                                        >
                                          <Volume2 size={12} /> {audioEffects[call.id]?.noiseSuppression ? "Supression ON" : "Noise Filter"}
                                        </button>
                                        
                                        <select 
                                          onClick={e => e.stopPropagation()}
                                          onChange={(e) => {
                                            const current = audioEffects[call.id] || { noiseSuppression: false, modulation: 'none' };
                                            setAudioEffects(prev => ({ 
                                              ...prev, 
                                              [call.id]: { ...current, modulation: e.target.value } 
                                            }));
                                          }}
                                          value={audioEffects[call.id]?.modulation || 'none'}
                                          className="bg-white border border-zinc-100 rounded-lg px-2 py-2 text-[9px] font-mono font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-wa-primary text-zinc-500"
                                        >
                                          <option value="none">Voice: Natural</option>
                                          <option value="deep">Voice: Deep</option>
                                          <option value="robot">Voice: Robot</option>
                                          <option value="chipmunk">Voice: Studio</option>
                                        </select>
                                     </div>
                                  </div>

                                  <div className="flex items-center justify-between gap-2 p-2 mt-4 bg-zinc-50 rounded-xl border border-zinc-200 cursor-default shadow-inner">
                                     <button 
                                       onClick={(e) => handleToggleRecording(e, call.id, call.type === 'video')}
                                       className={cn(
                                         "flex-1 p-2.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border",
                                         recordingCallId === call.id ? "bg-red-500 text-white border-red-600 shadow-sm" : "bg-white text-zinc-700 border-zinc-200 shadow-sm hover:border-zinc-300 hover:bg-zinc-50"
                                       )}
                                       title="Ensure compliance before recording"
                                     >
                                        <Disc size={12} className={recordingCallId === call.id ? "animate-pulse" : ""} /> {recordingCallId === call.id ? "Rec" : "Record"}
                                     </button>

                                     <button 
                                       onClick={(e) => toggleMute(e, call.id)}
                                       className={cn(
                                         "flex-1 p-2.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border",
                                         mutedCallId === call.id ? "bg-yellow-500 text-white border-yellow-600 shadow-sm" : "bg-white text-zinc-700 border-zinc-200 shadow-sm hover:border-zinc-300 hover:bg-zinc-50"
                                       )}
                                       title="Mute/Unmute microphone"
                                     >
                                        {mutedCallId === call.id ? <MicOff size={12} /> : <Mic size={12} />} {mutedCallId === call.id ? "Muted" : "Mute"}
                                     </button>

                                     <button 
                                       onClick={(e) => { e.stopPropagation(); updateCallStatus(call.id, 'completed'); setRecordingCallId(null); setMutedCallId(null); }}
                                       className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all shadow-md shrink-0 border border-red-600"
                                     >
                                        <PhoneOff size={16} />
                                     </button>
                                  </div>
                               </motion.div>
                             )}
                           </AnimatePresence>
                         </motion.div>
                       );
                     })}
                   </div>
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Schedule Call Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowScheduleModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Calendar size={18} className="text-wa-primary" />
                    Schedule Connection
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-1">Calendar Integration</p>
                </div>
                <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors text-zinc-500">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-1">Select Contact</label>
                  <select 
                    value={scheduleData.contactId}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, contactId: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-1 focus:ring-wa-primary"
                  >
                    <option value="">Choose a contact...</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.displayName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-1">Transmission Title</label>
                  <input 
                    type="text"
                    value={scheduleData.title}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-1 focus:ring-wa-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-1">Start Time</label>
                    <input 
                      type="datetime-local"
                      value={scheduleData.date}
                      onChange={(e) => setScheduleData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-[11px] font-medium outline-none focus:ring-1 focus:ring-wa-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-1">Recurrence</label>
                    <div className="relative">
                      <select 
                        value={scheduleData.recurrence}
                        onChange={(e) => setScheduleData(prev => ({ ...prev, recurrence: e.target.value }))}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-medium appearance-none outline-none focus:ring-1 focus:ring-wa-primary"
                      >
                        <option value="none">Once</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                      <Repeat className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={12} />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={scheduleCall}
                    disabled={scheduling || !scheduleData.contactId}
                    className="w-full py-4 bg-zinc-950 dark:bg-wa-primary text-white rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest shadow-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                  >
                    {scheduling ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    {scheduling ? "Syncing Frequencies..." : "Process Connection Request"}
                  </button>
                  <p className="text-[9px] text-zinc-400 text-center mt-3 uppercase tracking-wider font-mono italic">
                    Calendar event will be synchronized & notification sent
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
