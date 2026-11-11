import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';

describe('Chat API Route Handler Integration', () => {
  it('returns 400 Bad Request when request body is invalid or empty', async () => {
    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: '',
        messages: [],
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toBe('Invalid request payload');
  });

  it('streams SSE response in Mock AI mode when no API key is present', async () => {
    // Ensure mock mode is active by unsetting API key
    delete process.env.ANTHROPIC_API_KEY;
    process.env.MOCK_AI_MODE = 'true';

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 'conv-test-1',
        messages: [
          {
            role: 'user',
            content: 'Hello from integration test!',
          },
        ],
        model: 'claude-3-5-sonnet-20241022',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    if (reader) {
      const { value } = await reader.read();
      const text = new TextDecoder().decode(value);
      expect(text).toContain('data: ');
      reader.cancel();
    }
  });
});
