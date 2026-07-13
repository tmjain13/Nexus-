import React, { useEffect, useRef, useState } from 'react';
import { Waves, SlidersHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';

interface AudioWaveformProps {
  url: string;
  isActive: boolean;
  progress: number;
  onSeek?: (percentage: number) => void;
}

export default function AudioWaveform({ url, isActive, progress, onSeek }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'waveform' | 'slider'>('waveform');

  useEffect(() => {
    const fetchAndProcess = async () => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        const rawData = audioBuffer.getChannelData(0);
        const samples = 40; // Number of bars
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData = [];
        for (let i = 0; i < samples; i++) {
          let blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum = sum + Math.abs(rawData[blockStart + j]);
          }
          filteredData.push(sum / blockSize);
        }
        
        // Normalize
        const multiplier = Math.pow(Math.max(...filteredData), -1);
        setAudioData(filteredData.map(n => n * multiplier));
      } catch (err) {
        console.error("Waveform generation failed", err);
      }
    };

    fetchAndProcess();
  }, [url]);

  useEffect(() => {
    if (viewMode !== 'waveform' || !canvasRef.current || audioData.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / audioData.length;
    const gap = 2;

    ctx.clearRect(0, 0, width, height);

    audioData.forEach((val, i) => {
      const barHeight = val * height;
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      // Color logic
      const isPlayed = (i / audioData.length) <= (progress / 100);
      if (isActive && isPlayed) {
        ctx.fillStyle = '#000000';
      } else {
        ctx.fillStyle = '#cbd5e1';
      }

      // Rounded rectangle for bar
      const radius = 2;
      ctx.beginPath();
      ctx.roundRect(x + gap/2, y, barWidth - gap, barHeight, radius);
      ctx.fill();
    });
  }, [audioData, progress, isActive, viewMode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    onSeek(percentage);
  };

  return (
    <div className="relative group/waveform min-h-[32px] flex items-center w-full">
      <button 
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setViewMode(prev => prev === 'waveform' ? 'slider' : 'waveform');
        }}
        className="absolute -right-2 -top-1 p-1 bg-white dark:bg-zinc-800 rounded-full shadow-md opacity-0 group-hover/waveform:opacity-100 transition-opacity z-20 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
        title={viewMode === 'waveform' ? "Switch to Slider" : "Switch to Waveform"}
      >
        {viewMode === 'waveform' ? <SlidersHorizontal size={10} className="text-zinc-500" /> : <Waves size={10} className="text-zinc-500" />}
      </button>

      {viewMode === 'waveform' ? (
        <canvas 
          ref={canvasRef} 
          width={240} 
          height={32} 
          onClick={handleCanvasClick}
          className="w-full h-8 cursor-pointer rounded"
        />
      ) : (
        <div className="w-full h-8 flex items-center px-1">
          <input 
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            onChange={(e) => {
              e.stopPropagation();
              onSeek?.(parseFloat(e.target.value));
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-wa-primary focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
