# My AI — Private Personal AI Assistant

> A premium, private personal AI assistant web application and PWA powered by the Anthropic Claude API (Claude 3.7 Sonnet, Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus).

---

## Features

- ⚡ **Real-Time Streaming**: Progressive token streaming with Server-Sent Events (SSE).
- 🤖 **Multi-Model Support**: Claude 3.7 Sonnet, Claude 3.5 Sonnet (Recommended), Claude 3.5 Haiku, and Claude 3 Opus.
- 🧪 **Mock AI Mode**: Built-in development streaming mode allowing full offline and zero-cost UI testing.
- 📑 **PDF & Document Understanding**: Native Anthropic base64 document block ingestion for PDFs; text and markdown file extraction.
- 🖼️ **Multimodal Vision**: Analysis of JPEG, PNG, and WebP images.
- 💻 **Code Assistant**: Syntax highlighting, language identification, responsive code formatting, and one-click copy.
- 💾 **Hybrid Persistence**: Instant local browser storage (IndexedDB) with PostgreSQL Row-Level Security sync (Supabase).
- 📱 **Responsive PWA**: Installable web app with custom manifest, service worker shell caching, and mobile touch layout.
- 🔒 **Single-Owner Security**: Protected routes, owner authorization checks, sanitized markdown, and no public registration.
- 📊 **Usage Analytics**: Token accounting (input, output, total), latency measurements, and historical logs.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.7 (Strict)
- **Styling**: Tailwind CSS with custom dark/light theme
- **Icons**: Lucide React
- **AI SDK**: Official `@anthropic-ai/sdk`
- **Validation**: Zod
- **Database**: Supabase PostgreSQL with RLS
- **Testing**: Vitest, React Testing Library, JSDOM

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional for local testing)
```bash
cp .env.example .env.local
```
*Note: If no API key is provided, My AI runs automatically in **Mock AI Mode** for local testing.*

To enable live Claude API responses, add your API key to `.env.local`:
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
OWNER_EMAIL=your-email@example.com
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server |
| `npm run build` | Compiles optimized production build |
| `npm start` | Runs the compiled production server |
| `npm test` | Executes the Vitest test suite |
| `npm run typecheck` | Runs TypeScript static verification |

---

## Documentation

Comprehensive engineering documentation is available in the `docs/` directory:
- [Architecture & Data Flow](docs/ARCHITECTURE.md)
- [Database Schema & RLS Policies](docs/DATABASE.md)
- [Claude API Integration Guide](docs/API_INTEGRATION.md)
- [Security Model & Controls](docs/SECURITY.md)
- [Vercel Deployment Guide](docs/DEPLOYMENT.md)
- [Testing & QA Report](docs/TESTING.md)
- [Known Limitations & Roadmap](docs/KNOWN_LIMITATIONS.md)
- [Final Engineering Delivery Report](docs/FINAL_REPORT.md)

---

## License

Private and personal use only.
