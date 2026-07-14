import React, { useState } from 'react';
import { 
  Copy, Check, Send, Shield, FolderPlus, Sparkles, ChevronRight, Edit2, 
  Receipt, FileText, Contact, CreditCard, RefreshCw, FileSignature, Save, ListTodo
} from 'lucide-react';
import { OCRResult } from '../hooks/useOCR';
import { DocumentTypeBadge } from './DocumentTypeBadge';

interface OCRPreviewProps {
  ocrResult: OCRResult;
  onSaveDocument: (editedText: string, finalType: OCRResult['documentType'], metadata: any, action: 'chat_image' | 'chat_pdf' | 'chat_text' | 'chat_both' | 'vault' | 'workspace') => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export const OCRPreview: React.FC<OCRPreviewProps> = ({
  ocrResult,
  onSaveDocument,
  onCancel,
  isSaving = false,
}) => {
  const [editedText, setEditedText] = useState(ocrResult.text);
  const [docType, setDocType] = useState<OCRResult['documentType']>(ocrResult.documentType);
  const [copied, setCopied] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);

  // Parse or edit metadata values live
  const [metadata, setMetadata] = useState<any>({ ...(ocrResult.metadata || {}), confidence: ocrResult.confidence });

  const handleCopy = () => {
    navigator.clipboard.writeText(editedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateMetadataField = (field: string, value: any) => {
    setMetadata((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedMetadataField = (parent: string, field: string, value: any) => {
    setMetadata((prev: any) => ({
      ...prev,
      [parent]: {
        ...(prev[parent] || {}),
        [field]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4" id="ocr-preview-modal">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-850 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">AI Document Core</h3>
            <p className="text-[10px] text-slate-500 font-mono">Neural extraction results and smart triggers</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
          {/* Left panel: Original data and detected smart metadata */}
          <div className="flex-1 overflow-y-auto p-5 border-b lg:border-b-0 lg:border-r border-slate-850 space-y-6">
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase mb-3">AI Intelligence</h4>
              <div className="flex items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-850">
                <div className="flex items-center gap-2">
                  <DocumentTypeBadge type={docType} />
                  <span className="text-[10px] text-slate-500 font-mono">
                    Confidence: {ocrResult.confidence || 95}%
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 text-[11px] rounded-lg px-2 py-1 text-slate-300 outline-none focus:border-amber-500 transition font-semibold"
                  >
                    <option value="receipt">Receipt</option>
                    <option value="contract">Contract</option>
                    <option value="note">Note</option>
                    <option value="business_card">Business Card</option>
                    <option value="id">Secure ID</option>
                    <option value="whiteboard">Whiteboard</option>
                    <option value="other">Other Document</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Smart fields based on type */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase mb-3">Smart Metadata Extracted</h4>
              
              {docType === 'receipt' && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
                    <Receipt className="w-4 h-4" />
                    <span>Receipt Diagnostics</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-1">Merchant</label>
                      <input
                        type="text"
                        value={metadata.merchant || ''}
                        onChange={(e) => updateMetadataField('merchant', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-emerald-500/50 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-1">Total Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={metadata.total || ''}
                        onChange={(e) => updateMetadataField('total', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-emerald-500/50 outline-none transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Date</label>
                    <input
                      type="text"
                      value={metadata.date || ''}
                      onChange={(e) => updateMetadataField('date', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-emerald-500/50 outline-none transition"
                    />
                  </div>
                </div>
              )}

              {docType === 'business_card' && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-3">
                  <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs mb-1">
                    <Contact className="w-4 h-4" />
                    <span>Business Card Info</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-1">Name</label>
                      <input
                        type="text"
                        value={metadata.contact?.name || ''}
                        onChange={(e) => updateNestedMetadataField('contact', 'name', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-purple-500/50 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-1">Company</label>
                      <input
                        type="text"
                        value={metadata.contact?.company || ''}
                        onChange={(e) => updateNestedMetadataField('contact', 'company', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-purple-500/50 outline-none transition"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-1">Phone</label>
                        <input
                          type="text"
                          value={metadata.contact?.phone || ''}
                          onChange={(e) => updateNestedMetadataField('contact', 'phone', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-purple-500/50 outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-1">Email</label>
                        <input
                          type="email"
                          value={metadata.contact?.email || ''}
                          onChange={(e) => updateNestedMetadataField('contact', 'email', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-purple-500/50 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {docType === 'contract' && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
                    <FileSignature className="w-4 h-4" />
                    <span>Contract Parameters</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Key Terms & Commitments</label>
                    <textarea
                      value={(metadata.keyTerms || []).join('\n')}
                      onChange={(e) => updateMetadataField('keyTerms', e.target.value.split('\n'))}
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-amber-500/50 outline-none transition resize-none font-sans"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-1">Target Action Dates</label>
                      <input
                        type="text"
                        value={(metadata.dates || []).join(', ')}
                        onChange={(e) => updateMetadataField('dates', e.target.value.split(','))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-amber-500/50 outline-none transition"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <label className="text-[10px] text-slate-500 font-semibold block mb-1">Signatures Found</label>
                      <div className="flex items-center gap-2 py-2">
                        <input
                          type="checkbox"
                          checked={metadata.signaturesFound || false}
                          onChange={(e) => updateMetadataField('signaturesFound', e.target.checked)}
                          className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-800 focus:ring-offset-slate-900"
                        />
                        <span className="text-xs text-slate-300 font-medium">Validly Signed</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {docType === 'id' && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-3">
                  <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs mb-1">
                    <CreditCard className="w-4 h-4" />
                    <span>ID Privacy Filters</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={metadata.name || ''}
                        onChange={(e) => updateMetadataField('name', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-rose-500/50 outline-none transition"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-1">ID/Passport Number</label>
                        <input
                          type="text"
                          value={metadata.idNumber || ''}
                          onChange={(e) => updateMetadataField('idNumber', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-rose-500/50 outline-none transition font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-1">Expiry Date</label>
                        <input
                          type="text"
                          value={metadata.expiryDate || ''}
                          onChange={(e) => updateMetadataField('expiryDate', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-rose-500/50 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {docType !== 'receipt' && docType !== 'business_card' && docType !== 'contract' && docType !== 'id' && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-850">
                  <div className="flex items-center gap-2 text-slate-400 font-semibold text-xs mb-2">
                    <FileText className="w-4 h-4" />
                    <span>General Document Notes</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                    This document structure contains clean visual flow paragraphs. Standard text commands are enabled below.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Extracted Editable Text and Smart Actions */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">Extracted Text Buffer</h4>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[10px] font-mono">{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => setIsEditingText(!isEditingText)}
                    className={`p-1.5 rounded-lg transition flex items-center gap-1.5 ${isEditingText ? 'bg-amber-500/10 text-amber-500' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono">{isEditingText ? 'View Only' : 'Edit'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 rounded-xl border border-slate-850 p-4 min-h-[300px] flex flex-col">
                {isEditingText ? (
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full flex-1 min-h-[250px] bg-transparent text-slate-300 text-xs leading-relaxed outline-none resize-none font-mono"
                    placeholder="Extracted text will appear here..."
                  />
                ) : (
                  <div className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-mono flex-1 overflow-y-auto max-h-[40vh]">
                    {editedText || <span className="text-slate-600 italic">No text extracted. Click Edit to add text.</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Smart Action Triggers and Send Options */}
            <div className="pt-5 border-t border-slate-850 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">Smart Dispatch & Storage Actions</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {/* Save Securely to Vault */}
                <button
                  onClick={() => onSaveDocument(editedText, docType, metadata, 'vault')}
                  disabled={isSaving}
                  className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl transition flex flex-col items-center justify-center text-center gap-1.5 text-slate-300 disabled:opacity-40"
                >
                  <Shield className="w-4 h-4 text-rose-500" />
                  <span className="text-[10px] font-bold">Save Securely (Vault)</span>
                </button>

                {/* Save to Workspace (Kanban/Notes) */}
                <button
                  onClick={() => onSaveDocument(editedText, docType, metadata, 'workspace')}
                  disabled={isSaving}
                  className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl transition flex flex-col items-center justify-center text-center gap-1.5 text-slate-300 disabled:opacity-40"
                >
                  <FolderPlus className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-bold">Save to Workspace</span>
                </button>

                {/* Send as Both Image & Text */}
                <button
                  onClick={() => onSaveDocument(editedText, docType, metadata, 'chat_both')}
                  disabled={isSaving}
                  className="p-3 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 hover:border-amber-500/30 rounded-xl transition flex flex-col items-center justify-center text-center gap-1.5 text-amber-500 disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Send Image + Text</span>
                </button>

                {/* Send as PDF */}
                <button
                  onClick={() => onSaveDocument(editedText, docType, metadata, 'chat_pdf')}
                  disabled={isSaving}
                  className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl transition flex flex-col items-center justify-center text-center gap-1.5 text-slate-300 disabled:opacity-40"
                >
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-bold">Send as PDF Document</span>
                </button>

                {/* Send Text Only */}
                <button
                  onClick={() => onSaveDocument(editedText, docType, metadata, 'chat_text')}
                  disabled={isSaving}
                  className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl transition flex flex-col items-center justify-center text-center gap-1.5 text-slate-300 disabled:opacity-40"
                >
                  <Send className="w-4 h-4 text-sky-500" />
                  <span className="text-[10px] font-bold">Send Text Only</span>
                </button>

                {/* Send Image Only */}
                <button
                  onClick={() => onSaveDocument(editedText, docType, metadata, 'chat_image')}
                  disabled={isSaving}
                  className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl transition flex flex-col items-center justify-center text-center gap-1.5 text-slate-300 disabled:opacity-40"
                >
                  <Send className="w-4 h-4 text-purple-500" />
                  <span className="text-[10px] font-bold">Send Image Only</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
