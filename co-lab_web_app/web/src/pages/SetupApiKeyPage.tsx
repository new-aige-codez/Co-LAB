import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../store/authStore';
import { Key, ArrowRight, ExternalLink } from 'lucide-react';

export default function SetupApiKeyPage() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await fetchWithAuth('/auth/api-key', {
        method: 'POST',
        body: JSON.stringify({ apiKey }),
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch {
      setError('Failed to save API key. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleSkip() {
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <Key className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold">Add your Claude API Key</h2>
          <p className="mt-2 text-sm text-gray-400">
            Your API key is encrypted and stored securely
          </p>
        </div>

        {success ? (
          <div className="bg-green-900/50 border border-green-700 text-green-200 px-4 py-4 rounded-lg text-center">
            <p className="font-medium">API key saved successfully!</p>
            <p className="text-sm mt-1">Redirecting to dashboard...</p>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium mb-1">
                Claude API Key
              </label>
              <input
                id="apiKey"
                name="apiKey"
                type="password"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition font-mono text-sm"
                placeholder="sk-ant-..."
              />
              <p className="mt-2 text-xs text-gray-500">
                Get your API key from{' '}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 inline-flex items-center gap-1"
                >
                  Anthropic Console
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading || !apiKey.startsWith('sk-ant-')}
                className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {isLoading ? 'Saving...' : 'Save and Continue'}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition text-gray-300"
              >
                Skip for now
              </button>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-gray-400">
              <p className="font-medium text-gray-300 mb-2">Your key is secure</p>
              <ul className="space-y-1 list-disc list-inside text-xs">
                <li>Encrypted with AES-256-GCM before storage</li>
                <li>Only decrypted when needed for API calls</li>
                <li>Never exposed to other users</li>
              </ul>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
