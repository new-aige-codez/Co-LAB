import { useEffect } from 'react';
import { useResearchStore } from '../store/researchStore';
import { useMemoryStore } from '../store/memoryStore';
import { ResearchSettingsPanel } from '../components/research/ResearchSettingsPanel';
import { ResearchResultsPanel } from '../components/research/ResearchResultsPanel';
import { ResearchSidebar } from '../components/research/ResearchSidebar';

export default function ResearchPage() {
  const {
    results,
    isLoading,
    executionTimeMs,
    selectedResult,
    options,
    fetchSources,
    executeResearch,
    selectResult,
  } = useResearchStore();

  const { currentChatId, chats, fetchChats, setCurrentChat } = useMemoryStore();

  // Load available sources and chats on mount
  useEffect(() => {
    fetchSources();
    fetchChats();
  }, [fetchSources, fetchChats]);

  const handleResearch = async () => {
    await executeResearch();
  };

  return (
    <div className="h-screen flex bg-gray-900">
      {/* Left sidebar with icons */}
      <ResearchSidebar />

      {/* Settings panel */}
      <div className="w-80 flex-shrink-0">
        {/* Chat selector for memory integration */}
        {chats.length > 0 && (
          <div className="p-4 border-b border-gray-700">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Save to Chat
            </label>
            <select
              value={currentChatId || ''}
              onChange={(e) => setCurrentChat(e.target.value || null)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a chat...</option>
              {chats.map((chat) => (
                <option key={chat.chatId} value={chat.chatId}>
                  {chat.chatId.slice(0, 12)}... ({chat.count} memories)
                </option>
              ))}
            </select>
          </div>
        )}
        <ResearchSettingsPanel onResearch={handleResearch} />
      </div>

      {/* Results panel */}
      <div className="flex-1">
        <ResearchResultsPanel
          results={results}
          isLoading={isLoading}
          executionTimeMs={executionTimeMs}
          selectedResult={selectedResult}
          onSelectResult={selectResult}
          query={options.query}
          sources={options.sources}
          dateRange={options.dateRange}
          chatId={currentChatId || undefined}
        />
      </div>
    </div>
  );
}
