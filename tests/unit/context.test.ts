import { describe, it, expect } from 'vitest';
import { buildAnthropicContext } from '@/lib/anthropic/context';

describe('Context Management & Anthropic Payload Builder', () => {
  it('builds valid alternating message parameters for Anthropic', () => {
    const rawMessages = [
      { role: 'user' as const, content: 'What is the speed of light?' },
      { role: 'assistant' as const, content: 'Approximately 299,792,458 meters per second.' },
      { role: 'user' as const, content: 'And in miles per hour?' },
    ];

    const result = buildAnthropicContext({ messages: rawMessages });

    expect(result.messages.length).toBe(3);
    expect(result.messages[0].role).toBe('user');
    expect(result.messages[1].role).toBe('assistant');
    expect(result.messages[2].role).toBe('user');
    expect(result.systemPrompt).toContain('You are My AI');
  });

  it('incorporates custom owner system instructions', () => {
    const customInstructions = 'Respond only in haiku format.';
    const result = buildAnthropicContext({
      messages: [{ role: 'user', content: 'Hello' }],
      systemInstructions: customInstructions,
    });

    expect(result.systemPrompt).toContain(customInstructions);
  });

  it('formats PDF attachment as native document block', () => {
    const rawMessages = [
      {
        role: 'user' as const,
        content: 'Summarize this file',
        attachments: [
          {
            id: 'pdf-1',
            name: 'invoice.pdf',
            type: 'pdf' as const,
            mimeType: 'application/pdf',
            size: 5000,
            base64: 'JVBERi0xLj...',
          },
        ],
      },
    ];

    const result = buildAnthropicContext({ messages: rawMessages });
    const userMsg = result.messages[0];
    expect(userMsg.role).toBe('user');

    const blocks = userMsg.content as any[];
    expect(blocks.some((b) => b.type === 'document' && b.source?.media_type === 'application/pdf')).toBe(true);
  });

  it('formats image attachment as multimodal image block', () => {
    const rawMessages = [
      {
        role: 'user' as const,
        content: 'What is in this image?',
        attachments: [
          {
            id: 'img-1',
            name: 'chart.png',
            type: 'image' as const,
            mimeType: 'image/png',
            size: 10000,
            base64: 'iVBORw0KGgo...',
          },
        ],
      },
    ];

    const result = buildAnthropicContext({ messages: rawMessages });
    const userMsg = result.messages[0];
    const blocks = userMsg.content as any[];

    expect(blocks.some((b) => b.type === 'image' && b.source?.media_type === 'image/png')).toBe(true);
  });
});
