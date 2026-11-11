'use client';

import React from 'react';
import { Attachment } from '@/types';
import { FileText, FileCode, File, X } from 'lucide-react';

interface AttachmentPreviewProps {
  attachment: Attachment;
  onRemove?: () => void;
  readOnly?: boolean;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachment,
  onRemove,
  readOnly = false,
}) => {
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = attachment.type === 'image';

  return (
    <div className="relative group flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[#30333B] dark:border-[#30333B] light:border-[#E2E4E8] bg-[#1D2027] dark:bg-[#1D2027] light:bg-[#FFFFFF] shadow-sm max-w-[280px]">
      {/* Visual Icon / Thumbnail */}
      {isImage && attachment.dataUrl ? (
        <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-black/20 border border-[#30333B]">
          <img
            src={attachment.dataUrl}
            alt={attachment.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : attachment.type === 'pdf' ? (
        <div className="w-10 h-10 rounded flex-shrink-0 bg-red-950/40 border border-red-800/40 flex items-center justify-center text-red-400">
          <FileText className="w-5 h-5" />
        </div>
      ) : attachment.type === 'markdown' ? (
        <div className="w-10 h-10 rounded flex-shrink-0 bg-blue-950/40 border border-blue-800/40 flex items-center justify-center text-blue-400">
          <FileCode className="w-5 h-5" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded flex-shrink-0 bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-amber-400">
          <File className="w-5 h-5" />
        </div>
      )}

      {/* File Details */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs font-medium text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#121316] truncate">
          {attachment.name}
        </p>
        <p className="text-[11px] text-[#A1A1AA] dark:text-[#A1A1AA] light:text-[#71717A]">
          {attachment.type.toUpperCase()} · {formatSize(attachment.size)}
        </p>
      </div>

      {/* Remove Button (for composer mode) */}
      {!readOnly && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${attachment.name}`}
          className="p-1 rounded-full text-[#A1A1AA] hover:text-[#F5F5F5] dark:hover:text-[#F5F5F5] light:hover:text-[#121316] hover:bg-[#30333B] dark:hover:bg-[#30333B] light:hover:bg-[#E2E4E8] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
