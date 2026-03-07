import { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { Plus, Trash2, Loader2, ExternalLink, ToggleLeft, ToggleRight, Youtube } from 'lucide-react';

export function YouTubeChannelsManager() {
  const { researchSettings, addYouTubeChannel, removeYouTubeChannel, toggleYouTubeChannel, error } = useSettingsStore();
  const [newChannelId, setNewChannelId] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!researchSettings) return null;

  const handleAdd = async () => {
    if (!newChannelId.trim()) return;

    setLocalError(null);
    setIsAdding(true);

    const success = await addYouTubeChannel(
      newChannelId.trim(),
      newChannelName.trim() || undefined
    );

    if (success) {
      setNewChannelId('');
      setNewChannelName('');
    }
    setIsAdding(false);
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    await toggleYouTubeChannel(id, !enabled);
  };

  const handleRemove = async (id: number) => {
    await removeYouTubeChannel(id);
  };

  const enabledCount = researchSettings.youtubeChannels.filter(c => c.enabled).length;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium flex items-center gap-2">
              <Youtube className="h-4 w-4 text-red-500" />
              YouTube Channels
              <span className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-400">
                {enabledCount}/{researchSettings.youtubeChannels.length} enabled
              </span>
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Monitor specific YouTube channels for research
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {(error || localError) && (
        <div className="px-4 py-2 bg-red-900/30 text-red-300 text-sm border-b border-red-800">
          {error || localError}
        </div>
      )}

      {/* List */}
      <div className="max-h-64 overflow-y-auto">
        {researchSettings.youtubeChannels.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No YouTube channels configured. Add some below.
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {researchSettings.youtubeChannels.map((channel) => (
              <div
                key={channel.id}
                className={`flex items-center justify-between px-4 py-3 ${
                  !channel.enabled ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(channel.id, channel.enabled)}
                    className="text-gray-400 hover:text-white"
                    title={channel.enabled ? 'Disable' : 'Enable'}
                  >
                    {channel.enabled ? (
                      <ToggleRight className="h-5 w-5 text-primary-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </button>
                  <div>
                    <a
                      href={`https://youtube.com/channel/${channel.channelId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary-400"
                    >
                      {channel.channelName || channel.channelId}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {channel.channelName && (
                      <p className="text-xs text-gray-500">{channel.channelId}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(channel.id)}
                  className="p-1 text-gray-400 hover:text-red-400"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add input */}
      <div className="p-4 border-t border-gray-700">
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newChannelId}
              onChange={(e) => setNewChannelId(e.target.value)}
              placeholder="Channel ID (e.g., UCLow4..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Display name (optional)"
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleAdd}
              disabled={!newChannelId.trim() || isAdding}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
