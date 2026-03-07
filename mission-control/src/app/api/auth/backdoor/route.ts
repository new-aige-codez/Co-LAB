/**
 * Admin Backdoor API Route
 *
 * SECURITY: This endpoint provides emergency admin access using a secret key.
 * The secret should be stored in ADMIN_BACKDOOR_SECRET environment variable.
 *
 * Usage:
 *   POST /api/auth/backdoor
 *   {
 *     "secret": "your-backdoor-secret",
 *     "email": "admin@example.com"
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateBackdoor, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, email } = body;

    // Validate input
    if (!secret || !email) {
      return NextResponse.json(
        { error: 'Secret and email are required' },
        { status: 400 }
      );
    }

    // Validate backdoor access
    const result = await validateBackdoor(secret, email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Access denied' },
        { status: 403 }
      );
    }

    // Build response
    const response = NextResponse.json({
      success: true,
      message: 'Admin session created',
    });

    // Set session cookie
    response.headers.set('Set-Cookie', setSessionCookie(result.token!));

    return response;
  } catch (error) {
    console.error('Backdoor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check if backdoor is available
 * Useful for debugging without exposing the secret
 */
export async function GET() {
  const isAvailable = process.env.ADMIN_BACKDOOR_SECRET ? true : false;
  return NextResponse.json({
    available: isAvailable,
    message: isAvailable
      ? 'Backdoor is configured'
      : 'Backdoor is not configured. Set ADMIN_BACKDOOR_SECRET environment variable.',
  });
}
