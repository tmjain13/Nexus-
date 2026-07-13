import { useState } from 'react';

export type ScannerFilter = 'original' | 'bw' | 'grayscale' | 'enhanced';

export interface ScannedPage {
  id: string;
  imageUrl: string;      // Base64 or object URL of captured image
  processedUrl: string;  // Base64 or object URL of filtered image
  filter: ScannerFilter;
  rotation: number;      // 0, 90, 180, 270 degrees
}

export function useDocumentScanner() {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState<number>(-1);

  const addPage = (imageUrl: string) => {
    const newPage: ScannedPage = {
      id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      imageUrl,
      processedUrl: imageUrl,
      filter: 'original',
      rotation: 0
    };
    setPages(prev => [...prev, newPage]);
    setActivePageIndex(pages.length);
  };

  const removePage = (id: string) => {
    setPages(prev => {
      const idx = prev.findIndex(p => p.id === id);
      const updated = prev.filter(p => p.id !== id);
      if (idx === activePageIndex) {
        setActivePageIndex(updated.length > 0 ? Math.max(0, idx - 1) : -1);
      } else if (idx < activePageIndex) {
        setActivePageIndex(prev => prev - 1);
      }
      return updated;
    });
  };

  const clearScanner = () => {
    setPages([]);
    setIsCapturing(false);
    setActivePageIndex(-1);
  };

  const rotatePage = (id: string) => {
    setPages(prev => prev.map(p => {
      if (p.id !== id) return p;
      const nextRotation = (p.rotation + 90) % 360;
      return { ...p, rotation: nextRotation };
    }));
  };

  const applyFilterToPage = async (id: string, filter: ScannerFilter) => {
    setPages(prev => prev.map(p => {
      if (p.id !== id) return p;

      // Filter implementation via Canvas inside component or simulated on server
      // We'll update the filter type here, and let the UI component apply the actual CSS / Canvas transform.
      return { ...p, filter };
    }));
  };

  const reorderPages = (startIndex: number, endIndex: number) => {
    setPages(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  return {
    pages,
    isCapturing,
    setIsCapturing,
    activePageIndex,
    setActivePageIndex,
    addPage,
    removePage,
    clearScanner,
    rotatePage,
    applyFilterToPage,
    reorderPages
  };
}
