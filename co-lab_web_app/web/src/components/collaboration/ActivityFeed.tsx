import { Lock, Unlock, UserPlus, UserMinus, RefreshCw } from 'lucide-react';

// This component can be extended to show a real-time activity log
// For now it's a placeholder for future implementation

interface Activity {
  id: string;
  type: 'lock' | 'unlock' | 'join' | 'leave' | 'sync';
  userId: string;
  userName: string;
  resource?: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const activityIcons = {
  lock: Lock,
  unlock: Unlock,
  join: UserPlus,
  leave: UserMinus,
  sync: RefreshCw,
};

const activityColors = {
  lock: 'text-yellow-400',
  unlock: 'text-green-400',
  join: 'text-blue-400',
  leave: 'text-gray-400',
  sync: 'text-purple-400',
};

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Recent Activity
      </h3>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-500">No recent activity</p>
      ) : (
        <ul className="space-y-2">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];

            return (
              <li
                key={activity.id}
                className="flex items-start gap-2 text-sm py-1"
              >
                <Icon className={`h-4 w-4 mt-0.5 ${colorClass}`} />
                <div className="flex-1">
                  <p className="text-gray-300">
                    <span className="font-medium">{activity.userName}</span>{' '}
                    {activity.type === 'lock' && `locked ${activity.resource}`}
                    {activity.type === 'unlock' && `unlocked ${activity.resource}`}
                    {activity.type === 'join' && 'joined the workspace'}
                    {activity.type === 'leave' && 'left the workspace'}
                    {activity.type === 'sync' && 'synced the workspace'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
