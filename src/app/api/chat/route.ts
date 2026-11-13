// ==========================================
// MY AI — Real-Time Streaming Chat Route Handler
// ==========================================

import { NextRequest } from 'next/server';
import { ChatApiRequestSchema } from '@/lib/validation/schemas';
import { isMockModeActive, isAnthropicConfigured, getAnthropicClient } from '@/lib/anthropic/client';
import { buildAnthropicContext } from '@/lib/anthropic/context';
import { createMockStream } from '@/lib/anthropic/mock';
import { verifyChatEndpointAuthorization } from '@/lib/security/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify authorization to protect the endpoint from unauthorized or anonymous abuse
    const authResult = await verifyChatEndpointAuthorization(req);
    if (!authResult.authorized) {
      return new Response(
        JSON.stringify({
          error: authResult.error || 'Unauthorized',
          code: 'AUTH_REQUIRED',
        }),
        {
          status: authResult.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Parse and validate request body
    const body = await req.json();
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

    const { messages, model, systemInstructions, temperature, maxTokens, mock } = parseResult.data;

    // 3. Prepare context
    const preparedContext = buildAnthropicContext({
      messages,
      systemInstructions,
    });

    const encoder = new TextEncoder();

    // 4. Check whether Mock AI Mode is explicitly requested
    const isMock = isMockModeActive({ explicitMock: mock });

    if (isMock) {
      const lastUserMsg = messages[messages.length - 1];
      const mockStream = createMockStream({
        userPrompt: lastUserMsg?.content || '',
        attachments: lastUserMsg?.attachments,
        model,
        signal: req.signal,
      });

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of mockStream) {
              if (req.signal.aborted) {
                break;
              }
              const sseEvent = `data: ${JSON.stringify({ type: 'delta', text: chunk })}\n\n`;
              controller.enqueue(encoder.encode(sseEvent));
            }

            // Mock usage stats
            const sseUsage = `data: ${JSON.stringify({
              type: 'usage',
              inputTokens: 120,
              outputTokens: 380,
            })}\n\n`;
            controller.enqueue(encoder.encode(sseUsage));

            const sseDone = `data: ${JSON.stringify({ type: 'done' })}\n\n`;
            controller.enqueue(encoder.encode(sseDone));
            controller.close();
          } catch (err: any) {
            const errEvent = `data: ${JSON.stringify({
              type: 'error',
              message: err.message || 'Stream generation failed',
            })}\n\n`;
            controller.enqueue(encoder.encode(errEvent));
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    // 5. Real Claude Mode (No automatic mock fallback)
    if (!isAnthropicConfigured()) {
      return new Response(
        JSON.stringify({
          error:
            'Anthropic Claude API is not configured. Real Claude mode is active. Please configure ANTHROPIC_API_KEY in .env.local, or explicitly set MOCK_AI_MODE=true or USE_MOCK_AI=true for local mock testing.',
          code: 'ANTHROPIC_NOT_CONFIGURED',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = getAnthropicClient();

    const stream = await client.messages.stream({
      model,
      max_tokens: maxTokens,
      temperature,
      system: preparedContext.systemPrompt,
      messages: preparedContext.messages,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        let inputTokens = 0;
        let outputTokens = 0;

        try {
          for await (const event of stream) {
            if (req.signal.aborted) {
              stream.abort();
              break;
            }

            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const sseChunk = `data: ${JSON.stringify({
                type: 'delta',
                text: event.delta.text,
              })}\n\n`;
              controller.enqueue(encoder.encode(sseChunk));
            } else if (event.type === 'message_delta' && event.usage) {
              outputTokens = event.usage.output_tokens || 0;
            } else if (event.type === 'message_start' && event.message?.usage) {
              inputTokens = event.message.usage.input_tokens || 0;
            }
          }

          // Emit final usage data
          const sseUsage = `data: ${JSON.stringify({
            type: 'usage',
            inputTokens,
            outputTokens,
          })}\n\n`;
          controller.enqueue(encoder.encode(sseUsage));

          const sseDone = `data: ${JSON.stringify({ type: 'done' })}\n\n`;
          controller.enqueue(encoder.encode(sseDone));
          controller.close();
        } catch (streamError: any) {
          const sseError = `data: ${JSON.stringify({
            type: 'error',
            message: streamError.message || 'Error occurred during Claude generation',
          })}\n\n`;
          controller.enqueue(encoder.encode(sseError));
          controller.close();
        }
      },
      cancel() {
        try {
          stream.abort();
        } catch {
          // ignore
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);

    // Format descriptive error message without leaking sensitive credentials
    let errorMessage = 'An unexpected server error occurred.';
    let statusCode = 500;

    if (error?.status === 401) {
      errorMessage = 'Invalid Anthropic API Key. Please verify your ANTHROPIC_API_KEY environment variable.';
      statusCode = 401;
    } else if (error?.status === 429) {
      errorMessage = 'Anthropic rate limit reached. Please wait a moment before sending another request.';
      statusCode = 429;
    } else if (error?.status === 529) {
      errorMessage = 'Anthropic Claude servers are currently overloaded. Please try again shortly.';
      statusCode = 503;
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
