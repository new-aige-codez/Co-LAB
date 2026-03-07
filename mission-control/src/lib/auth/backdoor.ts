/**
 * Admin Backdoor Access
 *
 * Provides a secure way to access the system as admin even if
 * normal authentication is broken. Requires a secret key.
 *
 * SECURITY: Keep ADMIN_BACKDOOR_SECRET secure and rotate it regularly.
 */

import { findOrCreateAdminUser } from './users';
import { createSession, setSessionCookie } from './sessions';

const BACKDOOR_SECRET = process.env.ADMIN_BACKDOOR_SECRET;

if (!BACKDOOR_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('[SECURITY] ADMIN_BACKDOOR_SECRET is not set in production!');
}

/**
 * Validate backdoor access and create admin session
 *
 * @param secret - The backdoor secret from environment
 * @param email - The email to use for admin access
 * @returns Session token if successful
 */
export async function validateBackdoor(
  secret: string,
  email: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  // Validate secret
  if (!BACKDOOR_SECRET) {
    return {
      success: false,
      error: 'Backdoor is not configured. Set ADMIN_BACKDOOR_SECRET environment variable.',
    };
  }

  if (secret !== BACKDOOR_SECRET) {
    // Log failed attempt
    console.warn(`[SECURITY] Failed backdoor attempt for email: ${email}`);
    return {
      success: false,
      error: 'Invalid backdoor secret',
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: 'Invalid email format',
    };
  }

  try {
    // Find or create admin user
    const user = await findOrCreateAdminUser(email);

    // Create session
    const session = await createSession(user.id);

    // Log successful backdoor access
    console.log(`[SECURITY] Successful backdoor access for: ${email} at ${new Date().toISOString()}`);

    return {
      success: true,
      token: session.token,
    };
  } catch (error) {
    console.error('[SECURITY] Backdoor error:', error);
    return {
      success: false,
      error: 'Failed to create admin session',
    };
  }
}

/**
 * Check if backdoor is available
 */
export function isBackdoorAvailable(): boolean {
  return !!BACKDOOR_SECRET;
}

/**
 * Generate a secure backdoor secret
 * Run this to generate a new secret for ADMIN_BACKDOOR_SECRET
 */
export async function generateBackdoorSecret(): Promise<string> {
  const crypto = await import('crypto');
  return crypto.randomBytes(32).toString('hex');
}
