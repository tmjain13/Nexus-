import React, { useRef, useEffect } from 'react';

interface ResizablePanelProps {
  width: number;
  onResize: (newWidth: number) => void;
  minWidth?: number;
  maxWidth?: number;
}

export function ResizablePanel({
  width,
  onResize,
  minWidth = 280,
  maxWidth = 500,
}: ResizablePanelProps) {
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      // Get exact horizontal position
      const newWidth = e.clientX - 80; // Offset for left SideNav sidebar (80px)
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        onResize(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.classList.remove('select-none');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onResize, minWidth, maxWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.classList.add('select-none');
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-[3px] bg-transparent hover:bg-amber-500/30 active:bg-amber-500 transition-colors cursor-col-resize h-full relative group shrink-0"
      title="Drag to resize panels"
    >
      {/* Decorative vertical glowing visual line inside hover handle */}
      <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-amber-500/10 pointer-events-none transition-all duration-300" />
    </div>
  );
}

export default ResizablePanel;
