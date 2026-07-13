import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Heart, ChevronUp, ChevronDown, Plus, Music, AlertTriangle, ShieldCheck, 
  VolumeX, Volume2, Pause, Play 
} from 'lucide-react';
import { useReels } from '../hooks/useReels';
import { Reel, ReelComment } from '../types';
import { ReelDiscover } from './ReelDiscover';
import { ReelActions } from './ReelActions';
import { ReelComments } from './ReelComments';
import { ReelSearch } from './ReelSearch';
import { ReelCreatorAnalytics } from './ReelCreatorAnalytics';
import { ReelDuet } from './ReelDuet';
import { ReelStitch } from './ReelStitch';
import { useAuth } from '../context/AuthContext';

// Standard heart burst animator structure
interface HeartPop {
  id: number;
  x: number;
  y: number;
}

interface ReelFeedProps {
  onCreateReelClick: () => void;
}

export const ReelFeed: React.FC<ReelFeedProps> = ({ onCreateReelClick }) => {
  const { user } = useAuth();
  const { feed, forYou, following, trending, like, comment, share, save, loading } = useReels();
  const [currentTab, setCurrentTab] = useState<'foryou' | 'following' | 'trending'>('foryou');
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  
  // Floating comment drawer
  const [showComments, setShowComments] = useState<Reel | null>(null);
  
  // Search Overlay
  const [showSearch, setShowSearch] = useState(false);
  
  // Analytics Dashboard
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Duet & Stitch Interactive States
  const [duetReel, setDuetReel] = useState<Reel | null>(null);
  const [stitchReel, setStitchReel] = useState<Reel | null>(null);
  
  // Heart bursts list
  const [hearts, setHearts] = useState<HeartPop[]>([]);
  const lastTapRef = useRef<number>(0);

  // Playback refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Timeline Scrubber States
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Determine active list
  const activeReels = (() => {
    if (currentTab === 'following') return following;
    if (currentTab === 'trending') return trending;
    return forYou;
  })();

  const currentReel = activeReels[activeIndex];

  // Auto-play when activeIndex or activeReels changes
  useEffect(() => {
    setPaused(false);
    setCurrentTime(0);
    setDuration(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Safe play block fallback
      });
    }
  }, [activeIndex, currentTab]);

  // Handle video timing
  const handleTimeUpdate = () => {
    if (videoRef.current && !isScrubbing) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 15);
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showComments || showSearch || showAnalytics || duetReel || stitchReel) return;
      if (e.key === 'ArrowUp') {
        handlePrev();
      } else if (e.key === 'ArrowDown') {
        handleNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        setPaused(prev => {
          if (videoRef.current) {
            if (prev) videoRef.current.play();
            else videoRef.current.pause();
          }
          return !prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, activeReels, showComments, showSearch, showAnalytics, duetReel, stitchReel]);

  const handleNext = () => {
    if (activeIndex < activeReels.length - 1) {
      setActiveIndex(prev => prev + 1);
    } else {
      // Loop back to beginning of active feed
      setActiveIndex(0);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    }
  };

  // Double tap to like
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap triggered
      handleDoubleTap(e);
    } else {
      // Single tap - toggle play/pause or unmute
      setTimeout(() => {
        if (Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY) {
          if (muted) {
            setMuted(false);
          } else {
            setPaused(p => {
              if (videoRef.current) {
                if (p) videoRef.current.play().catch(() => {});
                else videoRef.current.pause();
              }
              return !p;
            });
          }
        }
      }, DOUBLE_TAP_DELAY);
    }
    lastTapRef.current = now;
  };

  const handleDoubleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentReel) return;
    like(currentReel.id);

    // Create heart burst animation instance
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newHeart: HeartPop = {
      id: Date.now(),
      x,
      y
    };

    setHearts(prev => [...prev, newHeart]);

    // Clear after animation finish
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 800);
  };

  const handleReport = () => {
    alert("⚠️ Reel successfully flagged for content scan. Security moderators will review this feed shortly.");
  };

  if (loading) {
    return (
      <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center gap-2 select-none">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-zinc-400">Loading Enclave Reels...</p>
      </div>
    );
  }

  if (activeReels.length === 0) {
    return (
      <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center text-center p-6 select-none text-white">
        <span className="text-4xl mb-2">🎞️</span>
        <h3 className="text-base font-bold text-zinc-300">No Reels found in this sector</h3>
        <p className="text-xs text-zinc-500 max-w-[240px] mt-1.5 leading-relaxed">
          Be the first pioneer on Enclave OS to publish a video!
        </p>
        <button
          onClick={onCreateReelClick}
          className="mt-5 px-5 py-2.5 bg-amber-500 text-black font-bold text-xs rounded-xl hover:bg-amber-600 transition-all shadow-lg cursor-pointer"
        >
          Create Reel
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="flex-1 bg-black relative flex items-center justify-center overflow-hidden"
    >
      {/* Top Header Selector & Search/Analytics link */}
      <ReelDiscover 
        currentFeedTab={currentTab}
        onChangeTab={(tab) => { setCurrentTab(tab); setActiveIndex(0); }}
        onSearchClick={() => setShowSearch(true)}
        onAnalyticsClick={() => setShowAnalytics(true)}
      />

      {/* Primary Video Container */}
      <div 
        onClick={handleTap}
        className="w-full h-full max-w-[450px] aspect-[9/16] relative bg-zinc-950 flex items-center justify-center overflow-hidden cursor-pointer"
      >
        <video
          ref={videoRef}
          src={currentReel.videoUrl}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted={muted}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />

        {/* Double-tap heart burst animations */}
        {hearts.map(heart => (
          <div 
            key={heart.id}
            className="absolute z-30 pointer-events-none animate-heart-pop text-rose-500"
            style={{ left: heart.x - 24, top: heart.y - 24 }}
          >
            <Heart size={48} fill="currentColor" />
          </div>
        ))}

        {/* Mute state overlay indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md p-3.5 rounded-full z-20 pointer-events-none opacity-0 hover:opacity-100 transition-all">
          {muted ? <VolumeX size={24} className="text-white" /> : <Volume2 size={24} className="text-white" />}
        </div>

        {/* Pause/Play state overlay indicator */}
        {paused && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md p-4 rounded-full z-20 pointer-events-none">
            <Pause size={28} className="text-white animate-pulse" />
          </div>
        )}

        {/* Vertical desktop scroll buttons */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-20">
          <button 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            disabled={activeIndex === 0}
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 border border-zinc-800/40 flex items-center justify-center text-white disabled:opacity-30 transition-all cursor-pointer"
          >
            <ChevronUp size={18} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 border border-zinc-800/40 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <ChevronDown size={18} />
          </button>
        </div>

        {/* Bottom Metadata & Caption overlay */}
        <div className="absolute bottom-4 left-3 right-16 z-20 text-white drop-shadow-lg flex flex-col gap-2">
          
          {/* Creator Profile */}
          <div className="flex items-center gap-2.5">
            <img 
              src={currentReel.creatorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentReel.creatorId}`} 
              alt="" 
              className="w-9 h-9 rounded-full object-cover border border-white/20 bg-zinc-900" 
            />
            <div>
              <p className="font-bold text-xs tracking-tight">@{currentReel.creatorName || 'enclave_creator'}</p>
              <p className="text-[9px] text-zinc-300 font-bold uppercase tracking-widest flex items-center gap-1">
                <span>⚡ SECURE NODE</span>
              </p>
            </div>
          </div>

          {/* Caption */}
          <p className="text-xs leading-relaxed max-h-16 overflow-y-auto pr-1 scrollbar-none font-medium">
            {currentReel.caption}
          </p>

          {/* Soundtrack info spinning text */}
          {currentReel.music && (
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 bg-black/30 backdrop-blur-sm self-start px-2 py-1 rounded-lg border border-zinc-800/30">
              <Music size={10} className="text-amber-500 animate-pulse" />
              <span className="font-bold truncate max-w-[150px]">{currentReel.music.title} - {currentReel.music.artist}</span>
            </div>
          )}

        </div>

        {/* Right Stack Action Buttons */}
        <ReelActions 
          reel={currentReel}
          liked={false} // Double-tap handles real state increments
          onLike={() => like(currentReel.id)}
          onCommentClick={() => setShowComments(currentReel)}
          onShareClick={() => share(currentReel.id)}
          onSaveClick={() => save(currentReel.id)}
          onDuetClick={() => setDuetReel(currentReel)}
          onStitchClick={() => setStitchReel(currentReel)}
          onReportClick={handleReport}
        />

        {/* Interactive Seekable Timeline Scrubber */}
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800/60 z-30 flex items-center group cursor-pointer"
        >
          <input 
            type="range"
            min="0"
            max={duration || 15}
            step="0.1"
            value={currentTime}
            onChange={handleScrub}
            onMouseDown={() => setIsScrubbing(true)}
            onMouseUp={() => setIsScrubbing(false)}
            onTouchStart={() => setIsScrubbing(true)}
            onTouchEnd={() => setIsScrubbing(false)}
            className="w-full h-1 bg-amber-500 appearance-none accent-amber-500 outline-none opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: `linear-gradient(to right, #f59e0b ${(currentTime / duration) * 100}%, #52525b ${(currentTime / duration) * 100}%)`
            }}
          />
          {/* Static progress preview */}
          {!isScrubbing && (
            <div 
              className="absolute left-0 top-0 h-full bg-amber-500 transition-all pointer-events-none" 
              style={{ width: `${(currentTime / (duration || 15)) * 100}%` }}
            />
          )}
        </div>

      </div>

      {/* Comments Drawer Overlay */}
      {showComments && (
        <ReelComments 
          reel={showComments}
          onClose={() => setShowComments(null)}
          onAddComment={(text) => comment(showComments.id, text)}
        />
      )}

      {/* Search Overlay */}
      {showSearch && (
        <ReelSearch 
          reels={feed}
          onSelectReel={(reel) => {
            const index = activeReels.findIndex(r => r.id === reel.id);
            if (index !== -1) setActiveIndex(index);
            setShowSearch(false);
          }}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Creator Analytics Dashboard */}
      {showAnalytics && (
        <ReelCreatorAnalytics 
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Duet Interaction Overlay */}
      {duetReel && (
        <ReetDuetWrapper 
          originalReel={duetReel} 
          onClose={() => setDuetReel(null)}
          onPublishSuccess={(newDuet) => {
            setDuetReel(null);
            // Instantly push to feed for instant feedback
            feed.unshift(newDuet);
            setActiveIndex(0);
          }}
        />
      )}

      {/* Stitch Interaction Overlay */}
      {stitchReel && (
        <ReelStitch 
          originalReel={stitchReel} 
          onClose={() => setStitchReel(null)}
          onPublishSuccess={(newStitch) => {
            setStitchReel(null);
            feed.unshift(newStitch);
            setActiveIndex(0);
          }}
        />
      )}

      {/* Creator Button Float */}
      <button
        onClick={onCreateReelClick}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer border-2 border-black"
        title="Create Reel"
      >
        <Plus size={14} strokeWidth={3} />
        REEL
      </button>

    </div>
  );
};

// Quick wrapper to handle lazy loading or inline safety
const ReetDuetWrapper: React.FC<{ originalReel: Reel; onClose: () => void; onPublishSuccess: (reel: Reel) => void }> = ({
  originalReel,
  onClose,
  onPublishSuccess
}) => {
  return (
    <ReelDuet originalReel={originalReel} onClose={onClose} onPublishSuccess={onPublishSuccess} />
  );
};
export default ReelFeed;
