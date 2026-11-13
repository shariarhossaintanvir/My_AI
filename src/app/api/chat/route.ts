// ==========================================
// MY AI — Claude Chat API Streaming Route
// ==========================================

import { NextRequest } from 'next/server';
import { ChatApiRequestSchema } from '@/lib/validation/schemas';
import { isAnthropicConfigured, getAnthropicClient, DEFAULT_MODEL } from '@/lib/anthropic/client';
import { SYSTEM_PROMPT, buildAnthropicMessages } from '@/lib/anthropic/context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Validate request payload
    const body = await req.json().catch(() => null);
    const parseResult = ChatApiRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request payload',
          details: parseResult.error.format(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, model } = parseResult.data;

    // 2. Verify Anthropic API key is configured
    if (!isAnthropicConfigured()) {
      return new Response(
        JSON.stringify({
          error: 'Anthropic Claude API key is not configured. Please set ANTHROPIC_API_KEY in C:\\My AI\\.env.local.',
          code: 'ANTHROPIC_KEY_MISSING',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Initialize Anthropic client
    const client = getAnthropicClient();
    const formattedMessages = buildAnthropicMessages(messages);
    const selectedModel = model || DEFAULT_MODEL;

    // 4. Request streaming completion from Anthropic Messages API
    const stream = await client.messages.stream({
      model: selectedModel,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: formattedMessages,
    });

    const encoder = new TextEncoder();

    // 5. Stream tokens back to the browser via SSE
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (req.signal.aborted) {
              stream.abort();
              break;
            }

            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }
          }

          // Signal stream completion
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (streamErr: any) {
          const errChunk = `data: ${JSON.stringify({
            error: streamErr?.message || 'Error occurred during streaming response.',
          })}\n\n`;
          controller.enqueue(encoder.encode(errChunk));
          controller.close();
        }
      },
      cancel() {
        try {
          stream.abort();
        } catch {
          // Ignore cancellation errors
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);

    let statusCode = 500;
    let errorMessage = 'An unexpected server error occurred while contacting Claude.';

    if (error?.status === 401) {
      statusCode = 401;
      errorMessage = 'Invalid Anthropic API Key. Please verify your ANTHROPIC_API_KEY in .env.local.';
    } else if (error?.status === 429) {
      statusCode = 429;
      errorMessage = 'Anthropic rate limit reached. Please wait a moment and try again.';
    } else if (error?.status === 529) {
      statusCode = 503;
      errorMessage = 'Anthropic Claude servers are currently overloaded. Please try again shortly.';
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        code: error?.code || 'CHAT_API_ERROR',
      }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
