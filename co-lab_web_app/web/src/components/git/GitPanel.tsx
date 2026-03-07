import { useEffect, useState } from 'react';
import {
  GitBranch,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Check,
  Send,
  GitCommit,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useGitStore, type ChangedFile } from '../../store/gitStore';
import BranchSelector from './BranchSelector';
import CommitHistory from './CommitHistory';
import ChangedFilesList from './ChangedFilesList';

interface GitPanelProps {
  workspaceId?: string;
  className?: string;
}

export default function GitPanel({ workspaceId, className = '' }: GitPanelProps) {
  const {
    status,
    changedFiles,
    isLoadingStatus,
    isCommitting,
    isPushing,
    isPulling,
    error,
    fetchStatus,
    fetchChangedFiles,
    fetchHistory,
    commit,
    push,
    pull,
    clearError,
  } = useGitStore();

  const [commitMessage, setCommitMessage] = useState('');
  const [showCommitInput, setShowCommitInput] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch initial data
  useEffect(() => {
    fetchStatus(workspaceId);
    fetchChangedFiles(workspaceId);
    fetchHistory(workspaceId);
  }, [workspaceId, fetchStatus, fetchChangedFiles, fetchHistory]);

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    const success = await commit(commitMessage, workspaceId);
    if (success) {
      setCommitMessage('');
      setShowCommitInput(false);
    }
  };

  const handlePush = async () => {
    await push(false, workspaceId);
  };

  const handlePull = async () => {
    await pull(workspaceId);
  };

  const handleRefresh = () => {
    fetchStatus(workspaceId);
    fetchChangedFiles(workspaceId);
    fetchHistory(workspaceId);
  };

  const hasChanges = changedFiles.length > 0;
  const isBusy = isCommitting || isPushing || isPulling;

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      {/* Header / Status Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <GitBranch className="h-5 w-5 text-primary-400" />
          <div className="flex items-center gap-2">
            <BranchSelector workspaceId={workspaceId} />
            {status && (
              <>
                {status.ahead > 0 && (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <ArrowUp className="h-3 w-3" />
                    {status.ahead}
                  </span>
                )}
                {status.behind > 0 && (
                  <span className="flex items-center gap-1 text-xs text-yellow-400">
                    <ArrowDown className="h-3 w-3" />
                    {status.behind}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Push/Pull buttons */}
          <button
            onClick={handlePull}
            disabled={isBusy || isPulling}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition disabled:opacity-50"
            title="Pull from remote"
          >
            {isPulling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )}
            Pull
          </button>
          <button
            onClick={handlePush}
            disabled={isBusy || isPushing || (status?.ahead ?? 0) === 0}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition disabled:opacity-50"
            title="Push to remote"
          >
            {isPushing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowUp className="h-3.5 w-3.5" />
            )}
            Push
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoadingStatus}
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-900/30 border-b border-red-900/50 text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={clearError} className="hover:text-red-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="divide-y divide-gray-700">
          {/* Changed Files Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                Changed Files
                {hasChanges && (
                  <span className="px-1.5 py-0.5 text-xs bg-primary-500/20 text-primary-400 rounded">
                    {changedFiles.length}
                  </span>
                )}
              </h3>
              {!showCommitInput && hasChanges && (
                <button
                  onClick={() => setShowCommitInput(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded transition"
                >
                  <GitCommit className="h-3.5 w-3.5" />
                  Commit
                </button>
              )}
            </div>

            {/* Commit Input */}
            {showCommitInput && hasChanges && (
              <div className="mb-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <textarea
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Describe your changes..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
                  rows={3}
                  disabled={isCommitting}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setShowCommitInput(false);
                      setCommitMessage('');
                    }}
                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition"
                    disabled={isCommitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCommit}
                    disabled={!commitMessage.trim() || isCommitting}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCommitting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    Commit
                  </button>
                </div>
              </div>
            )}

            <ChangedFilesList workspaceId={workspaceId} />
          </div>

          {/* Commit History Section */}
          <div className="p-4">
            <CommitHistory workspaceId={workspaceId} maxItems={5} />
          </div>
        </div>
      )}
    </div>
  );
}
