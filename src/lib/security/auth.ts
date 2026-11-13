// ==========================================
// MY AI — API Endpoint Authentication & Authorization
// ==========================================

import { NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isAuthorizedOwner } from './sanitize';

export interface AuthVerificationResult {
  authorized: boolean;
  status: number;
  error?: string;
  userId?: string;
  userEmail?: string;
}

/**
 * Server-side authorization check to protect paid API endpoints (such as /api/chat).
 * Ensures anonymous or unauthorized requests cannot trigger paid Claude API inferences.
 *
 * Enforcement Rules:
 * 1. If Supabase is configured:
 *    - Validates Bearer token or Supabase session cookie.
 *    - Queries Supabase Auth to verify active user identity.
 *    - Confirms user email matches isAuthorizedOwner(email).
 *    - Fails with 401 (unauthenticated) or 403 (unauthorized).
 * 2. If Supabase is NOT configured:
 *    - In production (NODE_ENV === 'production'):
 *      Rejects all anonymous invocations with 401 Unauthorized because an authentication
 *      provider must be active in production to safeguard paid resources.
 *    - In development (NODE_ENV !== 'production'):
 *      Authorizes local requests from the host machine for single-owner development.
 *      If OWNER_EMAIL is configured and an x-owner-email header is provided, verifies it matches.
 */
export async function verifyChatEndpointAuthorization(
  req: NextRequest
): Promise<AuthVerificationResult> {
  const isProduction = process.env.NODE_ENV === 'production';
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();

  // 1. Supabase Auth Verification (Production / Cloud persistence mode)
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return {
        authorized: false,
        status: 500,
        error: 'Authentication configuration error: Supabase client unavailable.',
      };
    }

    // Extract token from Authorization header or cookie
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
        error: 'Unauthorized: Authentication token is required to access the Claude API.',
      };
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return {
          authorized: false,
          status: 401,
          error: 'Unauthorized: Invalid or expired authentication session.',
        };
      }

      if (!isAuthorizedOwner(user.email)) {
        return {
          authorized: false,
          status: 403,
          error: 'Forbidden: You are not authorized to access this private personal AI assistant.',
        };
      }

      return {
        authorized: true,
        status: 200,
        userId: user.id,
        userEmail: user.email,
      };
    } catch {
      return {
        authorized: false,
        status: 401,
        error: 'Unauthorized: Failed to verify authentication token.',
      };
    }
  }

  // 2. Standalone Mode in Production (No Supabase configured)
  if (isProduction) {
    return {
      authorized: false,
      status: 401,
      error: 'Unauthorized: A verified authentication session is required in production to access paid Claude endpoints.',
    };
  }

  // 3. Local Development Mode
  // If OWNER_EMAIL is configured and client sent x-owner-email, verify match
  const providedEmail = req.headers.get('x-owner-email')?.trim().toLowerCase();
  if (ownerEmail && providedEmail && providedEmail !== ownerEmail) {
    return {
      authorized: false,
      status: 403,
      error: 'Forbidden: Provided email does not match the configured application owner.',
    };
  }

  return {
    authorized: true,
    status: 200,
    userEmail: ownerEmail || 'local-development-owner',
  };
}
