import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Camera, Video, Upload, Music, Layers, Trash2, Check, Sparkles, 
  RefreshCw, Zap, Timer, Grid, Scissors, Play, Pause, Save, Plus, Hash 
} from 'lucide-react';
import { useReelCreator, VideoSegment } from '../hooks/useReelCreator';
import { ReelMusicPicker } from './ReelMusicPicker';
import { ReelFilterPicker, FILTERS_LIST, EFFECTS_LIST } from './ReelFilterPicker';
import { useAuth } from '../context/AuthContext';

interface ReelCreatorProps {
  onClose: () => void;
  onPublishSuccess: () => void;
}

export const ReelCreator: React.FC<ReelCreatorProps> = ({ onClose, onPublishSuccess }) => {
  const { user } = useAuth();
  const {
    segments,
    setSegments,
    activeMusic,
    activeFilter,
    activeEffect,
    durationLimit,
    setDurationLimit,
    isRecording,
    publishing,
    record,
    upload,
    applyFilter,
    applyEffect,
    addMusic,
    trim,
    publish,
    saveDraft
  } = useReelCreator();

  // Screen phases: 'record' | 'edit' | 'publish'
  const [phase, setPhase] = useState<'record' | 'edit' | 'publish'>('record');
  
  // Camera feed states
  const [cameraActive, setCameraActive] = useState(true);
  const [flashActive, setFlashActive] = useState(false);
  const [gridActive, setGridActive] = useState(false);
  const [timerLimit, setTimerLimit] = useState<0 | 3 | 10>(0);
  const [activeSpeed, setActiveSpeed] = useState<0.5 | 1 | 2>(1);
  const [recordingProgress, setRecordingProgress] = useState(0);

  // Selector Drawer Overlays
  const [showMusicDrawer, setShowMusicDrawer] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Form Publishing fields
  const [caption, setCaption] = useState('');
  const [hashInput, setHashInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>(['enclave', 'flow']);

  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordingTimerRef = useRef<any>(null);

  // Initialize and check hardware camera
  useEffect(() => {
    if (phase === 'record') {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          streamRef.current = stream;
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn("Camera hardware not found or blocked, activating simulator:", err);
          setCameraActive(false);
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [phase]);

  // Handle Recording Timer Simulation
  useEffect(() => {
    if (isRecording) {
      const intervalMs = 100;
      const stepValue = (intervalMs / (durationLimit * 1000)) * 100;

      recordingTimerRef.current = setInterval(() => {
        setRecordingProgress(prev => {
          if (prev >= 100) {
            handleStopRecording();
            return 100;
          }
          return prev + stepValue;
        });
      }, intervalMs);
    } else {
      clearInterval(recordingTimerRef.current);
    }

    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording, durationLimit]);

  const handleStartRecording = () => {
    if (segments.length >= 3) {
      alert("⚠️ Max 3 clips reached! Trim or delete some segments to record more.");
      return;
    }
    
    // Timer delay logic if timer set
    if (timerLimit > 0) {
      let count = timerLimit;
      const originalLimit = timerLimit;
      // Let's count down
      alert(`⏱️ Starting in ${count}s...`);
    }

    record.start();
  };

  const handleStopRecording = () => {
    // Generate mock captured clip
    const mockBlob = new Blob([], { type: 'video/mp4' });
    const duration = (recordingProgress / 100) * durationLimit;
    record.stop(mockBlob, Math.max(1.5, duration), activeSpeed);
    setRecordingProgress(0);
  };

  // Gallery File selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert("⚠️ File exceeds 100MB safety threshold!");
      return;
    }

    upload(file);
    setPhase('edit');
  };

  const handlePublishReel = async () => {
    const res = await publish(caption, hashtags);
    if (res) {
      onPublishSuccess();
    } else {
      alert("❌ Critical node error: Upload failed. Saving to local Drafts folder.");
      saveDraft(caption, hashtags);
      onPublishSuccess();
    }
  };

  const addHashtag = () => {
    if (!hashInput.trim()) return;
    const clean = hashInput.trim().replace('#', '');
    if (!hashtags.includes(clean)) {
      setHashtags([...hashtags, clean]);
    }
    setHashInput('');
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  // Speed modifiers toggle
  const cycleSpeed = () => {
    if (activeSpeed === 1) setActiveSpeed(2);
    else if (activeSpeed === 2) setActiveSpeed(0.5);
    else setActiveSpeed(1);
  };

  // Find active filter definition
  const filterStyle = FILTERS_LIST.find(f => f.name === activeFilter)?.style || '';

  return (
    <div id="reel_creator_view" className="fixed inset-0 bg-black text-white z-50 flex flex-col select-none overflow-hidden">
      
      {/* PHASE 1: RECORD STUDIO */}
      {phase === 'record' && (
        <div className="flex-1 flex flex-col relative bg-zinc-950">
          {/* Header Controls */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
            
            {/* Active soundtrack display */}
            <button 
              onClick={() => setShowMusicDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold border border-zinc-800 hover:border-amber-500 transition-colors"
            >
              <Music size={12} className="text-amber-500" />
              <span className="max-w-[120px] truncate">{activeMusic ? activeMusic.title : 'Select Sound'}</span>
            </button>

            <button 
              onClick={() => setPhase('edit')}
              disabled={segments.length === 0}
              className="px-4 py-1.5 bg-amber-500 text-black text-xs font-black rounded-full disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
            >
              Next
              <Check size={12} strokeWidth={3} />
            </button>
          </div>

          {/* Video Preview Camera */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
            {cameraActive ? (
              <video 
                ref={videoPreviewRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
                style={{ filter: filterStyle }}
              />
            ) : (
              <div className="flex flex-col items-center text-center p-6 gap-2">
                <Camera size={44} className="text-amber-500 animate-pulse" />
                <p className="text-sm font-bold text-zinc-300">Enclave Virtual Lens</p>
                <p className="text-[10px] text-zinc-500 max-w-[200px]">Camera hardware simulated. Double check device settings.</p>
              </div>
            )}

            {/* Grid overlay */}
            {gridActive && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div />
              </div>
            )}

            {/* Multi-segment markers list */}
            <div className="absolute top-16 left-4 right-4 h-1.5 flex gap-1 bg-zinc-900/60 p-0.5 rounded-full z-20">
              {segments.map((seg, i) => (
                <div 
                  key={i} 
                  className="h-full bg-amber-500 rounded-full" 
                  style={{ flex: seg.duration }}
                />
              ))}
              {isRecording && (
                <div 
                  className="h-full bg-red-600 rounded-full transition-all duration-100 animate-pulse" 
                  style={{ width: `${recordingProgress}%` }}
                />
              )}
            </div>

            {/* Right Side Camera Tools Stack */}
            <div className="absolute right-4 top-20 flex flex-col gap-4 z-20">
              <button 
                onClick={() => setCameraActive(!cameraActive)}
                className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-zinc-800 hover:border-amber-500 text-white transition-colors"
                title="Flip Camera"
              >
                <RefreshCw size={16} />
              </button>
              
              <button 
                onClick={cycleSpeed}
                className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex flex-col items-center justify-center border border-zinc-800 hover:border-amber-500 text-white transition-colors"
                title="Speed modifier"
              >
                <span className="text-[10px] font-black text-amber-500">{activeSpeed}x</span>
              </button>

              <button 
                onClick={() => setFlashActive(!flashActive)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                  flashActive 
                    ? 'border-amber-500 bg-amber-500/10 text-amber-500' 
                    : 'border-zinc-800 bg-black/60 text-white'
                }`}
                title="Torch Flash"
              >
                <Zap size={16} />
              </button>

              <button 
                onClick={() => setTimerLimit(t => t === 0 ? 3 : t === 3 ? 10 : 0)}
                className={`w-10 h-10 rounded-full flex flex-col items-center justify-center border transition-all ${
                  timerLimit > 0 
                    ? 'border-amber-500 bg-amber-500/10 text-amber-500' 
                    : 'border-zinc-800 bg-black/60 text-white'
                }`}
                title="Timer Countdown"
              >
                <Timer size={15} />
                {timerLimit > 0 && <span className="text-[8px] font-bold mt-0.5">{timerLimit}s</span>}
              </button>

              <button 
                onClick={() => setGridActive(!gridActive)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                  gridActive 
                    ? 'border-amber-500 bg-amber-500/10 text-amber-500' 
                    : 'border-zinc-800 bg-black/60 text-white'
                }`}
                title="Grid Overlay"
              >
                <Grid size={16} />
              </button>
            </div>
          </div>

          {/* Bottom Capturing HUD Controls */}
          <div className="p-6 bg-zinc-950 flex flex-col gap-5 z-20">
            {/* Duration select */}
            <div className="flex items-center justify-center gap-4 text-xs font-bold text-zinc-500">
              {([15, 30, 60] as const).map(sec => (
                <button
                  key={sec}
                  onClick={() => setDurationLimit(sec)}
                  className={`px-3 py-1 rounded-full transition-all ${
                    durationLimit === sec ? 'text-amber-500 bg-amber-500/10 font-black' : 'hover:text-white'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              {/* Filter selector icon */}
              <button 
                onClick={() => setShowFilterDrawer(true)}
                className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors"
              >
                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
                  <Layers size={18} className="text-amber-500" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">AI Filters</span>
              </button>

              {/* Main Record Button */}
              <button
                onMouseDown={handleStartRecording}
                onMouseUp={handleStopRecording}
                onTouchStart={handleStartRecording}
                onTouchEnd={handleStopRecording}
                className={`w-18 h-18 rounded-full border-4 flex items-center justify-center transition-all cursor-pointer ${
                  isRecording 
                    ? 'border-red-500 bg-red-600/30' 
                    : 'border-white bg-red-600 hover:scale-105'
                }`}
              >
                <div className={`bg-white transition-all ${isRecording ? 'w-5 h-5 rounded-md' : 'w-10 h-10 rounded-full'}`} />
              </button>

              {/* Upload Gallery Picker */}
              <label className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
                  <Upload size={18} className="text-amber-500" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
                <input 
                  type="file" 
                  accept="video/mp4" 
                  onChange={handleFileSelect} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 2: EDITING STUDIO */}
      {phase === 'edit' && (
        <div className="flex-1 flex flex-col relative bg-zinc-950">
          <div className="p-4 bg-zinc-950 flex items-center justify-between border-b border-zinc-900">
            <button 
              onClick={() => setPhase('record')}
              className="text-zinc-400 hover:text-white text-xs font-bold"
            >
              Re-shoot
            </button>
            <h2 className="font-bold text-sm">Preview & Trim</h2>
            <button 
              onClick={() => setPhase('publish')}
              className="px-4 py-1.5 bg-amber-500 text-black text-xs font-black rounded-full"
            >
              Publish
            </button>
          </div>

          <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
            <div className="w-full h-full max-w-[360px] aspect-[9/16] bg-zinc-900 relative rounded-2xl overflow-hidden shadow-2xl">
              {/* Simple looping preview of first clip */}
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <Video size={40} className="text-amber-500 animate-pulse mb-2" />
                <p className="text-xs font-bold text-zinc-400">Captured Segment</p>
                <p className="text-[10px] text-zinc-600">Filters & Effects applied: {activeFilter}</p>
              </div>
            </div>
          </div>

          {/* Timeline segments list & triggers */}
          <div className="p-5 bg-zinc-950 border-t border-zinc-900 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Clips ({segments.length}/3)</span>
              <button 
                onClick={() => setSegments([])}
                className="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={10} /> Discard All
              </button>
            </div>

            <div className="space-y-2.5">
              {segments.map((seg, idx) => (
                <div key={idx} className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-xl border border-zinc-850">
                  <div className="flex items-center gap-2">
                    <Scissors size={13} className="text-amber-500" />
                    <div>
                      <p className="text-xs font-bold">Clip #{idx + 1}</p>
                      <p className="text-[10px] text-zinc-500">{seg.duration.toFixed(1)}s • {seg.speed}x speed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => trim(idx, 0, 80)} // Trim demo trigger
                      className="text-[9px] bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-zinc-300 transition-colors"
                    >
                      Trim -20%
                    </button>
                    <button 
                      onClick={() => record.removeSegment(idx)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: PUBLISH & DESCRIPTION */}
      {phase === 'publish' && (
        <div className="flex-1 flex flex-col bg-zinc-950 p-4 overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-900 mb-5">
            <button 
              onClick={() => setPhase('edit')}
              className="text-zinc-400 hover:text-white text-xs font-bold"
            >
              Back
            </button>
            <h2 className="font-bold text-sm">Finalize Video</h2>
            <div className="w-8" />
          </div>

          <div className="space-y-5">
            {/* Caption Form */}
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Caption Details</label>
              <textarea 
                placeholder="Write your video description here..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 placeholder-zinc-500"
              />
            </div>

            {/* Hashtag Editor */}
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Hashtags</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="cyberpunk, neon, etc"
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addHashtag()}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
                <button 
                  onClick={addHashtag}
                  className="px-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl font-bold text-xs"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Hashtag tags display list */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {hashtags.map(tag => (
                  <span 
                    key={tag}
                    className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-bold rounded-lg"
                  >
                    #{tag}
                    <button onClick={() => removeHashtag(tag)} className="text-zinc-400 hover:text-white">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Privacy selection indicators */}
            <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-2xl flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300">Allow Duet reactions</span>
                <input type="checkbox" defaultChecked className="accent-amber-500 cursor-pointer" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300">Allow Stitch clipping</span>
                <input type="checkbox" defaultChecked className="accent-amber-500 cursor-pointer" />
              </div>
            </div>

            {/* Save draft or publish triggers */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => { saveDraft(caption, hashtags); alert("💾 Draft saved to offline storage!"); onClose(); }}
                className="flex-1 py-3.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-zinc-300"
              >
                <Save size={14} />
                Save Draft
              </button>
              
              <button
                onClick={handlePublishReel}
                disabled={publishing}
                className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/15"
              >
                {publishing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Check size={14} strokeWidth={3} />
                    Publish Reel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Music Picker Drawer */}
      {showMusicDrawer && (
        <div className="absolute inset-x-0 bottom-0 z-55">
          <ReelMusicPicker 
            onSelect={(music) => { addMusic(music); setShowMusicDrawer(false); }}
            selectedMusicId={activeMusic?.id}
            onClose={() => setShowMusicDrawer(false)}
          />
        </div>
      )}

      {/* Floating Filter Picker Drawer */}
      {showFilterDrawer && (
        <div className="absolute inset-x-0 bottom-0 z-55">
          <div className="flex justify-between items-center bg-zinc-950 p-3 border-t border-zinc-800">
            <span className="text-xs font-bold text-amber-500">Pick Filter or AI Effect</span>
            <button 
              onClick={() => setShowFilterDrawer(false)}
              className="text-xs text-zinc-400 font-bold hover:text-white"
            >
              Close
            </button>
          </div>
          <ReelFilterPicker 
            onSelectFilter={applyFilter}
            selectedFilter={activeFilter}
            onSelectEffect={applyEffect}
            selectedEffect={activeEffect}
          />
        </div>
      )}

    </div>
  );
};
export default ReelCreator;
