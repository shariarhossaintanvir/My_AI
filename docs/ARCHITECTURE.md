# MY AI — Architecture & Engineering Specification

## 1. Overview & Architectural Philosophy
**My AI** is engineered as a private, high-performance personal AI assistant tailored for an individual developer/owner. It provides an interface combining the usability of ChatGPT with the aesthetic restraint of Claude, powered by the Anthropic Claude API (Claude 3.7 Sonnet, 3.5 Sonnet, 3.5 Haiku, and 3 Opus).

Key design principles:
- **Zero-Trust Private Boundary**: Single-owner access model. Public registrations, multi-tenant billing, and shared telemetry are explicitly prohibited.
- **Progressive Hybrid Storage**: High-speed, zero-latency local operations via browser IndexedDB, paired with PostgreSQL Row-Level Security (RLS) persistence through Supabase.
- **Server-Side Streaming Pipeline**: Real-time token streaming directly over HTTP/SSE with backpressure management, graceful cancellation, and client-side markdown syntax rendering.
- **Full Multimodal Ingestion**: Native Claude document processing for PDFs and base64 multimodal vision for JPEG, PNG, and WebP images.

---

## 2. System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|  Next.js App Router (React 19 / TypeScript / Tailwind CSS / Lucide React)        |
|                                                                                   |
|  +--------------------+  +----------------------+  +--------------------------+  |
|  |     Sidebar        |  |     MessageList      |  |       ChatComposer       |  |
|  | Conversation Tree  |  | Virtualized Messages |  | Auto-expand, Multi-drop  |  |
|  | History Search     |  | Markdown & CodeBlock |  | PDF / Vision Attachment  |  |
|  | Settings Trigger   |  | SSE Stream Reader    |  | Model Pill / Abort Ctrl  |  |
|  +--------------------+  +----------------------+  +--------------------------+  |
|                                     |                                             |
|                     +---------------+---------------+                             |
|                     |  Unified Storage Repository   |                             |
|                     +---------------+---------------+                             |
|                             /               \                                     |
|             (Local Fallback / Offline)    (Cloud Auth & Sync)                     |
|                           /                   \                                   |
|                +--------------------+   +--------------------+                    |
|                | Browser IndexedDB  |   |   Supabase Client  |                    |
|                | Conversations, Msgs|   |   PostgreSQL / RLS |                    |
|                | Settings, Usage    |   |   Auth Sessions    |                    |
|                +--------------------+   +--------------------+                    |
+-----------------------------------------------------------------------------------+
                                      |
                           HTTP SSE (/api/chat)
                                      |
+-----------------------------------------------------------------------------------+
|                                 BACKEND TIER                                      |
|                       Next.js Route Handlers (Node.js)                            |
|                                                                                   |
|  +-------------------------+   +------------------------+   +------------------+  |
|  |   Input Zod Validator   |-->|   Context Assembler    |-->| Anthropic Client |  |
|  | ChatApiRequestSchema    |   | PDF Blocks & Truncation|   | Official TS SDK  |  |
|  +-------------------------+   +------------------------+   +------------------+  |
|                                                                      |            |
|                                                    +-----------------+            |
|                                                   /                  \            |
|                                          (Live Mode)            (Mock Mode)       |
|                                         /                             \           |
|                               +--------------------+       +--------------------+ |
|                               | Anthropic API      |       | Mock Stream Engine | |
|                               | Claude 3.5 / 3.7   |       | Local Zero-Cost    | |
|                               +--------------------+       +--------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## 3. Core Subsystems

### 3.1 Streaming Response Pipeline
- The client dispatches a POST request to `/api/chat` with message history, active model, and attachment metadata.
- `/api/chat` checks environment credentials. If `ANTHROPIC_API_KEY` is present and not overridden, it initiates an SDK stream via `client.messages.stream(...)`.
- Incoming SSE chunks format as `data: {"type": "delta", "text": "..."}\n\n`, followed by `data: {"type": "usage", ...}\n\n` and `data: {"type": "done"}\n\n`.
- The client reads via a `ReadableStreamDefaultReader`, progressively appending tokens to state while parsing code fences and markdown.
- Clicking the Stop button triggers `AbortController.abort()`, severing the upstream stream without leaking server connections.

### 3.2 Mock AI Mode
- When `MOCK_AI_MODE=true` or in development when `ANTHROPIC_API_KEY` is unconfigured, the application transparently activates the Mock AI provider.
- Yields realistic streaming word tokens, simulates network latency (20ms/token), produces syntax-highlighted code or PDF summaries, and measures simulated token usage.
- Emits a mandatory `> ⚠️ **MOCK AI MODE**` banner to prevent confusing mock output with genuine Claude intelligence.

### 3.3 Context Window Management
- Messages are ordered strictly by sequence number.
- Anthropic requires alternating `user` and `assistant` turns starting with `user`. `buildAnthropicContext` normalizes consecutive user messages, injects system prompts, and converts attachments into Claude-compatible blocks.
- Truncation strategy: When editing an earlier prompt, subsequent turns are pruned locally and remotely to prevent conversation state corruption.
