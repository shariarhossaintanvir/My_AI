'use client';

import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, DragEvent } from 'react';
import { Attachment, ClaudeModelId, SUPPORTED_MODELS } from '@/types';
import { validateAttachmentFile } from '@/lib/security/sanitize';
import { AttachmentPreview } from '../attachments/AttachmentPreview';
import { ArrowUp, Paperclip, Square, AlertCircle, ChevronDown } from 'lucide-react';

interface ChatComposerProps {
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  onStopGeneration?: () => void;
  isStreaming: boolean;
  selectedModel: ClaudeModelId;
  onSelectModel: (model: ClaudeModelId) => void;
  initialPrompt?: string;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  onStopGeneration,
  isStreaming,
  selectedModel,
  onSelectModel,
  initialPrompt = '',
}) => {
  const [content, setContent] = useState(initialPrompt);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt) {
      setContent(initialPrompt);
      if (textareaRef.current) {
        textareaRef.current.focus();
        adjustHeight();
      }
    }
  }, [initialPrompt]);

  // Click outside to close model picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modelPickerRef.current && !modelPickerRef.current.contains(event.target as Node)) {
        setShowModelPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 220);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    adjustHeight();
    if (errorMessage) setErrorMessage(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isStreaming) return;

    const trimmed = content.trim();
    if (!trimmed && attachments.length === 0) return;

    onSendMessage(trimmed, attachments);
    setContent('');
    setAttachments([]);
    setErrorMessage(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const processFile = async (file: File) => {
    const validation = validateAttachmentFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file');
      return;
    }

    if (attachments.length >= 5) {
      setErrorMessage('Maximum 5 attachments allowed per message.');
      return;
    }

    const id = crypto.randomUUID();
    const type = validation.type!;
    const mimeType = validation.mimeType!;

    if (type === 'image') {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        setAttachments((prev) => [
          ...prev,
          { id, name: file.name, type, mimeType, size: file.size, dataUrl, base64 },
        ]);
      };
      reader.readAsDataURL(file);
    } else if (type === 'pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        setAttachments((prev) => [
          ...prev,
          { id, name: file.name, type, mimeType, size: file.size, base64 },
        ]);
      };
      reader.readAsDataURL(file);
    } else {
      // Text / Markdown
      const reader = new FileReader();
      reader.onload = () => {
        const extractedText = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          { id, name: file.name, type, mimeType, size: file.size, extractedText },
        ]);
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(processFile);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(processFile);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const currentModelInfo = SUPPORTED_MODELS.find((m) => m.id === selectedModel) || SUPPORTED_MODELS[1];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
      {/* Error alert if file validation failed */}
      {errorMessage && (
        <div className="mb-2 px-3 py-2 rounded-lg bg-red-950/40 border border-red-800/40 flex items-center justify-between text-xs text-red-300">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="hover:underline font-medium ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Composer Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col rounded-2xl border transition-all ${
          isDragging
            ? 'border-[#FF8A45] bg-[#FF8A45]/5'
            : 'border-[#30333B] dark:border-[#30333B] light:border-[#D1D5DB] bg-[#1D2027] dark:bg-[#1D2027] light:bg-white shadow-lg'
        }`}
      >
        {/* Attachment preview row */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-1 border-b border-[#30333B]/50 dark:border-[#30333B]/50 light:border-[#E5E7EB]">
            {attachments.map((att) => (
              <AttachmentPreview
                key={att.id}
                attachment={att}
                onRemove={() => removeAttachment(att.id)}
              />
            ))}
          </div>
        )}

        {/* Textarea Input */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask Claude anything, paste code, or drop documents..."
          rows={1}
          className="w-full px-4 pt-3.5 pb-2 bg-transparent text-sm text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111827] placeholder-[#71717A] dark:placeholder-[#71717A] light:placeholder-[#9CA3AF] focus:outline-none resize-none leading-relaxed min-h-[48px] max-h-[220px]"
        />

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md"
          className="hidden"
        />

        {/* Action Toolbar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          {/* Left tools: Attachment button + Model selector pill */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach file or image"
              title="Attach PDF, Image, TXT, or MD"
              className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#F5F5F5] dark:hover:text-[#F5F5F5] light:hover:text-[#111827] hover:bg-[#252932] dark:hover:bg-[#252932] light:hover:bg-[#F3F4F6] transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Model Selector Dropdown */}
            <div className="relative" ref={modelPickerRef}>
              <button
                type="button"
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[#A1A1AA] dark:text-[#A1A1AA] light:text-[#4B5563] hover:text-[#F5F5F5] dark:hover:text-[#F5F5F5] light:hover:text-[#111827] hover:bg-[#252932] dark:hover:bg-[#252932] light:hover:bg-[#F3F4F6] transition-colors border border-transparent hover:border-[#30333B]"
              >
                <span>{currentModelInfo.name}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {showModelPicker && (
                <div className="absolute bottom-full mb-2 left-0 w-64 rounded-xl border border-[#30333B] dark:border-[#30333B] light:border-[#E5E7EB] bg-[#17191E] dark:bg-[#17191E] light:bg-white shadow-xl p-1.5 z-50">
                  <div className="text-[11px] font-semibold text-[#71717A] px-2.5 py-1 uppercase tracking-wider">
                    Select Claude Model
                  </div>
                  {SUPPORTED_MODELS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onSelectModel(m.id);
                        setShowModelPicker(false);
                      }}
                      className={`w-full flex flex-col text-left px-2.5 py-2 rounded-lg text-xs transition-colors ${
                        m.id === selectedModel
                          ? 'bg-[#FF8A45]/15 text-[#FF8A45]'
                          : 'text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111827] hover:bg-[#252932] dark:hover:bg-[#252932] light:hover:bg-[#F3F4F6]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{m.name}</span>
                        {m.badge && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#30333B] text-[#D1D5DB] font-normal">
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#A1A1AA] dark:text-[#A1A1AA] light:text-[#6B7280] line-clamp-1 mt-0.5">
                        {m.tagline}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Action: Send or Stop */}
          <div>
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopGeneration}
                aria-label="Stop generating response"
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF8A45] hover:bg-[#E57734] text-white transition-colors shadow-sm"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!content.trim() && attachments.length === 0}
                aria-label="Send message"
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                  content.trim() || attachments.length > 0
                    ? 'bg-[#FF8A45] hover:bg-[#E57734] text-white shadow-sm'
                    : 'bg-[#252932] dark:bg-[#252932] light:bg-[#E5E7EB] text-[#71717A] dark:text-[#71717A] light:text-[#9CA3AF] cursor-not-allowed'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-[#71717A] dark:text-[#71717A] light:text-[#9CA3AF]">
        <span>Enter sends · Shift+Enter new line</span>
        <span>My AI Personal Edition</span>
      </div>
    </div>
  );
};
