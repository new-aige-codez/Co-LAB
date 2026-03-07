import { Lock, Unlock } from 'lucide-react';

interface LockedResourceBadgeProps {
  resourcePath: string;
  isLocked: boolean;
  isLockedByMe: boolean;
  onLock: () => void;
  onUnlock: () => void;
}

export default function LockedResourceBadge({
  isLocked,
  isLockedByMe,
  onLock,
  onUnlock,
}: LockedResourceBadgeProps) {
  if (!isLocked) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onLock();
        }}
        className="p-1 text-gray-500 hover:text-white transition"
        title="Lock this file for editing"
      >
        <Unlock className="h-4 w-4" />
      </button>
    );
  }

  if (isLockedByMe) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onUnlock();
        }}
        className="flex items-center gap-1 px-2 py-1 bg-primary-600 text-white text-xs rounded-full hover:bg-primary-700 transition"
        title="You have this file locked. Click to unlock."
      >
        <Lock className="h-3 w-3" />
        <span>Locked by you</span>
      </button>
    );
  }

  return (
    <span
      className="flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded-full"
      title="This file is locked by another user"
    >
      <Lock className="h-3 w-3" />
      <span>Locked</span>
    </span>
  );
}
