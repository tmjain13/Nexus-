import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Bell, Shield, Settings } from 'lucide-react';
import { CalendarConnect } from '../components/CalendarConnect';
import { CalendarReminders } from '../components/CalendarReminders';
import { motion } from 'motion/react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'calendar' | 'reminders'>('calendar');

  return (
    <div className="flex-1 overflow-y-auto h-full bg-[#111b21] text-[#e9edef] p-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 bg-[#202c33] p-4 rounded-3xl border border-slate-800">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1.5 hover:bg-slate-850 text-[#aebac1] hover:text-white rounded-full transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
            <h1 className="text-sm font-mono font-bold tracking-widest uppercase">System Settings</h1>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 bg-slate-950/40 p-1 rounded-2xl border border-slate-850">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition ${activeTab === 'calendar' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            Calendar Accounts
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition ${activeTab === 'reminders' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
          >
            Alerts & Reminders
          </button>
        </div>

        {/* Dynamic Panel */}
        <div className="animate-in fade-in duration-300">
          {activeTab === 'calendar' && (
            <CalendarConnect />
          )}
          {activeTab === 'reminders' && (
            <CalendarReminders />
          )}
        </div>
      </div>
    </div>
  );
}
export { SettingsPage as Settings };
