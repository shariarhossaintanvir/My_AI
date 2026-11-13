// ==========================================
// MY AI — Official Anthropic SDK Client
// ==========================================

import Anthropic from '@anthropic-ai/sdk';
import { DEFAULT_MODEL_ID } from '@/types';

let anthropicClientInstance: Anthropic | null = null;

export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL_ID;

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
      'ANTHROPIC_API_KEY is not configured or is invalid. Please ensure ANTHROPIC_API_KEY is set in .env.local.'
    );
  }

  anthropicClientInstance = new Anthropic({
    apiKey,
  });

  return anthropicClientInstance;
}
