import { useState } from 'react';
import { useAgentConfigStore, type Subagent } from '../store/agentConfigStore';
import {
  Search,
  Globe,
  Code,
  Map,
  Bug,
  FlaskConical,
  ChevronDown,
  Plus,
  Power,
  PowerOff,
  X,
  Cpu,
} from 'lucide-react';

// Map icon names to components
const ICON_MAP: Record<string, React.ReactNode> = {
  Search: <Search className="w-5 h-5" />,
  Globe: <Globe className="w-5 h-5" />,
  Code: <Code className="w-5 h-5" />,
  Map: <Map className="w-5 h-5" />,
  Bug: <Bug className="w-5 h-5" />,
  FlaskConical: <FlaskConical className="w-5 h-5" />,
};

function StatusBadge({ status }: { status: Subagent['status'] }) {
  const cfg = {
    active: { label: 'Active', cls: 'text-green-400 bg-green-900/30' },
    idle: { label: 'Idle', cls: 'text-yellow-400 bg-yellow-900/30' },
    disabled: { label: 'Disabled', cls: 'text-gray-500 bg-gray-700/50' },
  };
  const { label, cls } = cfg[status];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

function AddProviderModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, endpoint: string) => void }) {
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), endpoint.trim());
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-100">Add LLM Provider</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <label className="block">
            <span className="text-xs text-gray-400 mb-1 block">Provider Name *</span>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Groq, Together AI, DeepSeek"
              className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500 rounded-lg px-4 py-2.5 text-sm text-gray-100 outline-none transition-colors"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-400 mb-1 block">API Endpoint (optional)</span>
            <input
              type="text"
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              placeholder="https://api.example.com/v1"
              className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500 rounded-lg px-4 py-2.5 text-sm text-gray-100 outline-none transition-colors"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Provider
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AgentSquadPage() {
  const { subagents, llmProviders, setAgentModel, toggleAgentStatus, addLlmProvider } = useAgentConfigStore();
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  function handleAddProvider(name: string, endpoint: string) {
    addLlmProvider({ name, endpoint, isConfigured: false });
    setShowAddProvider(false);
  }

  const activeCount = subagents.filter(a => a.status === 'active').length;
  const idleCount = subagents.filter(a => a.status === 'idle').length;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-950">
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-100">Agent Squad</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {activeCount} active · {idleCount} idle · {subagents.length} total subagents
          </p>
        </div>
        <button
          onClick={() => setShowAddProvider(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add LLM Provider
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
        {subagents.map(agent => {
          const currentProvider = llmProviders.find(p => p.id === agent.assignedModelId);
          const isDropdownOpen = openDropdown === agent.id;

          return (
            <div
              key={agent.id}
              className={`relative bg-gray-900 rounded-xl border transition-all ${agent.status === 'disabled'
                  ? 'border-gray-800 opacity-60'
                  : 'border-gray-800 hover:border-gray-700'
                }`}
            >
              <div className="flex items-start gap-4 p-5">
                {/* Icon */}
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${agent.status === 'disabled'
                    ? 'bg-gray-700/50 text-gray-500'
                    : agent.status === 'active'
                      ? 'bg-orange-500/10 text-orange-400'
                      : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
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
                    {agent.capabilities.map(cap => (
                      <span key={cap} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded-md">
                        {cap.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* LLM Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdown(isDropdownOpen ? null : agent.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-lg transition-all min-w-[160px]"
                    >
                      <Cpu className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs text-gray-200 flex-1 text-left truncate">
                        {currentProvider?.name || 'Select model…'}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1 z-30 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                        {llmProviders.map(provider => (
                          <button
                            key={provider.id}
                            onClick={() => {
                              setAgentModel(agent.id, provider.id);
                              setOpenDropdown(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-700 transition-colors text-left"
                          >
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${provider.isConfigured ? 'bg-green-400' : 'bg-gray-600'
                              }`} />
                            <span className="text-xs text-gray-200 flex-1">{provider.name}</span>
                            {provider.id === agent.assignedModelId && (
                              <span className="text-xs text-orange-400">✓</span>
                            )}
                          </button>
                        ))}
                        <div className="border-t border-gray-700">
                          <button
                            onClick={() => {
                              setOpenDropdown(null);
                              setShowAddProvider(true);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-700 transition-colors text-left"
                          >
                            <Plus className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-xs text-gray-400">Add New Provider</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleAgentStatus(agent.id)}
                    className={`p-2 rounded-lg transition-colors ${agent.status === 'disabled'
                        ? 'text-gray-600 hover:text-green-400 hover:bg-green-900/20'
                        : 'text-gray-500 hover:text-red-400 hover:bg-red-900/20'
                      }`}
                    title={agent.status === 'disabled' ? 'Enable agent' : 'Disable agent'}
                  >
                    {agent.status === 'disabled'
                      ? <PowerOff className="w-4 h-4" />
                      : <Power className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showAddProvider && (
        <AddProviderModal
          onClose={() => setShowAddProvider(false)}
          onAdd={handleAddProvider}
        />
      )}
    </div>
  );
}
