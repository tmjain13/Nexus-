import React from 'react';

interface DiffViewerProps {
  oldText: string;
  newText: string;
}

export function diffTexts(oldText: string, newText: string) {
  // A simple and reliable word/character diff using a classic DP LCS algorithm
  const words1 = oldText.split(/(\s+)/).filter(Boolean);
  const words2 = newText.split(/(\s+)/).filter(Boolean);
  
  const dp: number[][] = Array(words1.length + 1)
    .fill(null)
    .map(() => Array(words2.length + 1).fill(0));
  
  for (let i = 1; i <= words1.length; i++) {
    for (let j = 1; j <= words2.length; j++) {
      if (words1[i - 1] === words2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const result: { type: 'added' | 'removed' | 'equal'; text: string }[] = [];
  let i = words1.length;
  let j = words2.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && words1[i - 1] === words2[j - 1]) {
      result.unshift({ type: 'equal', text: words1[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', text: words2[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'removed', text: words1[i - 1] });
      i--;
    }
  }
  
  return result;
}

export default function DiffViewer({ oldText, newText }: DiffViewerProps) {
  const diffs = diffTexts(oldText, newText);

  return (
    <div className="p-3.5 rounded-2xl bg-zinc-950/40 border border-zinc-800/80 font-sans text-[13px] leading-relaxed whitespace-pre-wrap select-text">
      {diffs.map((part, idx) => {
        if (part.type === 'added') {
          return (
            <span
              key={idx}
              className="bg-emerald-500/10 text-emerald-400 px-1 py-0.5 rounded font-medium border border-emerald-500/20"
            >
              {part.text}
            </span>
          );
        }
        if (part.type === 'removed') {
          return (
            <span
              key={idx}
              className="bg-rose-500/10 text-rose-400 px-1 py-0.5 rounded line-through decoration-rose-500/50 border border-rose-500/20"
            >
              {part.text}
            </span>
          );
        }
        return (
          <span key={idx} className="text-zinc-300">
            {part.text}
          </span>
        );
      })}
    </div>
  );
}
