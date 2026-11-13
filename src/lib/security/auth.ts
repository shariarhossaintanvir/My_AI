// ==========================================
// MY AI — Server-Side Authentication & Authorization
// ==========================================

import { NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export interface AuthVerificationResult {
  authorized: boolean;
  status: number;
  code?: string;
  error?: string;
  userId?: string;
  userEmail?: string;
}

/**
 * Validates that an authenticated Supabase user matches the designated owner identity.
 * Evaluates immutable OWNER_USER_ID (UUID) and/or OWNER_EMAIL.
 * Fails closed if neither is configured.
 */
export function isVerifiedOwnerUser(user: { id: string; email?: string | null }): boolean {
  if (!user || !user.id) return false;

  const ownerUserId = process.env.OWNER_USER_ID?.trim();
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();

  // If both are configured, require both to match for maximum assurance
  if (ownerUserId && user.id !== ownerUserId) {
    return false;
  }

  if (ownerEmail) {
    if (!user.email || user.email.trim().toLowerCase() !== ownerEmail) {
      return false;
    }
  }

  // If neither identifier is configured, fail closed
  if (!ownerUserId && !ownerEmail) {
    return false;
  }

  return true;
}

/**
 * Server-side authorization check protecting the chat endpoint.
 *
 * Security Guarantees:
 * 1. Proof of identity is NEVER derived from client-supplied headers (Origin, Host, Referer, x-owner-email).
 * 2. Every request invoking paid real Claude inference REQUIRES a verified Supabase Auth session.
 * 3. If Supabase Auth is not configured, real Claude requests FAIL CLOSED (401 Unauthorized / AUTH_REQUIRED).
 * 4. Mock AI mode is strictly prohibited in production (NODE_ENV === 'production').
 * 5. In development, Mock AI mode is permitted ONLY when explicitly requested, with zero paid API capability.
 */
export async function verifyChatEndpointAuthorization(
  req: NextRequest,
  isMockMode: boolean = false
): Promise<AuthVerificationResult> {
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Guard against accidental Mock Mode in production
  if (isMockMode) {
    if (isProduction) {
      return {
        authorized: false,
        status: 403,
        code: 'MOCK_MODE_FORBIDDEN_IN_PRODUCTION',
        error: 'Forbidden: Mock AI Mode is permanently disabled in production environments.',
      };
    }

    // In development, mock mode produces only local simulated tokens with zero paid API access.
    return {
      authorized: true,
      status: 200,
      userEmail: 'dev-mock-mode',
    };
  }

  // 2. Real Claude Requests: ALWAYS require verified owner identity.
  // Fail closed if Supabase Auth is not configured.
  if (!isSupabaseConfigured()) {
    return {
      authorized: false,
      status: 401,
      code: 'AUTH_REQUIRED',
      error: 'Authentication configuration required: A verified Supabase Auth session is required to invoke real Claude inference. Please configure Supabase Auth (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) or explicitly enable development mock mode with USE_MOCK_AI=true.',
    };
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      authorized: false,
      status: 500,
      code: 'AUTH_SERVER_ERROR',
      error: 'Authentication server error: Supabase client is unavailable.',
    };
  }

  // Extract Bearer token from Authorization header or Supabase session cookies
  const authHeader = req.headers.get('authorization') || '';
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null;

  const cookieToken =
    req.cookies.get('sb-access-token')?.value ||
    req.cookies.get('sb:token')?.value;

  const token = bearerToken || cookieToken;

  if (!token) {
    return {
      authorized: false,
      status: 401,
      code: 'AUTH_REQUIRED',
      error: 'Unauthorized: Authentication token is required to invoke Claude API inference.',
    };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return {
        authorized: false,
        status: 401,
        code: 'INVALID_TOKEN',
        error: 'Unauthorized: Invalid, expired, or malformed authentication token.',
      };
    }

    // Verify authenticated user is the designated owner
    if (!isVerifiedOwnerUser(user)) {
      return {
        authorized: false,
        status: 403,
        code: 'FORBIDDEN_NOT_OWNER',
        error: 'Forbidden: You are not authorized to access this private personal AI assistant.',
      };
    }

    return {
      authorized: true,
      status: 200,
      userId: user.id,
      userEmail: user.email || undefined,
    };
  } catch {
    return {
      authorized: false,
      status: 401,
      code: 'INVALID_TOKEN',
      error: 'Unauthorized: Failed to verify authentication session.',
    };
  }
}
