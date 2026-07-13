import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical, Flame, Scissors, Copy } from 'lucide-react';
import { Reel } from '../types';

interface ReelActionsProps {
  reel: Reel;
  liked: boolean;
  onLike: () => void;
  onCommentClick: () => void;
  onShareClick: () => void;
  onSaveClick: () => void;
  onDuetClick: () => void;
  onStitchClick: () => void;
  onReportClick: () => void;
}

export const ReelActions: React.FC<ReelActionsProps> = ({
  reel,
  liked,
  onLike,
  onCommentClick,
  onShareClick,
  onSaveClick,
  onDuetClick,
  onStitchClick,
  onReportClick
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveInternal = () => {
    setIsSaved(!isSaved);
    onSaveClick();
  };

  return (
    <div id="reel_actions_column" className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20">
      
      {/* Like Button */}
      <div className="flex flex-col items-center">
        <button
          onClick={onLike}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
            liked 
              ? 'bg-rose-600 text-white animate-bounce' 
              : 'bg-zinc-950/60 backdrop-blur-md border border-zinc-800 text-white hover:bg-zinc-900/80'
          }`}
          title="Like"
        >
          <Heart size={22} fill={liked ? 'currentColor' : 'none'} className={liked ? 'text-white' : 'text-zinc-200'} />
        </button>
        <span className="text-[11px] font-bold text-white mt-1 drop-shadow-md">
          {reel.likes + (liked ? 1 : 0)}
        </span>
      </div>

      {/* Comment Button */}
      <div className="flex flex-col items-center">
        <button
          onClick={onCommentClick}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-950/60 backdrop-blur-md border border-zinc-800 text-white hover:bg-zinc-900/80 shadow-lg transition-all active:scale-95"
          title="Comments"
        >
          <MessageCircle size={22} className="text-zinc-200" />
        </button>
        <span className="text-[11px] font-bold text-white mt-1 drop-shadow-md">
          {reel.comments}
        </span>
      </div>

      {/* Share Button */}
      <div className="flex flex-col items-center">
        <button
          onClick={onShareClick}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-950/60 backdrop-blur-md border border-zinc-800 text-white hover:bg-zinc-900/80 shadow-lg transition-all active:scale-95"
          title="Share"
        >
          <Share2 size={22} className="text-zinc-200" />
        </button>
        <span className="text-[11px] font-bold text-white mt-1 drop-shadow-md">
          {reel.shares}
        </span>
      </div>

      {/* Save Button */}
      <div className="flex flex-col items-center">
        <button
          onClick={handleSaveInternal}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
            isSaved 
              ? 'bg-amber-500 text-black' 
              : 'bg-zinc-950/60 backdrop-blur-md border border-zinc-800 text-white hover:bg-zinc-900/80'
          }`}
          title="Save to Collection"
        >
          <Bookmark size={22} fill={isSaved ? 'currentColor' : 'none'} className={isSaved ? 'text-black' : 'text-zinc-200'} />
        </button>
        <span className="text-[11px] font-bold text-white mt-1 drop-shadow-md">
          {reel.saves + (isSaved ? 1 : 0)}
        </span>
      </div>

      {/* More Options Trigger */}
      <div className="relative flex flex-col items-center">
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-950/60 backdrop-blur-md border border-zinc-800 text-white hover:bg-zinc-900/80 shadow-lg transition-all active:scale-95"
          title="More Options"
        >
          <MoreVertical size={20} className="text-zinc-200" />
        </button>

        {showMoreMenu && (
          <div className="absolute right-14 bottom-0 bg-zinc-950 border border-zinc-800 rounded-2xl p-2.5 w-44 shadow-2xl flex flex-col gap-1 z-30">
            <button
              onClick={() => { onDuetClick(); setShowMoreMenu(false); }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white rounded-xl transition-all text-left w-full"
            >
              <Copy size={14} className="text-amber-500" />
              Duet Reaction
            </button>
            
            <button
              onClick={() => { onStitchClick(); setShowMoreMenu(false); }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white rounded-xl transition-all text-left w-full"
            >
              <Scissors size={14} className="text-amber-500" />
              Stitch 5s Clip
            </button>

            <div className="h-px bg-zinc-800 my-1" />

            <button
              onClick={() => { onReportClick(); setShowMoreMenu(false); }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all text-left w-full"
            >
              ⚠️ Report Reel
            </button>
          </div>
        )}
      </div>

      {/* Spinning Music Disc */}
      {reel.music && (
        <div className="mt-2 flex flex-col items-center">
          <div className="w-11 h-11 rounded-full bg-zinc-950 border-2 border-zinc-700/80 flex items-center justify-center overflow-hidden animate-spin [animation-duration:6s] shadow-xl">
            <img 
              src={reel.music.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'} 
              alt="" 
              className="w-7 h-7 rounded-full object-cover" 
            />
          </div>
        </div>
      )}

    </div>
  );
};
export default ReelActions;
