'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '@/types';
import { ChatMessage } from './ChatMessage';
import { ArrowUp, Plus, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

const SUGGESTIONS = [
  'Explain how large language models work in simple terms',
  'Write a Python function to parse JSON with error handling',
  'What are the key differences between SQL and NoSQL databases?',
  'Help me structure a computer science project report',
];

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Adjust textarea height
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  // Start a new chat (clear conversation)
  const handleNewChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages([]);
    setInput('');
    setError(null);
    setIsLoading(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    setError(null);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const assistantMsgId = `assistant-${Date.now()}`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Request failed with server status ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error('Readable stream not supported in response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let addedAssistantMessage = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(dataStr);

              if (parsed.error) {
                throw new Error(parsed.error);
              }

              if (parsed.text) {
                assistantContent += parsed.text;

                if (!addedAssistantMessage) {
                  addedAssistantMessage = true;
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: assistantMsgId,
                      role: 'assistant',
                      content: assistantContent,
                      createdAt: new Date().toISOString(),
                    },
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? { ...msg, content: assistantContent }
                        : msg
                    )
                  );
                }
              }
            } catch (err: any) {
              if (err.message && err.message !== 'Unexpected end of JSON input') {
                console.warn('SSE parsing warning:', err);
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Ignored, user reset or cancelled
        return;
      }
      console.error('Chat error:', err);
      setError(err?.message || 'Failed to communicate with Claude API.');
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#101114] text-[#F5F5F5]">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#1E2129] bg-[#14161C]/90 backdrop-blur z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D97706] flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-[#F5F5F5]">
              My AI
            </h1>
            <p className="text-[11px] text-[#A1A1AA]">
              Powered by Claude Sonnet 4.6
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#ECEFF4] bg-[#1E2129] hover:bg-[#252932] border border-[#2E323B] rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </header>

      {/* Main Chat Body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#D97706]/10 border border-[#D97706]/20 flex items-center justify-center text-[#D97706] mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 text-[#F5F5F5]">
              How can I help you today?
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA] max-w-md mb-8">
              A clean, personal AI assistant built with the official Claude Messages API.
            </p>

            {/* Quick Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
              {SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(item)}
                  className="p-3 text-xs sm:text-[13px] rounded-xl border border-[#23262E] bg-[#15171D] hover:bg-[#1C1F27] hover:border-[#383C48] text-[#D1D5DB] transition-all text-left"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col pb-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Loading Indicator */}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="w-full py-4 px-4 sm:px-6 bg-[#15171D]/60 border-y border-[#1E2129]">
                <div className="max-w-3xl mx-auto flex gap-3.5 sm:gap-4 items-center">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#D97706] flex items-center justify-center text-white">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-[#A1A1AA]">
                    <span>Claude is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex-shrink-0 px-4 sm:px-6 py-2 bg-red-950/60 border-t border-red-800/40 text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-2xl truncate">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span className="truncate">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-3 underline hover:no-underline text-xs flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input Composer */}
      <div className="p-4 sm:px-6 border-t border-[#1E2129] bg-[#14161C]/80 backdrop-blur flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-[#1A1D24] border border-[#2E323B] rounded-2xl p-2 focus-within:border-[#D97706]/80 focus-within:ring-1 focus-within:ring-[#D97706]/50 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message Claude..."
              disabled={isLoading}
              className="flex-1 max-h-[180px] bg-transparent text-[#F5F5F5] placeholder-[#71717A] text-sm resize-none focus:outline-none px-2 py-1.5 leading-relaxed"
            />
            <button
              type="button"
              disabled={!input.trim() || isLoading}
              onClick={() => handleSendMessage()}
              aria-label="Send message"
              className={`p-2 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                input.trim() && !isLoading
                  ? 'bg-[#D97706] text-white hover:bg-[#B45309]'
                  : 'bg-[#252932] text-[#71717A] cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-[11px] text-[#71717A]">
              Press Enter to send, Shift + Enter for new line.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
