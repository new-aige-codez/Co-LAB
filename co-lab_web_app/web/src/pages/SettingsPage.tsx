import { useState, useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { SettingsSidebar } from '../components/settings/SettingsSidebar';
import { SubagentModelsPanel } from '../components/settings/SubagentModelsPanel';
import { ResearchSourcesPanel } from '../components/settings/ResearchSourcesPanel';
import { Loader2 } from 'lucide-react';

type SettingsSection = 'subagent-models' | 'research-sources' | 'general';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('subagent-models');
  const { isLoading, error, loadAllSettings } = useSettingsStore();

  useEffect(() => {
    loadAllSettings();
  }, [loadAllSettings]);

  const renderContent = () => {
    switch (activeSection) {
      case 'subagent-models':
        return <SubagentModelsPanel />;
      case 'research-sources':
        return <ResearchSourcesPanel />;
      case 'general':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">General Settings</h2>
            <p className="text-gray-400">General application settings coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex bg-gray-900">
      <SettingsSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-gray-400 mt-1">
            Configure subagent models and research sources
          </p>
        </header>

        {/* Error message */}
        {error && (
          <div className="bg-red-900/50 border-b border-red-700 px-6 py-3 text-red-200">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </div>
  );
}
