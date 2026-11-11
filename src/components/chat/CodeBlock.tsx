'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code to clipboard', err);
    }
  };

  const displayLanguage = language || 'code';

  return (
    <div className="relative my-3 rounded-lg border border-[#30333B] dark:border-[#30333B] light:border-[#E2E4E8] bg-[#14161C] dark:bg-[#14161C] light:bg-[#F4F4F6] overflow-hidden text-sm">
      {/* Code Header */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-[#30333B] dark:border-[#30333B] light:border-[#E2E4E8] bg-[#1A1D24] dark:bg-[#1A1D24] light:bg-[#EBECEF] text-xs text-[#A1A1AA] dark:text-[#A1A1AA] light:text-[#646873]">
        <span className="font-mono lowercase select-none font-medium text-[#D1D5DB] dark:text-[#D1D5DB] light:text-[#374151]">
          {displayLanguage}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs transition-colors hover:text-[#F5F5F5] dark:hover:text-[#F5F5F5] light:hover:text-[#121316] hover:bg-[#252932] dark:hover:bg-[#252932] light:hover:bg-[#DCDFE4]"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-3.5 overflow-x-auto font-mono text-[13px] leading-relaxed text-[#ECEFF4] dark:text-[#ECEFF4] light:text-[#1F2937]">
        <pre className="m-0 p-0 font-mono">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
};
