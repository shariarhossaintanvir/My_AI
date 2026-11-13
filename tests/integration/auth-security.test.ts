import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';
import * as serverSupabase from '@/lib/supabase/server';
import * as clientSupabase from '@/lib/supabase/client';

describe('Authentication & Authorization Hardening Security Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // 1. Anonymous Requests
  it('rejects anonymous real Claude requests with 401 when Supabase Auth is configured but no token is passed', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://valid-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'valid-anon-key-123456';
    process.env.OWNER_EMAIL = 'owner@example.com';
    process.env.USE_MOCK_AI = 'false';
    process.env.MOCK_AI_MODE = 'false';

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 'conv-anon-test',
        messages: [{ role: 'user', content: 'test' }],
        model: 'claude-sonnet-4-6',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.code).toBe('AUTH_REQUIRED');
  });

  // 2. Forged Owner Headers
  it('rejects forged owner headers (x-owner-email, Origin, Host) without proof of identity', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://valid-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'valid-anon-key-123456';
    process.env.OWNER_EMAIL = 'owner@example.com';
    process.env.USE_MOCK_AI = 'false';
    process.env.MOCK_AI_MODE = 'false';

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'x-owner-email': 'owner@example.com',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
        Referer: 'http://localhost:3000/chat',
      },
      body: JSON.stringify({
        conversationId: 'conv-forgery-test',
        messages: [{ role: 'user', content: 'forgery test' }],
        model: 'claude-sonnet-4-6',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.code).toBe('AUTH_REQUIRED');
  });

  // 3. Invalid Bearer Tokens
  it('rejects invalid or forged bearer tokens with 401', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://valid-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'valid-anon-key-123456';
    process.env.OWNER_EMAIL = 'owner@example.com';
    process.env.USE_MOCK_AI = 'false';
    process.env.MOCK_AI_MODE = 'false';

    // Mock Supabase getUser returning failure for invalid token
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid JWT signature' },
        }),
      },
    };
    vi.spyOn(serverSupabase, 'getSupabaseServerClient').mockReturnValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer invalid-token-forged-signature',
      },
      body: JSON.stringify({
        conversationId: 'conv-invalid-jwt-test',
        messages: [{ role: 'user', content: 'test' }],
        model: 'claude-sonnet-4-6',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.code).toBe('INVALID_TOKEN');
  });

  // 4. Valid Owner Authentication
  it('authorizes requests with a valid token matching the designated owner identity', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://valid-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'valid-anon-key-123456';
    process.env.OWNER_EMAIL = 'legit-owner@example.com';
    process.env.OWNER_USER_ID = 'owner-uuid-12345';
    process.env.USE_MOCK_AI = 'false';
    process.env.MOCK_AI_MODE = 'false';
    // Provide a mock Anthropic key to verify path continues past auth
    process.env.ANTHROPIC_API_KEY = 'sk-ant-api03-test-mock-key-length-greater-than-twenty-characters';

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'owner-uuid-12345',
              email: 'legit-owner@example.com',
            },
          },
          error: null,
        }),
      },
    };
    vi.spyOn(serverSupabase, 'getSupabaseServerClient').mockReturnValue(mockSupabase as any);

    // Mock Anthropic SDK stream so no real network requests are made
    const mockStream = {
      async *[Symbol.asyncIterator]() {
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Auth verified' } };
      },
      abort: vi.fn(),
    };
    const mockClient = {
      messages: {
        stream: vi.fn().mockResolvedValue(mockStream),
      },
    };
    const clientModule = await import('@/lib/anthropic/client');
    vi.spyOn(clientModule, 'getAnthropicClient').mockReturnValue(mockClient as any);

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-owner-signed-token',
      },
      body: JSON.stringify({
        conversationId: 'conv-valid-owner-test',
        messages: [{ role: 'user', content: 'Hello Claude' }],
        model: 'claude-sonnet-4-6',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
  });

  // 5. Non-Owner Authentication
  it('rejects valid authenticated tokens belonging to non-owner users with 403 Forbidden', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://valid-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'valid-anon-key-123456';
    process.env.OWNER_EMAIL = 'legit-owner@example.com';
    process.env.OWNER_USER_ID = 'owner-uuid-12345';
    process.env.USE_MOCK_AI = 'false';
    process.env.MOCK_AI_MODE = 'false';

    // Authenticated user exists, but is NOT the owner
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'different-uuid-99999',
              email: 'intruder@othercompany.com',
            },
          },
          error: null,
        }),
      },
    };
    vi.spyOn(serverSupabase, 'getSupabaseServerClient').mockReturnValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-jwt-for-different-user',
      },
      body: JSON.stringify({
        conversationId: 'conv-non-owner-test',
        messages: [{ role: 'user', content: 'test' }],
        model: 'claude-sonnet-4-6',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.code).toBe('FORBIDDEN_NOT_OWNER');
  });

  // 6. Missing Authentication Configuration
  it('fails closed with 401 when Supabase Auth is unconfigured and real Claude is requested', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.USE_MOCK_AI = 'false';
    process.env.MOCK_AI_MODE = 'false';

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 'conv-unconfigured-test',
        messages: [{ role: 'user', content: 'trigger real inference' }],
        model: 'claude-sonnet-4-6',
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.code).toBe('AUTH_REQUIRED');
    expect(json.error).toContain('A verified Supabase Auth session is required');
  });

  // 7. Production Mode Behavior
  it('permanently blocks Mock Mode in production even when requested', async () => {
    (process.env as any).NODE_ENV = 'production';
    process.env.USE_MOCK_AI = 'true';
    process.env.MOCK_AI_MODE = 'true';

    const req = new NextRequest('https://my-ai-production.com/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 'conv-prod-test',
        messages: [{ role: 'user', content: 'test' }],
        model: 'claude-sonnet-4-6',
        mock: true,
      }),
    });

    const response = await POST(req);
    // In production, mock mode cannot run and fails with 401 / 403
    expect([401, 403]).toContain(response.status);
    const json = await response.json();
    expect(json.error).toBeDefined();
  });
});
