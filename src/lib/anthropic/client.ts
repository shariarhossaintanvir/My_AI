// ==========================================
// MY AI — Official Anthropic SDK Client
// ==========================================

import Anthropic from '@anthropic-ai/sdk';

let anthropicClientInstance: Anthropic | null = null;

/**
 * Returns whether the Anthropic Claude API key is configured in the environment.
 */
export function isAnthropicConfigured(): boolean {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  return Boolean(
    apiKey &&
    apiKey.length > 20 &&
    apiKey.startsWith('sk-ant-') &&
    !apiKey.startsWith('sk-ant-your-')
  );
}

/**
 * Checks whether mock AI mode is explicitly enabled.
 *
 * Rules:
 * 1. NEVER active in production (process.env.NODE_ENV === 'production').
 * 2. Only active when explicitly requested via MOCK_AI_MODE=true or USE_MOCK_AI=true,
 *    or explicitly passed in request options in development.
 * 3. NO automatic silent fallback when real Claude is configured or if keys are missing.
 */
export function isMockModeActive(options?: { explicitMock?: boolean }): boolean {
  // In production, mock mode is permanently disabled
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  // Check if explicitly requested via parameter in development
  if (options?.explicitMock === true) {
    return true;
  }

  // Check explicit environment flags
  const mockEnv = process.env.MOCK_AI_MODE?.trim().toLowerCase();
  const useMockEnv = process.env.USE_MOCK_AI?.trim().toLowerCase();

  if (mockEnv === 'true' || useMockEnv === 'true') {
    return true;
  }

  // Real mode is the default; do NOT fall back to mock automatically
  return false;
}

/**
 * Retrieves the Anthropic client instance or initializes it.
 * Throws an explicit error if called when unconfigured.
 */
export function getAnthropicClient(): Anthropic {
  if (anthropicClientInstance) {
    return anthropicClientInstance;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey || !isAnthropicConfigured()) {
    throw new Error(
      'ANTHROPIC_API_KEY is not configured or is invalid. Real Claude mode is active. Please configure a valid Anthropic API key in .env.local, or explicitly enable mock mode in development using MOCK_AI_MODE=true or USE_MOCK_AI=true.'
    );
  }

  anthropicClientInstance = new Anthropic({
    apiKey,
  });

  return anthropicClientInstance;
}
