'use client';

import React, { useEffect, useRef } from 'react';
import { Message } from '@/types';
import { ChatMessage } from './ChatMessage';
import { Sparkles, Code2, FileText, Cpu, ArrowUpRight } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  onSelectStarter?: (prompt: string) => void;
  onRegenerate?: () => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
}

const STARTER_PROMPTS = [
  {
    icon: Code2,
    title: 'Analyze or debug code',
    description: 'Paste code or ask for architectural guidance and algorithms',
    prompt: 'Can you help me design a robust rate limiter for a Next.js API in TypeScript?',
  },
  {
    icon: FileText,
    title: 'Inspect documents & PDFs',
    description: 'Upload a PDF or Markdown file for synthesis and key takeaways',
    prompt: 'I am uploading a technical specification. Can you review it and highlight any potential failure modes?',
  },
  {
    icon: Cpu,
    title: 'System architecture review',
    description: 'Evaluate microservices, database schemas, and data pipelines',
    prompt: 'What are the trade-offs between Supabase Row Level Security and application-layer authorization?',
  },
  {
    icon: Sparkles,
    title: 'Deep technical writing',
    description: 'Synthesize complex engineering concepts with precision',
    prompt: 'Explain the internal mechanics of LLM streaming and backpressure in modern browsers.',
  },
];

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isStreaming,
  onSelectStarter,
  onRegenerate,
  onEditMessage,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Clean Empty State
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto my-auto select-none">
        {/* Brand Icon */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF8A45] to-[#FF9E64] flex items-center justify-center text-white shadow-lg shadow-[#FF8A45]/20 mb-4">
          <Sparkles className="w-6 h-6" />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111827]">
          What would you like to build today?
        </h1>
        <p className="mt-1.5 text-sm text-[#A1A1AA] dark:text-[#A1A1AA] light:text-[#6B7280] max-w-md">
          My AI is your private assistant. Ask coding questions, upload documents, or analyze architecture.
        </p>

        {/* Starter Suggestion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8 w-full text-left">
          {STARTER_PROMPTS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectStarter?.(item.prompt)}
                className="group flex flex-col justify-between p-3.5 rounded-xl border border-[#30333B] dark:border-[#30333B] light:border-[#E5E7EB] bg-[#1D2027]/70 dark:bg-[#1D2027]/70 light:bg-white hover:border-[#FF8A45]/50 dark:hover:border-[#FF8A45]/50 hover:bg-[#252932] dark:hover:bg-[#252932] light:hover:bg-[#F9FAFB] transition-all text-left shadow-sm"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#FF8A45]" />
                    <span className="text-xs font-semibold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#111827]">
                      {item.title}
                    </span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#71717A] group-hover:text-[#FF8A45] transition-colors" />
                </div>
                <p className="text-[11px] text-[#A1A1AA] dark:text-[#A1A1AA] light:text-[#6B7280] leading-relaxed">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      {messages.map((message, idx) => (
        <ChatMessage
          key={message.id}
          message={message}
          isLast={idx === messages.length - 1}
          isStreaming={isStreaming}
          onRegenerate={idx === messages.length - 1 ? onRegenerate : undefined}
          onEdit={onEditMessage}
        />
      ))}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
};
