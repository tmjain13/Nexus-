import React, { useState, useCallback } from 'react';

export function useDragDrop(onDropCallback?: (files: File[]) => void) {
  const [isDragging, setIsDragging] = useState(false);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDropTarget(targetId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDropTarget(null);

    const files: File[] = [];
    if (e.dataTransfer && e.dataTransfer.files) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        files.push(e.dataTransfer.files[i]);
      }
    }

    if (files.length > 0 && onDropCallback) {
      onDropCallback(files);
    }
  }, [onDropCallback]);

  return {
    isDragging,
    dropTarget,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  };
}

export default useDragDrop;
