'use client';

import React, { useState, useMemo } from 'react';
import { Conversation, Theme } from '@/types';
import {
  Plus,
  MessageSquare,
  Search,
  Settings,
  Trash2,
  Edit2,
  Pin,
  PinOff,
  PanelLeftClose,
  PanelLeft,
  X,
  Sparkles,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  isMockMode?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  onOpenSettings,
  isOpenMobile,
  onCloseMobile,
  theme,
  onToggleTheme,
  isMockMode = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(query));
  }, [conversations, searchQuery]);

  // Group conversations chronologically
  const groupedConversations = useMemo(() => {
    const groups: { [key: string]: Conversation[] } = {
      Pinned: [],
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const pastWeek = today - 86400000 * 7;

    for (const conv of filteredConversations) {
      if (conv.isPinned) {
        groups.Pinned.push(conv);
        continue;
      }

      const convTime = new Date(conv.updatedAt).getTime();
      if (convTime >= today) {
        groups.Today.push(conv);
      } else if (convTime >= yesterday) {
        groups.Yesterday.push(conv);
      } else if (convTime >= pastWeek) {
        groups['Previous 7 Days'].push(conv);
      } else {
        groups.Older.push(conv);
      }
    }

    return groups;
  }, [filteredConversations]);

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleSaveRename = (id: string) => {
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const content = (
    <div className="flex flex-col h-full w-full bg-[#17191E] dark:bg-[#17191E] light:bg-[#F2F3F5] text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#18181B] border-r border-[#30333B] dark:border-[#30333B] light:border-[#E2E4E8]">
      {/* Sidebar Header */}
      <div className="p-3.5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#FF8A45] to-[#FF9E64] flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#18181B]">
                My AI
              </span>
              {isMockMode && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-medium border border-amber-500/30">
                  MOCK
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Close or Desktop Collapse button */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={onCloseMobile}
            className="sm:hidden p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#F5F5F5] dark:hover:text-[#F5F5F5] light:hover:text-[#18181B] hover:bg-[#252932] dark:hover:bg-[#252932] light:hover:bg-[#E4E6EA]"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden sm:flex p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#F5F5F5] dark:hover:text-[#F5F5F5] light:hover:text-[#18181B] hover:bg-[#252932] dark:hover:bg-[#252932] light:hover:bg-[#E4E6EA] transition-colors"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Buttons: New Chat */}
      <div className="px-3 py-2">
        <button
          type="button"
          onClick={() => {
            onNewConversation();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#252932] dark:bg-[#252932] light:bg-[#E4E6EA] hover:bg-[#2F343F] dark:hover:bg-[#2F343F] light:hover:bg-[#DCDFE4] text-xs font-semibold text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#18181B] transition-all border border-[#30333B] dark:border-[#30333B] light:border-[#D1D5DB] shadow-sm"
        >
          <Plus className="w-4 h-4 text-[#FF8A45]" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 py-1.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#71717A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#1D2027] dark:bg-[#1D2027] light:bg-white border border-[#30333B] dark:border-[#30333B] light:border-[#D1D5DB] text-xs text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#18181B] placeholder-[#71717A] focus:outline-none focus:border-[#FF8A45]"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        {Object.entries(groupedConversations).map(([groupTitle, list]) => {
          if (list.length === 0) return null;
          return (
            <div key={groupTitle} className="space-y-1">
              <div className="px-2.5 text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">
                {groupTitle}
              </div>
              {list.map((conv) => {
                const isActive = conv.id === activeId;
                const isItemEditing = editingId === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      if (!isItemEditing) {
                        onSelectConversation(conv.id);
                        onCloseMobile();
                      }
                    }}
                    className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-[#252932] dark:bg-[#252932] light:bg-[#E4E6EA] text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#18181B] font-medium'
                        : 'text-[#A1A1AA] dark:text-[#A1A1AA] light:text-[#4B5563] hover:bg-[#1D2027] dark:hover:bg-[#1D2027] light:hover:bg-[#EAEBED] hover:text-[#F5F5F5]'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-[#71717A]" />
                      {isItemEditing ? (
                        <input
                          type="text"
                          value={editingTitle}
                          autoFocus
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleSaveRename(conv.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(conv.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="w-full bg-[#1D2027] px-1 py-0.5 rounded border border-[#FF8A45] text-xs text-[#F5F5F5] focus:outline-none"
                        />
                      ) : (
                        <span className="truncate">{conv.title}</span>
                      )}
                    </div>

                    {/* Action buttons (Rename, Delete) */}
                    {!isItemEditing && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(conv, e)}
                          title="Rename"
                          aria-label={`Rename ${conv.title}`}
                          className="p-1 rounded text-[#71717A] hover:text-[#F5F5F5] hover:bg-[#30333B]"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv.id);
                          }}
                          title="Delete"
                          aria-label={`Delete ${conv.title}`}
                          className="p-1 rounded text-[#71717A] hover:text-red-400 hover:bg-[#30333B]"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {filteredConversations.length === 0 && (
          <div className="text-center py-6 px-4 text-xs text-[#71717A]">
            No conversations found.
          </div>
        )}
      </div>

      {/* Footer Profile & Settings */}
      <div className="p-3 border-t border-[#30333B] dark:border-[#30333B] light:border-[#E2E4E8] flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[#252932] transition-colors"
        >
          <Settings className="w-4 h-4 text-[#A1A1AA]" />
          <span>Settings</span>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle appearance theme"
          title={`Switch Theme (Current: ${theme})`}
          className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[#252932] transition-colors"
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-[#FF8A45]" />
          ) : theme === 'light' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Laptop className="w-4 h-4 text-[#A1A1AA]" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div
        className={`hidden sm:block transition-all duration-300 h-full flex-shrink-0 ${
          isCollapsed ? 'w-0 overflow-hidden' : 'w-64'
        }`}
      >
        {content}
      </div>

      {/* Floating Expand button when desktop sidebar is collapsed */}
      {isCollapsed && (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          aria-label="Open sidebar"
          className="hidden sm:flex fixed top-3 left-3 z-30 p-2 rounded-xl bg-[#1D2027] border border-[#30333B] text-[#A1A1AA] hover:text-[#F5F5F5] shadow-md transition-colors"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      )}

      {/* Mobile Backdrop & Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

