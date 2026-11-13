import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';
import * as clientModule from '@/lib/anthropic/client';

describe('Chat API Route Handler Integration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 Bad Request when request body is invalid or empty', async () => {
    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [],
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toBe('Invalid request payload');
  });

  it('returns 500 when Anthropic API key is not configured', async () => {
    vi.spyOn(clientModule, 'isAnthropicConfigured').mockReturnValue(false);

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.code).toBe('ANTHROPIC_KEY_MISSING');
  });

  it('streams response from mocked Anthropic SDK via Server-Sent Events', async () => {
    vi.spyOn(clientModule, 'isAnthropicConfigured').mockReturnValue(true);

    // Mock Anthropic SDK stream without making any real API calls
    const fakeEvents = [
      { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } },
      { type: 'content_block_delta', delta: { type: 'text_delta', text: ' from Claude!' } },
    ];

    const mockStream = {
      async *[Symbol.asyncIterator]() {
        for (const event of fakeEvents) {
          yield event;
        }
      },
      abort: vi.fn(),
    };

    const mockClient = {
      messages: {
        stream: vi.fn().mockResolvedValue(mockStream),
      },
    };

    vi.spyOn(clientModule, 'getAnthropicClient').mockReturnValue(mockClient as any);

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hi there' }],
        model: 'claude-sonnet-4-6',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    let accumulatedText = '';
    if (reader) {
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accumulatedText += decoder.decode(value);
      }
    }

    expect(accumulatedText).toContain('Hello');
    expect(accumulatedText).toContain(' from Claude!');
    expect(accumulatedText).toContain('"done":true');
  });

  it('handles Anthropic API 401 error gracefully', async () => {
    vi.spyOn(clientModule, 'isAnthropicConfigured').mockReturnValue(true);

    const mockClient = {
      messages: {
        stream: vi.fn().mockRejectedValue({
          status: 401,
          message: 'Invalid Anthropic API Key',
        }),
      },
    };

    vi.spyOn(clientModule, 'getAnthropicClient').mockReturnValue(mockClient as any);

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Test key error' }],
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.error).toContain('Invalid Anthropic API Key');
  });
});
