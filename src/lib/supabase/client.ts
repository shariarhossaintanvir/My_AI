// ==========================================
// MY AI — Supabase Browser Client
// ==========================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    !url.includes('your-project-ref') &&
    !anonKey.includes('your-anon-key')
  );
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;

  if (supabaseClient) return supabaseClient;

  if (!isSupabaseConfigured()) {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  supabaseClient = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseClient;
}
