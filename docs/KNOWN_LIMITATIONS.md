# MY AI — Known Limitations & Future Roadmap

## 1. Current Architectural Boundaries

### 1.1 Single-Owner Scope
- **Designed Scope**: My AI is explicitly built as a private personal assistant for one authorized owner.
- **Multi-Tenant Limitation**: Multi-user registration, tenant billing, organization hierarchies, and role-based permissions (RBAC) are not implemented by deliberate design intent.

### 1.2 Document Understanding Bounds
- **Supported File Types**: PDF, TXT, and Markdown.
- **Office Formats**: Word (`.docx`), Excel (`.xlsx`), and PowerPoint (`.pptx`) are not currently parsed natively. Users should convert documents to PDF or export text before uploading.
- **Size Limits**: Attachment uploads are constrained to 20 MB per file, and maximum 5 files per message turn, in compliance with Anthropic and serverless payload thresholds.

### 1.3 Offline Capabilities
- **Local Shell Access**: The PWA service worker caches application shell, navigation, and theme assets, enabling offline review of previously loaded chat history stored in IndexedDB.
- **Inference Requirement**: New conversational queries, streaming, and document analysis require an active network connection to reach either the local Next.js server or the Anthropic Claude API. The AI cannot generate completions offline.

### 1.4 Code Execution Environment
- My AI functions strictly as a code assistant and architectural adviser. It does not provide remote containerized code execution (sandboxed Docker execution). Code must be run locally in the owner's preferred development environment.

---

## 2. External Credentials Pending Verification
- **Anthropic Claude API Key**: When running locally without `ANTHROPIC_API_KEY`, the application activates the Mock AI Provider. Live streaming inference with Claude requires setting `ANTHROPIC_API_KEY` in `.env.local`.
- **Supabase Cloud Persistence**: In local mode without remote Supabase credentials, the application automatically uses client-side IndexedDB for complete persistence. Remote synchronization requires setting `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

