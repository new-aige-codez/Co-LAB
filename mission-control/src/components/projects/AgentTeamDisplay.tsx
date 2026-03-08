/**
 * Agent Team Display Component
 *
 * Shows the active agents organized by team, */

'use client';

import { useAgentStore, useBusinessAgents,
  useDevelopmentAgents,
  useLLMProviders,
  type Agent,
  type BusinessAgent,
  type DevelopmentAgent,
} from '@/store/agentStore';
import { cn } from '@/lib/utils';
import {
  User,
  Search,
  Code,
  Megaphone,
  BarChart3,
  Bug,
  Globe,
  Map,
  FlaskConical,
  Power,
  PowerOff,
  Cpu,
  ChevronDown,
  Check,
  Briefcase,
} from 'lucide-react';
import { useState } from 'react';

// Map icon names to components
const ICON_MAP: Record<string, React.ReactNode> = {
  User: <User className="w-5 h-5" />,
  Search: <Search className="w-5 h-5" />,
  Code: <Code className="w-5 h-5" />,
  Megaphone: <Megaphone className="w-5 h-5" />,
  BarChart3: <BarChart3 className="w-5 h-5" />,
  Bug: <Bug className="w-5 h-5" />,
  Globe: <Globe className="w-5 h-5" />,
  Map: <Map className="w-5 h-5" />,
  FlaskConical: <FlaskConical className="w-5 h-5" />,
};

function StatusBadge({ status }: { status: Agent['status'] }) {
  const config = {
    active: { label: 'Active', className: 'text-green-400 bg-green-900/30' },
    idle: { label: 'Idle', className: 'text-yellow-400 bg-yellow-900/30' },
    disabled: { label: 'Disabled', className: 'text-gray-500 bg-gray-700/50' },
  };
  const { label, className } = config[status];
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', className)}>
      {label}
    </span>
  );
}

interface AgentCardProps {
  agent: Agent;
  onToggleStatus: (id: string, status: Agent['status']) => void;
  llmProviders: { id: string; name: string; isConfigured: boolean }[];
  onSetModel?: (agentId: string, modelId: string | null) => void;
}

function AgentCard({ agent, onToggleStatus, llmProviders, onSetModel }: AgentCardProps) {
  const [showModelSelector, setShowModelSelector] = useState(false);
  const isDevelopment = agent.team === 'development';
  const devAgent = agent as DevelopmentAgent;

  return (
    <div
      className={cn(
        'relative bg-gray-900 rounded-xl border transition-all',
        agent.status === 'disabled'
          ? 'border-gray-800 opacity-60'
          : 'border-gray-800 hover:border-gray-700'
      )}
    >
      <div className="flex items-start gap-4 p-5">
        {/* Icon */}
        <div
          className={cn(
            'w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0',
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
          <div className="flex items-center gap-2.5 mb-1">
            <h3 className="text-sm font-semibold text-gray-100">{agent.name}</h3>
            <StatusBadge status={agent.status} />
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">{agent.description}</p>

          {/* Capabilities */}
          <div className="flex flex-wrap gap-1.5">
            {agent.capabilities.map((cap) => (
              <span
                key={cap}
                className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded-md"
              >
                {cap.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* LLM Dropdown for development agents */}
          {isDevelopment && onSetModel && (
            <div className="relative">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-lg transition-all min-w-[160px]"
              >
                <Cpu className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-200 flex-1 text-left truncate">
                  {llmProviders.find((p) => p.id === devAgent.assignedModelId)?.name || 'Select model...'}
                </span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 text-gray-500 transition-transform',
                    showModelSelector && 'rotate-180'
                  )}
                />
              </button>

              {showModelSelector && (
                <div className="absolute right-0 top-full mt-1 z-30 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                  {llmProviders.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => {
                        onSetModel(agent.id, provider.id);
                        setShowModelSelector(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-700 transition-colors text-left"
                    >
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          provider.isConfigured ? 'bg-green-400' : 'bg-gray-600'
                        )}
                      />
                      <span className="text-xs text-gray-200 flex-1">{provider.name}</span>
                      {provider.id === devAgent.assignedModelId && (
                        <Check className="w-3.5 h-3.5 text-orange-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Toggle */}
          <button
            onClick={() => onToggleStatus(agent.id, agent.status === 'disabled' ? 'idle' : 'disabled')}
            className={cn(
              'p-2 rounded-lg transition-colors',
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

interface AgentTeamDisplayProps {
  showDevelopment?: boolean;
  showBusiness?: boolean;
  className?: string;
}

export function AgentTeamDisplay({
  showDevelopment = true,
  showBusiness = true,
  className,
}: AgentTeamDisplayProps) {
  const businessAgents = useBusinessAgents();
  const developmentAgents = useDevelopmentAgents();
  const llmProviders = useLLMProviders();
  const { setAgentStatus, setAgentModel } = useAgentStore();

  const activeBusiness = businessAgents.filter((a) => a.status === 'active').length;
  const idleBusiness = businessAgents.filter((a) => a.status === 'idle').length;
  const activeDev = developmentAgents.filter((a) => a.status === 'active').length;
  const idleDev = developmentAgents.filter((a) => a.status === 'idle').length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Business Team */}
      {showBusiness && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-orange-400" />
                Business Team
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {activeBusiness} active · {idleBusiness} idle · {businessAgents.length} total
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {businessAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onToggleStatus={setAgentStatus}
                llmProviders={llmProviders}
              />
            ))}
          </div>
        </div>
      )}

      {/* Development Team */}
      {showDevelopment && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                Development Team
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {activeDev} active · {idleDev} idle · {developmentAgents.length} total
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {developmentAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onToggleStatus={setAgentStatus}
                llmProviders={llmProviders}
                onSetModel={setAgentModel}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
