/**
 * User CRUD Operations
 *
 * Handles user creation, authentication, and management
 */

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import type { User, NewUser } from '@/db/schema';

const SALT_ROUNDS = 10;

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  password: string,
  displayName?: string,
  role: 'admin' | 'operator' | 'viewer' = 'operator'
): Promise<User> {
  // Check if user already exists
  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const now = new Date();
  const newUser: NewUser = {
    id: `user_${nanoid(12)}`,
    email,
    displayName: displayName || email.split('@')[0],
    passwordHash,
    role,
    createdAt: now,
    lastActiveAt: null,
  };

  const result = await db.insert(users).values(newUser).returning();
  return result[0];
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0] || null;
}

/**
 * Find user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] || null;
}

/**
 * Verify password
 */
export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}

/**
 * Update user's last active timestamp
 */
export async function updateLastActive(userId: string): Promise<void> {
  await db.update(users)
    .set({ lastActiveAt: new Date() })
    .where(eq(users.id, userId));
}

/**
 * Update user profile
 */
export async function updateUser(
  userId: string,
  updates: { displayName?: string; email?: string }
): Promise<User | null> {
  const result = await db.update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning();
  return result[0] || null;
}

/**
 * Change user password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const valid = await verifyPassword(user, currentPassword);
  if (!valid) {
    return false;
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password
  await db.update(users)
    .set({ passwordHash })
    .where(eq(users.id, userId));

  return true;
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  role: 'admin' | 'operator' | 'viewer'
): Promise<User | null> {
  const result = await db.update(users)
    .set({ role })
    .where(eq(users.id, userId))
    .returning();
  return result[0] || null;
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<void> {
  await db.delete(users).where(eq(users.id, userId));
}

/**
 * List all users (admin only)
 */
export async function listUsers(): Promise<User[]> {
  return db.select().from(users);
}

/**
 * Get or create admin user for backdoor access
 */
export async function findOrCreateAdminUser(email: string): Promise<User> {
  let user = await findUserByEmail(email);

  if (!user) {
    // Create admin user with random password
    const randomPassword = nanoid(24);
    user = await createUser(email, randomPassword, 'Admin', 'admin');
  } else if (user.role !== 'admin') {
    // Upgrade to admin if not already
    user = await updateUserRole(user.id, 'admin') || user;
  }

  return user;
}
