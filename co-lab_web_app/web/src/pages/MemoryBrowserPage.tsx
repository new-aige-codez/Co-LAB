import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemoryStore, type MemoryEntry, type MemorySector } from '../store/memoryStore';
import { useProjectStore } from '../store/projectStore';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ExternalLink,
  GitBranch,
  Loader2,
  X,
  BookOpen,
  Brain,
} from 'lucide-react';

// ─── Tab type ───
type Tab = 'memory' | 'references';

// ─── Codebase References Panel ───
function CodebaseReferencesPanel() {
  const { activeProjectId, getActiveReferences, addCodebaseReference, removeCodebaseReference } =
    useProjectStore();

  const references = getActiveReferences();

  const [showAddForm, setShowAddForm] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [repoDesc, setRepoDesc] = useState('');
  const [cloning, setCloning] = useState(false);
  const [cloneStatus, setCloneStatus] = useState('');
  const [cloneError, setCloneError] = useState('');

  function extractRepoName(url: string): string {
    try {
      const parts = url.replace(/\.git$/, '').split('/');
      return parts[parts.length - 1] || 'repo';
    } catch {
      return 'repo';
    }
  }

  async function handleCloneAndAdd() {
    if (!repoUrl.trim() || !activeProjectId) return;
    setCloning(true);
    setCloneStatus('Cloning repository…');
    setCloneError('');

    try {
      const response = await fetch(`/api/workspaces/${activeProjectId}/references/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: repoUrl.trim(), description: repoDesc.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${response.status}`);
      }

      const data = await response.json();
      setCloneStatus('Clone complete!');

      addCodebaseReference(activeProjectId, {
        name: extractRepoName(repoUrl),
        url: repoUrl.trim(),
        description: repoDesc.trim() || `Cloned from ${repoUrl.trim()}`,
        localPath: data.localPath,
        clonedAt: new Date().toISOString(),
      });

      setTimeout(() => {
        setShowAddForm(false);
        setRepoUrl('');
        setRepoDesc('');
        setCloneStatus('');
      }, 800);
    } catch (err: any) {
      setCloneError(err.message || 'Clone failed');
      setCloneStatus('');
    } finally {
      setCloning(false);
    }
  }

  if (!activeProjectId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm p-8 text-center">
        No project selected. Open a workspace to see its codebase references.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <p className="text-xs text-gray-500">
        Reference repos are scoped to the active project. Only visible when that project is open.
      </p>

      {/* Reference cards */}
      {references.length === 0 && !showAddForm && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-sm text-center">
          <GitBranch className="w-10 h-10 mb-3 text-gray-700" />
          <p>No codebase references yet.</p>
          <p className="text-xs mt-1">Add a GitHub repo to reference it during this project.</p>
        </div>
      )}

      {references.map((ref) => (
        <div
          key={ref.id}
          className="flex items-start justify-between p-4 bg-gray-800 rounded-xl border border-gray-700 group"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <GitBranch className="w-4 h-4 text-gray-400" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-gray-100 text-sm">{ref.name}</div>
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange-400 hover:text-orange-300 truncate flex items-center gap-1 mt-0.5"
              >
                {ref.url}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
              {ref.description && (
                <p className="text-xs text-gray-500 mt-1">{ref.description}</p>
              )}
              {ref.clonedAt && (
                <p className="text-xs text-gray-600 mt-1">
                  Cloned {new Date(ref.clonedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => removeCodebaseReference(activeProjectId, ref.id)}
            className="text-gray-600 hover:text-red-400 transition-colors ml-3 flex-shrink-0 opacity-0 group-hover:opacity-100"
            title="Remove reference"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Add Repo form */}
      {showAddForm ? (
        <div className="p-4 bg-gray-800 rounded-xl border border-orange-500/30 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-100">Add Codebase Reference</h3>
            <button onClick={() => { setShowAddForm(false); setRepoUrl(''); setRepoDesc(''); setCloneError(''); setCloneStatus(''); }}>
              <X className="w-4 h-4 text-gray-500 hover:text-gray-300" />
            </button>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">GitHub URL *</label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="w-full bg-gray-700 border border-gray-600 focus:border-orange-500 rounded-lg px-3 py-2 text-gray-100 text-sm outline-none transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">What is this for?</label>
            <input
              type="text"
              value={repoDesc}
              onChange={(e) => setRepoDesc(e.target.value)}
              placeholder="e.g., Reference architecture for the project"
              className="w-full bg-gray-700 border border-gray-600 focus:border-orange-500 rounded-lg px-3 py-2 text-gray-100 text-sm outline-none transition-colors"
            />
          </div>

          {/* Clone status */}
          {cloning && (
            <div className="flex items-center gap-2 text-sm text-orange-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              {cloneStatus}
            </div>
          )}
          {cloneStatus && !cloning && (
            <div className="text-sm text-green-400">{cloneStatus}</div>
          )}
          {cloneError && (
            <div className="text-sm text-red-400 bg-red-900/20 border border-red-700/30 rounded px-3 py-2">
              {cloneError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => { setShowAddForm(false); setCloneError(''); setCloneStatus(''); }}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCloneAndAdd}
              disabled={!repoUrl.trim() || cloning}
              className="flex items-center gap-2 px-4 py-1.5 text-sm bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-lg transition-colors"
            >
              {cloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
              Clone & Add
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-gray-700 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group text-sm text-gray-500 group-hover:text-orange-400"
        >
          <Plus className="w-4 h-4" />
          Add Repo
        </button>
      )}
    </div>
  );
}

// ─── Main MemoryBrowserPage ───
export default function MemoryBrowserPage() {
  const navigate = useNavigate();
  const {
    chats,
    memories,
    currentChatId,
    selectedTopic,
    topicContent,
    stats,
    isLoading,
    error,
    fetchChats,
    fetchMemories,
    fetchTopic,
    saveMemory,
    deleteMemory,
    setCurrentChat,
    clear,
  } = useMemoryStore();

  const [activeTab, setActiveTab] = useState<Tab>('memory');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMemory, setShowNewMemory] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSector, setNewSector] = useState<MemorySector>('semantic');

  useEffect(() => {
    fetchChats();
    return () => clear();
  }, []);

  useEffect(() => {
    if (currentChatId) {
      fetchMemories(currentChatId);
    }
  }, [currentChatId]);

  const handleChatSelect = (chatId: string) => {
    setCurrentChat(chatId);
    setSearchQuery('');
  };

  const handleTopicClick = async (topic: string) => {
    if (currentChatId) {
      await fetchTopic(currentChatId, topic);
    }
  };

  const handleSaveMemory = async () => {
    if (currentChatId && newTopic.trim() && newContent.trim()) {
      const success = await saveMemory(currentChatId, newTopic.trim(), newContent.trim(), newSector);
      if (success) {
        setShowNewMemory(false);
        setNewTopic('');
        setNewContent('');
      }
    }
  };

  const handleDeleteMemory = async (topic: string) => {
    if (currentChatId && confirm(`Delete memory "${topic}"?`)) {
      await deleteMemory(currentChatId, topic);
    }
  };

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const filteredMemories = searchQuery
    ? memories.filter(
      (m) =>
        m.topicKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : memories;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-100">Memory</h1>

            {/* Tab switcher */}
            <div className="flex items-center gap-1 ml-4 bg-gray-900 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('memory')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'memory'
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <Brain className="w-4 h-4" />
                Agent Memory
              </button>
              <button
                onClick={() => setActiveTab('references')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'references'
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <BookOpen className="w-4 h-4" />
                Codebase References
              </button>
            </div>
          </div>

          {activeTab === 'memory' && stats && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-400">
                <span className="text-gray-100 font-medium">{stats.total}</span> memories
              </span>
              <span className="text-gray-400">
                <span className="text-blue-400 font-medium">{stats.semantic}</span> semantic
              </span>
              <span className="text-gray-400">
                <span className="text-purple-400 font-medium">{stats.episodic}</span> episodic
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Error message */}
      {error && activeTab === 'memory' && (
        <div className="bg-red-900/50 border-b border-red-700 px-6 py-3 text-red-200">
          {error}
        </div>
      )}

      {/* ── Codebase References Tab ── */}
      {activeTab === 'references' && <CodebaseReferencesPanel />}

      {/* ── Agent Memory Tab ── */}
      {activeTab === 'memory' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Chat list */}
          <div className="w-64 bg-gray-850 border-r border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-700">
              <h2 className="text-sm font-medium text-gray-400 uppercase">Chats</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chats.map((chat) => (
                <button
                  key={chat.chatId}
                  onClick={() => handleChatSelect(chat.chatId)}
                  className={`w-full px-4 py-3 text-left border-b border-gray-700/50 transition-colors ${currentChatId === chat.chatId
                    ? 'bg-primary-600/20 border-l-2 border-l-primary-500'
                    : 'hover:bg-gray-700/50'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-100 truncate font-mono">
                      {chat.chatId.slice(0, 12)}...
                    </span>
                    <span className="text-xs text-gray-500">{chat.count}</span>
                  </div>
                  {chat.lastActivity && (
                    <span className="text-xs text-gray-500">{formatDate(chat.lastActivity)}</span>
                  )}
                </button>
              ))}
              {chats.length === 0 && !isLoading && (
                <div className="p-4 text-center text-gray-500 text-sm">No chats with memories</div>
              )}
            </div>
          </div>

          {/* Memory list */}
          <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
            {currentChatId ? (
              <>
                <div className="p-3 border-b border-gray-700 space-y-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search memories..."
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500"
                  />
                  <button
                    onClick={() => setShowNewMemory(true)}
                    className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded transition-colors"
                  >
                    + New Memory
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
                    </div>
                  ) : (
                    filteredMemories.map((memory) => (
                      <MemoryListItem
                        key={memory.id}
                        memory={memory}
                        isSelected={selectedTopic === memory.topicKey}
                        onClick={() => handleTopicClick(memory.topicKey)}
                        onDelete={() => handleDeleteMemory(memory.topicKey)}
                        formatDate={formatDate}
                      />
                    ))
                  )}
                  {filteredMemories.length === 0 && !isLoading && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {searchQuery ? 'No matching memories' : 'No memories yet'}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                Select a chat to view memories
              </div>
            )}
          </div>

          {/* Content panel */}
          <div className="flex-1 flex flex-col bg-gray-900">
            {selectedTopic && topicContent ? (
              <>
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-100">{selectedTopic}</h2>
                  <span className="text-sm text-gray-400">
                    {memories.find((m) => m.topicKey === selectedTopic)?.sector === 'semantic'
                      ? 'Semantic'
                      : 'Episodic'}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <pre className="whitespace-pre-wrap text-gray-300 font-mono text-sm">
                    {topicContent}
                  </pre>
                </div>
              </>
            ) : currentChatId ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a memory topic to view content
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <Brain className="w-16 h-16 mb-4 text-gray-700" />
                <p className="text-lg mb-2">Memory Browser</p>
                <p className="text-sm">Select a chat from the sidebar to browse memories</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Memory Modal */}
      {showNewMemory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">New Memory</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Topic</label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g., project-status, preferences, debugging"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Sector</label>
                <select
                  value={newSector}
                  onChange={(e) => setNewSector(e.target.value as MemorySector)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100"
                >
                  <option value="semantic">Semantic (facts, preferences)</option>
                  <option value="episodic">Episodic (events, conversations)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Content</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={6}
                  placeholder="Memory content in markdown..."
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowNewMemory(false); setNewTopic(''); setNewContent(''); }}
                className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMemory}
                disabled={!newTopic.trim() || !newContent.trim() || isLoading}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Memory list item component
function MemoryListItem({
  memory,
  isSelected,
  onClick,
  onDelete,
  formatDate,
}: {
  memory: MemoryEntry;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  formatDate: (date: Date | string) => string;
}) {
  const sectorColor = memory.sector === 'semantic' ? 'bg-blue-500' : 'bg-purple-500';

  return (
    <div
      onClick={onClick}
      className={`px-4 py-3 border-b border-gray-700/50 cursor-pointer transition-colors ${isSelected ? 'bg-primary-600/20' : 'hover:bg-gray-700/50'
        }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${sectorColor}`} />
            <span className="text-sm font-medium text-gray-100 truncate">{memory.topicKey}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{memory.content.slice(0, 100)}...</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>Salience: {(memory.salience * 100).toFixed(0)}%</span>
            <span>{formatDate(memory.lastAccessed)}</span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-gray-500 hover:text-red-400 transition-colors ml-2"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
