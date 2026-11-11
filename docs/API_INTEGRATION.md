# MY AI — Anthropic Claude API Integration Guide

## 1. SDK Configuration
The backend integrates directly with the official `@anthropic-ai/sdk` TypeScript package (`^0.39.0`). The API key is stored strictly on the server side in `process.env.ANTHROPIC_API_KEY` and is never transmitted or exposed to the client browser.

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

---

## 2. Supported Claude Models

| Model Name | Model Identifier | Context Window | Max Output | Primary Strengths |
| :--- | :--- | :--- | :--- | :--- |
| **Claude 3.7 Sonnet** | `claude-3-7-sonnet-20250219` | 200,000 tokens | 8,192 tokens | Hybrid reasoning, advanced programming, nuanced analysis |
| **Claude 3.5 Sonnet** | `claude-3-5-sonnet-20241022` | 200,000 tokens | 8,192 tokens | Fast, intelligent, exceptional across code & vision (*Default*) |
| **Claude 3.5 Haiku** | `claude-3-5-haiku-20241022` | 200,000 tokens | 4,096 tokens | Ultra-low latency, rapid question answering |
| **Claude 3 Opus** | `claude-3-opus-20240229` | 200,000 tokens | 4,096 tokens | Deep literary writing, long-form synthesis |

---

## 3. Multimodal & Document Block Payloads

### 3.1 PDF Documents (Native Document Block)
PDF files are encoded into base64 and sent directly using Anthropic's native document format:
```json
{
  "role": "user",
  "content": [
    {
      "type": "document",
      "source": {
        "type": "base64",
        "media_type": "application/pdf",
        "data": "<BASE64_ENCODED_PDF>"
      }
    },
    {
      "type": "text",
      "text": "Summarize this technical specification and list risks."
    }
  ]
}
```

### 3.2 Multimodal Vision (PNG, JPEG, WebP)
Images are transmitted as vision content blocks:
```json
{
  "role": "user",
  "content": [
    {
      "type": "image",
      "source": {
        "type": "base64",
        "media_type": "image/png",
        "data": "<BASE64_ENCODED_IMAGE>"
      }
    },
    {
      "type": "text",
      "text": "Explain what this diagram illustrates."
    }
  ]
}
```

---

## 4. Server-Sent Events (SSE) Stream Protocol
Responses from `/api/chat` are streamed over HTTP using the `text/event-stream` MIME type:
- `data: {"type": "delta", "text": "token"}`: Emits incoming text delta tokens.
- `data: {"type": "usage", "inputTokens": 140, "outputTokens": 320}`: Token accounting on stream completion.
- `data: {"type": "done"}`: Marks clean stream termination.
- `data: {"type": "error", "message": "..."}`: Relays provider rate limits, context overflows, or authentication errors.
