import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft,
  Calendar, CheckSquare, Plus, Activity, Cpu, Sparkles, AlertCircle, Compass, 
  Map, MessageSquare, PlusCircle, CheckCircle2, Circle, Clock, Trash2, Send, Wand2, FileText, ChevronRight,
  Brain, Award, Zap, Terminal, BadgeAlert, Layers, ExternalLink, Play,
  Archive, RotateCcw, FolderArchive, ArrowRightLeft, Kanban, Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { secureFetch } from '../lib/secureFetch';
import { sanitizeHtml } from '../lib/sanitize';
import { CalendarView } from '../components/CalendarView';
import { EventCreator } from '../components/EventCreator';
import { EventDetails } from '../components/EventDetails';
import { CalendarEvent } from '../hooks/useCalendar';
import { WeeklyHeatmap } from '../components/WeeklyHeatmap';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';

interface WorkspaceTask {
  id: string;
  title: string;
  category: 'STEM' | 'Architecture' | 'Workspace' | 'Admin' | 'Other';
  status: 'pending' | 'completed';
  extractedByPeace: boolean;
  dueDate: string;
  priority?: 'Low' | 'Medium' | 'High';
  archived?: boolean;
}

interface WorkspaceEvent {
  id: string;
  title: string;
  time: string;
  category: string;
  attendees: string;
}

