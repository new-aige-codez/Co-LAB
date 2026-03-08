/**
 * Collaboration Types
 *
 * Types for real-time collaboration features
 */

// User presence in a room/document
export interface PresenceUser {
  id: string;
  name: string;
  color: string;
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  lastSeen: Date;
}

// Room/document for collaboration
export interface CollaborationRoom {
  id: string;
  type: 'feature' | 'task' | 'document' | 'project';
  name: string;
  users: PresenceUser[];
  lockedBy: string | null;
  lockedAt: Date | null;
}

// Resource lock
export interface ResourceLock {
  resourceId: string;
  resourceType: 'feature' | 'task' | 'document';
  lockedBy: string;
  lockedAt: Date;
  expiresAt: Date;
}

// WebSocket message types
export type WSMessageType =
  | 'join'
  | 'leave'
  | 'presence_update'
  | 'cursor_move'
  | 'selection_change'
  | 'lock_acquire'
  | 'lock_release'
  | 'lock_expired'
  | 'state_sync'
  | 'ping'
  | 'pong';

export interface WSMessage {
  type: WSMessageType;
  payload: unknown;
  timestamp: Date;
  senderId: string;
}

export interface JoinPayload {
  roomId: string;
  userId: string;
  userName: string;
  userColor: string;
}

export interface PresenceUpdatePayload {
  roomId: string;
  user: Partial<PresenceUser>;
}

export interface LockPayload {
  resourceId: string;
  resourceType: 'feature' | 'task' | 'document';
}

// Connection configuration
export interface WSServerConfig {
  maxConnections: number;
  heartbeatInterval: number;
  lockTimeout: number;
  port: number;
}

// Default configuration for Oracle Cloud (6GB free tier)
export const DEFAULT_WS_CONFIG: WSServerConfig = {
  maxConnections: 50,
  heartbeatInterval: 30000,
  lockTimeout: 300000, // 5 minutes
  port: 3002,
};
