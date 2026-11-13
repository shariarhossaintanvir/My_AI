# MY AI — Application Security & Threat Model

## 1. Threat Model & Security Posture
My AI is a **private personal tool** for a single authorized owner. Because it processes personal documents and executes intelligent queries, the architecture employs defense-in-depth across the client, API, database, and third-party transport layers.

---

## 2. Hardened Server-Side Authentication & Authorization

### 2.1 Zero-Trust Client Headers
- Client-supplied headers—including `x-owner-email`, `Host`, `Origin`, `Referer`, and `localhost` hostnames—are **never** trusted as proof of owner identity.
- Proof of identity is strictly established via cryptographically signed Supabase Auth JWT sessions verified on the server via `supabase.auth.getUser(token)`.

### 2.2 Strict Fail-Closed Policy for Paid Claude Inference
- Every invocation of the paid Anthropic Claude API (`/api/chat`) requires a verified owner identity.
- If Supabase Auth is not configured, real Claude API requests **fail closed** immediately with `401 Unauthorized` (`AUTH_REQUIRED`), preventing anonymous or untracked API usage.
- If an unauthenticated user or an authenticated non-owner attempts to query the Claude endpoint, the request is rejected with `401 Unauthorized` or `403 Forbidden` (`FORBIDDEN_NOT_OWNER`).

### 2.3 Immutable Owner Identity (`OWNER_USER_ID`)
- The server checks the authenticated user against:
  1. `OWNER_USER_ID`: Immutable user UUID from Supabase `auth.users(id)`.
  2. `OWNER_EMAIL`: Designated owner email address.
- If neither identifier is configured, the server fails closed.

### 2.4 Production Isolation of Mock Mode
- Mock AI Mode is permanently and unconditionally disabled when `process.env.NODE_ENV === 'production'`.
- Even if a client passes `mock: true` or `USE_MOCK_AI=true` in production, the server rejects mock invocation with `403 Forbidden`.

---

## 3. Credential & Key Protections

### 3.1 Server-Only API Keys
- The Anthropic API Key (`ANTHROPIC_API_KEY`) and Supabase Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`) are stored strictly in server-side environment variables.
- Neither key is prefixed with `NEXT_PUBLIC_`, ensuring they are never bundled into client-side JavaScript or exposed in browser network inspection.

### 3.2 Row-Level Security (RLS)
- All Supabase tables (`profiles`, `conversations`, `messages`, `attachments`, `user_settings`, `usage_logs`) enforce PostgreSQL Row-Level Security.
- The browser cannot pass an arbitrary `user_id` to read or modify another session. Identity is extracted directly from the validated Supabase JWT token:
  ```sql
  CREATE POLICY "Users can manage their own messages"
      ON public.messages FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  ```
- Anonymous access is blocked at the database engine level.

---

## 4. File Validation & Sanitization

- Uploaded attachments are checked for:
  - Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`, `text/plain`, `text/markdown`.
  - Extension verification: Rejects `.exe`, `.sh`, `.bat`, `.html`, `.js`, `.zip`.
  - File size bounds: Hard limit of 20 MB enforced client-side and 25 MB in schema validation.
- Raw text files are sanitized and bounded before injection into the prompt context to prevent prompt injection and memory exhaustion.

---

## 5. Safe Markdown Rendering

- Markdown rendering is sandboxed via `react-markdown` with `remark-gfm`.
- Arbitrary `<script>` tags, inline event handlers, and dangerous iframe attributes are stripped.
- All rendered links are enforced with `target="_blank"` and `rel="noopener noreferrer"` to prevent tab-nabbing.

---

## 6. Security Headers

Configured in `next.config.mjs`:
- `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing exploits.
- `X-Frame-Options: DENY`: Protects against clickjacking.
- `X-XSS-Protection: 1; mode=block`: Legacy browser XSS filter.
- `Referrer-Policy: strict-origin-when-cross-origin`: Mitigates URL parameter leakage.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`: Disables unneeded hardware APIs.
