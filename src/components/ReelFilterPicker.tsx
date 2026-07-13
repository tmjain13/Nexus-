import React from 'react';
import { Sparkles, Sun, Eye, Heart, Layers } from 'lucide-react';

interface ReelFilterPickerProps {
  onSelectFilter: (filter: string) => void;
  selectedFilter: string;
  onSelectEffect: (effect: string) => void;
  selectedEffect: string;
}

export interface FilterOption {
  name: string;
  class: string;
  style: string;
  icon: string;
}

export const FILTERS_LIST: FilterOption[] = [
  { name: 'Normal', class: '', style: '', icon: '🌟' },
  { name: 'Cyberpunk', class: 'hue-rotate-15 contrast-125 saturate-150', style: 'hue-rotate(15deg) contrast(1.25) saturate(1.5)', icon: '🧬' },
  { name: 'Vintage', class: 'sepia contrast-85 brightness-95', style: 'sepia(1) contrast(0.85) brightness(0.95)', icon: '🎞️' },
  { name: 'Noir B&W', class: 'grayscale contrast-125 brightness-90', style: 'grayscale(1) contrast(1.25) brightness(0.9)', icon: '🖤' },
  { name: 'Warm Sun', class: 'sepia-20 brightness-105 saturate-110 hue-rotate-10', style: 'sepia(0.2) brightness(1.05) saturate(1.1) hue-rotate(10deg)', icon: '☀️' },
  { name: 'Glitch Cool', class: 'hue-rotate-180 saturate-125 contrast-110', style: 'hue-rotate(180deg) saturate(1.25) contrast(1.10)', icon: '🌀' },
  { name: 'Dreamy', class: 'blur-[0.5px] brightness-110 saturate-90 contrast-95', style: 'blur(0.5px) brightness(1.1) saturate(0.9) contrast(0.95)', icon: '☁️' },
  { name: 'Neon Pink', class: 'hue-rotate-[320deg] saturate-150 contrast-120', style: 'hue-rotate(320deg) saturate(1.5) contrast(1.2)', icon: '🌸' },
  { name: 'Matrix Green', class: 'hue-rotate-[90deg] saturate-120 contrast-130 brightness-95', style: 'hue-rotate(90deg) saturate(1.2) contrast(1.3) brightness(0.95)', icon: '🟢' },
  { name: 'Polaroid', class: 'sepia-30 saturate-120 contrast-90 brightness-110', style: 'sepia(0.3) saturate(1.2) contrast(0.9) brightness(1.1)', icon: '📷' },
  { name: 'Teal & Orange', class: 'hue-rotate-[15deg] saturate-135 contrast-115 brightness-100', style: 'hue-rotate(15deg) saturate(1.35) contrast(1.15) brightness(1.0)', icon: '🍊' },
  { name: 'Acid Rain', class: 'hue-rotate-[120deg] saturate-200 contrast-150', style: 'hue-rotate(120deg) saturate(2.0) contrast(1.5)', icon: '🧪' },
  { name: 'Solitude', class: 'grayscale-30 brightness-90 saturate-70 contrast-105', style: 'grayscale(0.3) brightness(0.9) saturate(0.7) contrast(1.05)', icon: '❄️' },
  { name: 'Sunset Glow', class: 'sepia-10 saturate-150 contrast-105 hue-rotate-15', style: 'sepia(0.1) saturate(1.5) contrast(1.05) hue-rotate(15deg)', icon: '🌅' },
  { name: 'Midnight', class: 'brightness-75 contrast-110 saturate-110 hue-rotate-[240deg]', style: 'brightness(0.75) contrast(1.1) saturate(1.1) hue-rotate(240deg)', icon: '🌃' },
  { name: 'Golden Hour', class: 'sepia-40 saturate-130 brightness-105', style: 'sepia(0.4) saturate(1.3) brightness(1.05)', icon: '🌇' },
  { name: 'Vibrant Pop', class: 'saturate-200 contrast-110', style: 'saturate(2.0) contrast(1.1)', icon: '🎈' },
  { name: 'Ethereal', class: 'brightness-115 contrast-90 saturate-80 blur-[0.3px]', style: 'brightness(1.15) contrast(0.9) saturate(0.8) blur(0.3px)', icon: '✨' },
  { name: 'Cold Steel', class: 'hue-rotate-[200deg] saturate-90 brightness-95 contrast-105', style: 'hue-rotate(200deg) saturate(0.9) brightness(0.95) contrast(1.05)', icon: '🛡️' },
  { name: 'Fairy Tale', class: 'hue-rotate-[340deg] saturate-110 brightness-110 contrast-100', style: 'hue-rotate(340deg) saturate(1.1) brightness(1.1) contrast(1.0)', icon: '🦄' },
  { name: 'Chroma Glitch', class: 'hue-rotate-[280deg] saturate-175 contrast-125', style: 'hue-rotate(280deg) saturate(1.75) contrast(1.25)', icon: '🔮' }
];

export const EFFECTS_LIST = [
  { name: 'None', icon: '❌', description: 'No face or AI effect' },
  { name: 'AI Skin Glow', icon: '✨', description: 'Subtle beauty skin clearing, no face shape distortion' },
  { name: 'AI Face Portrait', icon: '👤', description: 'Soft portrait bokeh background isolation' },
  { name: 'Background Remove', icon: '🌌', description: 'Isolates person, replaces background with digital Enclave space' },
  { name: 'Beat Flash', icon: '💓', description: 'Video flashes gently to the sound beat transitions' },
  { name: 'Motion Trails', icon: '🌠', description: 'AI estimated motion ghosting trails' }
];

export const ReelFilterPicker: React.FC<ReelFilterPickerProps> = ({
  onSelectFilter,
  selectedFilter,
  onSelectEffect,
  selectedEffect
}) => {
  return (
    <div id="reel_filter_picker" className="flex flex-col bg-zinc-950/95 text-white border-t border-zinc-800 p-4 select-none">
      
      {/* 20+ Filters Section */}
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2.5 flex items-center gap-1.5">
          <Layers size={12} />
          AI Video Filters ({FILTERS_LIST.length})
        </p>
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {FILTERS_LIST.map((filter) => (
            <button
              key={filter.name}
              onClick={() => onSelectFilter(filter.name)}
              className={`flex flex-col items-center flex-shrink-0 cursor-pointer transition-all ${
                selectedFilter === filter.name ? 'scale-105' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div 
                className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl border-2 transition-all ${
                  selectedFilter === filter.name 
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/15' 
                    : 'border-zinc-800 bg-zinc-900'
                }`}
                style={{ filter: filter.style }}
              >
                {filter.icon}
              </div>
              <span className="text-[10px] font-medium mt-1.5 text-zinc-300 whitespace-nowrap">
                {filter.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Face Effects Section */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2.5 flex items-center gap-1.5">
          <Sparkles size={12} />
          Privacy-First AI Effects ({EFFECTS_LIST.length})
        </p>
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {EFFECTS_LIST.map((effect) => (
            <button
              key={effect.name}
              onClick={() => onSelectEffect(effect.name)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border flex-shrink-0 transition-all cursor-pointer ${
                selectedEffect === effect.name 
                  ? 'border-amber-500 bg-amber-500/15 text-white' 
                  : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-400'
              }`}
            >
              <span className="text-lg">{effect.icon}</span>
              <div className="text-left">
                <p className="text-[11px] font-bold">{effect.name}</p>
                <p className="text-[9px] text-zinc-500 max-w-[120px] truncate">{effect.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
export default ReelFilterPicker;
