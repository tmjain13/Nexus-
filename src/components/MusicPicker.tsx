import React, { useState } from 'react';
import { Search, Music } from 'lucide-react';
import { Song } from '../types';

interface MusicPickerProps {
  onSelect: (song: Song) => void;
}

export const MusicPicker: React.FC<MusicPickerProps> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  // Mock results for now
  const results: Song[] = [
    { id: '1', title: 'Song A', artist: 'Artist A', album: 'Album A', duration: 180, coverUrl: 'https://placehold.co/100x100', audioUrl: 'https://example.com/audio1.mp3', addedBy: 'me', addedAt: new Date() as any, votes: 0 },
  ];

  return (
    <div className="p-4 bg-slate-800 rounded-xl">
      <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-2 mb-4">
        <Search size={20} className="text-slate-400" />
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Search songs..."
          className="bg-transparent text-white w-full outline-none"
        />
      </div>
      <div className="space-y-2">
        {results.map(song => (
          <button key={song.id} onClick={() => onSelect(song)} className="flex items-center gap-3 w-full hover:bg-slate-700 p-2 rounded-lg">
            <img src={song.coverUrl} alt={song.title} className="w-10 h-10 rounded" />
            <div className="text-left">
              <div className="text-white font-medium">{song.title}</div>
              <div className="text-slate-400 text-xs">{song.artist}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