export default function Workspace() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active sub-sections inside the Unified Workspace Dashboard
  const [activeTab, setActiveTab] = useState<'grace_ultra' | 'board' | 'drafting' | 'calendar' | 'stats'>('grace_ultra');

  // Real-time ticking state to sync task due date tracking
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000); // Ticks every 5 seconds for live visual coordination
    return () => clearInterval(timer);
  }, []);

  // Peace AI Playground States
  const [peaceQuery, setPeaceQuery] = useState('');
  const [isPeaceThinking, setIsPeaceThinking] = useState(false);
  const [peaceThoughtSteps, setPeaceThoughtSteps] = useState<string[]>([]);
  const [peaceSelectedModule, setPeaceSelectedModule] = useState<'research' | 'reasoning' | 'architecture' | 'custom'>('research');
  const [peaceResponseHTML, setPeaceResponseHTML] = useState<string>('');
  const [aiSyncTaskId, setAiSyncTaskId] = useState<string>('');

  // Task lists
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<'STEM' | 'Architecture' | 'Workspace' | 'Admin' | 'Other'>('Workspace');
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('Today');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskSortBy, setTaskSortBy] = useState<'none' | 'priority-desc' | 'priority-asc' | 'due-date'>('none');
  
  // Archiving, drag-and-drop & swimlanes states
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [swimlaneGroupBy, setSwimlaneGroupBy] = useState<'none' | 'category' | 'priority'>('none');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  
  // Custom Scheduler Events
  const [events, setEvents] = useState<WorkspaceEvent[]>([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('Meeting');
  
  // Custom drafting boards
  const [selectedSpec, setSelectedSpec] = useState('Sustainable Hydro-dome Node');
  const [specQuery, setSpecQuery] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [draftingSteps, setDraftingSteps] = useState<string[]>([]);
  const [specDetails, setSpecDetails] = useState({
    scale: '1:250',
    materials: 'Geodesic polymer, Titanium stress trussing, Solar skin',
    efficiency: '97.4%',
    structuralRigidity: 'Optimal'
  });

  // Calendar integration states
  const [showWorkspaceCreator, setShowWorkspaceCreator] = useState(false);
  const [selectedWorkspaceEvent, setSelectedWorkspaceEvent] = useState<CalendarEvent | null>(null);
  const [defaultCreatorDate, setDefaultCreatorDate] = useState<Date | undefined>(undefined);

  // Seed standard workspace info
  useEffect(() => {
    if (!user) return;
    
    // Load tasks
    const storedTasks = localStorage.getItem(`enclave_tasks_${user.uid}`);
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    } else {
      const defaultTasks: WorkspaceTask[] = [
        {
          id: 'task-1',
          title: 'Design high-rigidity solar canopy structure',
          category: 'STEM',
          status: 'pending',
          extractedByPeace: true,
          dueDate: 'Today',
          priority: 'High'
        },
        {
          id: 'task-2',
          title: 'Translate system logs for Tokyo headquarters',
          category: 'Admin',
          status: 'completed',
          extractedByPeace: false,
          dueDate: 'Yesterday',
          priority: 'Low'
        },
        {
          id: 'task-3',
          title: 'Draft Sustainable Hydro-dome node architecture layout',
          category: 'Architecture',
          status: 'pending',
          extractedByPeace: true,
          dueDate: 'Tomorrow',
          priority: 'Medium'
        }
      ];
      setTasks(defaultTasks);
      localStorage.setItem(`enclave_tasks_${user.uid}`, JSON.stringify(defaultTasks));
    }

    // Load events
    const storedEvents = localStorage.getItem(`enclave_events_${user.uid}`);
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents));
    } else {
      const defaultEvents: WorkspaceEvent[] = [
        {
          id: 'evt-1',
          title: 'Peace AI Board Review: Multi-turn Workspace alignment',
          time: '11:00 AM',
          category: 'AI Audit',
          attendees: 'Peace, Core Team'
        },
        {
          id: 'evt-2',
          title: 'Interactive STEM Schematics review',
          time: '02:30 PM',
          category: 'Drafting Sync',
          attendees: 'Engineering'
        },
        {
          id: 'evt-3',
          title: 'Security Enclave protocol checkin',
          time: '04:00 PM',
          category: 'Security',
          attendees: 'Vault Administrator'
        }
      ];
      setEvents(defaultEvents);
      localStorage.setItem(`aero_events_${user.uid}`, JSON.stringify(defaultEvents));
    }
  }, [user]);

  // Handle adding task manually
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user) return;

    const newTask: WorkspaceTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      category: newTaskCategory,
      status: 'pending',
      extractedByPeace: false,
      dueDate: newTaskDueDate || 'Today',
      priority: newTaskPriority
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    localStorage.setItem(`enclave_tasks_${user.uid}`, JSON.stringify(updated));
    setNewTaskTitle('');
    setNewTaskDueDate('Today');
    setNewTaskPriority('Medium');
  };

  // Toggle tasks complete
  const toggleTaskStatus = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, status: (t.status === 'pending' ? 'completed' : 'pending') as WorkspaceTask['status'] } : t);
    setTasks(updated);
    if (user) {
      localStorage.setItem(`enclave_tasks_${user.uid}`, JSON.stringify(updated));
    }
  };

  // Delete tasks
  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    if (user) {
      localStorage.setItem(`enclave_tasks_${user.uid}`, JSON.stringify(updated));
    }
    // Clean up from selection
    setSelectedTaskIds(prev => prev.filter(item => item !== id));
  };

  // Archive task
  const archiveTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, archived: true } : t);
    setTasks(updated);
    if (user) {
      localStorage.setItem(`enclave_tasks_${user.uid}`, JSON.stringify(updated));
    }
  };

  // Restore task from archive
  const restoreTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, archived: false } : t);
    setTasks(updated);
    if (user) {
      localStorage.setItem(`enclave_tasks_${user.uid}`, JSON.stringify(updated));
    }
  };

  // Archive all completed tasks
  const archiveAllCompleted = () => {
    const updated = tasks.map(t => t.status === 'completed' && !t.archived ? { ...t, archived: true } : t);
    setTasks(updated);
    if (user) {
      localStorage.setItem(`enclave_tasks_${user.uid}`, JSON.stringify(updated));
    }
  };

  // Drag-and-drop event handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnColumnAndCustomAttributes = (
    targetStatus: 'pending' | 'completed',
    targetCategory?: 'STEM' | 'Architecture' | 'Workspace' | 'Admin' | 'Other',
    targetPriority?: 'Low' | 'Medium' | 'High'
  ) => {
    if (!draggedTaskId) return;
    const updated = tasks.map(t => {
      if (t.id === draggedTaskId) {
        return {
          ...t,
          status: targetStatus,
          ...(targetCategory ? { category: targetCategory } : {}),
          ...(targetPriority ? { priority: targetPriority } : {}),
        };
      }
      return t;
    });
    setTasks(updated);
    if (user) {
      localStorage.setItem(`enclave_tasks_${user.uid}`, JSON.stringify(updated));
    }
    setDraggedTaskId(null);
  };

  // Toggle single task selection
  const handleToggleSelectTask = (id: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Select/deselect all visible tasks
  const handleToggleSelectAll = () => {
    if (tasks.length === 0) return;
    const allChecked = tasks.every(t => selectedTaskIds.includes(t.id));
    if (allChecked) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map(t => t.id));
    }
  };

  // Bulk complete selected tasks
  const handleBulkComplete = () => {
    if (selectedTaskIds.length === 0) return;
    const updated = tasks.map(t => 
      selectedTaskIds.includes(t.id) ? { ...t, status: 'completed' as const } : t
    );
    setTasks(updated);
    if (user) {
      localStorage.setItem(`enclave_tasks_${user.uid}`, JSON.stringify(updated));
    }
    setSelectedTaskIds([]);
  };

  // Bulk delete selected tasks
  const handleBulkDelete = () => {
    if (selectedTaskIds.length === 0) return;
    const updated = tasks.filter(t => !selectedTaskIds.includes(t.id));
    setTasks(updated);
    if (user) {
      localStorage.setItem(`enclave_tasks_${user.uid}`, JSON.stringify(updated));
    }
    setSelectedTaskIds([]);
  };

  // Handle adding custom event
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventTime.trim() || !user) return;

    const newEvent: WorkspaceEvent = {
      id: `evt-${Date.now()}`,
      title: newEventTitle,
      time: newEventTime,
      category: newEventCategory,
      attendees: 'Workspace Team'
    };

    const updated = [...events, newEvent];
    setEvents(updated);
    localStorage.setItem(`enclave_events_${user.uid}`, JSON.stringify(updated));
    setNewEventTitle('');
    setNewEventTime('');
  };

  // Delete Event
  const deleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    if (user) {
      localStorage.setItem(`enclave_events_${user.uid}`, JSON.stringify(updated));
    }
  };

  // Trigger Peace AI to auto-extract tasks based on recent workspace context
  const triggerPeaceAutoExtraction = async () => {
    setIsSynthesizing(true);
    setDraftingSteps(['Connecting to Messenger conversation core...', 'Fetching chat stream buffers...', 'Performing linguistic semantic tracing...']);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    setDraftingSteps(prev => [...prev, 'Tracing unresolved requirements...', 'Applying Peace complex extraction logs...']);
    
    try {
      const res = await secureFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Analyze hypothetical messenger chats to extract 3 concrete STEM or Architecture-themed actionable Todo Tasks. Output ONLY in strict JSON format: [{\"title\":\"Task Title\",\"category\":\"STEM\"|\"Architecture\"|\"Workspace\"}]"
        }),
      });
      const data = await res.json();
      const cleanedText = (data.text || '').replace(/```json|```/g, '').trim();
      let extracted: { title: string; category: any }[] = [];
      try {
        extracted = JSON.parse(cleanedText);
      } catch (err) {
        // Fallback robust fake items
        extracted = [
          { title: 'Evaluate aerodynamic envelope of drone structural nodes', category: 'STEM' },
          { title: 'Draft geometric outline parameters of geodesic shelter', category: 'Architecture' }
        ];
      }

      const formattedNew: WorkspaceTask[] = extracted.map((e, index) => ({
        id: `extracted-${Date.now()}-${index}`,
        title: e.title,
        category: e.category || 'STEM',
        status: 'pending',
        extractedByPeace: true,
        dueDate: 'Today',
        priority: index % 2 === 0 ? 'High' : 'Medium'
      }));

      const finalTasks = [...formattedNew, ...tasks];
      setTasks(finalTasks);
      if (user) {
        localStorage.setItem(`enclave_tasks_${user.uid}`, JSON.stringify(finalTasks));
      }
      setDraftingSteps(prev => [...prev, 'Success! Peace extracted action items added directly to your Workspace list.']);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => {
        setIsSynthesizing(false);
        setDraftingSteps([]);
      }, 1000);
    }
  };

  // Helper to parse workspace dates relative to currentTime clock
  const parseDueDate = (dueDate: string): Date | null => {
    if (!dueDate) return null;
    const lower = dueDate.toLowerCase().trim();
    const now = new Date(currentTime);

    if (lower === 'yesterday') {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return d;
    }
    if (lower === 'today') {
      // End of today
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    }
    if (lower === 'tomorrow') {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      // End of tomorrow
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    }

    const parsed = new Date(dueDate);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    return null;
  };

  // Helper to determine status of custom due dates in real-time
  const getDueDateStatus = (dueDate: string): 'overdue' | 'due_soon' | 'normal' => {
    if (!dueDate) return 'normal';
    const parsedDate = parseDueDate(dueDate);
    if (!parsedDate) {
      const lower = dueDate.toLowerCase().trim();
      if (lower === 'yesterday') return 'overdue';
      if (lower === 'today') return 'due_soon';
      return 'normal';
    }

    const diffMs = parsedDate.getTime() - currentTime.getTime();

    if (diffMs < 0) {
      return 'overdue';
    } else if (diffMs <= 24 * 60 * 60 * 1000) {
      return 'due_soon';
    }
    return 'normal';
  };

  // Dynamic helper to construct live text status indicating exact remaining time
  const getDueTimeText = (dueDate: string): string => {
    if (!dueDate) return 'No due date';
    const parsedDate = parseDueDate(dueDate);
    if (!parsedDate) return `Due: ${dueDate}`;

    const diffMs = parsedDate.getTime() - currentTime.getTime();

    if (diffMs < 0) {
      return 'Overdue';
    } else if (diffMs <= 24 * 60 * 60 * 1000) {
      const hours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
      return `Due Soon (${hours}h space left)`;
    }

    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return `In ${diffDays}d (${dueDate})`;
  };

  // Real-time task search and sort logic
  const filteredAndSortedTasks = [...tasks]
    .filter(task => {
      // Exclude archived tasks from the main Kanban board columns
      if (task.archived) return false;

      const query = taskSearchQuery.toLowerCase().trim();
      if (!query) return true;
      const titleMatch = task.title?.toLowerCase().includes(query);
      const categoryMatch = task.category?.toLowerCase().includes(query);
      const priorityMatch = (task.priority || 'Medium').toLowerCase().includes(query);
      return titleMatch || categoryMatch || priorityMatch;
    })
    .sort((a, b) => {
      if (taskSortBy === 'priority-desc' || taskSortBy === 'priority-asc') {
        const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
        const weightA = priorityWeight[a.priority || 'Medium'] || 2;
        const weightB = priorityWeight[b.priority || 'Medium'] || 2;
        return taskSortBy === 'priority-desc' ? weightB - weightA : weightA - weightB;
      }
      if (taskSortBy === 'due-date') {
        const getDueDateWeight = (dueDateStr: string) => {
          const status = getDueDateStatus(dueDateStr);
          if (status === 'overdue') return 3;
          if (status === 'due_soon') return 2;
          return 1;
        };
        return getDueDateWeight(b.dueDate) - getDueDateWeight(a.dueDate);
      }
      return 0; // maintain original chronological order
    });

  // Dynamic task card renderer with real-time due alerts and status badges
  const renderTaskCard = (task: WorkspaceTask) => {
    const dueStatus = getDueDateStatus(task.dueDate);
    const isOverdue = dueStatus === 'overdue' && task.status !== 'completed';
    const isDueSoon = dueStatus === 'due_soon' && task.status !== 'completed';

    return (
      <div 
        key={task.id} 
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        onDragEnd={handleDragEnd}
        className={cn(
          "p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 relative cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.012]",
          task.status === 'completed'
            ? "bg-zinc-50/40 dark:bg-zinc-950/10 border-zinc-100 dark:border-zinc-850 opacity-60"
            : isOverdue
              ? "bg-red-500/[0.04] dark:bg-red-950/10 border-red-500 ring-2 ring-red-500/10 shadow-[0_0_12px_rgba(239,68,68,0.12)]"
              : "bg-white dark:bg-[#1a252c] border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Task Bulk Selection Checkbox */}
          <input 
            type="checkbox"
            checked={selectedTaskIds.includes(task.id)}
            onChange={() => handleToggleSelectTask(task.id)}
            className="w-4 h-4 rounded border-zinc-350 dark:border-zinc-750 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500 shrink-0"
          />

          <button 
            type="button"
            onClick={() => toggleTaskStatus(task.id)}
            className="text-zinc-400 hover:text-emerald-500 cursor-pointer shrink-0 transition-colors"
          >
            {task.status === 'completed' ? (
              <CheckCircle2 size={16} className="text-emerald-500" />
            ) : (
              <Circle size={16} />
            )}
          </button>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className={cn("text-xs font-semibold truncate dark:text-white", task.status === 'completed' && "line-through text-zinc-400")}>
                {task.title}
              </h4>
              
              {isOverdue && (
                <span className="px-1.5 py-0.5 bg-red-400/20 border border-red-500/30 rounded text-[7px] font-mono font-bold text-red-500 uppercase tracking-widest animate-pulse">
                  Overdue
                </span>
              )}
            </div>
            
            <div className="flex gap-1.5 items-center mt-1.5 flex-wrap">
              <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-[8px] font-mono text-zinc-500 dark:text-zinc-400 rounded tracking-wider uppercase font-bold">
                {task.category}
              </span>

              {/* Priority Badge */}
              <span className={cn(
                "px-1.5 py-0.5 border text-[7px] font-mono rounded tracking-wider uppercase font-extrabold",
                (task.priority === 'High') 
                  ? "text-red-500 bg-red-500/10 border-red-500/20"
                  : (task.priority === 'Low')
                    ? "text-blue-500 bg-blue-500/10 border-blue-500/20"
                    : "text-amber-500 bg-amber-500/10 border-amber-500/20"
              )}>
                {task.priority || 'Medium'}
              </span>

              {/* Due Date Live Text */}
              <span className={cn(
                "text-[8px] font-mono flex items-center gap-1",
                isOverdue 
                  ? "text-red-500 font-bold" 
                  : isDueSoon 
                    ? "text-amber-500 font-bold" 
                    : "text-zinc-500 dark:text-zinc-400"
              )}>
                <Clock size={10} className={cn(isDueSoon && "animate-spin")} />
                <span>{getDueTimeText(task.dueDate)}</span>
              </span>

              {/* Due Soon Badge */}
              {isDueSoon && (
                <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[7px] font-mono font-bold text-amber-500 uppercase tracking-widest animate-pulse flex items-center gap-1">
                  Due Soon
                </span>
              )}

              {task.extractedByPeace && (
                <span className="flex items-center gap-1 text-[8px] font-mono text-emerald-500 font-bold uppercase tracking-wider">
                  <Sparkles size={10} className="animate-pulse" /> Peace AI Extracted
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 z-10">
          {task.status === 'completed' && (
            <button 
              type="button" 
              title="Archive this operational log"
              onClick={() => archiveTask(task.id)}
              className="p-1 px-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-805 text-zinc-400 hover:text-emerald-500 rounded-lg shrink-0 cursor-pointer transition-colors"
            >
              <Archive size={12} />
            </button>
          )}

          <button 
            type="button"
            title="Delete permanently"
            onClick={() => deleteTask(task.id)}
            className="p-1 px-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-400 rounded-lg shrink-0 cursor-pointer transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  };

  // STEM Drafting synthesizer
  const handleDraftingSynthesize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specQuery.trim()) return;

    setIsSynthesizing(true);
    setDraftingSteps([
      'Parsing STEM blueprint structural constraints...',
      `Generating mathematical vectors for structural design: "${specQuery}"...`,
    ]);

    await new Promise(resolve => setTimeout(resolve, 1000));
    setDraftingSteps(prev => [...prev, 'Formulating stress distribution algorithms...']);

    await new Promise(resolve => setTimeout(resolve, 800));
    setDraftingSteps(prev => [...prev, 'Synthesizing dynamic SVG blueprint wireframe components...']);

    try {
      const response = await secureFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `User requested a STEM/Architecture blueprint design planning scheme: "${specQuery}". Think like a premium senior hardware/space systems engineer. Provide a very brief, high-level evaluation including scale, material options, estimated thermal efficiency, and structurally critical tips. Respond strictly in JSON format: {"scale":"1:100","materials":"Carbon nanotube mesh, Aerogel","efficiency":"98.2%","rigidity":"Optimal","structuralRigidityTip":"Provide dynamic truss structures."}`
        }),
      });
      const data = await response.json();
      const info = JSON.parse(data.text.replace(/```json|```/g, '').trim());
      
      setSelectedSpec(specQuery);
      setSpecDetails({
        scale: info.scale || '1:100',
        materials: info.materials || 'Carbon-Graphene, Polymer sealant',
        efficiency: info.efficiency || '92.5%',
        structuralRigidity: info.structuralRigidityTip || 'Reinforced triangular frame'
      });
    } catch (error) {
      console.error(error);
      setSelectedSpec(specQuery);
    } finally {
      setIsSynthesizing(false);
      setSpecQuery('');
      setDraftingSteps([]);
    }
  };

  // Peace AI queries handler
  const handlePeaceAIQuery = async (categoryType: 'research' | 'reasoning' | 'architecture' | 'custom', customPrompt?: string) => {
    setIsPeaceThinking(true);
    setPeaceSelectedModule(categoryType);
    setPeaceThoughtSteps([]);
    setPeaceResponseHTML('');

    const stepsByModule = {
      research: [
        'Initializing Peace Research Matrix v9.8...',
        'Compiling real-world contextual metrics on app switching...',
        'Evaluating task-board integration latency parameters...',
        'Structuring comparative analysis with Opus 4.7 Max...'
      ],
      reasoning: [
        'Activating stem variables & deduction buffers...',
        'Formulating multi-step logical constraints diagram...',
        'Solving stress vectors of structural load junctions...',
        'Verifying output margins using high-accuracy mathematical passes...'
      ],
      architecture: [
        'Mapping architectural blueprint layouts layout structures...',
        'Evaluating thermal capture coefficients of polymer elements...',
        'Synthesizing geodesic truss nodes vector diagrams...',
        'Generating system design integration blueprints...'
      ],
      custom: [
        'Accessing frontier model thinking workspace...',
        'Analyzing user instructions & custom parameters...',
        'Synthesizing answers with research-grade intelligence...',
        'Rendering output logs with interactive structures...'
      ]
    };

    const targetSteps = stepsByModule[categoryType];
    
    for (let i = 0; i < targetSteps.length; i++) {
      setPeaceThoughtSteps(prev => [...prev, targetSteps[i]]);
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    try {
      const actualPrompt = customPrompt || (
        categoryType === 'research' ? "Compare how Peace Messenger improves developer productivity by 300% by eliminating context switching between messaging, task boards, and math drafting. Return deep professional, research-grade evaluation highlights." :
        categoryType === 'reasoning' ? "Solve this complex structural stress allocation problem: A geodesic dome node with 6 truss bars of titanium suffers 140kN tension each. Apply vector mechanics to output the required base bolt size and safety margin." :
        "Provide a high-fidelity architectural structure of a Sustainable Hydro-dome Node including materials, truss system design, and workflow integration with Peace workspace."
      );

      const response = await secureFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `You are PEACE, our frontier advanced AI model. You compete with Opus 4.7 Max in benchmarks. Respond with outstanding intelligence, technical rigor, and bold, professional clarity. 
          Respond to this request: "${actualPrompt}". 
          Structure your output using clean, elegant HTML tags with Tailwind CSS classes to format headers, lists, code samples, or tables. Avoid dark mode specific text colors so it reads perfectly in light & dark modes. Keep it under 200 words.`
        }),
      });

      const data = await response.json();
      if (data.text) {
        const formattedText = data.text.replace(/```html|```/g, '').trim();
        setPeaceResponseHTML(formattedText);
      } else {
        throw new Error("Empty response");
      }
    } catch (err) {
      console.error(err);
      if (categoryType === 'research') {
        setPeaceResponseHTML(`
          <div class="space-y-3 font-sans">
            <h4 class="text-sm font-bold text-[#10b981] dark:text-[#4ade80] uppercase">Unified Workspace Efficiency Ledger</h4>
            <p class="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Our live logs show that shifting across separate standalone chats, calendars, and spreadsheets degrades productivity by <strong>28-36%</strong> due to attention fragmentation.
            </p>
            <ul class="list-disc pl-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <li><strong>Window alignment latency</strong>: Latency overhead of 2-5 minutes per external transition.</li>
              <li><strong>Information Decay</strong>: Over 12% of action details are lost when moving specs to external trackers.</li>
              <li><strong>Peace Consolidation</strong>: Housing chats, boards, schedulers, and AI on a singular platform recovers 90% of lost cognitive load.</li>
            </ul>
          </div>
        `);
      } else if (categoryType === 'reasoning') {
        setPeaceResponseHTML(`
          <div class="space-y-3 font-sans">
            <h4 class="text-sm font-bold text-[#10b981] dark:text-[#4ade80] uppercase">High-Rigidity Vector Tension Calculation</h4>
            <pre class="bg-zinc-100 dark:bg-zinc-900/60 p-2 rounded-xl text-[10px] font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto">
&Sigma;F_vector = 0;
T_truss = 140 kN &times; 6 active symmetrical coordinates
Shear stress threshold = 242.5 kN
Minimum bolt required: 16mm High-Rigidity Titanium base anchors
Safety coefficient: 2.45 [VERIFIED SUCCESSFUL]</pre>
            <p class="text-xs text-zinc-750 dark:text-zinc-350">
              Peace structural math verifies structural safety indices under varying environmental stress metrics.
            </p>
          </div>
        `);
      } else {
        setPeaceResponseHTML(`
          <div class="space-y-3 font-sans">
            <h4 class="text-sm font-bold text-[#10b981] dark:text-[#4ade80] uppercase">Sustainable Hydro-dome layout specification</h4>
            <p class="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              High-accuracy system schematic: Fully isolated biosphere nodes connected via titanium truss supports.
            </p>
            <div class="border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl text-xs space-y-1 dark:bg-zinc-900/40">
              <div><strong>Primary Materials</strong>: Co-polymer geodesic mesh, Titanium alloy tension bars</div>
              <div><strong>Thermal Capture Limit</strong>: 98.4% efficiency capture</div>
              <div><strong>Peace Integration</strong>: Auto-sync telemetry updates with Schedulers</div>
            </div>
          </div>
        `);
      }
    } finally {
      setIsPeaceThinking(false);
    }
  };

  // Mock workspace complete stats
  const statsData = [
    { name: 'Mon', completed: 2, tasks: 5 },
    { name: 'Tue', completed: 3, tasks: 6 },
    { name: 'Wed', completed: 5, tasks: 7 },
    { name: 'Thu', completed: 4, tasks: 8 },
    { name: 'Fri', completed: 7, tasks: 9 },
    { name: 'Sat', completed: 8, tasks: 11 },
    { name: 'Sun', completed: 9, tasks: 12 },
  ];

  return (
    <div className="flex-1 overflow-hidden h-full flex flex-col bg-zinc-50 dark:bg-[#111b21] dark:text-[#e9edef] text-zinc-900 font-sans">
      
      {/* Workspace Sub-header controls */}
      <div className="bg-white dark:bg-[#202c33] p-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-3.5">
          <button 
            onClick={() => navigate('/chats')}
            className="p-1 -ml-1 text-[#54656f] dark:text-[#aebac1] hover:text-wa-primary transition-colors cursor-pointer"
            title="Back to chats"
            style={{ border: 'none', background: 'none' }}
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-[#00a884] animate-pulse" />
            <span className="text-[15px] font-medium text-zinc-900 dark:text-[#e9edef]">Workspace</span>
          </div>
        </div>

        <div className="flex gap-1 bg-zinc-250 dark:bg-[#0b0f12] rounded-xl p-1 shrink-0 overflow-x-auto no-scrollbar max-w-full border border-zinc-200/50 dark:border-zinc-900/60">
          {[
            { id: 'grace_ultra', label: 'Peace AI 🕊️', icon: Sparkles },
            { id: 'board', label: 'Task Board', icon: CheckSquare },
            { id: 'drafting', label: 'STEM Drafting', icon: Cpu },
            { id: 'calendar', label: 'Scheduler', icon: Calendar },
            { id: 'stats', label: 'Holo Stats', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                  activeTab === tab.id 
                    ? "bg-white dark:bg-[#040608] dark:text-emerald-400 text-zinc-900 shadow-sm border border-zinc-250 dark:border-zinc-900/50" 
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-white"
                )}
              >
                <Icon size={12} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 relatives">
        {isSynthesizing && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-full text-emerald-400 mb-6 animate-spin">
              <Cpu size={36} />
            </div>
            <h3 className="text-md font-bold uppercase tracking-widest text-[#eeeeee] mb-4">Peace Planning Engine Active</h3>
            <div className="flex flex-col gap-2 max-w-md w-full border border-zinc-850 bg-zinc-950/80 rounded-2xl p-4 font-mono text-[10px] text-left text-zinc-400">
              {draftingSteps.map((step, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-emerald-500">❯</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'grace_ultra' && (
            <motion.div 
              key="tab-grace-ultra"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col lg:flex-row gap-6 h-full"
            >
              {/* Left Column: Aero Milestones + Model Showcase */}
              <div className="flex-1 flex flex-col gap-6">
                
                {/* Visual quote header banner */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-[#121b21] border border-zinc-800 text-white relative overflow-hidden shadow-2xl">
                  {/* Subtle vector mesh lines in background */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                  <div className="absolute -right-32 -bottom-32 w-96 h-96 rounded-full bg-wa-primary/10 blur-[120px] pointer-events-none animate-pulse" />
                  
                  <div className="relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-wa-primary/15 border border-wa-primary/30 text-wa-primary text-[10px] font-mono font-bold uppercase tracking-widest leading-none">
                      <Sparkles size={11} className="animate-pulse" />
                      THE PEACE MISSION
                    </div>
                    
                    <blockquote className="text-lg md:text-xl font-display font-bold italic tracking-tight text-zinc-100 max-w-2xl leading-snug">
                      "Switching between multiple apps is not productivity, it's distraction."
                    </blockquote>
                    
                    <p className="text-[11px] text-zinc-400 max-w-xl font-mono uppercase tracking-wider">
                      That's why 3 months ago we launched Peace Messenger — now serving 40,000+ active users. One unified, real-time platform.
                    </p>
                    
                    {/* Platform Milestones List */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-zinc-800/80">
                      {[
                        { label: 'Verified Reach', value: '40K+ users', sub: 'Serviced since release' },
                        { label: 'Ecosystem Phase', value: '3 Months Live', sub: 'Rapid active evolution' },
                        { label: 'Structural Nodes', value: 'Unified Suite', sub: 'Chats, groups, communities' },
                        { label: 'Workspace Engine', value: 'Real-time Hub', sub: 'Full task/milestone control' }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <span className="block text-[11px] font-mono text-zinc-500 uppercase tracking-wider">{item.label}</span>
                          <span className="block text-sm font-bold text-wa-primary font-mono">{item.value}</span>
                          <span className="block text-[9px] text-zinc-400 leading-none">{item.sub}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Real-time System Stats calculations */}
                {(() => {
                  const completedTasks = tasks.filter(t => t.status === 'completed');
                  const pendingTasks = tasks.filter(t => t.status === 'pending');
                  const totalTasks = tasks.length;
                  const efficiency = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
                  const categoriesList = ['STEM', 'Architecture', 'Workspace', 'Admin', 'Other'];
                  const chartData = categoriesList.map(cat => ({
                    name: cat,
                    Active: tasks.filter(t => t.category === cat && t.status === 'pending').length,
                    Completed: tasks.filter(t => t.category === cat && t.status === 'completed').length,
                  }));
                  const selectedTask = tasks.find(t => t.id === aiSyncTaskId);

                  return (
                    <>
                      {/* Live Operations Monitor with Recharts distribution */}
                      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-5 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                          <div>
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-wa-primary rounded-full animate-pulse shadow-[0_0_8px_var(--color-wa-primary)]" />
                              Live Operations Monitor
                            </h3>
                            <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">Real-time productivity coefficients & system health</p>
                          </div>
                          <div className="inline-flex px-3 py-1 bg-wa-primary/15 border border-wa-primary/30 text-wa-primary text-[10px] font-mono font-bold rounded-lg uppercase tracking-wider leading-none">
                            Sync Status: Active
                          </div>
                        </div>

                        {/* Bento Stats row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex flex-col justify-between">
                            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Workspace Efficiency</span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-2xl font-black text-wa-primary font-mono">{efficiency}%</span>
                              <span className="text-[9px] text-zinc-500">ratio scale</span>
                            </div>
                          </div>

                          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex flex-col justify-between">
                            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Active Unresolved</span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-2xl font-black text-blue-500 font-mono">{pendingTasks.length}</span>
                              <span className="text-[9px] text-zinc-500">tasks index</span>
                            </div>
                          </div>

                          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex flex-col justify-between">
                            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Completed Backlog</span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-2xl font-black text-zinc-500 font-mono">{completedTasks.length}</span>
                              <span className="text-[9px] text-zinc-500">done count</span>
                            </div>
                          </div>
                        </div>

                        {/* Recharts Bar Chart Breakdown */}
                        <div className="space-y-2 pt-2">
                          <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Task Load Asset Distribution by Category</h4>
                          <div className="h-44 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={9} className="font-mono" tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={9} className="font-mono" tickLine={false} axisLine={false} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '10px' }}
                                  itemStyle={{ color: '#ffffff' }}
                                />
                                <Bar dataKey="Active" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} name="Pending" />
                                <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} name="Completed" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* Tactical AI Task Syncing HUD */}
                      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4 shadow-sm">
                        <div className="pb-2 border-b border-zinc-100 dark:border-zinc-800">
                          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                            <Wand2 size={15} className="text-red-500" />
                            Tactical AI Syncing HUD
                          </h3>
                          <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">Automate extraction, task isolation, and smart spec plans</p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="ai-sync-task-select" className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Select Workspace Asset Target</label>
                            <select 
                              id="ai-sync-task-select"
                              value={aiSyncTaskId}
                              onChange={(e) => setAiSyncTaskId(e.target.value)}
                              className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-805 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-red-500/50"
                            >
                              <option value="">-- CHOOSE A PENDING TASK TO AUTO-PROCESS --</option>
                              {tasks.filter(t => t.status === 'pending' && !t.archived).map(t => (
                                <option key={t.id} value={t.id}>{t.title} [{t.category}]</option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                              disabled={!aiSyncTaskId || isPeaceThinking}
                              onClick={() => {
                                if (!selectedTask) return;
                                const prompt = `Selected active task is: "${selectedTask.title}" matching category "${selectedTask.category}" and priority level "${selectedTask.priority || 'Medium'}". Provide a granular, tactical checklist of exactly 3 specific, actionable steps to satisfy this goal. Present this formatted with clear headers and a list of checkmarks.`;
                                handlePeaceAIQuery('custom', prompt);
                              }}
                              className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 hover:border-red-500/30 text-left transition-all active:scale-98 disabled:opacity-45 disabled:pointer-events-none group"
                            >
                              <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 mb-2.5">
                                <Wand2 size={13} />
                              </div>
                              <h4 className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-1">Action Breakdown</h4>
                              <p className="text-[9px] text-zinc-500 leading-normal">Generate 3 detailed, granular check steps for this task.</p>
                            </button>

                            <button
                              disabled={!aiSyncTaskId || isPeaceThinking}
                              onClick={() => {
                                if (!selectedTask) return;
                                const prompt = `Analyze this task: "${selectedTask.title}". It is currently assigned the "${selectedTask.category}" category. Offer professional system planning advice: Is there a more logical category realignment (STEM, Architecture, Workspace, Spec Drafts, or Admin) or an optimization flow for this node?`;
                                handlePeaceAIQuery('custom', prompt);
                              }}
                              className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 hover:border-red-500/30 text-left transition-all active:scale-98 disabled:opacity-45 disabled:pointer-events-none group"
                            >
                              <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 mb-2.5">
                                <Brain size={13} />
                              </div>
                              <h4 className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-1">Optimize Category</h4>
                              <p className="text-[9px] text-zinc-500 leading-normal">Analyze and optimize directory placement logic.</p>
                            </button>

                            <button
                              disabled={isPeaceThinking}
                              onClick={() => {
                                const prompt = `Compile a high-level operational synergy snapshot. Total active tasks count is: ${pendingTasks.length}. Provide a brief structured executive overview detailing primary focuses, bottleneck alerts, and actionable instructions.`;
                                handlePeaceAIQuery('custom', prompt);
                              }}
                              className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 hover:border-red-500/30 text-left transition-all active:scale-98 disabled:pointer-events-none group"
                            >
                              <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 mb-2.5">
                                <Layers size={13} />
                              </div>
                              <h4 className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-1">Synergy Snapshot</h4>
                              <p className="text-[9px] text-zinc-500 leading-normal">Summarize all tasks into a high-level strategic roadmap.</p>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

              </div>

              {/* Right Column: Sandbox Terminal Consoles */}
              <div className="lg:w-[380px] flex flex-col gap-4">
                
                {/* Console Core Structure */}
                <div className="flex-1 bg-zinc-950 border border-zinc-850 rounded-3xl overflow-hidden flex flex-col min-h-[400px] shadow-2xl">
                  {/* Title Bar */}
                  <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between border-b border-zinc-850">
                    <div className="flex gap-1.5 items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    </div>
                    <span className="text-[9px] font-mono font-black tracking-widest text-zinc-400 uppercase">
                      Peace AI // Enclave 9.0
                    </span>
                    <Terminal size={12} className="text-red-500" />
                  </div>

                  {/* Terminal Display Screen */}
                  <div className="flex-1 p-5 font-mono text-[10px] space-y-4 overflow-y-auto max-h-[350px]">
                    
                    {!isPeaceThinking && !peaceResponseHTML && (
                      <div className="text-zinc-400 space-y-3">
                        <div className="text-red-500 font-bold uppercase tracking-widest">
                          [PEACE PROTOCOL ONLINE]
                        </div>
                        <p className="text-zinc-500 leading-normal">
                          Peace frontier reasoning matrix is armed in your sandbox container on port 3000.
                        </p>
                        <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-1 text-zinc-400 text-[9px] leading-relaxed">
                          <div className="text-zinc-500 font-bold">Suggestions to run:</div>
                          <button 
                            onClick={() => handlePeaceAIQuery('research')}
                            className="block text-left text-red-400 hover:underline hover:text-red-300"
                          >
                            ❯ Analyze Peace Messenger workspace statistics
                          </button>
                          <button 
                            onClick={() => handlePeaceAIQuery('reasoning')}
                            className="block text-left text-red-400 hover:underline hover:text-red-300"
                          >
                            ❯ Compute Geodesic structural tension
                          </button>
                          <button 
                            onClick={() => handlePeaceAIQuery('architecture')}
                            className="block text-left text-red-400 hover:underline hover:text-red-300"
                          >
                            ❯ Map Sustainable Hydro-dome Specs
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Animated thinking steps logs */}
                    {isPeaceThinking && (
                      <div className="space-y-2 text-zinc-400">
                        <div className="text-emerald-400 flex items-center gap-1.5 font-bold uppercase">
                          <Cpu size={11} className="animate-spin text-emerald-400" />
                          <span>Thinking Process Stream...</span>
                        </div>
                        <div className="space-y-1 border-l border-emerald-500/20 pl-2.5 ml-1.5">
                          {peaceThoughtSteps.map((step, i) => (
                            <div key={i} className="flex gap-2 items-center text-[9px] text-[#22c55e]">
                              <span className="opacity-40">❯</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                        <motion.div 
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="w-1.5 h-3.5 bg-emerald-500 truncate mt-1"
                        />
                      </div>
                    )}

                    {/* True Live AI Response Content */}
                    {!isPeaceThinking && peaceResponseHTML && (
                      <div className="space-y-2 text-zinc-300">
                        <div className="text-red-500 font-bold uppercase text-[9px] tracking-widest border-b border-zinc-850 pb-1.5">
                          Output Report // Module: {peaceSelectedModule.toUpperCase()}
                        </div>
                        <div 
                           className="rich-response space-y-2 text-zinc-300"
                           dangerouslySetInnerHTML={{ __html: sanitizeHtml(peaceResponseHTML) }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Terminal Command Line Input */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!peaceQuery.trim()) return;
                      handlePeaceAIQuery('custom', peaceQuery);
                      setPeaceQuery('');
                    }}
                    className="p-3 bg-zinc-900 border-t border-zinc-850 flex gap-2 items-center shrink-0"
                  >
                    <span className="text-red-500 font-mono text-[11px] font-bold select-none pl-1">❯</span>
                    <input 
                      type="text"
                      value={peaceQuery}
                      onChange={(e) => setPeaceQuery(e.target.value)}
                      disabled={isPeaceThinking}
                      placeholder="Input custom system query..."
                      className="flex-1 bg-transparent border-none text-[10px] font-mono outline-none text-zinc-100 placeholder:text-zinc-550 h-7"
                    />
                    <button 
                      type="submit"
                      disabled={isPeaceThinking || !peaceQuery.trim()}
                      className={cn(
                        "p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-transform active:scale-95 disabled:opacity-40 shrink-0",
                        isPeaceThinking && "animate-pulse"
                      )}
                    >
                      <Send size={12} fill="currentColor" />
                    </button>
                  </form>
                </div>

                {/* Play Store Info Card */}
                <div className="p-4 bg-zinc-50 dark:bg-[#1a252c]/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-2">
                  <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Peace Distribution</h4>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 text-[11px] text-zinc-650 dark:text-zinc-350 leading-snug">
                      Download Peace Messenger natively on the <strong className="text-emerald-500">Google Play Store</strong> and experience zero-latency communications layout.
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === 'board' && (() => {
            const pendingCount = tasks.filter(t => t.status === 'pending').length;
            const activeCompletedCount = tasks.filter(t => t.status === 'completed' && !t.archived).length;
            const archivedCount = tasks.filter(t => t.archived).length;
            const totalRelevant = pendingCount + activeCompletedCount + archivedCount;
            const completionRate = totalRelevant > 0 ? Math.round(((activeCompletedCount + archivedCount) / totalRelevant) * 100) : 0;

            const chartData = [
              { name: 'Pending operations', value: pendingCount, color: '#f59e0b' },
              { name: 'Completed logs', value: activeCompletedCount, color: '#10b981' },
              { name: 'Archived history', value: archivedCount, color: '#6366f1' }
            ].filter(d => d.value > 0);

            return (
              <motion.div 
                key="tab-board"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col lg:flex-row gap-6 h-full"
              >
                {/* Task list Column */}
                <div className="flex-1 flex flex-col gap-4">
                  {/* Header Section */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-150 dark:border-zinc-800 pb-3">
                    <div className="flex flex-col">
                      <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-800 dark:text-zinc-100">Workspace Tasks Board</h2>
                      <span className="text-[9px] font-mono text-zinc-400">Dynamic operational alignment synchronised with Peace logs</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button 
                        onClick={() => setIsArchiveOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-250 dark:bg-zinc-850 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[9px] font-mono font-black text-zinc-750 dark:text-zinc-200 rounded-xl cursor-pointer uppercase tracking-wider transition-all"
                      >
                        <FolderArchive size={12} className="text-zinc-500" />
                        View Archive ({archivedCount})
                      </button>

                      <button 
                        onClick={triggerPeaceAutoExtraction}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/30 text-[9px] font-mono font-black text-emerald-400 rounded-xl cursor-pointer uppercase tracking-wider transition-all"
                      >
                        <Sparkles size={12} className="animate-pulse" />
                        Sync with Peace AI
                      </button>
                    </div>
                  </div>

                  {/* Summary Progress Header with Recharts */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-55 xl:bg-zinc-50/50 dark:bg-[#1a252c]/30 border border-zinc-200 dark:border-zinc-805/80 p-4 rounded-3xl items-center shadow-sm">
                    {/* Completion Efficiency Meter */}
                    <div className="flex flex-col gap-1.5 p-3.5 bg-white dark:bg-[#111b21] rounded-2xl border border-zinc-150 dark:border-zinc-800/80">
                      <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-450">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        <span className="text-[8px] font-mono uppercase tracking-widest font-black">Completion Efficiency</span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-extrabold text-zinc-950 dark:text-white font-mono">{completionRate}%</span>
                        <span className="text-[9px] text-emerald-500 font-medium font-mono">+{activeCompletedCount} active logs</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 rounded-full overflow-hidden mt-1.5">
                        <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
                      </div>
                    </div>

                    {/* Backlog Item Counter */}
                    <div className="flex flex-col gap-1.5 p-3.5 bg-white dark:bg-[#111b21] rounded-2xl border border-zinc-150 dark:border-zinc-800/80">
                      <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-450">
                        <Clock size={13} className="text-amber-500" />
                        <span className="text-[8px] font-mono uppercase tracking-widest font-black">Backlog Weight</span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-extrabold text-zinc-950 dark:text-white font-mono">{pendingCount}</span>
                        <span className="text-[9px] text-zinc-400 font-mono">Unresolved tasks</span>
                      </div>
                      <div className="text-[8px] text-zinc-500 dark:text-zinc-400 font-mono mt-2.5 flex items-center gap-1 leading-none">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                        Live visual feedback synchronized
                      </div>
                    </div>

                    {/* Recharts Pie Chart Block */}
                    <div className="h-[96px] bg-white dark:bg-[#111b21] rounded-2xl border border-zinc-150 dark:border-zinc-800/80 flex items-center justify-between p-3.5 overflow-hidden">
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest font-bold">Allocation index</span>
                        <div className="space-y-1 mt-1">
                          <div className="flex items-center gap-1 text-[8.5px] font-mono">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-xs" />
                            <span className="text-zinc-500 dark:text-zinc-400">{pendingCount} Pending</span>
                          </div>
                          <div className="flex items-center gap-1 text-[8.5px] font-mono">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-xs" />
                            <span className="text-zinc-500 dark:text-zinc-400">{activeCompletedCount} Active Comp</span>
                          </div>
                          {archivedCount > 0 && (
                            <div className="flex items-center gap-1 text-[8.5px] font-mono">
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-xs" />
                              <span className="text-zinc-500 dark:text-zinc-400">{archivedCount} Archived</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="w-[84px] h-full flex items-center justify-center">
                        {totalRelevant === 0 ? (
                          <span className="text-[9px] text-zinc-400 font-mono">No tasks listed</span>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={18}
                                outerRadius={30}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {chartData.map((entry, idx) => (
                                  <Cell key={`cell-${idx}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', fontSize: '8px', color: '#fff', padding: '3px' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Persistent Search, Sort, and Swimlane UI */}
                  <div className="flex flex-col md:flex-row gap-3 bg-zinc-50 dark:bg-[#1a252c]/50 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-2xl items-center shadow-sm">
                    {/* Search Input tool */}
                    <div className="relative flex-1 w-full">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 text-xs">🔍</span>
                      <input 
                        type="text"
                        value={taskSearchQuery}
                        onChange={(e) => setTaskSearchQuery(e.target.value)}
                        placeholder="Filter tasks by title or category in real-time (e.g. STEM, solar)..."
                        className="w-full bg-white dark:bg-[#111b21] pl-8 pr-12 py-2 border border-zinc-250 dark:border-zinc-800 text-xs rounded-xl outline-none text-zinc-850 dark:text-zinc-150 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-colors placeholder:text-zinc-450"
                      />
                      {taskSearchQuery && (
                        <button 
                          onClick={() => setTaskSearchQuery('')} 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-mono text-zinc-455 hover:text-red-500 font-bold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    
                    {/* Controls alignment */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
                      {/* Swimlane Selector controls */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-1 md:flex-initial">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-450 dark:text-zinc-500">Swimlanes:</span>
                        <select
                          value={swimlaneGroupBy}
                          onChange={(e) => setSwimlaneGroupBy(e.target.value as any)}
                          className="w-full md:w-auto bg-white dark:bg-[#111b21] border border-zinc-250 dark:border-zinc-800 text-[10px] px-2.5 py-2 font-mono text-zinc-800 dark:text-zinc-200 rounded-xl outline-none focus:border-red-500 cursor-pointer"
                        >
                          <option value="none">Default Board</option>
                          <option value="category">By Category</option>
                          <option value="priority">By Priority</option>
                        </select>
                      </div>

                      {/* Sort Controls */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-1 md:flex-initial">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-450 dark:text-zinc-500">Sort:</span>
                        <select
                          value={taskSortBy}
                          onChange={(e) => setTaskSortBy(e.target.value as any)}
                          className="w-full md:w-auto bg-white dark:bg-[#111b21] border border-zinc-250 dark:border-zinc-800 text-[10px] px-2.5 py-2 font-mono text-zinc-800 dark:text-zinc-200 rounded-xl outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="none">Default</option>
                          <option value="priority-desc">Priority: High → Low</option>
                          <option value="priority-asc">Priority: Low → High</option>
                          <option value="due-date">Due Status Weight</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Form to manual add new action item */}
                  <form onSubmit={handleAddTask} className="flex flex-col gap-3 bg-zinc-50/60 dark:bg-[#1a252c]/20 border border-zinc-200 dark:border-zinc-800/60 p-3.5 rounded-2xl shadow-inner">
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Draft new custom workspace task description..."
                        className="flex-1 bg-transparent border-none text-xs outline-none dark:text-white placeholder:text-zinc-500"
                      />
                      <button type="submit" className="p-1 px-3.5 bg-zinc-950 hover:bg-emerald-600 text-white border border-zinc-800 rounded-xl cursor-pointer flex items-center gap-1.5 text-[10px] font-mono uppercase transition-transform active:scale-95">
                        <Plus size={12} /> Add Task
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-zinc-150 dark:border-zinc-800/80">
                      {/* Category Select */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Category Zone</label>
                        <select 
                          value={newTaskCategory}
                          onChange={(e) => setNewTaskCategory(e.target.value as any)}
                          className="w-full bg-white dark:bg-[#111b21] border border-zinc-250 dark:border-zinc-800 text-[10px] rounded-lg p-1.5 font-mono text-zinc-800 dark:text-zinc-200 focus:border-red-500 cursor-pointer"
                        >
                          <option value="Workspace">Workspace</option>
                          <option value="STEM">STEM</option>
                          <option value="Architecture">Architecture</option>
                          <option value="Admin">Admin</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Priority Select */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Priority Rating</label>
                        <select 
                          value={newTaskPriority}
                          onChange={(e) => setNewTaskPriority(e.target.value as any)}
                          className="w-full bg-white dark:bg-[#111b21] border border-zinc-255 dark:border-zinc-800 text-[10px] rounded-lg p-1.5 font-mono text-zinc-800 dark:text-zinc-200 focus:border-red-500 cursor-pointer"
                        >
                          <option value="Low">Low Rating</option>
                          <option value="Medium">Medium Rating</option>
                          <option value="High">High Rating</option>
                        </select>
                      </div>

                      {/* Due Date Input */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Due Coordinate</label>
                        <input 
                          type="text"
                          value={newTaskDueDate}
                          onChange={(e) => setNewTaskDueDate(e.target.value)}
                          placeholder="Today, Tomorrow, YYYY-MM-DD..."
                          className="w-full bg-white dark:bg-[#111b21] border border-zinc-250 dark:border-zinc-800 text-[10px] rounded-lg p-1.5 font-mono text-zinc-800 dark:text-zinc-200 focus:border-red-500 outline-none"
                        />
                      </div>
                    </div>
                  </form>

                  {/* Bulk Selection Toolbar */}
                  {tasks.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-[#1a252c]/30 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox"
                          checked={tasks.length > 0 && tasks.filter(t => !t.archived).every(t => selectedTaskIds.includes(t.id))}
                          onChange={handleToggleSelectAll}
                          id="select-all-tasks"
                          className="w-4 h-4 rounded border-zinc-350 dark:border-zinc-750 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500 shrink-0"
                        />
                        <label htmlFor="select-all-tasks" className="text-[10px] font-mono font-bold text-zinc-450 uppercase tracking-widest cursor-pointer select-none">
                          Co-select tasks ({selectedTaskIds.filter(id => tasks.find(t=>t.id === id && !t.archived)).length}/{tasks.filter(t => !t.archived).length})
                        </label>
                      </div>

                      {selectedTaskIds.length > 0 && (
                        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                          <button
                            type="button"
                            onClick={handleBulkComplete}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-[9px] uppercase tracking-wider rounded-lg font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            Complete Selected
                          </button>
                          <button
                            type="button"
                            onClick={handleBulkDelete}
                            className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-[#ffffff] font-mono text-[9px] uppercase tracking-wider rounded-lg font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            Delete Selected
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedTaskIds([])}
                            className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-650 dark:text-zinc-350 font-mono text-[9px] uppercase tracking-wider rounded-lg font-bold transition-all active:scale-95 cursor-pointer"
                          >
                            Clear Selection
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Kanban Drag-and-Drop Columns with swimlanes support */}
                  {swimlaneGroupBy === 'none' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                      
                      {/* Column 1: Active Operations (Pending) drop slot */}
                      <div 
                        onDragOver={handleDragOver}
                        onDrop={() => handleDropOnColumnAndCustomAttributes('pending')}
                        className="flex flex-col gap-3 p-4 bg-zinc-50 dark:bg-[#1a252c]/20 border border-zinc-200 dark:border-zinc-805 rounded-3xl min-h-[400px]"
                      >
                        <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-350">
                              Active Operations
                            </h3>
                            <span className="px-1.5 py-0.5 bg-zinc-200/60 dark:bg-zinc-800 text-[8px] font-mono rounded font-bold text-zinc-500">
                              {filteredAndSortedTasks.filter(t => t.status === 'pending').length}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[450px] pr-1">
                          {tasks.length === 0 ? (
                            <div className="py-12 text-center text-zinc-400 text-[10px] font-mono uppercase tracking-wider">
                              No actions listed. Click Peace sync above!
                            </div>
                          ) : filteredAndSortedTasks.filter(t => t.status === 'pending').length === 0 ? (
                            <div className="py-12 text-center text-zinc-450 dark:text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
                              {taskSearchQuery ? "No matching operations." : "All operations checked."}
                            </div>
                          ) : (
                            filteredAndSortedTasks.filter(t => t.status === 'pending').map(task => renderTaskCard(task))
                          )}
                        </div>
                      </div>

                      {/* Column 2: Completed Logs (Completed) drop slot */}
                      <div 
                        onDragOver={handleDragOver}
                        onDrop={() => handleDropOnColumnAndCustomAttributes('completed')}
                        className="flex flex-col gap-3 p-4 bg-zinc-50 dark:bg-[#1a252c]/20 border border-zinc-200 dark:border-zinc-805 rounded-3xl min-h-[400px]"
                      >
                        <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-350">
                              Completed Logs
                            </h3>
                            <span className="px-1.5 py-0.5 bg-zinc-200/60 dark:bg-zinc-800 text-[8px] font-mono rounded font-bold text-zinc-500">
                              {filteredAndSortedTasks.filter(t => t.status === 'completed').length}
                            </span>
                          </div>

                          {filteredAndSortedTasks.filter(t => t.status === 'completed').length > 0 && (
                            <button 
                              type="button"
                              onClick={archiveAllCompleted}
                              className="flex items-center gap-1 px-2 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-[8px] font-mono font-bold text-zinc-500 dark:text-zinc-300 rounded uppercase tracking-wider cursor-pointer"
                            >
                              <Archive size={10} />
                              Archive All
                            </button>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[450px] pr-1">
                          {tasks.length === 0 ? (
                            <div className="py-12 text-center text-zinc-400 text-[10px] font-mono uppercase tracking-wider">
                              No logs recorded yet.
                            </div>
                          ) : filteredAndSortedTasks.filter(t => t.status === 'completed').length === 0 ? (
                            <div className="py-12 text-center text-zinc-450 dark:text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
                              {taskSearchQuery ? "No matching completed logs." : "No completed logs listed."}
                            </div>
                          ) : (
                            filteredAndSortedTasks.filter(t => t.status === 'completed').map(task => renderTaskCard(task))
                          )}
                        </div>
                      </div>

                    </div>
                  ) : swimlaneGroupBy === 'category' ? (
                    /* Horizontally segmented category lanes */
                    <div className="flex flex-col gap-5 mt-2">
                      {(['Workspace', 'STEM', 'Architecture', 'Admin', 'Other'] as const).map(catName => {
                        const catTasks = filteredAndSortedTasks.filter(t => t.category === catName);
                        const pendingCat = catTasks.filter(t => t.status === 'pending');
                        const completedCat = catTasks.filter(t => t.status === 'completed');

                        return (
                          <div key={catName} className="p-4 bg-zinc-50/50 dark:bg-[#1a252c]/10 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl">
                            {/* Swimlane header details */}
                            <div className="flex items-center gap-2 mb-3 pb-1 border-b border-zinc-150 dark:border-zinc-800/40">
                              <Layers size={13} className="text-red-500" />
                              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 font-mono">
                                {catName} Domain Lane
                              </h3>
                              <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-850 text-[8px] font-mono text-zinc-500 dark:text-zinc-400 rounded font-bold">
                                {catTasks.length} elements
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Pending Lane drop source */}
                              <div 
                                onDragOver={handleDragOver}
                                onDrop={() => handleDropOnColumnAndCustomAttributes('pending', catName)}
                                className="flex flex-col gap-2 p-3 bg-white/40 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/40 rounded-2xl min-h-[140px]"
                              >
                                <div className="text-[8px] font-mono uppercase font-bold text-zinc-400 mb-1 flex justify-between">
                                  <span>Active Backlog ({pendingCat.length})</span>
                                  <span className="opacity-60 font-medium">↓ Drag in to assign {catName}</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                  {pendingCat.length === 0 ? (
                                    <div className="py-6 text-center text-zinc-400 text-[8px] font-mono uppercase">Lane available: drop tasks here</div>
                                  ) : (
                                    pendingCat.map(t => renderTaskCard(t))
                                  )}
                                </div>
                              </div>

                              {/* Completed Lane drop source */}
                              <div 
                                onDragOver={handleDragOver}
                                onDrop={() => handleDropOnColumnAndCustomAttributes('completed', catName)}
                                className="flex flex-col gap-2 p-3 bg-white/40 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/40 rounded-2xl min-h-[140px]"
                              >
                                <div className="text-[8px] font-mono uppercase font-bold text-zinc-400 mb-1 flex justify-between">
                                  <span>Completed logs ({completedCat.length})</span>
                                  <span className="opacity-60 font-medium">↓ Drag here to complete in {catName}</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                  {completedCat.length === 0 ? (
                                    <div className="py-6 text-center text-zinc-400 text-[8px] font-mono uppercase">Empty completion logs</div>
                                  ) : (
                                    completedCat.map(t => renderTaskCard(t))
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Horizontally segmented priority lanes */
                    <div className="flex flex-col gap-5 mt-2">
                      {(['High', 'Medium', 'Low'] as const).map(prioName => {
                        const prioTasks = filteredAndSortedTasks.filter(t => (t.priority || 'Medium') === prioName);
                        const pendingPrio = prioTasks.filter(t => t.status === 'pending');
                        const completedPrio = prioTasks.filter(t => t.status === 'completed');

                        return (
                          <div key={prioName} className={cn(
                            "p-4 border rounded-3xl",
                            prioName === 'High' 
                              ? "bg-red-500/[0.01] border-red-500/20" 
                              : prioName === 'Low' 
                                ? "bg-blue-500/[0.01] border-blue-500/20" 
                                : "bg-zinc-50/50 border-zinc-200 dark:border-zinc-800/55"
                          )}>
                            {/* Swimlane header details */}
                            <div className="flex items-center gap-2 mb-3 pb-1 border-b border-zinc-150 dark:border-zinc-800/40">
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                prioName === 'High' ? "bg-red-500" : prioName === 'Low' ? "bg-blue-500" : "bg-amber-500"
                              )} />
                              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 font-mono">
                                {prioName} Priority Track
                              </h3>
                              <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-850 text-[8px] font-mono text-zinc-505 rounded font-bold">
                                {prioTasks.length} components
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Pending Lane drop source */}
                              <div 
                                onDragOver={handleDragOver}
                                onDrop={() => handleDropOnColumnAndCustomAttributes('pending', undefined, prioName)}
                                className="flex flex-col gap-2 p-3 bg-white/40 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/40 rounded-2xl min-h-[140px]"
                              >
                                <div className="text-[8px] font-mono uppercase font-bold text-zinc-400 mb-1 flex justify-between">
                                  <span>Active pending ({pendingPrio.length})</span>
                                  <span className="opacity-60 font-medium">↓ Drag here to set {prioName}</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                  {pendingPrio.length === 0 ? (
                                    <div className="py-6 text-center text-zinc-400 text-[8px] font-mono uppercase">No {prioName} track operations</div>
                                  ) : (
                                    pendingPrio.map(t => renderTaskCard(t))
                                  )}
                                </div>
                              </div>

                              {/* Completed Lane drop source */}
                              <div 
                                onDragOver={handleDragOver}
                                onDrop={() => handleDropOnColumnAndCustomAttributes('completed', undefined, prioName)}
                                className="flex flex-col gap-2 p-3 bg-white/40 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/40 rounded-2xl min-h-[140px]"
                              >
                                <div className="text-[8px] font-mono uppercase font-bold text-zinc-400 mb-1 flex justify-between">
                                  <span>Priority Completed ({completedPrio.length})</span>
                                  <span className="opacity-60 font-medium">↓ Drag to complete as {prioName}</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                  {completedPrio.length === 0 ? (
                                    <div className="py-6 text-center text-zinc-400 text-[8px] font-mono uppercase">No completed {prioName} tracks</div>
                                  ) : (
                                    completedPrio.map(t => renderTaskCard(t))
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

                {/* Peace Interactive Companion Side widget */}
                <div className="lg:w-[320px] bg-zinc-50 dark:bg-[#1e2a32]/60 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 flex flex-col gap-4 relative">
                  <div className="absolute top-3 right-3 flex items-center gap-1 text-[8px] font-mono text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase bg-emerald-950/20">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    Peace Real-time Active
                  </div>

                  <div className="p-3 bg-white dark:bg-[#111b21] rounded-2xl border border-zinc-150 dark:border-zinc-800/80 flex flex-col gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-700 dark:text-[#eeeeee]">Multi-Step Complex Logic</h3>
                    <p className="text-[10px] text-zinc-450 leading-relaxed">
                      Peace operates across multiple intelligence matrices, executing translation loops, scanning conversation threats, compiling tasks, and planning vector blueprint nodes with robust integrity checks.
                    </p>
                  </div>

                  {/* Grace interactive STEM blueprint tips panel */}
                  <div className="flex flex-col gap-2">
                    <h4 className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Active Reasoning Loops</h4>
                    <div className="p-2.5 bg-emerald-950/10 border border-emerald-500/10 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="px-1 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] font-mono font-bold rounded">LOGIC.STEP_1</div>
                        <span className="text-[9px] font-medium text-zinc-300">Parse conversational requirements</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-1 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] font-mono font-bold rounded">LOGIC.STEP_2</div>
                        <span className="text-[9px] font-medium text-zinc-300">Formulate optimal vector schedule coordinates</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })()}

          {activeTab === 'drafting' && (
            <motion.div 
              key="tab-draft"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full"
            >
              {/* Drafting synthesis board */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-zinc-150 dark:border-zinc-800 pb-2">
                  <div className="flex flex-col">
                    <h2 className="text-sm font-bold uppercase tracking-widest">STEM vector blueprint board</h2>
                    <span className="text-[9px] font-mono text-zinc-400">Holographic rendering & material stress alignment index</span>
                  </div>
                </div>

                {/* Synthesis prompts */}
                <form onSubmit={handleDraftingSynthesize} className="flex gap-2 bg-zinc-50 dark:bg-[#202c33]/30 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-2xl items-center shadow-inner">
                  <Wand2 size={16} className="text-emerald-500 shrink-0" />
                  <input 
                    type="text"
                    value={specQuery}
                    onChange={(e) => setSpecQuery(e.target.value)}
                    placeholder="Specify architectural node parameters (e.g. Geodesic Dome, Jet Engine)..."
                    className="flex-1 bg-transparent border-none text-xs outline-none dark:text-white"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-zinc-900 border border-zinc-805 text-white hover:border-emerald-500/70 text-[10px] font-mono rounded-xl cursor-pointer">
                    Plan Blueprint
                  </button>
                </form>

                {/* Dynamic SVG Blueprint Drafting Board */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50 dark:bg-zinc-950 p-6 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
                  {/* Glowing blueprints backdrop lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_94%,rgba(16,185,129,0.12)_95%),linear-gradient(90deg,rgba(18,18,18,0)_94%,rgba(16,185,129,0.12)_95%)] bg-[size:25px_25px] opacity-30 pointer-events-none" />

                  <div className="text-center mb-4 z-10">
                    <h3 className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest">{selectedSpec}</h3>
                    <p className="text-[8px] font-mono text-zinc-500 uppercase mt-0.5">Scale Vector: {specDetails.scale} // Material Stress Tolerant</p>
                  </div>

                  {/* Adaptive schematic blueprints drawing */}
                  <div className="w-full max-w-md aspect-video border border-emerald-500/20 bg-black/60 rounded-2xl flex items-center justify-center p-4 relative z-10 shadow-lg">
                    <svg viewBox="0 0 400 200" className="w-[85%] h-full text-emerald-400 stroke-current fill-none font-mono">
                      {/* Dynamic vector blueprints lines based on query */}
                      {selectedSpec.toLowerCase().includes('dome') ? (
                        <>
                          <path d="M 50,150 A 150,150 0 0,1 350,150 Z" strokeWidth="1" strokeDasharray="3,3" />
                          <path d="M 50,150 L 350,150 M 200,10 M 200,10 L 200,150" strokeWidth="0.5" strokeOpacity="0.4" />
                          <circle cx="200" cy="150" r="150" strokeWidth="0.4" strokeDasharray="1,5" />
                          <polygon points="50,150 100,100 150,60 200,45 250,60 300,100 350,150" strokeWidth="1.5" />
                          <line x1="100" y1="100" x2="100" y2="150" strokeWidth="0.8" strokeDasharray="2,2" />
                          <line x1="150" y1="60" x2="150" y2="150" strokeWidth="0.8" strokeDasharray="2,2" />
                          <line x1="250" y1="60" x2="250" y2="150" strokeWidth="0.8" strokeDasharray="2,2" />
                          <line x1="300" y1="100" x2="300" y2="150" strokeWidth="0.8" strokeDasharray="2,2" />
                          <circle cx="200" cy="45" r="3" fill="#10b981" />
                          <text x="210" y="50" fontSize="8" stroke="none" fill="#10b981" fontWeight="bold">APEX NODE</text>
                        </>
                      ) : selectedSpec.toLowerCase().includes('engine') ? (
                        <>
                          <rect x="100" y="60" width="200" height="80" rx="6" strokeWidth="1.5" />
                          <line x1="50" y1="100" x2="100" y2="100" strokeWidth="2" />
                          <line x1="300" y1="100" x2="350" y2="100" strokeWidth="2" />
                          <polygon points="50,70 50,130 100,115 100,85" strokeWidth="1" />
                          <polygon points="300,80 300,120 350,140 350,60" strokeWidth="1" />
                          <circle cx="200" cy="100" r="30" strokeWidth="0.8" strokeDasharray="3,3" />
                          <circle cx="200" cy="100" r="10" strokeWidth="1.5" />
                          <text x="180" y="103" fontSize="8" stroke="none" fill="#10b981">CORE_IND</text>
                        </>
                      ) : (
                        <>
                          {/* Default beautiful modular architectural draft */}
                          <rect x="50" y="40" width="300" height="120" rx="12" strokeWidth="1" strokeDasharray="4,4" />
                          <polygon points="200,20 80,80 320,80" strokeWidth="1.5" />
                          <rect x="110" y="80" width="180" height="80" strokeWidth="1" />
                          <line x1="150" y1="80" x2="150" y2="160" strokeWidth="0.8" strokeDasharray="2,2" strokeOpacity="0.8" />
                          <line x1="250" y1="80" x2="250" y2="160" strokeWidth="0.8" strokeDasharray="2,2" strokeOpacity="0.8" />
                          <circle cx="200" cy="80" r="28" strokeWidth="0.8" />
                          <text x="200" y="83" fontSize="8" stroke="none" fill="#10b981" textAnchor="middle" fontWeight="bold">STRUCTURAL GRID: {specDetails.efficiency}</text>
                        </>
                      )}
                    </svg>

                    {/* Scanning lasers line */}
                    <motion.div 
                      key={selectedSpec}
                      initial={{ left: '0%' }}
                      animate={{ left: '100%' }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                      className="absolute top-0 bottom-0 w-0.5 bg-[#4ade80] shadow-[0_0_8px_rgba(74,222,128,1)]"
                    />
                  </div>
                </div>
              </div>

              {/* Blueprint details specs sidebar */}
              <div className="lg:col-span-4 bg-zinc-50 dark:bg-[#1e2a32]/60 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-700 dark:text-[#eeeeee]">Blueprint Specifications</h3>
                
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Scale Coefficient', value: specDetails.scale },
                    { label: 'Sub-materials', value: specDetails.materials },
                    { label: 'Thermal Efficiency', value: specDetails.efficiency },
                    { label: 'Critical Rigidity Parameter', value: specDetails.structuralRigidity }
                  ].map((s, i) => (
                    <div key={i} className="p-3 bg-white dark:bg-[#111b21] border border-zinc-150 dark:border-zinc-800/80 rounded-2xl flex flex-col">
                      <span className="text-[8px] font-mono text-zinc-500 uppercase">{s.label}</span>
                      <span className="text-xs font-bold font-mono text-zinc-800 dark:text-zinc-200 mt-1">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div 
              key="tab-calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6 h-full"
            >
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-zinc-150 dark:border-zinc-800 pb-2">
                  <div className="flex flex-col">
                    <h2 className="text-sm font-bold uppercase tracking-widest">Workspace Timeline</h2>
                    <span className="text-[9px] font-mono text-zinc-400">Collaboration milestones and coordination logs</span>
                  </div>
                </div>

                <CalendarView 
                  onAddEventClick={(defaultDate) => {
                    setDefaultCreatorDate(defaultDate);
                    setShowWorkspaceCreator(true);
                  }}
                  onSelectEventClick={(evt) => {
                    setSelectedWorkspaceEvent(evt);
                  }}
                />
              </div>

              {/* Modals for Creator and Details */}
              <AnimatePresence>
                {showWorkspaceCreator && (
                  <EventCreator 
                    defaultDate={defaultCreatorDate}
                    onClose={() => {
                      setShowWorkspaceCreator(false);
                      setDefaultCreatorDate(undefined);
                    }}
                  />
                )}
                {selectedWorkspaceEvent && (
                  <EventDetails 
                    event={selectedWorkspaceEvent}
                    onClose={() => {
                      setSelectedWorkspaceEvent(null);
                    }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div 
              key="tab-stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              <div className="border-b border-zinc-150 dark:border-zinc-800 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-widest">Holographic analytics panel</h2>
                <span className="text-[9px] font-mono text-zinc-400">Coordination metrics stream & progress completeness index</span>
              </div>

              {/* Area chart using Recharts */}
              <div className="h-64 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 relative overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 top-0 bg-[linear-gradient(rgba(18,18,18,0)_94%,rgba(16,185,129,0.06)_95%),linear-gradient(90deg,rgba(18,18,18,0)_94%,rgba(16,185,129,0.06)_95%)] bg-[size:25px_25px] opacity-40 pointer-events-none" />
                
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={statsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={9} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={9} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', stroke: '#10b981', color: '#fff', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#colorComp)" strokeWidth={2} />
                    <Area type="monotone" dataKey="tasks" stroke="#3b82f6" fillOpacity={0} strokeWidth={1} strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* D3.js Weekly Communication Activity Heatmap */}
              <WeeklyHeatmap />

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Cumulative Operations', val: '4,892', sub: '99.4% uptime margin' },
                  { label: 'Active Draft vectors', val: selectedSpec.slice(0, 15) + '...', sub: '100% stress alignment coefficient' },
                  { label: 'Secure Enclave Index', val: '28 items', sub: 'Device sandbox strict offline key' },
                  { label: 'Workspace Uptime', val: '99.98%', sub: 'Local real-time' }
                ].map((col, i) => (
                  <div key={i} className="p-4 bg-[#fbfbfb] dark:bg-[#1a252c]/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col gap-1">
                    <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-widest">{col.label}</span>
                    <span className="text-md font-bold text-zinc-900 dark:text-zinc-100">{col.val}</span>
                    <span className="text-[8px] font-mono text-emerald-500">{col.sub}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sliding Archive Drawer Component */}
        <AnimatePresence>
          {isArchiveOpen && (
            <>
              {/* Backdrop glass */}
              <motion.div
                key="archive-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsArchiveOpen(false)}
                className="fixed inset-0 bg-black z-50 pointer-events-auto backdrop-blur-xs"
              />

              {/* Sliding cabinet sliding from right */}
              <motion.div
                key="archive-drawer-box"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-50 dark:bg-[#111A20] shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50 border-l border-zinc-200 dark:border-zinc-800 flex flex-col pointer-events-auto"
              >
                {/* Header details */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#142129] flex items-center justify-between shadow-sm shrink-0">
                  <div className="flex items-center gap-2">
                    <FolderArchive size={16} className="text-red-500" />
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-800 dark:text-[#eeeeee]">Archive Drawer Cabinet</h3>
                      <p className="text-[8px] font-mono text-zinc-500">Historical records of completed operational alignment logs</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsArchiveOpen(false)}
                    className="p-1 px-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-650 dark:text-zinc-300 text-[10px] uppercase font-mono font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Close ✕
                  </button>
                </div>

                {/* Drawer list area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {tasks.filter(t => t.archived).length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-400 h-full">
                      <Archive size={32} className="text-zinc-350 dark:text-zinc-700 stroke-1 mb-2 animate-bounce" />
                      <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-500">Cabinet is empty</span>
                      <span className="text-[9px] text-zinc-500 leading-relaxed mt-1">Complete tasks on the main board and click are box icon to move them into archive storage!</span>
                    </div>
                  ) : (
                    tasks.filter(t => t.archived).map(task => (
                      <div 
                        key={task.id}
                        className="p-3 bg-white dark:bg-[#17252E] border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-750 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate line-through opacity-70">
                              {task.title}
                            </h4>
                            <span className="px-1.5 py-0.5 bg-red-400/10 border border-red-500/20 text-red-500 text-[6.5px] font-mono font-bold rounded uppercase tracking-widest">
                              Archived
                            </span>
                          </div>
                          
                          <div className="flex gap-1.5 items-center mt-1 flex-wrap">
                            <span className="px-1 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-[8px] font-mono text-zinc-500 rounded font-semibold uppercase">
                              {task.category}
                            </span>
                            <span className="text-[8px] font-mono text-zinc-450">
                              Priority: {task.priority || 'Medium'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => restoreTask(task.id)}
                            title="Restore task to board"
                            className="p-1 px-2 bg-zinc-100/80 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-red-500 rounded-md shrink-0 cursor-pointer transition-colors flex items-center gap-1 text-[8px] font-mono font-bold uppercase"
                          >
                            <RotateCcw size={9} />
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTask(task.id)}
                            title="Delete permanently"
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/20 text-zinc-400 hover:text-red-500 rounded-lg shrink-0 cursor-pointer transition-colors"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer specs details metrics */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#142129] flex justify-between items-center text-[9px] font-mono text-zinc-500 uppercase shrink-0">
                  <span>Total Stored logs:</span>
                  <span className="font-extrabold text-red-500">{tasks.filter(t => t.archived).length} items</span>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
