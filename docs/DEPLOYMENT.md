# MY AI — Deployment & Infrastructure Guide

## 1. Zero-Cost Infrastructure Architecture
The entire application is architected to operate comfortably within free-tier limits:
- **Application Hosting**: Vercel Hobby Tier (Unlimited static hosting, serverless functions with streaming support).
- **Database & Auth**: Supabase Free Tier (500MB PostgreSQL, 50,000 monthly active users).
- **Client Storage**: Browser IndexedDB (Zero infrastructure cost, instant local access).
- **AI Inference**: Anthropic Claude API (Direct pay-per-token API usage, or Zero-Cost Mock AI Mode for development).

---

## 2. Environment Variables Checklist
Configure these environment variables in your Vercel Project Settings (`Settings > Environment Variables`):

| Variable | Description | Required? | Example |
| :--- | :--- | :--- | :--- |
| `ANTHROPIC_API_KEY` | Anthropic Console API key | Yes (for live Claude) | `sk-ant-api03-...` |
| `ANTHROPIC_MODEL` | Default Claude model ID | Optional | `claude-3-5-sonnet-20241022` |
| `OWNER_EMAIL` | Single-owner authorized email | Yes | `owner@example.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Optional (for cloud sync) | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Public Anon Key | Optional (for cloud sync) | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | Optional (for server sync) | `eyJhbGci...` |
| `MOCK_AI_MODE` | Force Mock AI mode | Optional | `false` |

---

## 3. Deployment Steps to Vercel

### Step 1: Initialize Git Repository & Commit
```bash
git add .
git commit -m "feat: complete My AI application"
```

### Step 2: Push to GitHub (User Approval Required)
Create a private GitHub repository:
```bash
git remote add origin https://github.com/<your-username>/my-ai.git
git push -u origin main
```

### Step 3: Connect to Vercel
1. Log into [vercel.com](https://vercel.com).
2. Click **Add New Project** and select your `my-ai` repository.
3. In **Environment Variables**, paste the keys from the table above.
4. Click **Deploy**.

---

## 4. Production Verification Checklist
- [ ] Application loads at production domain without console errors.
- [ ] PWA manifest and service worker load successfully.
- [ ] Sending a message streams tokens smoothly with no truncation.
- [ ] Attaching a PDF or image successfully transmits and returns contextual AI analysis.
- [ ] Conversations persist across browser reloads.
- [ ] Switching themes (Dark, Light, System) applies instantaneously.
- [ ] Usage tracking records token counts in settings.

