import React, { useState } from 'react';
import { 
  X, Calendar, Sparkles, Receipt, FileSignature, FileText, Contact, CreditCard, 
  Trash2, Signature, Plus, ShieldCheck, Download
} from 'lucide-react';
import { ScannedDocument } from '../hooks/useDocumentManager';
import { DocumentTypeBadge } from './DocumentTypeBadge';
import { SignaturePad } from './SignaturePad';

interface DocumentViewerProps {
  document: ScannedDocument;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onApplySignature?: (id: string, signatureUrl: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document: docItem,
  onClose,
  onDelete,
  onApplySignature,
}) => {
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isSigning, setIsSigning] = useState(false);
  const [signature, setSignature] = useState<string | null>(
    docItem.metadata?.signaturesFound && docItem.metadata?.signatureUrl 
      ? docItem.metadata.signatureUrl 
      : null
  );

  const activePage = docItem.pages[activePageIndex] || docItem.pages[0];

  const handleSaveSignature = (sigUrl: string) => {
    setSignature(sigUrl);
    setIsSigning(false);
    if (onApplySignature) {
      onApplySignature(docItem.id, sigUrl);
    }
  };

  const formattedDate = docItem.createdAt
    ? new Date(docItem.createdAt.seconds * 1000).toLocaleDateString()
    : 'Recently';

  const downloadText = () => {
    const blob = new Blob([docItem.extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docItem.documentType}_export_${docItem.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" id="document-viewer">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DocumentTypeBadge type={docItem.documentType} />
            <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px] font-bold">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate.toUpperCase()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to permanently delete this document scan?")) {
                    onDelete(docItem.id);
                    onClose();
                  }
                }}
                className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition"
                title="Delete document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Panel split layout */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
          {/* Left Panel: visual image gallery & placement overlay */}
          <div className="flex-1 bg-slate-950 p-6 flex flex-col items-center justify-center relative border-b lg:border-b-0 lg:border-r border-slate-850">
            {activePage ? (
              <div className="relative max-w-full max-h-[45vh] lg:max-h-[60vh] flex items-center justify-center">
                <img
                  src={activePage.processedUrl}
                  alt={`Doc page ${activePageIndex + 1}`}
                  className="max-w-full max-h-full rounded-lg shadow-xl border border-slate-800"
                />

                {/* Overlaid Signature if contract and signature exists */}
                {docItem.documentType === 'contract' && signature && (
                  <div className="absolute bottom-6 right-6 p-2 bg-white/95 backdrop-blur rounded-lg border border-emerald-500/30 flex flex-col items-center shadow-lg transform rotate-2">
                    <img src={signature} alt="Contract Signature" className="h-10 object-contain mix-blend-multiply" />
                    <div className="flex items-center gap-1 text-[8px] text-emerald-600 font-bold font-mono uppercase mt-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>BOUND SECURELY</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-600 font-mono">No preview image loaded</span>
            )}

            {/* Thumbnail Navigation */}
            {docItem.pages.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto py-1 max-w-md">
                {docItem.pages.map((p, idx) => {
                  const isCurrent = idx === activePageIndex;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActivePageIndex(idx)}
                      className={`w-10 h-12 rounded border bg-slate-900 overflow-hidden flex-shrink-0 transition ${isCurrent ? 'border-amber-500' : 'border-slate-850 hover:border-slate-800'}`}
                    >
                      <img src={p.processedUrl} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel: Parsed metadata fields + Editable text */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Type-Specific Smart Parameters */}
              {docItem.documentType === 'receipt' && docItem.metadata && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-3">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs font-sans">
                    <Receipt className="w-4 h-4" />
                    <span>Receipt Diagnostics</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">MERCHANT</span>
                      <span className="text-xs text-white font-bold">{docItem.metadata.merchant || 'Generic Store'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">TOTAL COST</span>
                      <span className="text-xs text-emerald-400 font-bold">${docItem.metadata.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                  {docItem.metadata.date && (
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">BILLING DATE</span>
                      <span className="text-xs text-slate-300 font-medium">{docItem.metadata.date}</span>
                    </div>
                  )}
                </div>
              )}

              {docItem.documentType === 'business_card' && docItem.metadata?.contact && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-3">
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs font-sans">
                    <Contact className="w-4 h-4" />
                    <span>Contact Diagnostics</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">NAME / ROLE</span>
                      <span className="text-xs text-white font-bold">{docItem.metadata.contact.name || 'Unavailable'}</span>
                    </div>
                    {docItem.metadata.contact.company && (
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block mb-0.5">COMPANY</span>
                        <span className="text-xs text-slate-300 font-semibold">{docItem.metadata.contact.company}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {docItem.metadata.contact.phone && (
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block mb-0.5">PHONE</span>
                          <span className="text-xs text-slate-300 font-mono font-bold">{docItem.metadata.contact.phone}</span>
                        </div>
                      )}
                      {docItem.metadata.contact.email && (
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block mb-0.5">EMAIL</span>
                          <span className="text-xs text-slate-300 font-semibold">{docItem.metadata.contact.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {docItem.documentType === 'contract' && docItem.metadata && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs font-sans">
                    <FileSignature className="w-4 h-4" />
                    <span>Contract Parameters</span>
                  </div>
                  {docItem.metadata.keyTerms && docItem.metadata.keyTerms.length > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">KEY TERMS</span>
                      <ul className="text-xs text-slate-300 list-disc list-inside space-y-1 font-medium">
                        {docItem.metadata.keyTerms.map((term: string, idx: number) => (
                          <li key={idx}>{term}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Signature control inside contracts */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-850">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-bold">DIGITAL SIGNATURE:</span>
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${signature ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {signature ? 'VALIDLY SIGNED' : 'PENDING'}
                      </span>
                    </div>

                    {!signature && (
                      <button
                        onClick={() => setIsSigning(true)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Apply Sign
                      </button>
                    )}
                  </div>
                </div>
              )}

              {docItem.documentType === 'id' && docItem.metadata && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-3">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs font-sans">
                    <CreditCard className="w-4 h-4" />
                    <span>Credential Parameters</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">FULL LEGAL NAME</span>
                      <span className="text-xs text-white font-bold">{docItem.metadata.name || 'Unavailable'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {docItem.metadata.idNumber && (
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block mb-0.5">ID/PASSPORT NUMBER</span>
                          <span className="text-xs text-rose-400 font-mono font-bold">●●●●●●●● {docItem.metadata.idNumber.slice(-4)}</span>
                        </div>
                      )}
                      {docItem.metadata.expiryDate && (
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block mb-0.5">EXPIRATION DATE</span>
                          <span className="text-xs text-slate-300 font-medium">{docItem.metadata.expiryDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Extracted text buffer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">Extracted Text Buffer</h4>
                  <button
                    onClick={downloadText}
                    className="text-[10px] font-bold font-mono text-amber-500 hover:text-amber-400 transition flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export .txt
                  </button>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 max-h-48 overflow-y-auto">
                  <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                    {docItem.extractedText || "No text buffer available."}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom info banner */}
            <div className="pt-4 border-t border-slate-850 text-center">
              <span className="text-[9px] text-slate-500 font-mono tracking-wider">
                DOCUMENT IDENTIFIER: {docItem.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature pad overlay */}
      {isSigning && (
        <SignaturePad
          onSave={handleSaveSignature}
          onClose={() => setIsSigning(false)}
        />
      )}
    </div>
  );
};
