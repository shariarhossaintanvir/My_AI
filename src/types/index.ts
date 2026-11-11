// ==========================================
// MY AI — Core Type Definitions
// ==========================================

export type Theme = 'dark' | 'light' | 'system';

export type ClaudeModelId =
  | 'claude-3-7-sonnet-20250219'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-opus-20240229';

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
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    tagline: 'Leading reasoning, coding, and problem solving with hybrid thought',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    badge: 'Latest',
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    tagline: 'Fast, intelligent, exceptional across code, text, and multimodal tasks',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    badge: 'Recommended',
    isDefault: true,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    tagline: 'Ultra-fast, responsive, ideal for rapid conversational queries and quick edits',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    badge: 'Fast',
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    tagline: 'In-depth analysis, comprehensive synthesis, and nuanced long-form writing',
    contextWindow: 200000,
    maxOutputTokens: 4096,
  },
];

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
}

export type StreamChunk =
  | { type: 'delta'; text: string }
  | { type: 'usage'; inputTokens: number; outputTokens: number }
  | { type: 'done'; totalTokens?: number }
  | { type: 'error'; message: string; code?: string };
