// ==========================================
// MY AI — Anthropic Messages Context Builder
// ==========================================

import type { MessageParam } from '@anthropic-ai/sdk/resources/messages.mjs';

export const SYSTEM_PROMPT = `You are My AI, a friendly, concise, and highly capable AI assistant built with Anthropic's Claude.
Provide accurate, helpful, and well-structured answers.
When presenting code, use markdown code blocks with the correct language syntax.`;

export interface ChatMessageItem {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Transforms application messages into Anthropic SDK MessageParam format.
 * Ensures role alternates properly and strips any empty messages.
 */
export function buildAnthropicMessages(messages: ChatMessageItem[]): MessageParam[] {
  return messages
    .filter((msg) => msg.content && msg.content.trim().length > 0)
    .map((msg) => ({
      role: msg.role,
      content: msg.content.trim(),
    }));
}
