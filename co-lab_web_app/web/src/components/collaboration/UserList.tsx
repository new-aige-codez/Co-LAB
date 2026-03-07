import { useCollaborationStore } from '../../store/collaborationStore';

const statusColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-500',
};

export default function UserList() {
  const { onlineUsers } = useCollaborationStore();

  // Group by user (they might have multiple connections)
  const uniqueUsers = onlineUsers.reduce((acc, user) => {
    const existing = acc.find((u) => u.userId === user.userId);
    if (!existing) {
      acc.push(user);
    } else {
      // Keep the most recent status
      if (user.status !== 'online' && existing.status === 'online') {
        acc[acc.indexOf(existing)] = user;
      }
    }
    return acc;
  }, [] as typeof onlineUsers);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Online Users ({uniqueUsers.length})
      </h3>

      {uniqueUsers.length === 0 ? (
        <p className="text-sm text-gray-500">No other users online</p>
      ) : (
        <ul className="space-y-2">
          {uniqueUsers.map((user) => (
            <li
              key={user.connectionId}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              {/* Avatar */}
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-sm font-medium">
                  {(user.displayName || 'U')[0].toUpperCase()}
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-gray-800 ${
                    statusColors[user.status]
                  }`}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.displayName || 'Anonymous'}
                </p>
                {user.activity && (
                  <p className="text-xs text-gray-500 truncate">{user.activity}</p>
                )}
              </div>

              {/* Status */}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  user.status === 'online'
                    ? 'bg-green-900/50 text-green-300'
                    : user.status === 'away'
                    ? 'bg-yellow-900/50 text-yellow-300'
                    : user.status === 'busy'
                    ? 'bg-red-900/50 text-red-300'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {user.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
