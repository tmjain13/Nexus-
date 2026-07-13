import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { getAIResponse } from '../services/aiService';
import { AIContext } from './useAIContext';

export interface AIAction {
  type: 'create_event' | 'send_message' | 'set_reminder' | 'enable_peace_mode';
  params: any;
  requiresConfirm: boolean;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: AIAction[];
  sources?: string[];
}

export interface AIConversation {
  id: string;
  messages: AIMessage[];
  createdAt: string;
  context?: AIContext;
}

export function useAIAssistant() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [preferences, setPreferences] = useState<{ preferMorning?: boolean; privacyMode?: boolean; customMemory?: string }>({});
  const [loading, setLoading] = useState(false);

  // Load preferences and chat history on init
  useEffect(() => {
    if (!user) return;

    // Load history from localStorage for offline resilience
    const cached = localStorage.getItem(`nexus_ai_conv_${user.uid}`);
    if (cached) {
      setConversations(JSON.parse(cached));
    } else {
      // Default welcome conversation
      const welcomeConv: AIConversation = {
        id: 'default',
        messages: [
          {
            id: 'welcome',
            role: 'assistant',
            content: "Hello! I am Nexus AI, your personal data assistant. I can summarize your unread messages, review your calendar events, manage your tasks, or check your upcoming trips. How can I assist you today?",
            sources: ['Nexus Core'],
          }
        ],
        createdAt: new Date().toISOString()
      };
      setConversations([welcomeConv]);
      localStorage.setItem(`nexus_ai_conv_${user.uid}`, JSON.stringify([welcomeConv]));
    }

    // Load AI preferences from Firestore / fallback local
    const loadPrefs = async () => {
      try {
        const prefRef = doc(db, 'users', user.uid, 'aiPreferences', 'settings');
        const snap = await getDoc(prefRef);
        if (snap.exists()) {
          setPreferences(snap.data());
        } else {
          const defaultPrefs = { preferMorning: true, privacyMode: false, customMemory: 'Prefers concise updates' };
          setPreferences(defaultPrefs);
          await setDoc(prefRef, defaultPrefs);
        }
      } catch (err) {
        console.warn('Failed to load AI preferences from firestore, using local:', err);
        const cachedPrefs = localStorage.getItem(`nexus_ai_prefs_${user.uid}`);
        if (cachedPrefs) setPreferences(JSON.parse(cachedPrefs));
      }
    };
    loadPrefs();
  }, [user]);

  // Save conversation helper
  const saveConversations = (updated: AIConversation[]) => {
    setConversations(updated);
    if (user) {
      localStorage.setItem(`nexus_ai_conv_${user.uid}`, JSON.stringify(updated));
    }
  };

  const updatePreferences = async (newPrefs: any) => {
    if (!user) return;
    const merged = { ...preferences, ...newPrefs };
    setPreferences(merged);
    localStorage.setItem(`nexus_ai_prefs_${user.uid}`, JSON.stringify(merged));
    try {
      const prefRef = doc(db, 'users', user.uid, 'aiPreferences', 'settings');
      await setDoc(prefRef, merged, { merge: true });
    } catch (e) {
      console.warn('Offline preference update queued:', e);
    }
  };

  const clearHistory = () => {
    if (!user) return;
    const welcomeConv: AIConversation = {
      id: 'default',
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: "Chat history cleared. I'm ready to assist you again. What is on your mind?",
          sources: ['Nexus Core'],
        }
      ],
      createdAt: new Date().toISOString()
    };
    saveConversations([welcomeConv]);
  };

  const sendMessage = async (prompt: string, aiContext: AIContext) => {
    if (!user) return;

    const userMsg: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: prompt,
    };

    // Append user message to the conversation
    const currentConv = conversations[0] || { id: 'default', messages: [], createdAt: new Date().toISOString() };
    const updatedMessages = [...currentConv.messages, userMsg];
    saveConversations([{ ...currentConv, messages: updatedMessages, context: aiContext }]);

    setLoading(true);

    // Check online status
    if (!navigator.onLine) {
      setTimeout(() => {
        const offlineMsg: AIMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: "I'm currently offline, but here's what I remember: your offline tasks list still has " + (aiContext.pendingTasks || 0) + " items left. Please reconnect to access real-time summaries of emails and calendar events.",
          sources: ['Local Memory Cache']
        };
        saveConversations([{ ...currentConv, messages: [...updatedMessages, offlineMsg] }]);
        setLoading(false);
      }, 800);
      return;
    }

    try {
      // Build rich system instruction prompt with full user context
      const contextSummary = `
You are Nexus AI, a highly advanced personal virtual assistant.
Here is the user's current private workspace and communication data. ONLY reference this data if relevant to the user's query:
- Calendar Events (next 7 days): ${JSON.stringify(aiContext.calendarEvents || [])}
- Unread emails count: ${aiContext.unreadMessages || 0}
- Pending tasks count: ${aiContext.pendingTasks || 0}
- Recent Chats / Messages: ${JSON.stringify(aiContext.recentChats || [])}
- Upcoming Trips & Passes: ${JSON.stringify(aiContext.upcomingTrips || [])}
- AI User Preferences: ${JSON.stringify(preferences)}

Rules:
1. Be concise, highly professional, and direct.
2. If the user asks a question about their day, summarize their calendar events, unread messages, and tasks cleanly.
3. You can perform actions! If the user wants to:
   - "set a reminder" or "create a meeting" -> output a special tag: [ACTION:create_event:{"title":"...","dueDate":"...","time":"..."}]
   - "send a message" -> output a special tag: [ACTION:send_message:{"recipient":"...","text":"..."}]
   - "create a task" -> output a special tag: [ACTION:set_reminder:{"title":"...","category":"Workspace"}]
   - "enable peace mode" -> output a special tag: [ACTION:enable_peace_mode:{"hours":2}]
4. Specify sources used by appending [SOURCES: Calendar, Email, Workspace, Chats] at the very end of your response as appropriate.
`;

      const historyForAI = currentConv.messages.slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      }));

      const aiReply = await getAIResponse(`${contextSummary}\n\nUser: ${prompt}`, historyForAI, "nexus-assistant");

      // Parse Action Tags and Sources
      let finalContent = aiReply || "I am processing your request.";
      const actionMatches = finalContent.match(/\[ACTION:(\w+):([^\]]+)\]/);
      let actions: AIAction[] = [];
      
      if (actionMatches) {
        try {
          const type = actionMatches[1] as any;
          const params = JSON.parse(actionMatches[2]);
          actions.push({
            type,
            params,
            requiresConfirm: true
          });
          // Clean the tag from user-facing text
          finalContent = finalContent.replace(/\[ACTION:[^\]]+\]/g, '').trim();
        } catch (e) {
          console.error("Failed to parse action params:", e);
        }
      }

      // Parse sources
      const sourceMatches = finalContent.match(/\[SOURCES:\s*([^\]]+)\]/);
      let sources: string[] = ['Nexus Intelligence'];
      if (sourceMatches) {
        sources = sourceMatches[1].split(',').map(s => s.trim());
        finalContent = finalContent.replace(/\[SOURCES:[^\]]+\]/g, '').trim();
      } else {
        // Infer sources based on keywords
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('calendar') || lowerPrompt.includes('schedule') || lowerPrompt.includes('meeting') || lowerPrompt.includes('day')) {
          sources.push('Calendar');
        }
        if (lowerPrompt.includes('email') || lowerPrompt.includes('unread') || lowerPrompt.includes('mail')) {
          sources.push('Emails');
        }
        if (lowerPrompt.includes('task') || lowerPrompt.includes('todo') || lowerPrompt.includes('workspace')) {
          sources.push('Workspace Board');
        }
        if (lowerPrompt.includes('chat') || lowerPrompt.includes('message') || lowerPrompt.includes('sarah') || lowerPrompt.includes('james')) {
          sources.push('Recent Chats');
        }
        if (lowerPrompt.includes('trip') || lowerPrompt.includes('flight') || lowerPrompt.includes('boarding') || lowerPrompt.includes('pass')) {
          sources.push('Secure Wallet Passes');
        }
      }

      const assistantMsg: AIMessage = {
        id: `msg-${Date.now() + 2}`,
        role: 'assistant',
        content: finalContent,
        actions,
        sources
      };

      saveConversations([{ ...currentConv, messages: [...updatedMessages, assistantMsg] }]);
    } catch (err) {
      console.error("AI Assistant send failed:", err);
      const errorMsg: AIMessage = {
        id: `msg-${Date.now() + 3}`,
        role: 'assistant',
        content: "I encountered an error accessing my neural pathways. Please try again.",
        sources: ['Nexus Diagnostics']
      };
      saveConversations([{ ...currentConv, messages: [...updatedMessages, errorMsg] }]);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (action: AIAction) => {
    if (!user) return;
    try {
      if (action.type === 'create_event') {
        const title = action.params.title || 'Nexus AI Reminder';
        // Add to calendar events
        const eventsRef = collection(db, 'users', user.uid, 'events');
        const { addDoc } = await import('firebase/firestore');
        const start = new Date();
        if (action.params.time) {
          const [h, m] = action.params.time.split(':');
          start.setHours(parseInt(h || '12'), parseInt(m || '0'));
        }
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        await addDoc(eventsRef, {
          title,
          description: 'Created by Nexus AI Assistant',
          start: start.toISOString(),
          end: end.toISOString(),
          allDay: false,
          attendees: [],
          reminders: [15],
          calendarId: 'primary',
          color: '#f59e0b'
        });
      } else if (action.type === 'set_reminder') {
        // Create task in Workspace (localStorage)
        const storedTasks = localStorage.getItem(`enclave_tasks_${user.uid}`);
        let tasksList = storedTasks ? JSON.parse(storedTasks) : [];
        const newTask = {
          id: `task-${Date.now()}`,
          title: action.params.title || 'New Task',
          category: action.params.category || 'Workspace',
          status: 'pending',
          extractedByPeace: true,
          dueDate: action.params.dueDate || 'Today',
          priority: action.params.priority || 'Medium'
        };
        tasksList.unshift(newTask);
        localStorage.setItem(`enclave_tasks_${user.uid}`, JSON.stringify(tasksList));
        // Dispatch task created event to update the workspace page if open
        window.dispatchEvent(new CustomEvent('nexus-task-created'));
      } else if (action.type === 'enable_peace_mode') {
        // Set peace mode
        const hours = action.params.hours || 2;
        const endTime = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        localStorage.setItem(`peace_mode_until_${user.uid}`, endTime);
        window.dispatchEvent(new CustomEvent('nexus-peace-mode-updated', { detail: { enabled: true } }));
      } else if (action.type === 'send_message') {
        // Send actual chat message if James or specific recipient exists, or simulate confirmation
        console.log("Draft message sent successfully:", action.params);
      }
    } catch (e) {
      console.error("Failed to execute AI action:", e);
    }
  };

  return {
    conversations,
    preferences,
    updatePreferences,
    sendMessage,
    executeAction,
    clearHistory,
    loading
  };
}
