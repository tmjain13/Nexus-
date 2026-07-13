import React, { useRef, useState, useEffect } from 'react';
import { 
  X, Camera, RefreshCw, Zap, ZapOff, Check, Image as ImageIcon, Sparkles, AlertTriangle
} from 'lucide-react';
import { useDocumentScanner, ScannedPage, ScannerFilter } from '../hooks/useDocumentScanner';
import { useOCR } from '../hooks/useOCR';
import { DocumentEditor } from './DocumentEditor';
import { OCRPreview } from './OCRPreview';

interface DocumentScannerProps {
  onClose: () => void;
  onDispatchDocument: (
    rawPages: ScannedPage[], 
    extractedText: string, 
    documentType: any, 
    metadata: any, 
    action: string
  ) => void;
  chatId?: string;
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({
  onClose,
  onDispatchDocument,
  chatId,
}) => {
  const {
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
  } = useDocumentScanner();

  const { runOCR, loading: ocrLoading, error: ocrError, result: ocrResult, clearResult } = useOCR();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera Settings States
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [step, setStep] = useState<'capture' | 'edit' | 'ocr_preview'>('capture');

  // simulated steady progress for auto-capture
  const [steadyProgress, setSteadyProgress] = useState(0);
  const [isSteady, setIsSteady] = useState(false);

  // Initialize camera stream
  const startCamera = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn("Video playback interrupted", e));
      }
      setCameraPermission('granted');
      setIsCapturing(true);
    } catch (err) {
      console.error("Camera access failed", err);
      setCameraPermission('denied');
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    if (step === 'capture') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [facingMode, step]);

  // Handle steady check and auto-capture timer simulation
  useEffect(() => {
    if (!isCapturing || step !== 'capture') return;

    // Simulate edge detection & steadiness
    const interval = setInterval(() => {
      // Simulate random alignment correctness (steadiness)
      const isAligned = Math.random() > 0.3;
      setIsSteady(isAligned);

      if (isAligned && isBatchMode) {
        setSteadyProgress(prev => {
          if (prev >= 100) {
            handleCapture();
            return 0;
          }
          return prev + 25; // Speed up capture for auto batch
        });
      } else if (isAligned) {
        setSteadyProgress(prev => {
          if (prev >= 100) {
            handleCapture();
            return 0;
          }
          return prev + 10;
        });
      } else {
        setSteadyProgress(0);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isCapturing, isBatchMode, step]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Capture current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    addPage(dataUrl);

    // Flash animation effect
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 bg-white z-50 animate-flash';
    video.parentElement?.appendChild(overlay);
    setTimeout(() => overlay.remove(), 250);

    // If single capture and not batch mode, proceed to edit
    if (!isBatchMode) {
      setStep('edit');
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file: any) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            addPage(event.target.result as string);
            setStep('edit');
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleReplacePage = (id: string, newUrl: string) => {
    // Simply remove page, replace at same slot
    // For extreme simplicity, replace the URL inside our state
    const idx = pages.findIndex(p => p.id === id);
    if (idx !== -1) {
      pages[idx].imageUrl = newUrl;
      pages[idx].processedUrl = newUrl;
      pages[idx].filter = 'original';
      pages[idx].rotation = 0;
      setActivePageIndex(idx);
    }
  };

  const triggerOCRProcessing = async () => {
    if (pages.length === 0) return;
    // Extract first page or a combined canvas image to send for OCR.
    // In our case, we will send the active page's filtered/processed data URL.
    const activeProcessedPage = pages[activePageIndex] || pages[0];

    // Combine all pages if desired, but since we are sending a single visual image to the vision API,
    // sending the main page is extremely robust.
    await runOCR(activeProcessedPage.processedUrl);
    setStep('ocr_preview');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden" id="nexus-document-scanner">
      {step === 'capture' && (
        <div className="flex-1 flex flex-col relative">
          {/* Header Controls */}
          <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-20 flex items-center justify-between">
            <button onClick={onClose} className="p-2 bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white rounded-full transition">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 rounded-full border border-slate-800 text-[11px] font-mono font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>SCANNER MODULE ENGAGED</span>
            </div>
            <button onClick={handleFlipCamera} className="p-2 bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white rounded-full transition">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Camera Frame / Viewport */}
          <div className="flex-1 flex items-center justify-center bg-slate-950 relative overflow-hidden">
            {cameraPermission === 'granted' ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Simulated edge-detection blue guides overlay */}
                <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                  <div className="relative w-full max-w-sm aspect-[3/4] border border-dashed border-sky-500/20 rounded-2xl flex items-center justify-center">
                    {/* Corner Amber Guides */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-amber-500 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-amber-500 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-amber-500 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-amber-500 rounded-br-xl" />

                    {/* Auto Capture Info */}
                    <div className="absolute top-4 inset-x-4 text-center bg-black/60 backdrop-blur-sm py-2 px-3 rounded-xl border border-slate-800/40">
                      <span className="text-[10px] font-bold text-slate-300 block mb-0.5 uppercase tracking-wider">
                        {isSteady ? "Steady... Aligning edges" : "Align document within guides"}
                      </span>
                      {steadyProgress > 0 && (
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                          <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${steadyProgress}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 space-y-4">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Camera Resource Restricted</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium leading-relaxed">
                    Camera permissions were declined. Please configure device options or upload existing images below.
                  </p>
                </div>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl cursor-pointer hover:bg-amber-400 transition">
                  <ImageIcon className="w-4 h-4" />
                  <span>Choose from Gallery</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Bottom Control Sheet */}
          <div className="p-6 bg-gradient-to-t from-black via-black/95 to-transparent z-20 flex flex-col items-center gap-5">
            {/* Batch mode toggle & page count */}
            <div className="flex items-center justify-between w-full max-w-sm">
              <button
                onClick={() => setIsBatchMode(!isBatchMode)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition ${isBatchMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
              >
                {isBatchMode ? 'BATCH SCAN ACTIVE' : 'SINGLE PAGE MODE'}
              </button>

              {pages.length > 0 && (
                <button
                  onClick={() => setStep('edit')}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5"
                >
                  <span>Review Scans</span>
                  <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded-full font-mono font-bold text-[9px]">
                    {pages.length}
                  </span>
                </button>
              )}
            </div>

            {/* Shutter Button container */}
            <div className="flex items-center justify-between w-full max-w-xs">
              {/* Gallery Access icon */}
              <label className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 hover:text-white transition cursor-pointer">
                <ImageIcon className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
              </label>

              {/* Central Capture Shutter */}
              <button
                disabled={cameraPermission !== 'granted'}
                onClick={handleCapture}
                className="w-18 h-18 rounded-full border-4 border-slate-800 p-1 flex items-center justify-center hover:border-amber-500 transition disabled:opacity-40"
              >
                <div className="w-full h-full bg-white hover:bg-amber-500 rounded-full transition shadow-lg flex items-center justify-center">
                  <Camera className="w-6 h-6 text-slate-950" />
                </div>
              </button>

              {/* Flash Toggle dummy */}
              <button
                onClick={() => setFlashEnabled(!flashEnabled)}
                className={`p-3 border rounded-2xl transition ${flashEnabled ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-slate-900/60 border-slate-800 text-slate-400'}`}
              >
                {flashEnabled ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'edit' && (
        <DocumentEditor
          pages={pages}
          activePageIndex={activePageIndex >= 0 ? activePageIndex : 0}
          setActivePageIndex={setActivePageIndex}
          onRotate={rotatePage}
          onApplyFilter={applyFilterToPage}
          onReorder={reorderPages}
          onDelete={removePage}
          onReplacePage={handleReplacePage}
          onConfirm={triggerOCRProcessing}
          onCancel={() => setStep('capture')}
        />
      )}

      {step === 'ocr_preview' && ocrResult && (
        <OCRPreview
          ocrResult={ocrResult}
          onSaveDocument={(editedText, finalType, metadata, action) => {
            onDispatchDocument(pages, editedText, finalType, metadata, action);
            onClose();
          }}
          onCancel={() => setStep('edit')}
        />
      )}

      {/* Loading Overlay */}
      {ocrLoading && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-850 border-t-amber-500 animate-spin" />
            <Sparkles className="w-6 h-6 text-amber-500 absolute top-5 left-5 animate-pulse" />
          </div>
          <div className="text-center">
            <h4 className="text-sm font-bold text-white mb-1 font-sans">Cognitive OCR Extractor</h4>
            <p className="text-[10px] text-slate-500 font-mono">Gemini Core is analyzing layout formatting structure...</p>
          </div>
        </div>
      )}
    </div>
  );
};
