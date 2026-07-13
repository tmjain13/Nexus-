import React from 'react';
import { Play } from 'lucide-react';
import { Song } from '../types';

interface SongBubbleProps {
  song: Song;
  onPlay: () => void;
}

export const SongBubble: React.FC<SongBubbleProps> = ({ song, onPlay }) => {
  return (
    <div className="bg-slate-800 rounded-xl p-3 flex gap-3 items-center">
      <div className="relative">
        <img src={song.coverUrl} alt={song.title} className="w-12 h-12 rounded-lg shadow" />
        <button onClick={onPlay} className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg hover:bg-black/20">
          <Play size={20} className="text-white" fill="currentColor" />
        </button>
      </div>
      <div className="flex-1 truncate">
        <div className="text-white font-medium truncate">{song.title}</div>
        <div className="text-slate-400 text-xs truncate">{song.artist}</div>
      </div>
    </div>
  );
};
