import React from 'react';
import { useAgentStore, type LocalAgent } from '../../store/agentStore';
import { AgentStatusBadge } from './AgentStatusBadge';

interface AgentCardProps {
  agent: LocalAgent;
  onClick?: () => void;
  onRetire?: () => void;
}

export function AgentCard({ agent, onClick, onRetire }: AgentCardProps) {
  const { retireAgent, isLoading } = useAgentStore();

  const handleRetire = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Retire agent "${agent.name}"? This will set it offline.`)) {
      await retireAgent(agent.id);
      onRetire?.();
    }
  };

  const formatLastSeen = (date: Date | string | null) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const isStale = () => {
    if (!agent.lastHeartbeat) return true;
    const lastHeartbeat = new Date(agent.lastHeartbeat);
    const now = new Date();
    const diffMs = now.getTime() - lastHeartbeat.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins > 5 && agent.status !== 'offline';
  };

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Agent avatar */}
          <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center text-white font-semibold">
            {agent.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium text-gray-100">{agent.name}</h3>
            <p className="text-xs text-gray-500 font-mono">{agent.machineId.slice(0, 8)}</p>
          </div>
        </div>
        <AgentStatusBadge status={agent.status} />
      </div>

      {/* Status info */}
      <div className="space-y-2 text-sm">
        {/* Last heartbeat */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Last seen</span>
          <span className={`${isStale() ? 'text-orange-400' : 'text-gray-300'}`}>
            {formatLastSeen(agent.lastHeartbeat)}
          </span>
        </div>

        {/* Current task */}
        {agent.currentTaskId && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Working on</span>
            <span className="text-primary-400 font-mono text-xs">
              {agent.currentTaskId.slice(0, 8)}
            </span>
          </div>
        )}

        {/* Project */}
        {agent.projectId && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Project</span>
            <span className="text-gray-300 font-mono text-xs">
              {agent.projectId.slice(0, 8)}
            </span>
          </div>
        )}
      </div>

      {/* Capabilities */}
      {agent.capabilities && agent.capabilities.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex flex-wrap gap-1">
            {agent.capabilities.slice(0, 4).map((cap) => (
              <span
                key={cap}
                className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded"
              >
                {cap}
              </span>
            ))}
            {agent.capabilities.length > 4 && (
              <span className="text-xs text-gray-500">
                +{agent.capabilities.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {agent.status !== 'offline' && (
        <div className="mt-3 pt-3 border-t border-gray-700 flex justify-end">
          <button
            onClick={handleRetire}
            disabled={isLoading}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            Retire
          </button>
        </div>
      )}
    </div>
  );
}
