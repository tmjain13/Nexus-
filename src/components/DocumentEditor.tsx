import React from 'react';
import { RotateCw, Trash2, ArrowLeft, ArrowRight, Check, Eye, RefreshCw, Upload } from 'lucide-react';
import { ScannedPage, ScannerFilter } from '../hooks/useDocumentScanner';

interface DocumentEditorProps {
  pages: ScannedPage[];
  activePageIndex: number;
  setActivePageIndex: (index: number) => void;
  onRotate: (id: string) => void;
  onApplyFilter: (id: string, filter: ScannerFilter) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
  onDelete: (id: string) => void;
  onReplacePage: (id: string, newUrl: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  pages,
  activePageIndex,
  setActivePageIndex,
  onRotate,
  onApplyFilter,
  onReorder,
  onDelete,
  onReplacePage,
  onConfirm,
  onCancel,
}) => {
  const activePage = pages[activePageIndex];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onReplacePage(id, event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getFilterStyle = (filter: ScannerFilter) => {
    switch (filter) {
      case 'bw':
        return 'contrast-200 grayscale brightness-105';
      case 'grayscale':
        return 'grayscale brightness-100 contrast-125';
      case 'enhanced':
        return 'contrast-135 saturate-125 brightness-110';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100" id="document-editor">
      {/* Top Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-850 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-full font-mono font-bold">
            PAGE {activePageIndex + 1} OF {pages.length}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Process Document
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Main Preview */}
        <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-6 relative">
          {activePage ? (
            <div className="relative max-w-full max-h-[60vh] md:max-h-[70vh] flex items-center justify-center">
              <img
                src={activePage.processedUrl}
                alt={`Scanned page ${activePageIndex + 1}`}
                style={{ transform: `rotate(${activePage.rotation}deg)` }}
                className={`max-w-full max-h-full rounded-lg shadow-2xl transition duration-300 border border-slate-800 ${getFilterStyle(activePage.filter)}`}
              />

              {/* Quick overlays */}
              <div className="absolute top-3 right-3 flex gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => onRotate(activePage.id)}
                  title="Rotate 90°"
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <label className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, activePage.id)}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => onDelete(activePage.id)}
                  title="Delete page"
                  className="p-1.5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Eye className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
              <p className="text-xs text-slate-500 font-mono">No pages captured yet</p>
            </div>
          )}

          {/* Quick Page Nav overlay */}
          {pages.length > 1 && (
            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
              <button
                disabled={activePageIndex === 0}
                onClick={() => setActivePageIndex(activePageIndex - 1)}
                className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full border border-slate-800 shadow-xl disabled:opacity-20 disabled:pointer-events-none pointer-events-auto transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                disabled={activePageIndex === pages.length - 1}
                onClick={() => setActivePageIndex(activePageIndex + 1)}
                className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full border border-slate-800 shadow-xl disabled:opacity-20 disabled:pointer-events-none pointer-events-auto transition"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="w-full md:w-80 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-850 p-4 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase mb-2">Enhancement Filters</h4>
              <div className="grid grid-cols-2 gap-2">
                {(['original', 'bw', 'grayscale', 'enhanced'] as ScannerFilter[]).map((f) => {
                  const isActive = activePage?.filter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => activePage && onApplyFilter(activePage.id, f)}
                      className={`py-2 px-3 text-xs rounded-xl font-bold tracking-wide transition border ${
                        isActive
                          ? 'bg-amber-500/10 border-amber-500/25 text-amber-500'
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white hover:border-slate-800'
                      }`}
                    >
                      {f === 'original' && 'Original'}
                      {f === 'bw' && 'B&W'}
                      {f === 'grayscale' && 'Grayscale'}
                      {f === 'enhanced' && 'Contrast Boost'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase mb-2">Page Grid & Reordering</h4>
              <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                {pages.map((p, idx) => {
                  const isActive = idx === activePageIndex;
                  return (
                    <div key={p.id} className="relative group">
                      <button
                        onClick={() => setActivePageIndex(idx)}
                        className={`w-full aspect-[3/4] rounded-lg overflow-hidden border bg-slate-950 p-0.5 relative transition ${
                          isActive ? 'border-amber-500 shadow-md shadow-amber-500/5' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={p.processedUrl}
                          className={`w-full h-full object-cover rounded ${getFilterStyle(p.filter)}`}
                          style={{ transform: `rotate(${p.rotation}deg)` }}
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/75 rounded text-[9px] font-mono text-slate-300">
                          {idx + 1}
                        </span>
                      </button>
                      
                      {/* Move Page Left/Right buttons */}
                      {pages.length > 1 && (
                        <div className="absolute top-1 left-1 right-1 opacity-0 group-hover:opacity-100 flex justify-between bg-black/60 rounded p-0.5 transition pointer-events-none">
                          <button
                            disabled={idx === 0}
                            onClick={() => onReorder(idx, idx - 1)}
                            className="p-0.5 hover:bg-slate-800 text-white rounded disabled:opacity-20 pointer-events-auto"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            disabled={idx === pages.length - 1}
                            onClick={() => onReorder(idx, idx + 1)}
                            className="p-0.5 hover:bg-slate-800 text-white rounded disabled:opacity-20 pointer-events-auto"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
            <h5 className="text-[10px] font-bold text-slate-400 font-mono mb-1">PRO TIPS:</h5>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              Use "Contrast Boost" to clarify faded ink, receipt tables, or pale handwritten whiteboard outlines before running text extraction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
