import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isAnthropicConfigured, getAnthropicClient } from '@/lib/anthropic/client';

describe('Anthropic Client Configuration Tests', () => {
  const originalEnv = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    if (originalEnv) {
      process.env.ANTHROPIC_API_KEY = originalEnv;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  it('correctly detects a valid Anthropic key', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-api03-test-mock-key-length-greater-than-twenty-characters';
    expect(isAnthropicConfigured()).toBe(true);
  });

  it('rejects missing or empty API keys', () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(isAnthropicConfigured()).toBe(false);

    process.env.ANTHROPIC_API_KEY = '   ';
    expect(isAnthropicConfigured()).toBe(false);
  });

  it('rejects placeholder or malformed keys', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-your-api-key-here';
    expect(isAnthropicConfigured()).toBe(false);

    process.env.ANTHROPIC_API_KEY = 'invalid-prefix-key-1234567890';
    expect(isAnthropicConfigured()).toBe(false);
  });

  it('throws a descriptive error when calling getAnthropicClient without key', () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(() => getAnthropicClient()).toThrow(/ANTHROPIC_API_KEY is not configured/);
  });
});
