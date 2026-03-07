import { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import {
  Globe,
  Twitter,
  MessageSquare,
  Youtube,
  Check
} from 'lucide-react';
import { SubredditsManager } from './SubredditsManager';
import { XAccountsManager } from './XAccountsManager';
import { YouTubeChannelsManager } from './YouTubeChannelsManager';

const SOURCE_CONFIGS = {
  web: { icon: Globe, label: 'Web Search', color: 'bg-blue-500' },
  x: { icon: Twitter, label: 'X.com', color: 'bg-sky-500' },
  reddit: { icon: MessageSquare, label: 'Reddit', color: 'bg-orange-500' },
  youtube: { icon: Youtube, label: 'YouTube', color: 'bg-red-500' },
};

type SourceType = keyof typeof SOURCE_CONFIGS;

export function ResearchSourcesPanel() {
  const { researchSettings, setEnabledSources } = useSettingsStore();
  const [pendingSources, setPendingSources] = useState<SourceType[] | null>(null);

  if (!researchSettings) {
    return null;
  }

  const enabledSources = pendingSources ?? researchSettings.enabledSources;

  const toggleSource = async (source: SourceType) => {
    const newSources = enabledSources.includes(source)
      ? enabledSources.filter((s) => s !== source)
      : [...enabledSources, source];

    // Optimistic update
    setPendingSources(newSources as SourceType[]);

    const success = await setEnabledSources(newSources);
    if (!success) {
      // Revert on failure
      setPendingSources(null);
    } else {
      setPendingSources(null);
    }
  };

  const allSourcesSelected = Object.keys(SOURCE_CONFIGS).every((s) =>
    enabledSources.includes(s)
  );

  const toggleAll = () => {
    const allTypes = Object.keys(SOURCE_CONFIGS) as SourceType[];
    if (allSourcesSelected) {
      setEnabledSources([]);
    } else {
      setEnabledSources(allTypes);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Research Sources</h2>
        <p className="text-gray-400 mt-1">
          Configure which sources to use for feature research
        </p>
      </div>

      {/* Source Toggles */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-300">Enabled Sources</label>
          <button
            onClick={toggleAll}
            className="text-xs text-primary-400 hover:text-primary-300"
          >
            {allSourcesSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(SOURCE_CONFIGS) as [SourceType, typeof SOURCE_CONFIGS[SourceType]][]).map(
            ([sourceType, config]) => {
              const Icon = config.icon;
              const isEnabled = enabledSources.includes(sourceType);

              return (
                <button
                  key={sourceType}
                  onClick={() => toggleSource(sourceType)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isEnabled
                      ? 'bg-primary-600/20 border border-primary-500'
                      : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className={`p-2 rounded ${config.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="flex-1 text-left">{config.label}</span>
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center ${
                      isEnabled
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-gray-600'
                    }`}
                  >
                    {isEnabled && <Check className="h-3 w-3 text-white" />}
                  </div>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Subreddits Manager */}
      <div className="mb-8">
        <SubredditsManager />
      </div>

      {/* X Accounts Manager */}
      <div className="mb-8">
        <XAccountsManager />
      </div>

      {/* YouTube Channels Manager */}
      <div>
        <YouTubeChannelsManager />
      </div>
    </div>
  );
}
