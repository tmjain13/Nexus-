import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud } from 'lucide-react';

interface DragDropZoneProps {
  isDragging: boolean;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  label?: string;
}

export function DragDropZone({
  isDragging,
  onDragLeave,
  onDragOver,
  onDrop,
  label = "Drop files here to transmit...",
}: DragDropZoneProps) {
  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="w-full h-full border-2 border-dashed border-amber-500/50 rounded-2xl flex flex-col items-center justify-center gap-4 bg-amber-500/5 shadow-2xl shadow-amber-500/5"
          >
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 animate-bounce">
              <UploadCloud size={32} />
            </div>
            <div className="text-center">
              <p className="text-sm font-mono font-bold tracking-wider text-amber-500 uppercase">
                {label}
              </p>
              <p className="text-[11px] text-zinc-500 font-medium mt-1">
                Supports documents, images, and archives
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DragDropZone;
