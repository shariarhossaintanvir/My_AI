'use client';

import React, { useState } from 'react';
import { Message, formatModelDisplayName } from '@/types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AttachmentPreview } from '../attachments/AttachmentPreview';
import { Copy, Check, RotateCcw, Edit3, Bot, User, AlertCircle } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isLast?: boolean;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onEdit?: (messageId: string, newContent: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLast = false,
  isStreaming = false,
  onRegenerate,
  onEdit,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message content', err);
    }
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(message.id, editContent.trim());
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`group w-full py-4 px-4 sm:px-6 transition-colors ${
        isUser
          ? 'bg-transparent'
          : 'bg-[#15171D]/60 dark:bg-[#15171D]/60 light:bg-[#F6F7F9]/70 border-y border-[#1E2129] dark:border-[#1E2129] light:border-[#E8EAEE]'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-3 sm:gap-4 items-start">
        {/* Avatar */}
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-medium ${
            isUser
              ? 'bg-[#252932] dark:bg-[#252932] light:bg-[#E4E6EA] text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#18181B]'
              : 'bg-[#FF8A45] text-white shadow-sm'
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Message Body */}
        <div className="flex-1 min-w-0">
          {/* Header Role Label */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-[#A1A1AA] dark:text-[#A1A1AA] light:text-[#71717A]">
              {isUser ? 'You' : 'My AI'}
            </span>

            {/* Timestamps or Model indicator */}
            {message.model && !isUser && (
              <span className="text-[11px] font-mono text-[#71717A] dark:text-[#71717A] light:text-[#9CA3AF]">
                {formatModelDisplayName(message.model)}
              </span>
            )}
          </div>

          {/* Attachments (if user provided any) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.attachments.map((att) => (
                <AttachmentPreview key={att.id} attachment={att} readOnly />
              ))}
            </div>
          )}

          {/* User Message Edit Mode */}
          {isEditing ? (
            <div className="my-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#30333B] dark:border-[#30333B] light:border-[#D1D5DB] bg-[#1D2027] dark:bg-[#1D2027] light:bg-white text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111827] text-sm focus:outline-none focus:border-[#FF8A45] resize-y min-h-[90px]"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditContent(message.content);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1.5 rounded text-xs text-[#A1A1AA] hover:text-[#F5F5F5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 rounded text-xs bg-[#FF8A45] hover:bg-[#E57734] text-white font-medium transition-colors"
                >
                  Save & Submit
                </button>
              </div>
            </div>
          ) : (
            /* Render Message Content */
            <div className="text-sm leading-relaxed text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#18181B]">
              <MarkdownRenderer content={message.content} />
              {isStreaming && isLast && isAssistant && <span className="streaming-cursor" />}
            </div>
          )}

          {/* Error Banner */}
          {message.isError && (
            <div className="mt-3 p-3 rounded-lg bg-red-950/40 border border-red-800/50 flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-200">Request Error</p>
                <p className="mt-0.5 text-red-300/90">{message.errorMessage || 'An error occurred during response generation.'}</p>
              </div>
              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="px-2.5 py-1 rounded bg-red-900/50 hover:bg-red-800/60 text-red-200 text-xs font-medium transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {/* Action Toolbar */}
          {!isEditing && (
            <div className="flex items-center gap-1.5 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy message"
                className="flex items-center gap-1 p-1 px-1.5 rounded text-xs text-[#A1A1AA] hover:text-[#F5F5F5] dark:hover:text-[#F5F5F5] light:hover:text-[#111827] hover:bg-[#252932] dark:hover:bg-[#252932] light:hover:bg-[#E5E7EB] transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>

              {/* Edit Button (User messages only) */}
              {isUser && onEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit message"
                  className="flex items-center gap-1 p-1 px-1.5 rounded text-xs text-[#A1A1AA] hover:text-[#F5F5F5] dark:hover:text-[#F5F5F5] light:hover:text-[#111827] hover:bg-[#252932] dark:hover:bg-[#252932] light:hover:bg-[#E5E7EB] transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Edit</span>
                </button>
              )}

              {/* Regenerate Button (Assistant messages only) */}
              {isAssistant && !isStreaming && onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  aria-label="Regenerate response"
                  className="flex items-center gap-1 p-1 px-1.5 rounded text-xs text-[#A1A1AA] hover:text-[#F5F5F5] dark:hover:text-[#F5F5F5] light:hover:text-[#111827] hover:bg-[#252932] dark:hover:bg-[#252932] light:hover:bg-[#E5E7EB] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Regenerate</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

