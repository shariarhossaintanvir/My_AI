import { describe, it, expect } from 'vitest';
import {
  ChatApiRequestSchema,
  UserSettingsSchema,
  AttachmentSchema,
  ConversationRenameSchema,
} from '@/lib/validation/schemas';

describe('Schema Validation Tests', () => {
  it('validates a correct ChatApiRequest payload', () => {
    const payload = {
      conversationId: 'conv-123',
      messages: [
        {
          role: 'user',
          content: 'Hello, how can you help me?',
        },
      ],
      model: 'claude-sonnet-4-6',
      temperature: 0.7,
      maxTokens: 4096,
    };

    const result = ChatApiRequestSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('rejects an empty messages array in ChatApiRequest', () => {
    const payload = {
      conversationId: 'conv-123',
      messages: [],
    };

    const result = ChatApiRequestSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects invalid model identifiers in ChatApiRequest', () => {
    const payload = {
      conversationId: 'conv-123',
      messages: [{ role: 'user', content: 'test' }],
      model: 'fake-claude-model-99',
    };

    const result = ChatApiRequestSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('validates and applies defaults for UserSettingsSchema', () => {
    const parsed = UserSettingsSchema.parse({});
    expect(parsed.theme).toBe('system');
    expect(parsed.preferredModel).toBe('claude-sonnet-4-6');
    expect(parsed.temperature).toBe(0.7);
    expect(parsed.sendOnEnter).toBe(true);
  });

  it('validates supported attachment metadata', () => {
    const attachment = {
      id: 'att-1',
      name: 'document.pdf',
      type: 'pdf',
      mimeType: 'application/pdf',
      size: 1024 * 50,
      base64: 'JVBERi0xLjQK...',
    };

    const result = AttachmentSchema.safeParse(attachment);
    expect(result.success).toBe(true);
  });

  it('rejects an attachment exceeding 25MB', () => {
    const attachment = {
      id: 'att-2',
      name: 'huge.pdf',
      type: 'pdf',
      mimeType: 'application/pdf',
      size: 30 * 1024 * 1024,
    };

    const result = AttachmentSchema.safeParse(attachment);
    expect(result.success).toBe(false);
  });

  it('validates conversation title renaming', () => {
    expect(ConversationRenameSchema.safeParse({ title: 'New Valid Title' }).success).toBe(true);
    expect(ConversationRenameSchema.safeParse({ title: '' }).success).toBe(false);
    expect(ConversationRenameSchema.safeParse({ title: '   ' }).success).toBe(false);
  });
});

