'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Conversation,
  Message,
  Attachment,
  ClaudeModelId,
  Theme,
  UserSettings,
  UsageLog,
  SUPPORTED_MODELS,
  formatModelDisplayName,
} from '@/types';
import { StorageRepository } from '@/lib/storage/repository';
import { DEFAULT_USER_SETTINGS } from '@/lib/storage/indexeddb';
import { Sidebar } from '../sidebar/Sidebar';
import { MessageList } from './MessageList';
import { ChatComposer } from '../composer/ChatComposer';
import { SettingsModal } from '../settings/SettingsModal';
import { Menu, Plus, Sparkles } from 'lucide-react';

export const ChatContainer: React.FC = () => {
  // Application State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);

  // Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // UI State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [composerPrompt, setComposerPrompt] = useState('');
  const [isMockMode, setIsMockMode] = useState(false);

  // Load initial data
  useEffect(() => {
    async function initData() {
      try {
        const loadedSettings = await StorageRepository.getSettings();
        setSettings(loadedSettings);
        applyTheme(loadedSettings.theme);

        const loadedConversations = await StorageRepository.getConversations();
        setConversations(loadedConversations);

        const loadedUsage = await StorageRepository.getUsageLogs();
        setUsageLogs(loadedUsage);

        if (loadedConversations.length > 0) {
          const firstId = loadedConversations[0].id;
          setActiveConversationId(firstId);
          const loadedMessages = await StorageRepository.getMessages(firstId);
          setMessages(loadedMessages);
        }

        // Register service worker if supported
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
          navigator.serviceWorker.register('/sw.js').catch(console.error);
        }
      } catch (err) {
        console.error('Failed to initialize application state:', err);
      }
    }

    initData();
  }, []);

  // Keyboard Shortcuts (Ctrl+K: New Chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNewConversation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [conversations]);

  const applyTheme = (theme: 'dark' | 'light' | 'system') => {
    const root = document.documentElement;
    if (theme === 'system') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSystemDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    } else if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  };

  const handleToggleTheme = () => {
    const nextTheme: Theme = settings.theme === 'dark' ? 'light' : 'dark';
    const updated: UserSettings = { ...settings, theme: nextTheme };
    setSettings(updated);
    StorageRepository.saveSettings(updated);
    applyTheme(nextTheme);
  };

  const handleSelectConversation = async (id: string) => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
    setActiveConversationId(id);
    const loadedMessages = await StorageRepository.getMessages(id);
    setMessages(loadedMessages);
  };

  const handleNewConversation = async () => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }

    const newConv = await StorageRepository.createConversation(
      'New Conversation',
      settings.preferredModel
    );
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setMessages([]);
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    await StorageRepository.renameConversation(id, newTitle);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  const handleDeleteConversation = async (id: string) => {
    await StorageRepository.deleteConversation(id);
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);

    if (activeConversationId === id) {
      if (remaining.length > 0) {
        handleSelectConversation(remaining[0].id);
      } else {
        setActiveConversationId(null);
        setMessages([]);
      }
    }
  };

  // Generate an automatic descriptive title based on first prompt
  const updateConversationTitleIfDefault = async (convId: string, promptText: string) => {
    const conv = conversations.find((c) => c.id === convId);
    if (conv && conv.title === 'New Conversation') {
      const generatedTitle = promptText.slice(0, 36) + (promptText.length > 36 ? '...' : '');
      await handleRenameConversation(convId, generatedTitle);
    }
  };

  // Send message & stream Claude response
  const handleSendMessage = async (userText: string, attachments: Attachment[] = []) => {
    if (isStreaming) return;

    let targetConvId = activeConversationId;
    if (!targetConvId) {
      const newConv = await StorageRepository.createConversation(
        'New Conversation',
        settings.preferredModel
      );
      setConversations([newConv, ...conversations]);
      targetConvId = newConv.id;
      setActiveConversationId(targetConvId);
    }

    const currentSeq = messages.length;

    // 1. Create and persist user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: targetConvId,
      role: 'user',
      content: userText,
      attachments,
      sequenceNumber: currentSeq,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    await StorageRepository.saveMessage(userMessage);

    // Update conversation title if this is the first prompt
    if (messages.length === 0) {
      updateConversationTitleIfDefault(targetConvId, userText || attachments[0]?.name || 'Chat');
    }

    // 2. Prepare assistant placeholder
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantMessageId,
      conversationId: targetConvId,
      role: 'assistant',
      content: '',
      sequenceNumber: currentSeq + 1,
      model: settings.preferredModel,
      status: 'streaming',
      createdAt: new Date().toISOString(),
    };

    setMessages([...nextMessages, assistantMessage]);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const startTime = Date.now();
    let accumulatedContent = '';

    try {
      // 3. Dispatch stream request to Route Handler
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: targetConvId,
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments,
          })),
          model: settings.preferredModel,
          systemInstructions: settings.systemInstructions,
          temperature: settings.temperature,
          maxTokens: settings.maxOutputTokens,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || `Server returned status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Streaming response body is unavailable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === 'delta') {
              accumulatedContent += event.text;

              // Check if response contains mock mode warning
              if (accumulatedContent.includes('MOCK AI MODE')) {
                setIsMockMode(true);
              }

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: accumulatedContent }
                    : m
                )
              );
            } else if (event.type === 'usage') {
              const latency = Date.now() - startTime;
              const log: UsageLog = {
                id: crypto.randomUUID(),
                conversationId: targetConvId,
                messageId: assistantMessageId,
                model: settings.preferredModel,
                inputTokens: event.inputTokens || 0,
                outputTokens: event.outputTokens || 0,
                totalTokens: (event.inputTokens || 0) + (event.outputTokens || 0),
                status: 'success',
                latencyMs: latency,
                createdAt: new Date().toISOString(),
              };
              StorageRepository.recordUsage(log);
              setUsageLogs((prev) => [log, ...prev]);
            } else if (event.type === 'error') {
              throw new Error(event.message || 'Stream error');
            }
          } catch (parseError: any) {
            console.error('Error parsing SSE line:', parseError);
          }
        }
      }

      // Finalize assistant message
      const finalizedAssistant: Message = {
        ...assistantMessage,
        content: accumulatedContent,
        status: 'complete',
      };

      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMessageId ? finalizedAssistant : m))
      );
      await StorageRepository.saveMessage(finalizedAssistant);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User stopped generation manually
        const abortedMessage: Message = {
          ...assistantMessage,
          content: accumulatedContent + '\n\n*(Generation stopped by user)*',
          status: 'complete',
        };
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMessageId ? abortedMessage : m))
        );
        await StorageRepository.saveMessage(abortedMessage);
      } else {
        // Unexpected error
        const errorMessage: Message = {
          ...assistantMessage,
          content: accumulatedContent,
          isError: true,
          errorMessage: err.message || 'An error occurred while generating the response.',
          status: 'error',
        };
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMessageId ? errorMessage : m))
        );
        await StorageRepository.saveMessage(errorMessage);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    abortControllerRef.current?.abort();
  };

  // Regenerate last response
  const handleRegenerate = async () => {
    if (messages.length < 2 || isStreaming) return;

    // Find the last user message
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    const lastUser = messages[lastUserIndex];
    if (activeConversationId) {
      await StorageRepository.truncateMessagesAfter(activeConversationId, lastUser.sequenceNumber);
    }

    // Set messages up to and including last user message
    setMessages(messages.slice(0, lastUserIndex + 1));

    // Re-trigger generation
    handleSendMessage(lastUser.content, lastUser.attachments || []);
  };

  // Edit user prompt: truncates conversation after this prompt and re-submits
  const handleEditMessage = async (messageId: string, newContent: string) => {
    const targetIdx = messages.findIndex((m) => m.id === messageId);
    if (targetIdx === -1 || isStreaming) return;

    const targetMsg = messages[targetIdx];
    if (activeConversationId) {
      await StorageRepository.truncateMessagesAfter(activeConversationId, targetMsg.sequenceNumber);
    }

    setMessages(messages.slice(0, targetIdx));
    handleSendMessage(newContent, targetMsg.attachments || []);
  };

  const handleClearAllData = async () => {
    for (const conv of conversations) {
      await StorageRepository.deleteConversation(conv.id);
    }
    setConversations([]);
    setActiveConversationId(null);
    setMessages([]);
    setUsageLogs([]);
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#101114] dark:bg-[#101114] light:bg-[#F9F9FB] text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#18181B]">
      {/* Sidebar (Desktop & Mobile) */}
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
        isMockMode={isMockMode}
      />

      {/* Main Chat Work Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-13 border-b border-[#30333B] dark:border-[#30333B] light:border-[#E2E4E8] bg-[#101114]/90 dark:bg-[#101114]/90 light:bg-[#F9F9FB]/90 backdrop-blur-md px-4 flex items-center justify-between z-20 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="sm:hidden p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[#252932] transition-colors"
              aria-label="Open conversation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Conversation Title & Model Tag */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs sm:text-sm text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#18181B] truncate max-w-[200px] sm:max-w-xs">
                {activeConversation?.title || 'My AI'}
              </span>
              <span className="hidden sm:inline-block text-[11px] font-mono text-[#71717A] px-2 py-0.5 rounded bg-[#1D2027] border border-[#30333B]">
                {formatModelDisplayName(settings.preferredModel)}
              </span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewConversation}
              className="sm:hidden p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[#252932]"
              aria-label="New chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Message Stream Scroll Area */}
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          onSelectStarter={(prompt) => setComposerPrompt(prompt)}
          onRegenerate={handleRegenerate}
          onEditMessage={handleEditMessage}
        />

        {/* Floating Composer */}
        <ChatComposer
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isStreaming={isStreaming}
          selectedModel={settings.preferredModel}
          onSelectModel={(model) => {
            const updated = { ...settings, preferredModel: model };
            setSettings(updated);
            StorageRepository.saveSettings(updated);
          }}
          initialPrompt={composerPrompt}
        />
      </div>

      {/* Settings Modal Dialog */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(s) => {
          setSettings(s);
          StorageRepository.saveSettings(s);
          applyTheme(s.theme);
        }}
        usageLogs={usageLogs}
        onClearAllData={handleClearAllData}
        isMockMode={isMockMode}
      />
    </div>
  );
};
