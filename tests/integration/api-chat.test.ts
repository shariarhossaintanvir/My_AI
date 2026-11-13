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

  it('rejects unauthorized access when an unauthorized owner email header is provided', async () => {
    const originalOwner = process.env.OWNER_EMAIL;
    try {
      process.env.OWNER_EMAIL = 'legit-owner@example.com';
      const req = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'x-owner-email': 'attacker@unauthorized.com',
        },
        body: JSON.stringify({
          conversationId: 'conv-auth-test',
          messages: [{ role: 'user', content: 'test' }],
          model: 'claude-sonnet-4-6',
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.code).toBe('AUTH_REQUIRED');
    } finally {
      process.env.OWNER_EMAIL = originalOwner;
    }
  });

  it('does NOT fall back to mock mode automatically when real Claude is configured but API key is missing', async () => {
    // Simulate real mode with missing API key
    const originalKey = process.env.ANTHROPIC_API_KEY;
    const originalMock = process.env.MOCK_AI_MODE;
    const originalUseMock = process.env.USE_MOCK_AI;

    try {
      delete process.env.ANTHROPIC_API_KEY;
      process.env.MOCK_AI_MODE = 'false';
      process.env.USE_MOCK_AI = 'false';

      const req = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-real-test',
          messages: [{ role: 'user', content: 'Hello in real mode' }],
          model: 'claude-sonnet-4-6',
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(500);

      const json = await response.json();
      expect(json.code).toBe('ANTHROPIC_NOT_CONFIGURED');
      expect(json.error).toContain('Real Claude mode is active');
    } finally {
      if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;
      if (originalMock) process.env.MOCK_AI_MODE = originalMock;
      if (originalUseMock) process.env.USE_MOCK_AI = originalUseMock;
    }
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
