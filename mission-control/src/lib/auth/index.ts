/**
 * Authentication Module
 *
 * Provides user authentication, session management, and admin backdoor access
 */

export * from './users';
export * from './sessions';
export * from './backdoor';

// Re-export types
export type { User, NewUser } from '@/db/schema';
