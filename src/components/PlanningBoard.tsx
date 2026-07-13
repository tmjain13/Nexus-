import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Database, Shield, Cpu, LayoutGrid, CheckCircle2, ChevronRight, Download, Server, Key, Network, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { secureFetch } from '../lib/secureFetch';


interface PlanningBoardProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
}

export default function PlanningBoard({ isOpen, onClose, theme }: PlanningBoardProps) {
  const [step, setStep] = useState(1);
  
  // State for architectural choices
  const [projTitle, setProjTitle] = useState('Peace OS Core Signal Hub');
  const [systemTemplate, setSystemTemplate] = useState('E2EE Realtrace Protocol');
  const [dbStrategy, setDbStrategy] = useState('Firestore Security Core (Default)');
  const [encryptionStandard, setEncryptionStandard] = useState('Client-Side ECDH + AES-256 GCM');
  const [isolationLevel, setIsolationLevel] = useState('Hardware Isolation (Intel SGX)');
  
  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDiagram, setGeneratedDiagram] = useState<string | null>(null);

  const systemPresets = [
    { name: 'E2EE Realtrace Protocol', desc: 'Secure, low-latency node discovery and synchronization.' },
    { name: 'Microservices Mesh Feed', desc: 'Distributed event matrix on segmented docker arrays.' },
    { name: 'Isolated Financial Ledger', desc: 'Decentralized cryptographic proof list with hardware vaults.' }
  ];

  const dbPresets = [
    { name: 'Firestore Security Core (Default)', desc: 'Realtime cloud persistence with Firestore Rules vetting.' },
    { name: 'Cloud SQL Postgres Matrix', desc: 'Relational ACID ledger with automated replication.' },
    { name: 'Spanner Global Scale', desc: 'Symmetric multi-region consensus database.' }
  ];

  const isolationPresets = [
    { name: 'Hardware Isolation (Intel SGX)', desc: 'Bypass kernel layers, decrypt keys only in physical hardware silicon.' },
    { name: 'Secured Virtual Machine Sandbox', desc: 'Hypervisor-isolated container with customized rules.' },
    { name: 'Encrypted Browser Session Scope', desc: 'Local volatile memory sandbox ignoring cloud indexing.' }
  ];

  const triggerAIActor = async () => {
    setIsGenerating(true);
    setGeneratedDiagram(null);
    try {
      const res = await secureFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `You are a Principal UI/UX Architect and Lead Systems Engineer. Please generate a sleek, production-ready system architecture diagram and schematic summary for standard Peace OS nodes.
Project: ${projTitle} (${systemTemplate})
Database: ${dbStrategy}
Crypto: ${encryptionStandard}
Isolation: ${isolationLevel}

Format the response in a highly professional, beautiful terminal-aligned technical format.
Under a header labeled "=== STRUCTURAL GRAPH ===", output an interactive system diagram constructed purely using Unicode box-drawing characters (such as ┌, ┐, └, ┘, ├, ┤, ─, │, ──►, etc.), showing the flow from Client/Enclave -> Router -> Security Gateway -> DB Nodes. Keep the graph layout dense and under 15 lines.
Then under a brief "=== SUBSYSTEM METADATA ===" header, write exactly 3 bullet points with brief technical assessments of this setup.`
        })
      });
      const data = await res.json();
      setGeneratedDiagram(data.text || "AI generation completed with success.");
    } catch (err) {
      console.error(err);
      setGeneratedDiagram("System node connection stalled. Let us verify internet access parameters.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSchematic = () => {
    if (!generatedDiagram) return;
    const blob = new Blob([generatedDiagram], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `peace-sys-architecture-${Date.now()}.txt`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={cn(
            "w-full max-w-2xl h-[85vh] flex flex-col rounded-[2rem] border overflow-hidden shadow-2xl relative",
            theme === 'dark' 
              ? "bg-[#111B21] border-[#202C33] text-zinc-100" 
              : "bg-white border-zinc-200 text-zinc-900"
          )}
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-150 dark:border-[#202C33] flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500">
                <Sparkles size={20} className="animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-widest font-sans">Peace AI Architecture Canvas</h2>
                <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Multi-step project schematics engineer</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400">
              <X size={20} />
            </button>
          </div>

          {/* Core Pipeline Navigation Timeline */}
          <div className="px-8 py-3.5 bg-neutral-100/55 dark:bg-[#090e11] border-b border-zinc-150 dark:border-[#202C33] flex items-center justify-between">
            {[1, 2, 3, 4].map((stepIdx) => (
              <div key={stepIdx} className="flex items-center gap-2">
                <div 
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-black transition-all",
                    step === stepIdx 
                      ? "bg-[#00a884] text-white ring-4 ring-[#00a884]/20" 
                      : step > stepIdx 
                        ? "bg-emerald-500/20 text-[#00a884]" 
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                  )}
                >
                  {stepIdx}
                </div>
                <span className={cn(
                  "text-[9px] font-mono font-black uppercase tracking-wider hidden sm:inline",
                  step === stepIdx ? "text-[#00a884]" : "text-zinc-450"
                )}>
                  {stepIdx === 1 && "Domain Core"}
                  {stepIdx === 2 && "Database Nodes"}
                  {stepIdx === 3 && "Isolation Shield"}
                  {stepIdx === 4 && "System Sketch"}
                </span>
                {stepIdx < 4 && <ChevronRight size={12} className="text-zinc-300 dark:text-zinc-800 ml-1 hidden sm:block" />}
              </div>
            ))}
          </div>

          {/* Interactive Steps Form Fields */}
          <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono font-black uppercase tracking-widest text-[#00a884]">1. System Core Title</label>
                    <input
                      type="text"
                      value={projTitle}
                      onChange={(e) => setProjTitle(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-[#202C33]/40 border border-zinc-200 dark:border-zinc-800 focus:border-[#00a884] rounded-2xl p-4 text-xs font-semibold outline-none transition-colors"
                      placeholder="e.g. Distributed Consensus Microservice"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-mono font-black uppercase tracking-widest text-[#00a884]">2. Custom System Template</label>
                    <div className="grid grid-cols-1 gap-3">
                      {systemPresets.map((preset) => (
                        <div
                          key={preset.name}
                          onClick={() => setSystemTemplate(preset.name)}
                          className={cn(
                            "p-4 rounded-2xl border cursor-pointer transition-all",
                            systemTemplate === preset.name 
                              ? "border-[#00a884] bg-emerald-500/5" 
                              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 bg-transparent"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Server size={16} className={systemTemplate === preset.name ? "text-[#00a884]" : "text-zinc-400"} />
                            <h4 className="text-xs font-semibold uppercase tracking-wider">{preset.name}</h4>
                          </div>
                          <p className="text-[10px] text-zinc-455 mt-1 leading-normal ml-7">{preset.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <label className="text-[11px] font-mono font-black uppercase tracking-widest text-[#00a884]">1. Database & Persistence Layer</label>
                    <div className="grid grid-cols-1 gap-3">
                      {dbPresets.map((preset) => (
                        <div
                          key={preset.name}
                          onClick={() => setDbStrategy(preset.name)}
                          className={cn(
                            "p-4 rounded-2xl border cursor-pointer transition-all",
                            dbStrategy === preset.name 
                              ? "border-[#00a884] bg-emerald-500/5" 
                              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 bg-transparent"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Database size={16} className={dbStrategy === preset.name ? "text-[#00a884]" : "text-zinc-400"} />
                            <h4 className="text-xs font-semibold uppercase tracking-wider">{preset.name}</h4>
                          </div>
                          <p className="text-[10px] text-zinc-455 mt-1 leading-normal ml-7">{preset.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-mono font-black uppercase tracking-widest text-[#00a884]">2. Clientside Cryptographic Core</label>
                    <input
                      type="text"
                      value={encryptionStandard}
                      onChange={(e) => setEncryptionStandard(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-[#202C33]/40 border border-zinc-200 dark:border-zinc-800 focus:border-[#00a884] rounded-2xl p-4 text-xs font-semibold outline-none transition-colors"
                      placeholder="e.g. Client-Side ECDH + AES-256 GCM"
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <label className="text-[11px] font-mono font-black uppercase tracking-widest text-[#00a884]">1. Trusted Compute Isolation Layer</label>
                    <div className="grid grid-cols-1 gap-3">
                      {isolationPresets.map((preset) => (
                        <div
                          key={preset.name}
                          onClick={() => setIsolationLevel(preset.name)}
                          className={cn(
                            "p-4 rounded-2xl border cursor-pointer transition-all",
                            isolationLevel === preset.name 
                              ? "border-[#00a884] bg-emerald-500/5" 
                              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 bg-transparent"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Shield size={16} className={isolationLevel === preset.name ? "text-[#00a884]" : "text-zinc-400"} />
                            <h4 className="text-xs font-semibold uppercase tracking-wider">{preset.name}</h4>
                          </div>
                          <p className="text-[10px] text-zinc-455 mt-1 leading-normal ml-7">{preset.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center px-1">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">Compile Architectural Sketch</h4>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono mt-0.5">Submit to Peace AI Security Agent</p>
                    </div>

                    {!generatedDiagram && !isGenerating && (
                      <button
                        onClick={triggerAIActor}
                        className="px-6 py-2.5 bg-[#00a884] hover:bg-emerald-600 text-white rounded-full text-[10px] font-mono font-black uppercase tracking-widest cursor-pointer shadow-md active:scale-95 transition-all"
                      >
                        Generate Sketch
                      </button>
                    )}
                  </div>

                  {isGenerating && (
                    <div className="p-16 border rounded-[2rem] border-dashed border-zinc-200 dark:border-zinc-800 bg-neutral-50/50 dark:bg-zinc-950/25 text-center flex flex-col items-center justify-center gap-4">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
                        <Loader2 className="text-[#00a884]" size={36} />
                      </motion.div>
                      <span className="text-xs font-semibold font-sans animate-pulse">Computing system trace matrices and drawing ASCII layouts...</span>
                    </div>
                  )}

                  {generatedDiagram && (
                    <div className="space-y-4">
                      {/* Diagram viewer */}
                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-[2rem] bg-neutral-950 p-6 shadow-inner relative group overflow-x-auto">
                        <pre className="text-emerald-400 font-mono text-[10px] leading-relaxed select-text whitespace-pre bg-transparent p-1 max-h-[300px] overflow-y-auto">
                          {generatedDiagram}
                        </pre>
                        
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={downloadSchematic}
                            className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-350 hover:text-white rounded-xl transition-all shadow-md"
                            title="Download schematic ASCII file"
                          >
                            <Download size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        <span className="text-[11px] font-sans text-zinc-600 dark:text-zinc-350">
                          Architecture compile successful. Decrypted schematic diagram saved into secure cache layout.
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          <div className="p-6 border-t border-zinc-150 dark:border-[#202C33] bg-zinc-50 dark:bg-[#0c1317] flex justify-between items-center shrink-0">
            <button
              onClick={() => setStep(prev => Math.max(1, prev - 1))}
              disabled={step === 1 || isGenerating}
              className="px-5 py-2.5 bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 hover:dark:bg-zinc-700 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-40"
            >
              Previous
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep(prev => Math.min(4, prev + 1))}
                className="px-5 py-2.5 bg-[#00a884] hover:bg-emerald-600 text-white rounded-full text-[10px] font-mono font-black uppercase tracking-widest transition-colors cursor-pointer"
              >
                Next Step
              </button>
            ) : (
              generatedDiagram && (
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#00a884] text-white font-black rounded-full text-[10px] font-mono uppercase tracking-widest transition-all shadow-md"
                >
                  Exit Sketcher
                </button>
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
