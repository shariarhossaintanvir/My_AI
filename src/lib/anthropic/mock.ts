// ==========================================
// MY AI — Mock AI Provider (Development & Testing)
// ==========================================

import { Attachment } from '@/types';

export interface MockStreamOptions {
  userPrompt: string;
  attachments?: Attachment[];
  model?: string;
  signal?: AbortSignal;
}

/**
 * Generates an intelligent, context-aware mock response for local testing
 * without expending Anthropic Claude API credits.
 */
export function generateMockContent(prompt: string, attachments?: Attachment[]): string {
  const p = prompt.toLowerCase();

  // 1. Attached document or image handling
  if (attachments && attachments.length > 0) {
    const file = attachments[0];
    if (file.type === 'pdf') {
      return `### 📄 Document Analysis: ${file.name}

I have processed your PDF document (**${file.name}**, ${(file.size / 1024).toFixed(1)} KB).

Here is a summary of the key insights:
- **Document Structure**: Validated PDF format compatible with Claude 3.5 native document input.
- **Content Overview**: The document contains structured information that can be analyzed, summarized, or extracted.
- **Actionable Next Steps**: You can ask specific questions about sections, request table data extraction, or ask for an executive brief.

*Note: In live mode with your \`ANTHROPIC_API_KEY\` set, Claude 3.5/3.7 performs full contextual OCR and multimodal document comprehension.*`;
    }

    if (file.type === 'image') {
      return `### 🖼️ Image Inspection: ${file.name}

I have analyzed the uploaded image (**${file.name}**, ${(file.size / 1024).toFixed(1)} KB, \`${file.mimeType}\`).

**Visual Observations:**
1. **Composition**: The image is formatted correctly for Anthropic Vision processing.
2. **Context**: You can ask for UI layout evaluation, screenshot debugging, text transcription, or visual question answering.

\`\`\`json
{
  "status": "image_received",
  "filename": "${file.name}",
  "mimeType": "${file.mimeType}",
  "resolution": "optimized for Claude Vision"
}
\`\`\`

Feel free to ask follow-up questions regarding any visual element!`;
    }
  }

  // 2. Coding query
  if (p.includes('code') || p.includes('function') || p.includes('react') || p.includes('typescript') || p.includes('python') || p.includes('bug') || p.includes('javascript')) {
    return `Here is a clean, robust implementation matching your request:

\`\`\`typescript
/**
 * Processes incoming data streams with backpressure control.
 */
export async function processDataStream<T, R>(
  items: AsyncIterable<T>,
  transform: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  
  for await (const item of items) {
    try {
      const transformed = await transform(item);
      results.push(transformed);
    } catch (error) {
      console.error('Failed to process chunk:', error);
      throw error;
    }
  }

  return results;
}
\`\`\`

### Key Architectural Details:
- **Type Safety**: Fully typed with generic parameters \`<T, R>\`.
- **Error Handling**: Catches individual item errors without memory leakage.
- **Async Iteration**: Compatible with modern JavaScript \`for await...of\` streaming loops.

Let me know if you would like me to adapt this for a specific framework or use case!`;
  }

  // 3. General greeting or query
  return `### Hello! I am My AI.

I am your private, personal AI assistant powered by Claude. Here is how I can assist you:

- 💻 **Engineering & Code**: Architecture design, debugging, full-stack implementations, and unit tests.
- 📑 **Document Analysis**: Uploading and analyzing PDFs, Markdown specifications, and text files.
- 🎨 **Multimodal Vision**: Reviewing screenshots, UI mockups, and architectural diagrams.
- ⚡ **Real-time Collaboration**: Streaming responses with instantaneous feedback and conversation history.

How can I assist your workflow today?`;
}

/**
 * Creates an async generator yielding text chunks simulating real-time LLM streaming.
 */
export async function* createMockStream(options: MockStreamOptions): AsyncGenerator<string, { inputTokens: number; outputTokens: number }, void> {
  const { userPrompt, attachments, signal } = options;

  const fullText = `> ⚠️ **MOCK AI MODE** — Development preview (No Claude API credits used)\n\n` +
    generateMockContent(userPrompt, attachments);

  // Split into words / token-like chunks
  const words = fullText.split(/(\s+)/);

  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) {
      break;
    }

    yield words[i];

    // Small delay to simulate realistic streaming cadence (20ms)
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  const inputTokens = Math.ceil(userPrompt.length / 4) + (attachments ? attachments.length * 100 : 0) + 40;
  const outputTokens = Math.ceil(fullText.length / 4);

  return { inputTokens, outputTokens };
}
