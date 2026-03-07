import { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { SUBAGENT_CONFIGS, type SubagentType } from '../../types/settings';
import { Loader2, Save } from 'lucide-react';

const AGENT_TYPES: SubagentType[] = [
  'orchestration',
  'codebase_research',
  'online_research',
  'technical_planning',
  'coding_frontend',
  'coding_backend',
  'diagnostics',
  'testing_frontend',
  'testing_backend',
];

export function SubagentModelsPanel() {
  const { subagentModels, providers, setSubagentModel } = useSettingsStore();
  const [savingType, setSavingType] = useState<SubagentType | null>(null);

  const handleModelChange = async (
    agentType: SubagentType,
    provider: string,
    model: string
  ) => {
    setSavingType(agentType);
    await setSubagentModel(agentType, provider, model);
    setSavingType(null);
  };

  if (!subagentModels) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Subagent Model Configuration</h2>
        <p className="text-gray-400 mt-1">
          Configure which AI model to use for each subagent type
        </p>
      </div>

      <div className="space-y-4">
        {AGENT_TYPES.map((agentType) => {
          const config = SUBAGENT_CONFIGS[agentType];
          const currentConfig = subagentModels[agentType];
          const isSaving = savingType === agentType;

          return (
            <SubagentModelSelector
              key={agentType}
              agentType={agentType}
              label={config.label}
              description={config.description}
              currentProvider={currentConfig.provider}
              currentModel={currentConfig.model}
              providers={providers}
              isSaving={isSaving}
              onChange={handleModelChange}
            />
          );
        })}
      </div>
    </div>
  );
}

interface SubagentModelSelectorProps {
  agentType: SubagentType;
  label: string;
  description: string;
  currentProvider: string;
  currentModel: string;
  providers: { name: string; displayName: string; models: { id: string; name: string }[] }[];
  isSaving: boolean;
  onChange: (agentType: SubagentType, provider: string, model: string) => void;
}

function SubagentModelSelector({
  agentType,
  label,
  description,
  currentProvider,
  currentModel,
  providers,
  isSaving,
  onChange,
}: SubagentModelSelectorProps) {
  const [selectedProvider, setSelectedProvider] = useState(currentProvider);
  const [selectedModel, setSelectedModel] = useState(currentModel);

  const provider = providers.find((p) => p.name === selectedProvider);
  const availableModels = provider?.models ?? [];

  const hasChanges = selectedProvider !== currentProvider || selectedModel !== currentModel;

  const handleProviderChange = (newProvider: string) => {
    setSelectedProvider(newProvider);
    // Select first model of new provider
    const newProviderData = providers.find((p) => p.name === newProvider);
    if (newProviderData?.models.length) {
      setSelectedModel(newProviderData.models[0].id);
    }
  };

  const handleSave = () => {
    if (hasChanges) {
      onChange(agentType, selectedProvider, selectedModel);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-medium">{label}</h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
        {isSaving && (
          <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Provider
          </label>
          <select
            value={selectedProvider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {providers.map((p) => (
              <option key={p.name} value={p.name}>
                {p.displayName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {availableModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasChanges && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 transition"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      )}
    </div>
  );
}
