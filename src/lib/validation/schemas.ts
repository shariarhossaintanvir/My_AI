import { z } from 'zod';
import { DEFAULT_MODEL_ID } from '@/types';

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Message content cannot be empty').max(100000),
});

export const ChatApiRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1, 'At least one message is required'),
  model: z.string().min(1).optional().default(DEFAULT_MODEL_ID),
});

export type ChatApiRequestInput = z.infer<typeof ChatApiRequestSchema>;
