import React from 'react';
import { FileText, Receipt, FileSignature, AlertCircle, Sparkles, Contact, CreditCard } from 'lucide-react';

interface DocumentTypeBadgeProps {
  type: 'receipt' | 'contract' | 'note' | 'business_card' | 'id' | 'whiteboard' | 'other';
  className?: string;
}

export const DocumentTypeBadge: React.FC<DocumentTypeBadgeProps> = ({ type, className = '' }) => {
  const getConfig = () => {
    switch (type) {
      case 'receipt':
        return {
          label: 'Receipt',
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          icon: <Receipt className="w-3 h-3" />
        };
      case 'contract':
        return {
          label: 'Contract',
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          icon: <FileSignature className="w-3 h-3" />
        };
      case 'note':
        return {
          label: 'Note',
          bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
          icon: <FileText className="w-3 h-3" />
        };
      case 'business_card':
        return {
          label: 'Business Card',
          bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
          icon: <Contact className="w-3 h-3" />
        };
      case 'id':
        return {
          label: 'Secure ID',
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          icon: <CreditCard className="w-3 h-3" />
        };
      case 'whiteboard':
        return {
          label: 'Whiteboard',
          bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
          icon: <Sparkles className="w-3 h-3" />
        };
      default:
        return {
          label: 'Document',
          bg: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
          icon: <AlertCircle className="w-3 h-3" />
        };
    }
  };

  const config = getConfig();

  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wide rounded-full border flex items-center gap-1.5 w-fit ${config.bg} ${className}`}>
      {config.icon}
      <span>{config.label.toUpperCase()}</span>
    </span>
  );
};
