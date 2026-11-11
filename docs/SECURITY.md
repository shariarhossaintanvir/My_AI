# MY AI — Application Security & Threat Model

## 1. Threat Model & Security Posture
My AI is a **private personal tool** for a single authorized owner. Because it processes personal documents and executes intelligent queries, the architecture employs defense-in-depth across the client, API, database, and third-party transport layers.

---

## 2. Key Security Protections

### 2.1 API Key Isolation
- The Anthropic API Key (`ANTHROPIC_API_KEY`) is stored strictly in server-side environment variables.
- It is never prefixed with `NEXT_PUBLIC_` and is never rendered into any client bundle or hydration payload.
- All Claude invocations are mediated by `/api/chat`.

### 2.2 Row-Level Security (RLS) & Identity Verification
- All Supabase tables (`profiles`, `conversations`, `messages`, `attachments`, `user_settings`, `usage_logs`) enforce PostgreSQL Row-Level Security.
- The browser cannot pass an arbitrary `user_id` to read or modify another session. Identity is extracted directly from the validated Supabase JWT token:
  ```sql
  CREATE POLICY "Users can manage their own messages"
      ON public.messages FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  ```
- Anonymous access is blocked at the database engine level.

### 2.3 Strict File Validation
- Uploaded attachments are checked for:
  - Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`, `text/plain`, `text/markdown`.
  - Extension verification: Rejects `.exe`, `.sh`, `.bat`, `.html`, `.js`, `.zip`.
  - File size bounds: Hard limit of 20 MB enforced client-side and 25 MB in schema validation.
- Raw text files are sanitized and bounded before injection into the prompt context to prevent prompt injection and memory exhaustion.

### 2.4 Safe Markdown Rendering
- Markdown rendering is sandboxed via `react-markdown` with `remark-gfm`.
- Arbitrary `<script>` tags, inline event handlers, and dangerous iframe attributes are stripped.
- All rendered links are enforced with `target="_blank"` and `rel="noopener noreferrer"` to prevent tab-nabbing.

### 2.5 Security Headers
Configured in `next.config.mjs`:
- `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing exploits.
- `X-Frame-Options: DENY`: Protects against clickjacking.
- `X-XSS-Protection: 1; mode=block`: Legacy browser XSS filter.
- `Referrer-Policy: strict-origin-when-cross-origin`: Mitigates URL parameter leakage.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`: Disables unneeded hardware APIs.
