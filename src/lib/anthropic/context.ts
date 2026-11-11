// ==========================================
// MY AI — Context Manager & Anthropic Payload Builder
// ==========================================

import type { MessageParam, ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs';
import { Attachment } from '@/types';

export interface RawChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
}

export interface BuildContextOptions {
  messages: RawChatMessage[];
  systemInstructions?: string;
  maxHistoricalMessages?: number;
}

export interface PreparedAnthropicContext {
  systemPrompt: string;
  messages: MessageParam[];
}

const DEFAULT_SYSTEM_PROMPT = `You are My AI, a private, exceptionally capable personal AI assistant.
You provide clear, accurate, thoughtful, and well-structured answers.
When presenting code, use proper syntax-highlighted markdown code blocks with language identifiers.
When analyzing documents or images, refer accurately to their visible details and content.
Maintain a respectful, direct, professional, and helpful tone.`;

/**
 * Builds the Anthropic API message array from the app message history,
 * ensuring proper block formatting for text, PDFs, images, and text attachments.
 */
export function buildAnthropicContext(options: BuildContextOptions): PreparedAnthropicContext {
  const { messages, systemInstructions, maxHistoricalMessages = 30 } = options;

  // 1. Construct System Prompt
  const customInstructions = systemInstructions?.trim();
  const systemPrompt = customInstructions
    ? `${DEFAULT_SYSTEM_PROMPT}\n\nOwner Custom Instructions:\n${customInstructions}`
    : DEFAULT_SYSTEM_PROMPT;

  // 2. Select recent messages within history limits
  const recentMessages = messages.slice(-maxHistoricalMessages);

  // 3. Transform messages into Anthropic MessageParam format
  const anthropicMessages: MessageParam[] = [];

  for (const msg of recentMessages) {
    if (msg.role !== 'user' && msg.role !== 'assistant') {
      continue;
    }

    // Assistant messages are always text
    if (msg.role === 'assistant') {
      anthropicMessages.push({
        role: 'assistant',
        content: msg.content || '(Empty response)',
      });
      continue;
    }

    // User messages may have attachments (documents, images) + text
    const contentBlocks: ContentBlockParam[] = [];

    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        if (att.type === 'pdf' && att.base64) {
          // Anthropic native document support for PDF
          contentBlocks.push({
            type: 'document' as const,
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: att.base64,
            },
          } as any);
        } else if (att.type === 'image' && att.base64) {
          // Anthropic multimodal image support
          const validMime = (
            ['image/jpeg', 'image/png', 'image/webp'].includes(att.mimeType)
              ? att.mimeType
              : 'image/jpeg'
          ) as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

          contentBlocks.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: validMime,
              data: att.base64,
            },
          });
        } else if ((att.type === 'text' || att.type === 'markdown') && att.extractedText) {
          // Plain text / Markdown embedded cleanly into context
          contentBlocks.push({
            type: 'text',
            text: `[Document Attachment: "${att.name}"]:\n\`\`\`\n${att.extractedText}\n\`\`\``,
          });
        }
      }
    }

    // Add main user message text
    if (msg.content && msg.content.trim().length > 0) {
      contentBlocks.push({
        type: 'text',
        text: msg.content,
      });
    } else if (contentBlocks.length === 0) {
      contentBlocks.push({
        type: 'text',
        text: 'Please review the attached file.',
      });
    }

    anthropicMessages.push({
      role: 'user',
      content: contentBlocks,
    });
  }

  // 4. Ensure messages alternate user / assistant as required by Anthropic
  const validatedMessages: MessageParam[] = [];
  let expectedRole: 'user' | 'assistant' = 'user';

  for (const msg of anthropicMessages) {
    if (msg.role === expectedRole) {
      validatedMessages.push(msg);
      expectedRole = expectedRole === 'user' ? 'assistant' : 'user';
    } else if (msg.role === 'user' && expectedRole === 'assistant') {
      // Merge consecutive user messages if necessary or insert placeholder
      validatedMessages.push({
        role: 'assistant',
        content: 'I understand. Please continue.',
      });
      validatedMessages.push(msg);
      expectedRole = 'assistant';
    }
  }

  // Anthropic requires the first message to be from 'user'
  if (validatedMessages.length > 0 && validatedMessages[0].role !== 'user') {
    validatedMessages.shift();
  }

  return {
    systemPrompt,
    messages: validatedMessages,
  };
}
