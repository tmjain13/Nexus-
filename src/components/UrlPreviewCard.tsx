import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Globe, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { secureFetch } from '../lib/secureFetch';


interface UrlMetadata {
  title: string;
  description: string;
  image: string | null;
  url: string;
  siteName: string;
}

interface UrlPreviewCardProps {
  url: string;
}

export default function UrlPreviewCard({ url }: UrlPreviewCardProps) {
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<UrlMetadata | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    const fetchMetadata = async () => {
      try {
        const response = await secureFetch(`/api/url-metadata?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
          throw new Error('Failed to retrieve hyperlink metadata');
        }
        const data = await response.json();
        if (active) {
          setMetadata(data);
          setLoading(false);
        }
      } catch (err) {
        console.warn('URL metadata fetch failed:', err);
        if (active) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchMetadata();

    return () => {
      active = false;
    };
  }, [url]);

  if (error) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block max-w-sm rounded-xl border border-zinc-200/60 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 transition-all text-xs font-mono select-none"
      >
        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <Globe size={13} className="shrink-0" />
          <span className="truncate flex-1 font-bold">{url}</span>
          <ExternalLink size={12} className="shrink-0" />
        </div>
      </a>
    );
  }

  if (loading) {
    return (
      <div className="mt-2 w-full max-w-md border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-950/20 rounded-2xl p-3 flex gap-3 animate-pulse">
        <div className="flex-1 space-y-2 py-1">
          <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4"></div>
          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-805 rounded w-3/4"></div>
          <div className="h-2.5 bg-zinc-150 dark:bg-zinc-850 rounded w-5/6"></div>
        </div>
        <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl shrink-0"></div>
      </div>
    );
  }

  if (!metadata) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mt-2.5 max-w-md w-full overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/70 hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all duration-300 shadow-sm"
    >
      <a
        href={metadata.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/60 dark:divide-zinc-800/60 h-full cursor-pointer"
      >
        {/* Texts Info */}
        <div className="flex-1 p-3.5 flex flex-col justify-between space-y-1.5 text-left min-w-0">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              <Globe size={11} className="shrink-0" />
              <span className="truncate">{metadata.siteName}</span>
            </div>
            <h4 className="text-[13px] font-extrabold text-zinc-900 dark:text-zinc-100 leading-snug truncate" title={metadata.title}>
              {metadata.title}
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
              {metadata.description}
            </p>
          </div>
          
          <span className="text-[9px] font-mono font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em] flex items-center gap-1">
            Browse Link <ExternalLink size={10} className="stroke-[2.5]" />
          </span>
        </div>

        {/* Image Preview */}
        {metadata.image && (
          <div className="sm:w-28 h-28 sm:h-auto shrink-0 bg-zinc-100 dark:bg-zinc-950 relative overflow-hidden">
            <img
              src={metadata.image}
              alt={metadata.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              onError={(e) => {
                // If hotlink image failing, remove container
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </a>
    </motion.div>
  );
}
