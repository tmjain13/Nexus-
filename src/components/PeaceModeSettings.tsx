import React, { useState } from 'react';
import { motion } from 'motion/react';
import { usePeaceMode } from '../hooks/usePeaceMode';
import { DailyReport } from './DailyReport';
import { Sparkles, Calendar, MessageSquare, Paintbrush, Heart, Shield, Lock } from 'lucide-react';

export function PeaceModeSettings() {
  const { settings, updateSettings, isEnabled, disable, enable } = usePeaceMode();
  const [showReport, setShowReport] = useState(false);

  const handleToggleActive = () => {
    if (isEnabled) {
      disable();
    } else {
      enable();
    }
  };

  const handleZenThemeSelect = (theme: string) => {
    updateSettings({ zenTheme: theme });
  };

  const handleAutoReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateSettings({ autoReplyText: e.target.value });
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ messageLimit: Number(e.target.value) });
  };

  const handleScheduleToggle = () => {
    const currentSchedule = settings.schedule || { enabled: false, daily: { start: "22:00", end: "07:00" } };
    updateSettings({
      schedule: {
        ...currentSchedule,
        enabled: !currentSchedule.enabled
      }
    });
  };

  const handleScheduleTimeChange = (type: 'daily' | 'weekend', field: 'start' | 'end', value: string) => {
    const currentSchedule = settings.schedule || { enabled: false, daily: { start: "22:00", end: "07:00" } };
    if (type === 'daily') {
      updateSettings({
        schedule: {
          ...currentSchedule,
          daily: {
            ...currentSchedule.daily,
            [field]: value
          }
        }
      });
    } else {
      updateSettings({
        schedule: {
          ...currentSchedule,
          weekend: {
            start: currentSchedule.weekend?.start || "22:00",
            end: currentSchedule.weekend?.end || "07:00",
            [field]: value
          }
        }
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto p-1 text-zinc-100 font-sans">
      {/* Hero Header Card */}
      <div className="bg-gradient-to-r from-amber-950/20 via-zinc-900/60 to-amber-950/20 border border-amber-500/15 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl flex items-center justify-center transition-all ${isEnabled ? 'bg-amber-500/10 text-amber-400 animate-pulse' : 'bg-zinc-800 text-zinc-500'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 3c-1.5 2-4 3.5-7 3.5m7-3.5c1.5 2 4 3.5 7 3.5M12 21c-1.5-2-4-3.5-7-3.5m7 3.5c1.5-2 4-3.5 7-3.5M4 10.5c2 1 4 .5 5-1.5m11 1.5c-2 1-4 .5-5-1.5" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-zinc-200">Peace Mode</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Quiet non-urgent messages. Prioritize your focus.</p>
            </div>
          </div>

          <button
            onClick={handleToggleActive}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isEnabled ? 'bg-amber-500' : 'bg-zinc-800'}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Close Friends settings inside Peace Mode */}
      <div className="bg-zinc-900/20 border border-zinc-850 rounded-3xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Heart size={16} className="text-emerald-500" />
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-300">Close Friends Enclave</span>
          </div>
          <button
            onClick={() => updateSettings({ onlyCloseFriendsMessage: !settings.onlyCloseFriendsMessage })}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.onlyCloseFriendsMessage ? 'bg-emerald-500' : 'bg-zinc-800'}`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${settings.onlyCloseFriendsMessage ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
        <p className="text-xs text-zinc-500 -mt-1 font-mono">
          When enabled, only contacts in your Close Friends list can initiate or send messages to you during Peace Mode. Other messages are held or receive an auto-reply.
        </p>
      </div>

      {/* Auto Reply settings */}
      <div className="bg-zinc-900/20 border border-zinc-850 rounded-3xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <MessageSquare size={16} className="text-amber-500/80" />
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-300">Auto-Reply Status</span>
        </div>
        <p className="text-xs text-zinc-500 -mt-1 font-mono">
          Sent automatically when non-starred contacts message you during Peace Mode. Max once per conversation.
        </p>
        <textarea
          value={settings.autoReplyText}
          onChange={handleAutoReplyChange}
          rows={3}
          className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-800 focus:border-amber-500/50 rounded-2xl p-4 text-xs font-mono text-zinc-200 focus:outline-none transition-colors leading-relaxed"
          placeholder="Type your auto reply message..."
        />
      </div>

      {/* Theme Picker */}
      <div className="bg-zinc-900/20 border border-zinc-850 rounded-3xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <Paintbrush size={16} className="text-amber-500/80" />
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-300">Zen UI Background</span>
        </div>
        <p className="text-xs text-zinc-500 -mt-1 font-mono">
          Custom calming gradient active inside chat rooms during Peace Mode.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'blue', name: 'Calming Sky', bg: 'bg-sky-950 border-sky-700/40 text-sky-300' },
            { id: 'green', name: 'Healing Forest', bg: 'bg-emerald-950 border-emerald-700/40 text-emerald-300' },
            { id: 'purple', name: 'Ethereal Dusk', bg: 'bg-purple-950 border-purple-700/40 text-purple-300' }
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleZenThemeSelect(theme.id)}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer hover:scale-102 ${theme.bg} ${
                settings.zenTheme === theme.id ? 'ring-2 ring-amber-500 border-transparent shadow-lg' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-amber-400/20 flex items-center justify-center border border-amber-400/30">
                {settings.zenTheme === theme.id && <div className="w-2 h-2 rounded-full bg-amber-400" />}
              </div>
              <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-zinc-200">{theme.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message Limits settings */}
      <div className="bg-zinc-900/20 border border-zinc-850 rounded-3xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <Lock size={16} className="text-amber-500/80" />
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-300">Hourly Message Limit</span>
        </div>
        <p className="text-xs text-zinc-500 -mt-1 font-mono">
          Limit outgoing messages to prevent digital fatigue. Reaching limit locks input and activates the Breathing sanctuary.
        </p>

        <div className="flex items-center gap-4">
          <input
            type="number"
            min={5}
            max={100}
            value={settings.messageLimit || 20}
            onChange={handleLimitChange}
            className="w-24 bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2 text-xs font-mono font-bold text-center text-amber-400 focus:outline-none"
          />
          <span className="text-xs text-zinc-400 font-mono">messages per hour</span>
        </div>
      </div>

      {/* Schedule settings */}
      <div className="bg-zinc-900/20 border border-zinc-850 rounded-3xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar size={16} className="text-amber-500/80" />
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-300">Scheduled Trigger</span>
          </div>
          <button
            onClick={handleScheduleToggle}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.schedule?.enabled ? 'bg-amber-500' : 'bg-zinc-800'}`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${settings.schedule?.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
        <p className="text-xs text-zinc-500 -mt-1 font-mono">
          Automatically enable Peace Mode on a recurring basis.
        </p>

        {settings.schedule?.enabled && (
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-4 flex flex-col gap-3">
              <span className="text-[9px] font-bold font-mono uppercase tracking-widest text-zinc-400">Daily (Mon - Fri)</span>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={settings.schedule.daily.start}
                  onChange={(e) => handleScheduleTimeChange('daily', 'start', e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 rounded-xl px-2 py-1 text-xs font-mono text-zinc-300"
                />
                <span className="text-xs text-zinc-500 font-mono">to</span>
                <input
                  type="time"
                  value={settings.schedule.daily.end}
                  onChange={(e) => handleScheduleTimeChange('daily', 'end', e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 rounded-xl px-2 py-1 text-xs font-mono text-zinc-300"
                />
              </div>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-4 flex flex-col gap-3">
              <span className="text-[9px] font-bold font-mono uppercase tracking-widest text-zinc-400">Weekend (Sat - Sun)</span>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={settings.schedule.weekend?.start || "22:00"}
                  onChange={(e) => handleScheduleTimeChange('weekend', 'start', e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 rounded-xl px-2 py-1 text-xs font-mono text-zinc-300"
                />
                <span className="text-xs text-zinc-500 font-mono">to</span>
                <input
                  type="time"
                  value={settings.schedule.weekend?.end || "07:00"}
                  onChange={(e) => handleScheduleTimeChange('weekend', 'end', e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 rounded-xl px-2 py-1 text-xs font-mono text-zinc-300"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wellness Report drawer trigger */}
      <div className="bg-zinc-900/20 border border-zinc-850 rounded-3xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Heart size={16} className="text-amber-500/80" />
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-300">Wellness Analytics</span>
          </div>
          <button
            onClick={() => setShowReport(!showReport)}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold font-mono uppercase tracking-widest rounded-xl transition-colors"
          >
            {showReport ? 'Hide report' : 'Show report'}
          </button>
        </div>

        {showReport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2"
          >
            <DailyReport />
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default PeaceModeSettings;
