import React, { useState, useEffect, useRef } from 'react';
import { X, Video, Scissors, Check, Sparkles, RefreshCw } from 'lucide-react';
import { Reel } from '../types';
import { useAuth } from '../context/AuthContext';

interface ReelStitchProps {
  originalReel: Reel;
  onClose: () => void;
  onPublishSuccess: (newReel: Reel) => void;
}

export const ReelStitch: React.FC<ReelStitchProps> = ({ originalReel, onClose, onPublishSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'trim' | 'record' | 'publish'>('trim');
  const [trimStart, setTrimStart] = useState(0); // in seconds
  const [recording, setRecording] = useState(false);
  const [recordedBytes, setRecordedBytes] = useState<Blob | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [progress, setProgress] = useState(0);
  const [caption, setCaption] = useState(`Stitched with @${originalReel.creatorName || 'creator'} 🎞️⛓️`);
  const [publishing, setPublishing] = useState(false);

  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const userVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Set default trim window
  useEffect(() => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = trimStart;
    }
  }, [trimStart]);

  useEffect(() => {
    if (step === 'record') {
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
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [step]);

  // Record timer simulation
  useEffect(() => {
    let interval: any;
    if (recording) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleStopRecording();
            return 100;
          }
          return prev + 4;
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
    const mockBlob = new Blob([], { type: 'video/mp4' });
    setRecordedBytes(mockBlob);
    setStep('publish');
  };

  const handlePublish = async () => {
    if (!user) return;
    setPublishing(true);

    setTimeout(() => {
      const stitchedReel: Reel = {
        id: `stitch_${Date.now()}`,
        creatorId: user.uid,
        creatorName: user.displayName || 'Anonymous User',
        creatorAvatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        videoUrl: originalReel.videoUrl, 
        thumbnailUrl: originalReel.thumbnailUrl,
        caption,
        duration: 10,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        views: 1,
        createdAt: { toDate: () => new Date() } as any,
        hashtags: ['stitch', 'enclave'],
        isPublic: true,
        allowDuet: false,
        allowStitch: false,
        isStitch: true,
        stitchParentId: originalReel.id,
        filters: [],
        effects: []
      };
      
      onPublishSuccess(stitchedReel);
      setPublishing(false);
    }, 1500);
  };

  return (
    <div id="reel_stitch_panel" className="fixed inset-0 bg-black z-50 flex flex-col select-none text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-900 bg-zinc-950">
        <div className="flex items-center gap-2">
          <Scissors className="text-amber-500" size={18} />
          <h2 className="font-bold text-sm">Enclave Stitch Studio</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-zinc-900 rounded-full text-zinc-400">
          <X size={20} />
        </button>
      </div>

      {/* Main interactive viewport */}
      <div className="flex-1 flex flex-col bg-zinc-900 justify-center items-center p-4 relative">
        {step === 'trim' && (
          <div className="w-full max-w-sm flex flex-col items-center gap-5">
            <p className="text-xs text-zinc-400 text-center">
              Step 1: Choose a 5-second hook segment from the original creator's reel
            </p>

            <div className="relative w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl">
              <video 
                ref={videoPlayerRef}
                src={originalReel.videoUrl}
                className="w-full h-full object-cover"
                muted
                playsInline
                loop
              />
              <div className="absolute inset-0 bg-black/30 pointer-events-none flex items-center justify-center">
                <Scissors size={42} className="text-amber-500/80 animate-pulse" />
              </div>
            </div>

            {/* Range slider for 5-sec stitch selection */}
            <div className="w-full space-y-2 px-3">
              <div className="flex justify-between text-[11px] text-zinc-500 font-bold">
                <span>Start: {trimStart.toFixed(1)}s</span>
                <span className="text-amber-500">Fixed 5.0s Clip</span>
                <span>End: {(trimStart + 5).toFixed(1)}s</span>
              </div>
              <input 
                type="range"
                min="0"
                max={Math.max(0, originalReel.duration - 5)}
                step="0.5"
                value={trimStart}
                onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>

            <button
              onClick={() => setStep('record')}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
            >
              Grab Clip & Record Response
            </button>
          </div>
        )}

        {step === 'record' && (
          <div className="w-full max-w-sm flex flex-col items-center gap-5">
            <p className="text-xs text-zinc-400 text-center">
              Step 2: Record your response following the original clip
            </p>

            <div className="relative w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl">
              {cameraActive ? (
                <video 
                  ref={userVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
                  <Video size={36} className="text-amber-500 animate-pulse mb-2" />
                  <p className="text-xs font-bold">Camera Simulation Active</p>
                  <p className="text-[10px] text-zinc-500 mt-1">Ready to capture responses</p>
                </div>
              )}

              {recording && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-800">
                  <div className="h-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => setStep('trim')}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Back
              </button>

              <button
                onClick={recording ? handleStopRecording : handleStartRecording}
                className={`w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all cursor-pointer ${
                  recording 
                    ? 'border-red-500/30 bg-red-600 animate-pulse' 
                    : 'border-white bg-amber-500 hover:bg-amber-600'
                }`}
              >
                <div className={`rounded-sm bg-black transition-all ${recording ? 'w-4 h-4' : 'w-0 h-0'}`} />
              </button>

              <button
                onClick={() => setCameraActive(!cameraActive)}
                className="p-3 bg-zinc-800 hover:bg-zinc-750 rounded-full text-zinc-300 transition-all cursor-pointer"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 'publish' && (
          <div className="w-full max-w-sm flex flex-col gap-4">
            <p className="text-xs text-zinc-400 text-center font-bold">
              Step 3: Confirm caption and publish stitched reel
            </p>

            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3 shadow-2xl">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Caption Response</label>
                <input 
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('record')}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Record Again
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  {publishing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Check size={14} strokeWidth={3} />
                      Publish Stitch
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ReelStitch;
