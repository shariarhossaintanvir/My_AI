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
  return Boolean(apiKey && apiKey.length > 10 && !apiKey.startsWith('your-'));
}

/**
 * Checks whether mock AI mode should be active.
 * Active if MOCK_AI_MODE is explicitly 'true' OR if no API key is provided in development.
 */
export function isMockModeActive(): boolean {
  if (process.env.MOCK_AI_MODE === 'true') {
    return true;
  }
  return !isAnthropicConfigured();
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
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Please configure your API key in .env.local or enable MOCK_AI_MODE=true for local testing.'
    );
  }

  anthropicClientInstance = new Anthropic({
    apiKey,
  });

  return anthropicClientInstance;
}
