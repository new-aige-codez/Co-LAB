/**
 * JWT Session Management
 *
 * Handles token creation, validation, and session management
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { eq, lt } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const COOKIE_NAME = 'mission_control_session';

// Get secret key as Uint8Array
async function getSecretKey(): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  return encoder.encode(JWT_SECRET);
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string): Promise<{ id: string; token: string; expiresAt: Date }> {
  const id = `session_${nanoid(12)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY);

  // Create JWT token
  const secretKey = await getSecretKey();
  const token = await new SignJWT({
    sub: userId,
    sessionId: id,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey);

  // Store session in database
  await db.insert(sessions).values({
    id,
    userId,
    token,
    createdAt: now,
    expiresAt,
  });

  return { id, token, expiresAt };
}

/**
 * Validate a session token
 */
export async function validateSession(token: string): Promise<{ userId: string; sessionId: string } | null> {
  try {
    // Verify JWT
    const secretKey = await getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);

    if (!payload.sub || !payload.sessionId) {
      return null;
    }

    // Check if session exists in database and hasn't expired
    const result = await db.select().from(sessions).where(eq(sessions.token, token));
    const session = result[0];

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return {
      userId: payload.sub as string,
      sessionId: payload.sessionId as string,
    };
  } catch {
    return null;
  }
}

/**
 * Get the current session from cookies
 */
export async function getSession(): Promise<{ userId: string; sessionId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return validateSession(token);
}

/**
 * Set session cookie in response
 */
export function setSessionCookie(token: string): string {
  const maxAge = TOKEN_EXPIRY / 1000; // Convert to seconds
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/**
 * Invalidate a session (logout)
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const now = new Date();
  const result = await db.delete(sessions).where(lt(sessions.expiresAt, now));
  return result.changes ?? 0;
}
