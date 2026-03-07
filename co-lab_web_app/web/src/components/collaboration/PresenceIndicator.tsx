import { useCollaborationStore } from '../../store/collaborationStore';

export default function PresenceIndicator() {
  const { onlineUsers } = useCollaborationStore();

  const uniqueUsers = onlineUsers.reduce((acc, user) => {
    if (!acc.find((u) => u.userId === user.userId)) {
      acc.push(user);
    }
    return acc;
  }, [] as typeof onlineUsers);

  if (uniqueUsers.length === 0) {
    return null;
  }

  return (
    <span className="absolute -top-1 -right-1 bg-green-500 text-black text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
      {uniqueUsers.length}
    </span>
  );
}
