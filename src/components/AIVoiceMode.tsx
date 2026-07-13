import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface AIVoiceModeProps {
  onTranscriptComplete: (text: string) => void;
  lastAIResponse?: string;
  isAiResponding?: boolean;
}

export function AIVoiceMode({ onTranscriptComplete, lastAIResponse, isAiResponding }: AIVoiceModeProps) {
  const [isListening, setIsListening] = useState(false);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Speech Recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setTranscript(resultText);
        if (resultText) {
          onTranscriptComplete(resultText);
        }
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [onTranscriptComplete]);

  // Voice playback using Web Speech Synthesis API
  useEffect(() => {
    if (isVoiceOutputEnabled && lastAIResponse && !isAiResponding) {
      // Cancel active voices first
      window.speechSynthesis?.cancel();
      
      const cleanText = lastAIResponse.replace(/[#*`_\[\]]/g, '').slice(0, 200); // truncate for fluid speech
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      
      // Select an elegant female or high-quality voice if available
      if (window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Female') || v.name.includes('Natural'));
        if (preferredVoice) utterance.voice = preferredVoice;
      }

      window.speechSynthesis?.speak(utterance);
    }
    
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [lastAIResponse, isAiResponding, isVoiceOutputEnabled]);

  const toggleListening = () => {
    if (!speechSupported) return;
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      window.speechSynthesis?.cancel(); // Mute speech when user starts talking
      recognitionRef.current?.start();
    }
  };

  return (
    <div className="flex items-center gap-2 shrink-0 select-none" id="ai-voice-panel">
      {/* Speech-to-text listener trigger */}
      {speechSupported && (
        <div className="relative">
          <button
            onClick={toggleListening}
            aria-label="Toggle voice input mode"
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 relative overflow-hidden ${
              isListening 
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20' 
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-500 hover:border-amber-500/30'
            }`}
          >
            {isListening ? <Mic size={20} className="animate-pulse" /> : <Mic size={20} />}
          </button>

          {/* Soundwave animation overlay on screen */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute bottom-14 right-0 z-50 bg-zinc-900 border border-amber-500/30 p-4 rounded-2xl w-64 shadow-xl shadow-black/80 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase">
                    NEXUS LISTENING
                  </span>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                </div>

                {/* Animated Gold Equalizer Bars */}
                <div className="flex items-center justify-center gap-1.5 py-4 h-12">
                  {[...Array(8)].map((_, idx) => (
                    <motion.div
                      key={idx}
                      className="w-1.5 bg-amber-500 rounded-full"
                      animate={{ 
                        height: [12, Math.floor(Math.random() * 32) + 12, 12] 
                      }}
                      transition={{ 
                        duration: 0.6 + idx * 0.1, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>

                <p className="text-[11px] text-zinc-400 text-center italic font-medium">
                  "Speak your mind..."
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Voice feedback output toggle */}
      <button
        onClick={() => setIsVoiceOutputEnabled(!isVoiceOutputEnabled)}
        aria-label="Toggle voice feedback output"
        className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
          isVoiceOutputEnabled
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
        }`}
      >
        {isVoiceOutputEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>
    </div>
  );
}

export default AIVoiceMode;
