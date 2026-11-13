import { describe, it, expect } from 'vitest';
import {
  ChatApiRequestSchema,
  ChatMessageSchema,
} from '@/lib/validation/schemas';
import { DEFAULT_MODEL_ID } from '@/types';

describe('Schema Validation Tests', () => {
  it('validates a correct ChatApiRequest payload', () => {
    const payload = {
      messages: [
        {
          role: 'user',
          content: 'Hello, how can you help me?',
        },
      ],
      model: 'claude-sonnet-4-6',
    };

    const result = ChatApiRequestSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('applies default model when omitted', () => {
    const payload = {
      messages: [
        {
          role: 'user',
          content: 'Hello Claude',
        },
      ],
    };

    const parsed = ChatApiRequestSchema.parse(payload);
    expect(parsed.model).toBe(DEFAULT_MODEL_ID);
  });

  it('rejects an empty messages array in ChatApiRequest', () => {
    const payload = {
      messages: [],
    };

    const result = ChatApiRequestSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('validates single ChatMessage with user or assistant role', () => {
    expect(ChatMessageSchema.safeParse({ role: 'user', content: 'Hi' }).success).toBe(true);
    expect(ChatMessageSchema.safeParse({ role: 'assistant', content: 'Hello!' }).success).toBe(true);
    expect(ChatMessageSchema.safeParse({ role: 'invalid', content: 'Hi' }).success).toBe(false);
    expect(ChatMessageSchema.safeParse({ role: 'user', content: '' }).success).toBe(false);
  });
});
