import { describe, it, expect } from 'vitest';
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

  it('fails closed when attempting real Claude requests without a verified authentication session', async () => {
    // When real mode is requested but no Supabase session or auth token is present
    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 'conv-real-noauth-test',
        messages: [{ role: 'user', content: 'Hello in real mode' }],
        model: 'claude-sonnet-4-6',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.code).toBe('AUTH_REQUIRED');
  });

  it('streams SSE response when Mock AI mode is explicitly enabled via USE_MOCK_AI=true', async () => {
    const originalUseMock = process.env.USE_MOCK_AI;
    const originalMock = process.env.MOCK_AI_MODE;

    try {
      process.env.USE_MOCK_AI = 'true';
      process.env.MOCK_AI_MODE = 'false';

      const req = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-mock-test-1',
          messages: [
            {
              role: 'user',
              content: 'Hello from mock integration test!',
            },
          ],
          model: 'claude-sonnet-4-6',
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
    } finally {
      if (originalUseMock) process.env.USE_MOCK_AI = originalUseMock;
      if (originalMock) process.env.MOCK_AI_MODE = originalMock;
    }
  });

  it('streams SSE response when Mock AI mode is explicitly passed via request body flag in development', async () => {
    const originalUseMock = process.env.USE_MOCK_AI;
    const originalMock = process.env.MOCK_AI_MODE;

    try {
      process.env.USE_MOCK_AI = 'false';
      process.env.MOCK_AI_MODE = 'false';

      const req = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-mock-explicit-test',
          messages: [
            {
              role: 'user',
              content: 'Explicit mock test',
            },
          ],
          model: 'claude-sonnet-4-6',
          mock: true,
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
    } finally {
      if (originalUseMock) process.env.USE_MOCK_AI = originalUseMock;
      if (originalMock) process.env.MOCK_AI_MODE = originalMock;
    }
  });
});
