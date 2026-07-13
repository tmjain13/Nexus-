import React from 'react';
import { FileText, Image as ImageIcon, Paperclip, Download, Eye } from 'lucide-react';
import { EmailAttachment } from '../../hooks/useEmailInbox';

interface EmailAttachmentViewerProps {
  attachments: EmailAttachment[];
  onPreview?: (attachment: EmailAttachment) => void;
}

export function EmailAttachmentViewer({ attachments, onPreview }: EmailAttachmentViewerProps) {
  if (!attachments || attachments.length === 0) return null;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-amber-500" />;
    return <FileText className="w-5 h-5 text-blue-400" />;
  };

  return (
    <div className="mt-4 border-t border-slate-700/50 pt-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-2">
        <Paperclip className="w-3.5 h-3.5" />
        <span>Attachments ({attachments.length})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {attachments.map((file, idx) => {
          const isImg = file.mimeType.startsWith('image/');
          return (
            <div 
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition"
              id={`email-attachment-${idx}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isImg && file.url ? (
                  <img 
                    src={file.url} 
                    alt={file.filename} 
                    className="w-10 h-10 object-cover rounded bg-slate-800"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-slate-800/80 flex items-center justify-center flex-shrink-0">
                    {getIcon(file.mimeType)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{file.filename}</p>
                  <p className="text-[10px] text-slate-500">{formatSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {onPreview && (
                  <button
                    onClick={() => onPreview(file)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Preview Attachment"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
                <a
                  href={file.url}
                  download={file.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
