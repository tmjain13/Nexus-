import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookTemplate, Sparkles, Plus, Trash2, Check, X } from 'lucide-react';

export interface Template {
  id: string;
  title: string;
  content: string;
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'sec-alert',
    title: '🚨 Security Alert',
    content: 'SECURITY NOTICE: We have detected a suspicious login attempt on our communication subnet. Please review your biometric keys and active sessions immediately. Contact command if you notice anomalies.'
  },
  {
    id: 'op-update',
    title: '📡 Subsystem Status',
    content: 'OPERATIONAL BULLETIN: Subsystem updates are being rolled out. Service may experience brief 5-second heartbeats. All encrypted storage remains locked and safe.'
  },
  {
    id: 'all-clear',
    title: '🟢 Operations All-Clear',
    content: 'ALL-CLEAR: The system maintenance window has closed successfully. Subnetwork routing is optimized and fully encrypted tunnels are active.'
  }
];

interface BroadcastTemplatesProps {
  onSelect: (content: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function BroadcastTemplates({ onSelect, isOpen, onClose }: BroadcastTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('enclave_broadcast_templates');
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading custom templates:", e);
      }
    }
  }, []);

  const saveTemplates = (updatedList: Template[]) => {
    setTemplates(updatedList);
    localStorage.setItem('enclave_broadcast_templates', JSON.stringify(updatedList));
  };

  const handleCreate = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const item: Template = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      content: newContent.trim()
    };
    const updated = [...templates, item];
    saveTemplates(updated);
    setNewTitle('');
    setNewContent('');
    setIsCreating(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = templates.filter(t => t.id !== id);
    saveTemplates(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/30">
          <div className="flex items-center gap-2">
            <BookTemplate size={16} className="text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-100">Broadcast Templates</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-zinc-900 text-zinc-400 rounded-lg border-0"
            style={{ border: 'none', background: 'none' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {isCreating ? (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-3.5"
            >
              <h4 className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest">New Custom Template</h4>
              <div className="space-y-3">
                <input 
                  type="text"
                  placeholder="Template Title (e.g., Weekly Sync)"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs outline-none text-zinc-100 font-mono placeholder-zinc-700"
                />
                <textarea 
                  placeholder="Type broadcast payload..."
                  rows={4}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs outline-none text-zinc-100 placeholder-zinc-700 leading-relaxed font-sans"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-[9px] font-mono uppercase font-bold text-zinc-500 hover:text-zinc-300 border-0 bg-none"
                  style={{ border: 'none', background: 'none' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreate}
                  className="px-4 py-1.5 bg-amber-500 text-black rounded-lg text-[9px] font-mono font-black uppercase tracking-wider border-0"
                  style={{ border: 'none' }}
                >
                  Save Template
                </button>
              </div>
            </motion.div>
          ) : (
            <button 
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 border border-dashed border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors"
              style={{ background: 'none' }}
            >
              <Plus size={12} /> Add Custom Template
            </button>
          )}

          <div className="space-y-2.5">
            {templates.map(t => (
              <div 
                key={t.id}
                onClick={() => {
                  onSelect(t.content);
                  onClose();
                }}
                className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-2xl hover:bg-zinc-900/40 hover:border-zinc-800 transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide font-mono">
                    {t.title}
                  </span>
                  
                  {/* Delete custom template only */}
                  {t.id.startsWith('custom-') && (
                    <button 
                      onClick={(e) => handleDelete(t.id, e)}
                      className="p-1 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 rounded transition-opacity border-0"
                      style={{ border: 'none', background: 'none' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2 font-sans">
                  {t.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
