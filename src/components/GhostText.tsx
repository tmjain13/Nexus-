import React from 'react';

interface GhostTextProps {
  typedText: string;
  suggestion: string;
}

export function GhostText({ typedText, suggestion }: GhostTextProps) {
  if (!suggestion) return null;

  return (
    <div className="absolute inset-y-0 left-0 right-0 px-1 py-2 text-[14px] font-medium font-sans pointer-events-none flex items-center select-none whitespace-pre overflow-hidden">
      {/* Invisible typed text to push the ghost suggestion to the exact caret location */}
      <span className="opacity-0">{typedText}</span>
      {/* Ghost suggestion text */}
      <span className="text-zinc-400 dark:text-zinc-500 italic transition-opacity duration-150">
        {suggestion}
      </span>
    </div>
  );
}
