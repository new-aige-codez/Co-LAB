/**
 * Agent Card Component
 *
 * Displays a single agent with status controls and model selection (for dev agents)
 */

'use client';

import { useState } from 'react';
import {
  Cpu,
  ChevronDown,
  Power,
  PowerOff,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Agent, BusinessAgent, DevelopmentAgent, LLMProvider } from '@/store/agentStore';

// Map icon names to components
const ICON_MAP: Record<string, React.ReactNode> = {
  User: '👤',
  Search: '🔍',
  Code: '💻',
  Megaphone: '📢',
  BarChart3: '📊',
  Bug: '🐛',
  Globe: '🌐',
  Map: '🗺️',
  FlaskConical: '🧪',
};

interface AgentCardProps {
  agent: Agent;
  onToggleStatus: (agentId: string, status: Agent['status']) => void;
  llmProviders: LLMProvider[];
  onSetModel?: (agentId: string, modelId: string | null) => void;
}

function StatusBadge({ status }: { status: Agent['status'] }) {
  const config = {
    active: { label: 'Active', cls: 'text-green-400 bg-green-900/30' },
    idle: { label: 'Idle', cls: 'text-yellow-400 bg-yellow-900/30' },
    disabled: { label: 'Disabled', cls: 'text-gray-500 bg-gray-700/50' },
  };
  const { label, cls } = config[status];
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cls)}>
      {label}
    </span>
  );
}

export function AgentCard({
  agent,
  onToggleStatus,
  llmProviders,
  onSetModel,
}: AgentCardProps) {
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const isDevelopment = agent.team === 'development';
  const devAgent = agent as DevelopmentAgent;

  const currentProvider = llmProviders.find(
    (p) => p.id === devAgent?.assignedModelId
  );

  const handleToggleStatus = () => {
    const newStatus = agent.status === 'disabled' ? 'idle' : 'disabled';
    onToggleStatus(agent.id, newStatus);
  };

  const handleModelSelect = (modelId: string) => {
    onSetModel?.(agent.id, modelId);
    setShowModelDropdown(false);
  };

  return (
    <div
      className={cn(
        'relative bg-gray-900 rounded-xl border transition-all',
        agent.status === 'disabled'
          ? 'border-gray-800 opacity-60'
          : 'border-gray-800 hover:border-gray-700'
      )}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg',
            agent.status === 'disabled'
              ? 'bg-gray-700/50 text-gray-500'
              : agent.status === 'active'
                ? 'bg-orange-500/10 text-orange-400'
                : 'bg-yellow-500/10 text-yellow-400'
          )}
        >
          {ICON_MAP[agent.icon] || <Cpu className="w-5 h-5" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-100">{agent.name}</h3>
            <StatusBadge status={agent.status} />
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-2">
            {agent.description}
          </p>

          {/* Capabilities */}
          <div className="flex flex-wrap gap-1">
            {agent.capabilities.slice(0, 4).map((cap) => (
              <span
                key={cap}
                className="text-xs px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded"
              >
                {cap.replace(/_/g, ' ')}
              </span>
            ))}
            {agent.capabilities.length > 4 && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded">
                +{agent.capabilities.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* LLM Dropdown for Development Agents */}
          {isDevelopment && (
            <div className="relative">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-2 px-2 py-1.5 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-lg transition-all min-w-[130px]"
              >
                <Cpu className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-200 flex-1 text-left truncate">
                  {currentProvider?.name || 'Select model…'}
                </span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 text-gray-500 transition-transform',
                    showModelDropdown && 'rotate-180'
                  )}
                />
              </button>

              {showModelDropdown && (
                <div className="absolute right-0 top-full mt-1 z-30 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                  {llmProviders.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => handleModelSelect(provider.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 transition-colors text-left',
                        provider.id === devAgent.assignedModelId && 'bg-gray-700/50'
                      )}
                    >
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          provider.isConfigured ? 'bg-green-400' : 'bg-gray-600'
                        )}
                      />
                      <span className="text-xs text-gray-200 flex-1">
                        {provider.name}
                      </span>
                      {provider.id === devAgent.assignedModelId && (
                        <Check className="w-3 h-3 text-orange-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Toggle */}
          <button
            onClick={handleToggleStatus}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              agent.status === 'disabled'
                ? 'text-gray-600 hover:text-green-400 hover:bg-green-900/20'
                : 'text-gray-500 hover:text-red-400 hover:bg-red-900/20'
            )}
            title={agent.status === 'disabled' ? 'Enable agent' : 'Disable agent'}
          >
            {agent.status === 'disabled' ? (
              <PowerOff className="w-4 h-4" />
            ) : (
              <Power className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
