// ==========================================
// MY AI — Core Types (Simple Claude Chatbot)
// ==========================================

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt?: string;
}

export interface ChatApiRequest {
  messages: Array<{
    role: MessageRole;
    content: string;
  }>;
  model?: string;
}

export const SUPPORTED_MODELS = [
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    tagline: 'Fast, intelligent, and highly capable',
    isDefault: true,
  },
] as const;

export type SupportedModelId = (typeof SUPPORTED_MODELS)[number]['id'];

export const DEFAULT_MODEL_ID: SupportedModelId = 'claude-sonnet-4-6';
