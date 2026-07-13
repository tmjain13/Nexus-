import { useState, useCallback } from 'react';
import { Song } from '../types';

export const useMusicPlayer = () => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback((song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const seek = useCallback((position: number) => {
    // Implement seek logic
  }, []);

  return { currentSong, isPlaying, play, pause, seek };
};
