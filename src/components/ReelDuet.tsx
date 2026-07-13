import React, { useState, useEffect, useRef } from 'react';
import { X, Video, RefreshCw, Flame, Check, Sparkles } from 'lucide-react';
import { Reel } from '../types';
import { useAuth } from '../context/AuthContext';
import { useReelCreator } from '../hooks/useReelCreator';

interface ReelDuetProps {
  originalReel: Reel;
  onClose: () => void;
  onPublishSuccess: (newReel: Reel) => void;
}

export const ReelDuet: React.FC<ReelDuetProps> = ({ originalReel, onClose, onPublishSuccess }) => {
  const { user } = useAuth();
  const { publish, activeFilter, applyFilter } = useReelCreator();
  const [recording, setRecording] = useState(false);
  const [recordedBytes, setRecordedBytes] = useState<Blob | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [progress, setProgress] = useState(0);
  const [caption, setCaption] = useState(`Duet with @${originalReel.creatorName || 'creator'} 🕶️🤖`);
  const [publishing, setPublishing] = useState(false);

  // Video feed ref
  const userVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Attempt camera access
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        streamRef.current = stream;
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.warn("Camera blocked, using digital simulation stream:", err);
        setCameraActive(false);
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Timer simulation
  useEffect(() => {
    let interval: any;
    if (recording) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleStopRecording();
            return 100;
          }
          return prev + 2;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [recording]);

  const handleStartRecording = () => {
    setProgress(0);
    setRecording(true);
  };

  const handleStopRecording = () => {
    setRecording(false);
    // Produce mock video blob
    const mockBlob = new Blob([], { type: 'video/mp4' });
    setRecordedBytes(mockBlob);
  };

  const handlePublish = async () => {
    if (!user) return;
    setPublishing(true);

    // Simulate database write
    setTimeout(() => {
      const duetReel: Reel = {
        id: `duet_${Date.now()}`,
        creatorId: user.uid,
        creatorName: user.displayName || 'Anonymous User',
        creatorAvatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        videoUrl: originalReel.videoUrl, // In real deployment, this would merge, for web we use same preview
        thumbnailUrl: originalReel.thumbnailUrl,
        caption,
        duration: originalReel.duration,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        views: 1,
        createdAt: { toDate: () => new Date() } as any,
        hashtags: ['duet', 'enclave'],
        isPublic: true,
        allowDuet: false,
        allowStitch: false,
        isDuet: true,
        duetParentId: originalReel.id,
        filters: [],
        effects: []
      };
      
      onPublishSuccess(duetReel);
      setPublishing(false);
    }, 1500);
  };

  return (
    <div id="reel_duet_panel" className="fixed inset-0 bg-black z-50 flex flex-col select-none text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-900 bg-zinc-950">
        <div className="flex items-center gap-2">
          <Sparkles className="text-amber-500" size={18} />
          <h2 className="font-bold text-sm">Enclave Duet Studio</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-zinc-900 rounded-full text-zinc-400">
          <X size={20} />
        </button>
      </div>

      {/* Side-by-side splitscreen content */}
      <div className="flex-1 grid grid-cols-2 bg-zinc-900 relative overflow-hidden">
        
        {/* Left Side: Original Video */}
        <div className="relative border-r border-zinc-800 bg-black flex items-center justify-center">
          <video 
            src={originalReel.videoUrl} 
            className="w-full h-full object-cover"
            autoPlay 
            loop 
            muted 
            playsInline
          />
          <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-amber-500">
            @{originalReel.creatorName || 'original'}
          </div>
        </div>

        {/* Right Side: My Camera / Simulator */}
        <div className="relative bg-zinc-950 flex items-center justify-center overflow-hidden">
          {cameraActive ? (
            <video 
              ref={userVideoRef} 
              autoPlay 
              muted 
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <div className="w-16 h-16 bg-zinc-900 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-500 mb-2 animate-pulse">
                <Video size={28} />
              </div>
              <p className="text-xs font-bold text-zinc-300">Camera Simulated</p>
              <p className="text-[10px] text-zinc-500 mt-1">Ready to sync reaction with original node</p>
            </div>
          )}
          <div className="absolute top-2 left-2 bg-amber-500/20 border border-amber-500/40 text-amber-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
            REACTION NODE
          </div>
        </div>

        {/* Live Recording Progress bar */}
        {recording && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* Editor & Actions Controls */}
      <div className="p-5 bg-zinc-950 border-t border-zinc-900 flex flex-col gap-4">
        {recordedBytes ? (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Caption Response</label>
              <input 
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRecordedBytes(null)}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-850 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Retake
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                {publishing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Check size={14} strokeWidth={3} />
                    Publish Duet
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-[11px] text-zinc-400">
              {recording ? 'Recording duet response...' : 'Tap record to capture reaction with original video'}
            </p>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => applyFilter(activeFilter === 'Normal' ? 'Cyberpunk' : 'Normal')}
                className="p-3 bg-zinc-900 hover:bg-zinc-850 rounded-full text-zinc-400 hover:text-white transition-all cursor-pointer"
                title="Filters"
              >
                🎨
              </button>
              
              <button
                onClick={recording ? handleStopRecording : handleStartRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all cursor-pointer ${
                  recording 
                    ? 'border-red-500/30 bg-red-600 animate-pulse' 
                    : 'border-white bg-amber-500 hover:bg-amber-600 hover:scale-105'
                }`}
              >
                <div className={`rounded-md bg-black transition-all ${recording ? 'w-5 h-5' : 'w-0 h-0'}`} />
              </button>

              <button 
                onClick={() => setCameraActive(!cameraActive)}
                className="p-3 bg-zinc-900 hover:bg-zinc-850 rounded-full text-zinc-400 hover:text-white transition-all cursor-pointer"
                title="Flip Camera"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ReelDuet;
