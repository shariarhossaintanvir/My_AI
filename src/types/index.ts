// ==========================================
// MY AI — Core Type Definitions
// ==========================================

export type Theme = 'dark' | 'light' | 'system';

export type ClaudeModelId =
  | 'claude-sonnet-4-6'
  | 'claude-opus-4-6'
  | 'claude-haiku-4-5';

export interface ModelInfo {
  id: ClaudeModelId;
  name: string;
  tagline: string;
  contextWindow: number;
  maxOutputTokens: number;
  badge?: string;
  isDefault?: boolean;
}

export const SUPPORTED_MODELS: ModelInfo[] = [
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    tagline: 'Leading reasoning, coding, and multimodal intelligence with 1M context',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    badge: 'Recommended',
    isDefault: true,
  },
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    tagline: 'Deep analytical synthesis, advanced agentic planning, and complex architecture',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    badge: 'Frontier',
  },
  {
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    tagline: 'Ultra-fast, responsive, ideal for rapid conversational queries and quick edits',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    badge: 'Fast',
  },
];

export function formatModelDisplayName(modelId?: string): string {
  if (!modelId) return 'Sonnet 4.6';
  switch (modelId) {
    case 'claude-sonnet-4-6':
      return 'Sonnet 4.6';
    case 'claude-opus-4-6':
      return 'Opus 4.6';
    case 'claude-haiku-4-5':
      return 'Haiku 4.5';
    default:
      return modelId
        .replace(/^claude-/, '')
        .replace(/^(sonnet|opus|haiku)-/, (m) => m.charAt(0).toUpperCase() + m.slice(1, -1) + ' ');
  }
}

export type MessageRole = 'user' | 'assistant' | 'system';

export type AttachmentType = 'image' | 'pdf' | 'text' | 'markdown';

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  mimeType: string;
  size: number;
  dataUrl?: string; // Data URL for image previews
  base64?: string; // Raw base64 string for API payloads (images, PDFs)
  extractedText?: string; // Extracted plain text for txt/md
}

export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  attachments?: Attachment[];
  model?: string;
  sequenceNumber: number;
  status?: MessageStatus;
  isError?: boolean;
  errorMessage?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface UserSettings {
  theme: Theme;
  preferredModel: ClaudeModelId;
  systemInstructions: string;
  temperature: number;
  maxOutputTokens: number;
  sendOnEnter: boolean;
}

export interface UsageLog {
  id: string;
  conversationId?: string;
  messageId?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  status: 'success' | 'error' | 'cancelled';
  latencyMs: number;
  createdAt: string;
}

export interface ChatApiRequest {
  conversationId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    attachments?: Attachment[];
  }>;
  model?: ClaudeModelId;
  systemInstructions?: string;
  temperature?: number;
  maxTokens?: number;
  mock?: boolean;
}

export type StreamChunk =
  | { type: 'delta'; text: string }
  | { type: 'usage'; inputTokens: number; outputTokens: number }
  | { type: 'done'; totalTokens?: number }
  | { type: 'error'; message: string; code?: string };
