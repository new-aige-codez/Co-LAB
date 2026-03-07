import type { AgentStatus } from '../../store/agentStore';

interface AgentStatusBadgeProps {
  status: AgentStatus;
  showLabel?: boolean;
}

const statusConfig: Record<AgentStatus, { color: string; bgColor: string; label: string; pulse?: boolean }> = {
  offline: {
    color: 'text-gray-400',
    bgColor: 'bg-gray-500',
    label: 'Offline',
  },
  idle: {
    color: 'text-green-400',
    bgColor: 'bg-green-500',
    label: 'Idle',
    pulse: true,
  },
  busy: {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500',
    label: 'Busy',
    pulse: true,
  },
  error: {
    color: 'text-red-400',
    bgColor: 'bg-red-500',
    label: 'Error',
  },
};

export function AgentStatusBadge({ status, showLabel = true }: AgentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-2 ${config.color}`}>
      <span className="relative flex h-3 w-3">
        {config.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.bgColor} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-3 w-3 ${config.bgColor}`}
        />
      </span>
      {showLabel && <span className="text-sm font-medium">{config.label}</span>}
    </div>
  );
}

export { statusConfig };
