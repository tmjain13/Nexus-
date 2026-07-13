import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trash2, Settings, Shield, ShieldAlert, Check, RefreshCw } from 'lucide-react';
import { useAIAssistant } from '../hooks/useAIAssistant';
import { useAIContext } from '../hooks/useAIContext';
import { AIMessageBubble } from './AIMessageBubble';
import AIQuickActions from './AIQuickActions';
import AIProactiveCard from './AIProactiveCard';
import AIAssistantInput from './AIAssistantInput';

export function NexusAIChat() {
  const { 
    conversations, 
    preferences, 
    updatePreferences, 
    sendMessage, 
    executeAction, 
    clearHistory, 
    loading: assistantLoading 
  } = useAIAssistant();

  const { context: aiContext, loading: contextLoading, refreshContext } = useAIContext();
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations[0];
  const messages = activeConversation?.messages || [];
  
  // Get last AI response to feed text-to-speech
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  const lastAIResponse = assistantMessages[assistantMessages.length - 1]?.content;

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, assistantLoading]);

  const handleSend = (text: string) => {
    sendMessage(text, aiContext);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#060814] overflow-hidden relative select-none" id="nexus-ai-workspace-panel">
      {/* 1. Header Section */}
      <div className="h-16 border-b border-zinc-900 bg-zinc-950/80 px-4 flex items-center justify-between shrink-0 relative z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-zinc-100 tracking-tight leading-none">Nexus AI</h2>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-amber-500/15 text-[8px] font-bold font-mono text-amber-500 uppercase tracking-widest">
                ASSISTANT
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
              Context-aware private database assistant
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2">
          {/* Refresh context */}
          <button
            onClick={refreshContext}
            title="Sync private context"
            className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 flex items-center justify-center text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={contextLoading ? 'animate-spin' : ''} />
          </button>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
              showSettings 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-amber-500'
            }`}
          >
            <Settings size={14} />
          </button>

          {/* Delete History */}
          <button
            onClick={clearHistory}
            title="Clear AI memory"
            className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-red-500/30 flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Settings Modal overlay inside panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="absolute left-4 right-4 top-18 bg-zinc-950 border border-zinc-900 p-4 rounded-2xl shadow-2xl shadow-black z-50 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <span className="text-xs font-bold text-zinc-300 font-mono tracking-wider uppercase">AI Cognitive Preferences</span>
              <span className="text-[10px] text-amber-500 font-bold">Firestore Sync</span>
            </div>

            <div className="flex flex-col gap-3.5">
              {/* Meeting Prefs toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-zinc-300">Prioritize Morning Meetings</h5>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Tell assistant to auto-suggest AM slots for calendar events.</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!preferences.preferMorning}
                  onChange={(e) => updatePreferences({ preferMorning: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-amber-500 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Privacy Toggles */}
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-zinc-300">Secure Privacy Sandbox</h5>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Encrypt preferences & purge context parameters from query logs.</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!preferences.privacyMode}
                  onChange={(e) => updatePreferences({ privacyMode: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-amber-500 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Memory custom override text */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold text-zinc-400">Custom System Prompt Memory Override</span>
                <input
                  type="text"
                  placeholder="e.g. Always give short bullet points"
                  value={preferences.customMemory || ''}
                  onChange={(e) => updatePreferences({ customMemory: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/30"
                />
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 uppercase tracking-wider cursor-pointer"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Messages & Activity list */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-4 flex flex-col gap-2 relative">
        {/* Proactive smart notifications at the very top */}
        <AIProactiveCard onTriggerPrompt={handleSend} />

        {/* Message elements */}
        {messages.map((msg) => (
          <AIMessageBubble
            key={msg.id}
            message={msg}
            onExecuteAction={executeAction}
          />
        ))}

        {/* AI Thinking pulsing loader */}
        {assistantLoading && (
          <div className="flex gap-3 py-3 px-4 justify-start items-center" id="ai-typing-loader">
            <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-amber-500 shadow-md">
              <Sparkles size={16} className="animate-pulse text-amber-500" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm p-4 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick suggestions bar above keyboard */}
      <AIQuickActions onSelectAction={handleSend} />

      {/* 4. Text and Voice Input Controllers */}
      <AIAssistantInput
        onSend={handleSend}
        isLoading={assistantLoading}
        lastAIResponse={lastAIResponse}
      />
    </div>
  );
}

export default NexusAIChat;
