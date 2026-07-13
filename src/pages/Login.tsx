import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Globe, Loader2, Lock, Delete, LogIn, Key, ShieldAlert } from 'lucide-react';

const MAX_ATTEMPTS = 3;
const LOCK_MINUTES = 5;

// SECURE CREDENTIALS FROM CUSTOM GATEWAY SPEC
const VIEWER_PIN = "1234";
const ADMIN_USER = "admin";
const ADMIN_PASS = "Nexus@2026";

export default function Login() {
  const { credentialSignIn, signIn } = useAuth();

  const [currentRole, setCurrentRole] = useState<'viewer' | 'admin'>('viewer');
  
  // PIN states (Viewer)
  const [pinEntry, setPinEntry] = useState<string>('');
  
  // Admin credentials states
  const [adminUser, setAdminUser] = useState<string>('');
  const [adminPass, setAdminPass] = useState<string>('');
  const [showPass, setShowPass] = useState<boolean>(false);

  // Security Lockout states
  const [attempts, setAttempts] = useState<number>(0);
  const [locked, setLocked] = useState<boolean>(false);
  const [lockTimeLeft, setLockTimeLeft] = useState<number>(0); // in seconds
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [authenticating, setAuthenticating] = useState<boolean>(false);

  // Lock timer ticker
  useEffect(() => {
    if (!locked) return;
    const interval = setInterval(() => {
      setLockTimeLeft((prev) => {
        if (prev <= 1) {
          setLocked(false);
          setAttempts(0);
          setErrorMsg('Terminal operational. Re-submit clearance.');
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [locked]);

  // Format lockout time
  const formatLockTime = () => {
    const m = Math.floor(lockTimeLeft / 60);
    const s = String(lockTimeLeft % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // Keyboard mapping for PIN input
  useEffect(() => {
    if (currentRole !== 'viewer' || locked || authenticating) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handlePinPress(e.key);
      } else if (e.key === 'Backspace') {
        handlePinDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinEntry, currentRole, locked, authenticating]);

  // Handle PIN input digit
  const handlePinPress = (val: string) => {
    if (locked || authenticating || pinEntry.length >= 4) return;
    const nextPin = pinEntry + val;
    setPinEntry(nextPin);
    setErrorMsg('');

    if (nextPin.length === 4) {
      setTimeout(() => verifyPin(nextPin), 250);
    }
  };

  // Handle PIN Backspace
  const handlePinDelete = () => {
    if (locked || authenticating) return;
    setPinEntry((prev) => prev.slice(0, -1));
  };

  // Check PIN
  const verifyPin = async (pinValue: string) => {
    setAuthenticating(true);
    // Simulate encryption decrypt processing latency
    await new Promise((r) => setTimeout(r, 600));

    if (pinValue === VIEWER_PIN) {
      try {
        await credentialSignIn('viewer');
      } catch (err) {
        setErrorMsg('Node sync error. Check connectivity.');
      }
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setPinEntry('');
      
      if (nextAttempts >= MAX_ATTEMPTS) {
        triggerLockout();
      } else {
        setErrorMsg(`Terminal rejected key. ${MAX_ATTEMPTS - nextAttempts} verification cycles remaining.`);
      }
    }
    setAuthenticating(false);
  };

  // Trigger terminal lockout override
  const triggerLockout = () => {
    setLocked(true);
    setLockTimeLeft(LOCK_MINUTES * 60);
    setPinEntry('');
  };

  // Switch tabs
  const handleSwitchRole = (role: 'viewer' | 'admin') => {
    setCurrentRole(role);
    setErrorMsg('');
    setPinEntry('');
  };

  // Admin authenticate action
  const handleAdminAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (locked || authenticating) return;

    if (!adminUser.trim() || !adminPass) {
      setErrorMsg('Inputs require credentials.');
      return;
    }

    setAuthenticating(true);
    await new Promise((r) => setTimeout(r, 700));

    if (adminUser.trim() === ADMIN_USER && adminPass === ADMIN_PASS) {
      try {
        await credentialSignIn('admin');
      } catch (err) {
        setErrorMsg('Sync timeout. Secure link compromised.');
      }
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        triggerLockout();
      } else {
        setErrorMsg(`Invalid Core credentials. ${MAX_ATTEMPTS - nextAttempts} sync attempts left.`);
      }
    }
    setAuthenticating(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-200">
      {/* Cybersecurity Mesh Background */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#060814_0%,#0b112c_50%,#050716_100%)] z-0" />
      
      {/* Decorative Orbs with Neon Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 translate-y-1/2 translate-x-1/2 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Security Gateway Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-[400px] z-10"
      >
        <div className="bg-slate-900/75 border border-cyan-500/15 rounded-[32px] p-8 shadow-[0_25px_55px_rgba(0,0,0,0.65),0_0_40px_rgba(0,242,254,0.03)] backdrop-blur-xl relative overflow-hidden">
          {/* Subtle Cyber scan effect bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_15px_#00f2fe] animate-pulse" style={{ background: 'linear-gradient(90deg, transparent, #00f2fe, transparent)' }} />
          
          {/* Gateway Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-950 border border-cyan-500/20 text-cyan-400 mb-3 shadow-[0_0_20px_rgba(0,242,254,0.15)]">
              <Globe className="w-8 h-8 animate-spin-slow text-cyan-400" />
            </div>
            <h1 className="font-orbitron text-2xl font-black tracking-wider text-white uppercase bg-gradient-to-r from-cyan-400 to-sky-400 bg-clip-text text-transparent">
              Nexus Social
            </h1>
            <p className="text-[10px] tracking-[4px] text-slate-500 uppercase font-black mt-1">
              Security Gateway
            </p>
          </div>

          {/* Role/Network Channel Switcher */}
          <div className="flex bg-slate-950/60 p-1 rounded-2xl border border-slate-800/80 mb-6">
            <button
              onClick={() => handleSwitchRole('viewer')}
              disabled={authenticating}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs transition-all duration-300 ${
                currentRole === 'viewer'
                  ? 'bg-gradient-to-r from-cyan-950 to-slate-900 border border-cyan-500/35 text-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.1)]'
                  : 'text-slate-500 hover:text-slate-400 bg-transparent border border-transparent'
              }`}
            >
              🤝 User Link
            </button>
            <button
              onClick={() => handleSwitchRole('admin')}
              disabled={authenticating}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs transition-all duration-300 ${
                currentRole === 'admin'
                  ? 'bg-gradient-to-r from-purple-950/70 to-slate-900 border border-purple-500/35 text-purple-400 shadow-[0_0_12px_rgba(157,78,221,0.1)]'
                  : 'text-slate-500 hover:text-slate-400 bg-transparent border border-transparent'
              }`}
            >
              💻 Nexus Core
            </button>
          </div>

          {/* Main authenticators state machines */}
          <AnimatePresence mode="wait">
            {currentRole === 'viewer' ? (
              <motion.div
                key="viewer-pin"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                {/* Dots Display Indicator */}
                <div className="flex gap-4 justify-center py-4 mb-4">
                  {[0, 1, 2, 3].map((index) => {
                    const isFilled = index < pinEntry.length;
                    return (
                      <motion.div
                        key={index}
                        animate={{
                          scale: isFilled ? [1, 1.2, 1] : 1,
                          backgroundColor: isFilled ? '#00f2fe' : 'transparent',
                        }}
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                          isFilled 
                            ? 'border-cyan-400 shadow-[0_0_12px_#00f2fe]' 
                            : 'border-slate-800 bg-transparent'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Digital Hardware Numpad */}
                <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mb-4">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={locked || authenticating}
                      onClick={() => handlePinPress(num)}
                      className="py-3 px-4 rounded-xl bg-slate-950/80 border border-slate-800/60 text-slate-100 font-orbitron font-bold text-lg hover:border-cyan-500/30 hover:text-cyan-400 active:scale-95 transition-all duration-150 disabled:opacity-20 disabled:pointer-events-none"
                    >
                      {num}
                    </button>
                  ))}
                  <div className="flex items-center justify-center opacity-40 text-xs font-mono select-none text-slate-600">
                    PIN
                  </div>
                  <button
                    type="button"
                    disabled={locked || authenticating}
                    onClick={() => handlePinPress('0')}
                    className="py-3 px-4 rounded-xl bg-slate-950/80 border border-slate-800/60 text-slate-100 font-orbitron font-bold text-lg hover:border-cyan-500/30 hover:text-cyan-400 active:scale-95 transition-all duration-150 disabled:opacity-20 disabled:pointer-events-none"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    disabled={locked || pinEntry.length === 0 || authenticating}
                    onClick={handlePinDelete}
                    className="flex items-center justify-center py-3 px-4 rounded-xl bg-slate-950/80 border border-slate-800/60 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-400 active:scale-95 transition-all duration-150 disabled:opacity-25 disabled:pointer-events-none"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="admin-credentials"
                onSubmit={handleAdminAuth}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[10px] tracking-[1.5px] font-black text-slate-500 uppercase mb-2">
                    Core Identity Identifier
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled={locked || authenticating}
                      value={adminUser}
                      onChange={(e) => setAdminUser(e.target.value)}
                      placeholder="Username hash"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] tracking-[1.5px] font-black text-slate-500 uppercase mb-2">
                    Encrypted Keyphrase
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      disabled={locked || authenticating}
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      placeholder="Core security token"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-5 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    />
                    <button
                      type="button"
                      disabled={locked || authenticating}
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-purple-400 transition-colors p-1"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={locked || authenticating}
                  className="w-full py-3 px-4 rounded-xl font-orbitron font-extrabold text-xs tracking-wider uppercase bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30 active:scale-95 transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2 border border-purple-500/20"
                >
                  {authenticating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Syncing Node...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Authenticate Node
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Attempts Visualizer Deck */}
          <div className="flex flex-col items-center justify-center mt-6 border-t border-slate-800/40 pt-4">
            {locked ? (
              <div className="flex items-center gap-2 text-rose-500 text-xs font-semibold animate-pulse">
                <ShieldAlert className="w-4 h-4" />
                <span>TERMINAL OVERLOAD: TETHER LOCKED</span>
              </div>
            ) : (
              <div className="flex gap-2">
                {[0, 1, 2].map((slot) => {
                  const isUsed = slot < attempts;
                  return (
                    <div
                      key={slot}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        isUsed 
                          ? 'bg-rose-500 shadow-[0_0_8px_#ff5e7e] scale-110' 
                          : 'bg-slate-800'
                      }`}
                    />
                  );
                })}
              </div>
            )}

            {/* General Feedback/Errors Display */}
            {errorMsg && !locked && (
              <p className="text-[11px] font-semibold text-rose-400 mt-3 text-center leading-relaxed">
                {errorMsg}
              </p>
            )}

            {/* Lockout Countdown Timer */}
            {locked && (
              <div className="text-center mt-2.5">
                <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
                  Cooldown Synchronization Phase
                </p>
                <div className="font-orbitron font-black text-rose-400 text-lg tracking-widest mt-1">
                  {formatLockTime()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom alternative link for optional real Firebase Google authentication if available */}
        <div className="text-center mt-5">
          <p className="text-[10px] text-slate-600 font-semibold mb-2">
            Secure offline-first session node tethers default.
          </p>
          <button
            type="button"
            onClick={signIn}
            disabled={locked || authenticating}
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-cyan-400 font-bold tracking-wide transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            OAuth Security Protocol Link
          </button>
        </div>
      </motion.div>
    </div>
  );
}
