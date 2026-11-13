'use client';

import React, { useState, useEffect } from 'react';
import { UserSettings, UsageLog, SUPPORTED_MODELS, ClaudeModelId, Theme, formatModelDisplayName } from '@/types';
import { X, Moon, Sun, Laptop, Cpu, Sliders, BarChart3, ShieldCheck, Trash2, LogOut } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  usageLogs: UsageLog[];
  onClearAllData?: () => void;
  onSignOut?: () => void;
  ownerEmail?: string;
  isMockMode?: boolean;
}

type TabType = 'general' | 'model' | 'usage' | 'security';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  usageLogs,
  onClearAllData,
  onSignOut,
  ownerEmail,
  isMockMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [currentSettings, setCurrentSettings] = useState<UserSettings>(settings);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = (updated: Partial<UserSettings>) => {
    const next = { ...currentSettings, ...updated };
    setCurrentSettings(next);
    onSaveSettings(next);
  };

  // Usage statistics calculation
  const totalTokens = usageLogs.reduce((acc, log) => acc + log.totalTokens, 0);
  const inputTokens = usageLogs.reduce((acc, log) => acc + log.inputTokens, 0);
  const outputTokens = usageLogs.reduce((acc, log) => acc + log.outputTokens, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-[#17191E] dark:bg-[#17191E] light:bg-[#FFFFFF] border border-[#30333B] dark:border-[#30333B] light:border-[#E2E4E8] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#18181B]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#30333B] dark:border-[#30333B] light:border-[#E2E4E8]">
          <h2 className="text-base font-semibold tracking-tight">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[#252932] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#30333B] dark:border-[#30333B] light:border-[#E2E4E8] px-6 bg-[#14161C] dark:bg-[#14161C] light:bg-[#F9FAFB] gap-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'general'
                ? 'border-[#FF8A45] text-[#FF8A45]'
                : 'border-transparent text-[#A1A1AA] hover:text-[#F5F5F5]'
              }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>General</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('model')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'model'
                ? 'border-[#FF8A45] text-[#FF8A45]'
                : 'border-transparent text-[#A1A1AA] hover:text-[#F5F5F5]'
              }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Model & Prompt</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('usage')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'usage'
                ? 'border-[#FF8A45] text-[#FF8A45]'
                : 'border-transparent text-[#A1A1AA] hover:text-[#F5F5F5]'
              }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Usage</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'security'
                ? 'border-[#FF8A45] text-[#FF8A45]'
                : 'border-transparent text-[#A1A1AA] hover:text-[#F5F5F5]'
              }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Appearance */}
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Theme Appearance
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['dark', 'light', 'system'] as Theme[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleSave({ theme: t })}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${currentSettings.theme === t
                          ? 'border-[#FF8A45] bg-[#FF8A45]/10 text-[#FF8A45]'
                          : 'border-[#30333B] dark:border-[#30333B] light:border-[#E2E4E8] bg-[#1D2027] dark:bg-[#1D2027] light:bg-[#F9FAFB] text-[#A1A1AA] hover:text-[#F5F5F5]'
                        }`}
                    >
                      {t === 'dark' && <Moon className="w-3.5 h-3.5" />}
                      {t === 'light' && <Sun className="w-3.5 h-3.5" />}
                      {t === 'system' && <Laptop className="w-3.5 h-3.5" />}
                      <span>{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Send on Enter toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#30333B] dark:border-[#30333B] light:border-[#E2E4E8] bg-[#1D2027] dark:bg-[#1D2027] light:bg-[#F9FAFB]">
                <div>
                  <p className="font-medium text-xs text-[#F5F5F5] dark:text-[#F5F5F5] light:text-[#18181B]">
                    Send with Enter
                  </p>
                  <p className="text-[11px] text-[#A1A1AA]">
                    Press Enter to send the message, or Shift+Enter for a new line.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={currentSettings.sendOnEnter}
                  onChange={(e) => handleSave({ sendOnEnter: e.target.checked })}
                  className="w-4 h-4 rounded text-[#FF8A45] focus:ring-0 cursor-pointer accent-[#FF8A45]"
                />
              </div>
            </div>
          )}

          {/* TAB 2: MODEL & PROMPT */}
          {activeTab === 'model' && (
            <div className="space-y-6">
              {/* Model Choice */}
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Default Claude Model
                </label>
                <div className="space-y-2">
                  {SUPPORTED_MODELS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSave({ preferredModel: m.id as ClaudeModelId })}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${currentSettings.preferredModel === m.id
                          ? 'border-[#FF8A45] bg-[#FF8A45]/10 text-[#F5F5F5]'
                          : 'border-[#30333B] dark:border-[#30333B] light:border-[#E2E4E8] bg-[#1D2027] text-[#A1A1AA] hover:bg-[#252932]'
                        }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#F5F5F5]">{m.name}</span>
                          {m.badge && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#30333B] text-[#D1D5DB]">
                              {m.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#A1A1AA] mt-0.5">{m.tagline}</p>
                      </div>
                      <div className="text-[11px] font-mono text-[#71717A]">
                        {m.contextWindow / 1000}k ctx
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom System Instructions */}
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Custom System Instructions
                </label>
                <textarea
                  value={currentSettings.systemInstructions}
                  onChange={(e) => handleSave({ systemInstructions: e.target.value })}
                  placeholder="e.g. Always respond concisely in TypeScript with comments explaining algorithmic complexity..."
                  rows={4}
                  className="w-full p-3 rounded-xl border border-[#30333B] dark:border-[#30333B] light:border-[#D1D5DB] bg-[#1D2027] text-xs text-[#F5F5F5] placeholder-[#71717A] focus:outline-none focus:border-[#FF8A45] resize-y"
                />
              </div>

              {/* Sliders: Max Tokens & Temperature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-[#30333B] bg-[#1D2027]">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-[#A1A1AA]">Max Output Tokens</span>
                    <span className="font-mono text-[#FF8A45]">{currentSettings.maxOutputTokens}</span>
                  </div>
                  <input
                    type="range"
                    min={256}
                    max={8192}
                    step={256}
                    value={currentSettings.maxOutputTokens}
                    onChange={(e) => handleSave({ maxOutputTokens: parseInt(e.target.value, 10) })}
                    className="w-full accent-[#FF8A45] cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-xl border border-[#30333B] bg-[#1D2027]">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-[#A1A1AA]">Temperature</span>
                    <span className="font-mono text-[#FF8A45]">{currentSettings.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={currentSettings.temperature}
                    onChange={(e) => handleSave({ temperature: parseFloat(e.target.value) })}
                    className="w-full accent-[#FF8A45] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USAGE & ANALYTICS */}
          {activeTab === 'usage' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-[#30333B] bg-[#1D2027] text-center">
                  <p className="text-[11px] font-semibold text-[#A1A1AA] uppercase">Total Tokens</p>
                  <p className="text-xl font-bold font-mono text-[#FF8A45] mt-1">
                    {totalTokens.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[#30333B] bg-[#1D2027] text-center">
                  <p className="text-[11px] font-semibold text-[#A1A1AA] uppercase">Input Tokens</p>
                  <p className="text-xl font-bold font-mono text-[#F5F5F5] mt-1">
                    {inputTokens.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[#30333B] bg-[#1D2027] text-center">
                  <p className="text-[11px] font-semibold text-[#A1A1AA] uppercase">Output Tokens</p>
                  <p className="text-xl font-bold font-mono text-[#F5F5F5] mt-1">
                    {outputTokens.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Usage Log Table */}
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Recent Request Log
                </label>
                {usageLogs.length === 0 ? (
                  <div className="p-6 rounded-xl border border-[#30333B] text-center text-xs text-[#71717A]">
                    No requests recorded yet.
                  </div>
                ) : (
                  <div className="border border-[#30333B] rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-[#14161C] border-b border-[#30333B] text-[#71717A] text-[11px]">
                        <tr>
                          <th className="p-2.5">Time</th>
                          <th className="p-2.5">Model</th>
                          <th className="p-2.5 text-right">Tokens</th>
                          <th className="p-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#30333B]/50 font-mono">
                        {usageLogs.slice(0, 10).map((log) => (
                          <tr key={log.id} className="hover:bg-[#1D2027]">
                            <td className="p-2.5 text-[#A1A1AA]">
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-2.5 text-[#D1D5DB] truncate max-w-[140px]">
                              {formatModelDisplayName(log.model)}
                            </td>
                            <td className="p-2.5 text-right text-[#FF8A45]">
                              {log.totalTokens.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-right">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${log.status === 'success'
                                  ? 'bg-emerald-950/40 text-emerald-400'
                                  : 'bg-red-950/40 text-red-400'
                                }`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & ACCOUNT */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Account Card */}
              <div className="p-4 rounded-xl border border-[#30333B] bg-[#1D2027] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#A1A1AA]">Owner Identity</span>
                  <span className="text-xs font-semibold text-[#F5F5F5]">
                    {ownerEmail || 'Local Development Owner'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#A1A1AA]">AI Mode</span>
                  <span className={`text-xs font-mono font-medium ${isMockMode ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {isMockMode ? 'Mock AI Mode (Zero Cost)' : 'Live Claude API'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#A1A1AA]">Database Mode</span>
                  <span className="text-xs text-[#A1A1AA]">
                    IndexedDB Local Storage + Supabase Sync (when configured)
                  </span>
                </div>
              </div>

              {/* Danger Zone: Clear Data */}
              <div className="p-4 rounded-xl border border-red-900/40 bg-red-950/20 space-y-3">
                <p className="text-xs font-semibold text-red-300">Data Management</p>
                <p className="text-[11px] text-red-400/80">
                  Permanently deletes all saved conversations and local messages from your browser storage.
                </p>

                {confirmClear ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClearAllData?.();
                        setConfirmClear(false);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
                    >
                      Yes, Delete Everything
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-3 py-1.5 rounded-lg border border-[#30333B] text-xs text-[#A1A1AA] hover:text-[#F5F5F5]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-800 text-xs text-red-300 hover:bg-red-900/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Chat Data</span>
                  </button>
                )}
              </div>

              {/* Sign out */}
              {onSignOut && (
                <div>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#30333B] hover:bg-[#252932] text-xs font-medium text-[#A1A1AA] hover:text-[#F5F5F5] transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#30333B] dark:border-[#30333B] light:border-[#E2E4E8] bg-[#14161C] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#FF8A45] hover:bg-[#E57734] text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

