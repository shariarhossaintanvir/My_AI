'use client';

import React, { useState } from 'react';
import { ChatMessage as ChatMessageType } from '@/types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Copy, Check, Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming = false }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div
      className={`group w-full py-5 px-4 sm:px-6 transition-colors ${
        isUser
          ? 'bg-transparent'
          : 'bg-[#15171D]/60 border-y border-[#1E2129]'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-3.5 sm:gap-4 items-start">
        {/* Avatar */}
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-medium ${
            isUser
              ? 'bg-[#252932] text-[#F5F5F5]'
              : 'bg-[#D97706] text-white shadow-sm'
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#A1A1AA]">
              {isUser ? 'You' : 'Claude'}
            </span>

            {/* Copy button */}
            {message.content && !isStreaming && (
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy message"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#71717A] hover:text-[#F5F5F5] rounded hover:bg-[#252932]"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          {/* Body */}
          <div className="text-[15px] leading-relaxed text-[#ECEFF4] break-words">
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <MarkdownRenderer content={message.content} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
