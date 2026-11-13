import { describe, it, expect } from 'vitest';
import { buildAnthropicMessages, SYSTEM_PROMPT } from '@/lib/anthropic/context';

describe('Anthropic Messages Builder', () => {
  it('formats alternating chat messages correctly', () => {
    const rawMessages = [
      { role: 'user' as const, content: 'What is the speed of light?' },
      { role: 'assistant' as const, content: 'Approximately 299,792,458 m/s.' },
      { role: 'user' as const, content: 'Thank you!' },
    ];

    const result = buildAnthropicMessages(rawMessages);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ role: 'user', content: 'What is the speed of light?' });
    expect(result[1]).toEqual({ role: 'assistant', content: 'Approximately 299,792,458 m/s.' });
    expect(result[2]).toEqual({ role: 'user', content: 'Thank you!' });
  });

  it('filters out empty or whitespace-only messages', () => {
    const rawMessages = [
      { role: 'user' as const, content: 'Valid message' },
      { role: 'assistant' as const, content: '   ' },
      { role: 'user' as const, content: '' },
    ];

    const result = buildAnthropicMessages(rawMessages);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('Valid message');
  });

  it('defines a helpful system prompt', () => {
    expect(SYSTEM_PROMPT).toContain('My AI');
    expect(SYSTEM_PROMPT).toContain('Claude');
  });
});
