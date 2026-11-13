'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded text-[13px] font-mono bg-[#252932] dark:bg-[#252932] light:bg-[#E4E6EA] text-[#FF9E64] dark:text-[#FF9E64] light:text-[#C55B1B]"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock
                language={match ? match[1] : ''}
                value={String(children).replace(/\n$/, '')}
              />
            );
          },
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF8A45] hover:underline font-medium break-all"
                {...props}
              >
                {children}
              </a>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3 border border-[#30333B] dark:border-[#30333B] light:border-[#E2E4E8] rounded-lg">
                <table className="w-full text-left border-collapse">{children}</table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

