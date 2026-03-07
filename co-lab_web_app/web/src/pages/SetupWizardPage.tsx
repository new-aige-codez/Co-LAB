import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth, useAuthStore } from '../store/authStore';
import {
  Settings,
  Shield,
  Key,
  ArrowRight,
  Check,
  Loader,
  Terminal,
  MessageSquare,
  Play,
  Eye,
  EyeOff,
} from 'lucide-react';

type SetupStep = 'welcome' | 'mode' | 'api-keys' | 'claude-cli' | 'project' | 'complete';

type AuthMethod = 'google' | 'api-key' | 'email';

type SetupConfig = {
  anthropicApiKey: string;
  openaiApiKey: string;
  groqApiKey: string;
  claudeCliPath: string;
  startOnLogin: boolean;
  telegramEnabled: boolean;
  autopilotEnabled: boolean;
};

const defaultConfig: SetupConfig = {
  anthropicApiKey: '',
  openaiApiKey: '',
  groqApiKey: '',
  claudeCliPath: '',
  startOnLogin: false,
  telegramEnabled: false,
  autopilotEnabled: false,
};

export default function SetupWizardPage() {
  const navigate = useNavigate();
  const { hasApiKey, setUser, setHasApiKey } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');
  const [config, setConfig] = useState<SetupConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cliVerified, setCliVerified] = useState<boolean | null>(null);

  // Load saved config on mount
  useState(() => {
    loadSavedConfig();
  }, []);

  const loadSavedConfig = async () => {
    try {
      const result = await fetchWithAuth<{ anthropicApiKey: string; openaiApiKey: string; groqApiKey: string; claudeCliPath: string; startOnLogin: boolean; telegramEnabled: boolean; autopilotEnabled: boolean; hasCompletedSetup: boolean }>('/setup/config');

      if (result.data) {
        setConfig(result.data);
        if (result.data.hasCompletedSetup) {
          navigate('/dashboard');
        } else if (currentStep === 'welcome') {
          // Auto-advance to api-keys step if we have anthropic key
          setCurrentStep('api-keys');
        }
      }
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  };

  const handleNextStep = async () => {
    setError(null);

    // Validate current step before proceeding
    if (currentStep === 'welcome') {
      setCurrentStep('mode');
    } else if (currentStep === 'mode') {
      if (config.anthropicApiKey) {
        // Has API key, skip to claude-cli
        setCurrentStep('claude-cli');
      } else {
        setCurrentStep('api-keys');
      }
    } else if (currentStep === 'api-keys') {
      if (config.claudeCliPath) {
        setCurrentStep('claude-cli');
      } else {
        setCurrentStep('claude-cli');
      }
    } else if (currentStep === 'claude-cli') {
      setCurrentStep('project');
    } else if (currentStep === 'project') {
      setCurrentStep('complete');
    } else if (currentStep === 'complete') {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchWithAuth('/setup/complete', {
        method: 'POST',
        body: JSON.stringify(config),
      });

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      setHasApiKey(true);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to complete setup');
      setIsLoading(false);
    }
  };

  const verifyClaudeCli = async () => {
    if (!config.claudeCliPath) {
      setCliVerified(null);
      return;
    }

    setCliVerified(null);
    setIsLoading(true);

    try {
      const result = await fetchWithAuth('/setup/verify-cli', {
        method: 'POST',
        body: JSON.stringify({ path: config.claudeCliPath }),
      });

      setCliVerified(result.data?.valid ?? false);
    } catch (err) {
      setCliVerified(false);
    }
  };

  const updateConfig = (updates: Partial<SetupConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const renderStepIndicator = () => {
    const steps: SetupStep[] = ['welcome', 'mode', 'api-keys', 'claude-cli', 'project', 'complete'];
    const currentIndex = steps.indexOf(currentStep);

    return (
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <button
            key={step}
            onClick={() => {}}
            className={`w-8 h-8 rounded-full transition flex items-center justify-center ${
              index <= currentIndex
                ? 'bg-primary-600 text-white'
                : index === currentIndex
                  ? 'ring-2 ring-primary-500 bg-gray-700 text-gray-300'
                  : 'bg-gray-800 text-gray-500'
            }`}
          >
            {index < currentIndex && (
              <Check className="w-5 h-5 text-primary-500" />
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-primary-500" />
          <h1 className="text-xl font-semibold text-gray-100">Mission Control Setup</h1>
        </div>
        <div className="text-sm text-gray-400">
          Step {steps.indexOf(currentStep) + 1} of {steps.length}
        </div>
      </header>

      {/* Error message */}
      {error && (
        <div className="bg-red-900/50 border-b border-red-700 px-6 py-3 text-red-200">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-2xl">
          {/* Step 1: Welcome */}
          {currentStep === 'welcome' && (
            <div className="text-center space-y-8">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary-600/20 flex items-center justify-center">
                <Settings className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-100">Welcome to Mission Control</h2>
              <p className="text-gray-400 max-w-md">
                Set up your AI collaboration workspace with multi-party task management and real-time coordination.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleNextStep()}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition"
                >
                  <Play className="w-5 h-5" />
                  <span>Get Started</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Mode Selection */}
          {currentStep === 'mode' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-100">Choose Your Mode</h2>
              <p className="text-gray-400 mb-6">
                How would you like to use Mission Control?
              </p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleNextStep()}
                  className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-100">Self-Host</div>
                    <div className="text-sm text-gray-400">Run everything locally on your machine</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: API Keys */}
          {currentStep === 'api-keys' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary-500" />
                <h2 className="text-xl font-semibold text-gray-100">API Keys</h2>
              </div>
              <p className="text-gray-400 mb-2">
                Your API keys are stored locally and encrypted. They are never sent to any server.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Anthropic API Key <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={config.anthropicApiKey}
                    onChange={(e) => updateConfig({ anthropicApiKey: e.target.value })}
                    placeholder="sk-ant-..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-100 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    OpenAI API Key <span className="text-gray-500">(optional)</span>
                  </label>
                  <input
                    type="password"
                    value={config.openaiApiKey}
                    onChange={(e) => updateConfig({ openaiApiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-100 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Groq API Key <span className="text-gray-500">(optional - for voice)</span>
                  </label>
                  <input
                    type="password"
                    value={config.groqApiKey}
                    onChange={(e) => updateConfig({ groqApiKey: e.target.value })}
                    placeholder="grov_..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-100 font-mono text-sm"
                  />
                </div>
              </div>

              <button
                onClick={() => handleNextStep()}
                disabled={!config.anthropicApiKey}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 rounded-lg transition"
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 4: Claude CLI */}
          {currentStep === 'claude-cli' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-primary-500" />
                <h2 className="text-xl font-semibold text-gray-100">Claude CLI</h2>
              </div>
              <p className="text-gray-400 mb-2">
                Path to the Claude CLI executable for spawning agent sessions.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    CLI Path
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config.claudeCliPath}
                      onChange={(e) => updateConfig({ claudeCliPath: e.target.value })}
                      placeholder="C:\Users\...\.local\bin\claude.exe"
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-100 font-mono text-sm"
                    />
                    <button
                      onClick={verifyClaudeCli}
                      disabled={!config.claudeCliPath || cliVerified !== null}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg transition text-sm whitespace-nowrap"
                    >
                      {cliVerified === null ? 'Verify' : cliVerified ? (
                        <span className="text-green-400 flex items-center gap-1">
                          <Check className="w-4 h-4" /> Valid
                        </span>
                      ) : (
                        <span className="text-red-400">Invalid</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleNextStep()}
                disabled={!cliVerified}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 rounded-lg transition"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 5: Project Selection */}
          {currentStep === 'project' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary-500" />
                <h2 className="text-xl font-semibold text-gray-100">Project Selection</h2>
              </div>
              <p className="text-gray-400 mb-2">
                Select a project to work with or create a new one.
              </p>
              <div className="text-center py-8 text-gray-500">
                Project selection coming soon...
              </div>
              <button
                onClick={() => handleNextStep()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 6: Complete */}
          {currentStep === 'complete' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <h2 className="text-xl font-semibold text-gray-100">Setup Complete</h2>
              </div>
              <p className="text-gray-400 mb-2">
                Configure your final preferences before starting.
              </p>

              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.startOnLogin}
                    onChange={(e) => updateConfig({ startOnLogin: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-gray-300">Start on login</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.telegramEnabled}
                    onChange={(e) => updateConfig({ telegramEnabled: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-gray-300">Enable Telegram notifications</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.autopilotEnabled}
                    onChange={(e) => updateConfig({ autopilotEnabled: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-gray-300">Enable autopilot mode</span>
                </label>
              </div>

              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition"
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Finish Setup</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step indicator */}
          <div className="mt-8">
            {renderStepIndicator()}
          </div>
        </div>
      </div>
    </div>
  );
}
