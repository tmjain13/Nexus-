import React, { useState } from 'react';
import { 
  Search, Filter, Calendar, Grid, List, Sparkles, FolderOpen, ArrowRight, Eye, FileText, Trash2
} from 'lucide-react';
import { useDocumentManager, ScannedDocument } from '../hooks/useDocumentManager';
import { DocumentTypeBadge } from './DocumentTypeBadge';
import { DocumentViewer } from './DocumentViewer';

export const DocumentManager: React.FC = () => {
  const { documents, loading, error, deleteDocument } = useDocumentManager();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewingDoc, setViewingDoc] = useState<ScannedDocument | null>(null);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.extractedText.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (doc.metadata?.merchant && doc.metadata.merchant.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (doc.metadata?.name && doc.metadata.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || doc.documentType === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6" id="document-manager">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-500" />
            <span>Document Hub</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono">Manage secure document scans & AI Extractions</p>
        </div>

        {/* Filter / Search Bar controls */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search extracted text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:border-amber-500/50 outline-none transition font-medium"
            />
          </div>

          {/* Type dropdown */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs rounded-xl py-2 px-3.5 text-slate-300 font-bold tracking-wide outline-none focus:border-amber-500 transition w-full sm:w-auto appearance-none pr-8 cursor-pointer"
            >
              <option value="all">ALL TYPES</option>
              <option value="receipt">RECEIPTS</option>
              <option value="contract">CONTRACTS</option>
              <option value="note">NOTES</option>
              <option value="business_card">BUSINESS CARDS</option>
              <option value="id">SECURE IDS</option>
              <option value="whiteboard">WHITEBOARDS</option>
              <option value="other">OTHER</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-slate-800 border-t-amber-500 animate-spin" />
          <span className="text-xs text-slate-500 font-mono">Synchronizing scans...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
          <span className="text-xs text-red-400 font-semibold font-mono">Sync Error: {error}</span>
        </div>
      )}

      {/* Documents Grid */}
      {!loading && !error && (
        filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDocs.map((docItem) => {
              const mainPage = docItem.pages[0];
              const dateString = docItem.createdAt
                ? new Date(docItem.createdAt.seconds * 1000).toLocaleDateString()
                : 'Recently';

              return (
                <div 
                  key={docItem.id}
                  className="bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between group transition duration-300 hover:-translate-y-0.5 shadow-lg"
                >
                  {/* Thumbnail Cover */}
                  <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden flex items-center justify-center p-2 border-b border-slate-850">
                    {mainPage ? (
                      <img 
                        src={mainPage.processedUrl} 
                        className="max-h-full max-w-full rounded shadow-md group-hover:scale-[1.02] transition duration-500" 
                      />
                    ) : (
                      <FileText className="w-10 h-10 text-slate-700" />
                    )}

                    {/* Quick view layer */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                      <button 
                        onClick={() => setViewingDoc(docItem)}
                        className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg hover:bg-amber-400 transition flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </div>

                    {/* Page counter badge */}
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/75 rounded text-[9px] font-mono text-slate-400 font-bold">
                      {docItem.pages.length} {docItem.pages.length === 1 ? 'PAGE' : 'PAGES'}
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <DocumentTypeBadge type={docItem.documentType} />
                        <span className="text-[10px] text-slate-500 font-mono font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {dateString}
                        </span>
                      </div>

                      {/* Snippet / Title depending on type */}
                      <p className="text-xs font-bold text-white tracking-wide truncate">
                        {docItem.documentType === 'receipt' && docItem.metadata?.merchant ? `${docItem.metadata.merchant}` : ''}
                        {docItem.documentType === 'business_card' && docItem.metadata?.contact?.name ? `${docItem.metadata.contact.name}` : ''}
                        {docItem.documentType === 'id' && docItem.metadata?.name ? `${docItem.metadata.name}` : ''}
                        {(!docItem.metadata?.merchant && !docItem.metadata?.contact?.name && !docItem.metadata?.name) && `Scan Ref: ${docItem.id.slice(-6).toUpperCase()}`}
                      </p>

                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed font-mono font-medium">
                        {docItem.extractedText || "No text buffer loaded."}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-850 flex items-center justify-between gap-2">
                      <span className="text-[9px] text-slate-500 font-mono tracking-wider truncate w-1/2">
                        CONF: {docItem.metadata?.confidence || '95'}%
                      </span>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to permanently delete this scan?")) {
                            deleteDocument(docItem.id);
                          }
                        }}
                        className="p-1 hover:bg-red-500/10 text-slate-600 hover:text-red-400 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-slate-900 border border-slate-850 rounded-3xl flex flex-col items-center justify-center gap-3">
            <FolderOpen className="w-8 h-8 text-slate-700 animate-pulse" />
            <div>
              <h4 className="text-sm font-bold text-slate-300">No matching scans found</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5 leading-relaxed font-medium">
                Try clearing search terms or start scanning documents from the active chat attachment options sheet.
              </p>
            </div>
          </div>
        )
      )}

      {/* Full Document Viewer Modal */}
      {viewingDoc && (
        <DocumentViewer
          document={viewingDoc}
          onClose={() => setViewingDoc(null)}
          onDelete={deleteDocument}
        />
      )}
    </div>
  );
};
