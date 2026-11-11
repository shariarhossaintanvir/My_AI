import { z } from 'zod';

export const AttachmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  type: z.enum(['image', 'pdf', 'text', 'markdown']),
  mimeType: z.string().min(1),
  size: z.number().int().positive().max(25 * 1024 * 1024), // Max 25MB per file
  dataUrl: z.string().optional(),
  base64: z.string().optional(),
  extractedText: z.string().max(500000).optional(), // Max 500k chars for text files
});

export const ChatMessageInputSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(100000), // Max 100k chars per message
  attachments: z.array(AttachmentSchema).max(5).optional(), // Up to 5 attachments per message
});

export const ChatApiRequestSchema = z.object({
  conversationId: z.string().min(1),
  messages: z.array(ChatMessageInputSchema).min(1),
  model: z
    .enum([
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
    ])
    .default('claude-3-5-sonnet-20241022'),
  systemInstructions: z.string().max(10000).optional(),
  temperature: z.number().min(0).max(1).optional().default(0.7),
  maxTokens: z.number().int().min(256).max(8192).optional().default(4096),
});

export const UserSettingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).default('system'),
  preferredModel: z
    .enum([
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
    ])
    .default('claude-3-5-sonnet-20241022'),
  systemInstructions: z.string().max(5000).default(''),
  temperature: z.number().min(0).max(1).default(0.7),
  maxOutputTokens: z.number().int().min(256).max(8192).default(4096),
  sendOnEnter: z.boolean().default(true),
});

export const ConversationCreateSchema = z.object({
  title: z.string().min(1).max(120).default('New Conversation'),
  model: z.string().min(1).default('claude-3-5-sonnet-20241022'),
});

export const ConversationRenameSchema = z.object({
  title: z.string().trim().min(1).max(120),
});
