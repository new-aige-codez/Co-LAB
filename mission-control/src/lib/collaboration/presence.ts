/**
 * Presence Tracking
 *
 * Tracks user presence in collaboration rooms
 */

import type { PresenceUser, CollaborationRoom } from './types';

// In-memory presence store (for single-instance deployment)
const rooms = new Map<string, CollaborationRoom>();

// Generate a random color for a user
function generateUserColor(): string {
  const colors = [
    '#f97316', // orange
    '#22c55e', // green
    '#3b82f6', // blue
    '#a855f7', // purple
    '#ec4899', // pink
    '#eab308', // yellow
    '#14b8a6', // teal
    '#6366f1', // indigo
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Join a collaboration room
 */
export function joinRoom(
  roomId: string,
  roomType: CollaborationRoom['type'],
  roomName: string,
  userId: string,
  userName: string
): CollaborationRoom {
  let room = rooms.get(roomId);

  if (!room) {
    room = {
      id: roomId,
      type: roomType,
      name: roomName,
      users: [],
      lockedBy: null,
      lockedAt: null,
    };
    rooms.set(roomId, room);
  }

  // Check if user already in room
  const existingUser = room.users.find((u) => u.id === userId);
  if (!existingUser) {
    room.users.push({
      id: userId,
      name: userName,
      color: generateUserColor(),
      lastSeen: new Date(),
    });
  } else {
    // Update last seen
    existingUser.lastSeen = new Date();
  }

  return room;
}

/**
 * Leave a collaboration room
 */
export function leaveRoom(roomId: string, userId: string): CollaborationRoom | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.users = room.users.filter((u) => u.id !== userId);

  // Release lock if held by leaving user
  if (room.lockedBy === userId) {
    room.lockedBy = null;
    room.lockedAt = null;
  }

  // Remove empty rooms
  if (room.users.length === 0) {
    rooms.delete(roomId);
    return null;
  }

  return room;
}

/**
 * Update user presence
 */
export function updatePresence(
  roomId: string,
  userId: string,
  updates: Partial<Pick<PresenceUser, 'cursor' | 'selection'>>
): PresenceUser | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  const user = room.users.find((u) => u.id === userId);
  if (!user) return null;

  if (updates.cursor) user.cursor = updates.cursor;
  if (updates.selection) user.selection = updates.selection;
  user.lastSeen = new Date();

  return user;
}

/**
 * Get room info
 */
export function getRoom(roomId: string): CollaborationRoom | null {
  return rooms.get(roomId) || null;
}

/**
 * Get all rooms a user is in
 */
export function getUserRooms(userId: string): CollaborationRoom[] {
  return Array.from(rooms.values()).filter((room) =>
    room.users.some((u) => u.id === userId)
  );
}

/**
 * Clean up stale users (not seen in last 5 minutes)
 */
export function cleanupStaleUsers(): void {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  for (const [roomId, room] of rooms) {
    room.users = room.users.filter((u) => u.lastSeen > fiveMinutesAgo);

    if (room.lockedBy) {
      const locker = room.users.find((u) => u.id === room.lockedBy);
      if (!locker) {
        room.lockedBy = null;
        room.lockedAt = null;
      }
    }

    if (room.users.length === 0) {
      rooms.delete(roomId);
    }
  }
}

/**
 * Get all active rooms (for debugging)
 */
export function getAllRooms(): CollaborationRoom[] {
  return Array.from(rooms.values());
}
