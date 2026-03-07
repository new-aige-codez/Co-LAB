import { useState, useEffect } from 'react';
import { GitCommit, ChevronDown, ChevronRight, Circle, Loader2 } from 'lucide-react';
import { useGitStore, type CommitInfo } from '../../store/gitStore';

interface CommitHistoryProps {
  workspaceId?: string;
  maxItems?: number;
  className?: string;
}

export default function CommitHistory({
  workspaceId,
  maxItems = 10,
  className = '',
}: CommitHistoryProps) {
  const { commitHistory, isLoadingHistory, fetchHistory } = useGitStore();
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    fetchHistory(workspaceId, maxItems);
  }, [workspaceId, maxItems, fetchHistory]);

  const displayCommits = commitHistory.slice(0, maxItems);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoadingHistory && commitHistory.length === 0) {
    return (
      <div className={`flex items-center justify-center py-4 ${className}`}>
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (commitHistory.length === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <GitCommit className="h-8 w-8 mx-auto mb-2 text-gray-600" />
        <p className="text-sm text-gray-500">No commits yet</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-700/30 px-1 py-1 -mx-1 rounded transition"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
        <span className="text-sm font-medium text-gray-300">Recent Commits</span>
        <span className="text-xs text-gray-500">({commitHistory.length})</span>
      </div>

      {/* Commit List */}
      {isExpanded && (
        <div className="mt-2 space-y-1">
          {displayCommits.map((commit, index) => (
            <CommitItem
              key={commit.hash}
              commit={commit}
              isLatest={index === 0}
            />
          ))}

          {commitHistory.length > maxItems && (
            <button
              className="w-full text-center text-xs text-gray-500 hover:text-gray-300 py-2 transition"
            >
              View all {commitHistory.length} commits
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface CommitItemProps {
  commit: CommitInfo;
  isLatest?: boolean;
}

function CommitItem({ commit, isLatest = false }: CommitItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex items-start gap-2 p-2 rounded transition ${
        isHovered ? 'bg-gray-700/30' : ''
      }`}
    >
      {/* Commit indicator */}
      <div className="flex flex-col items-center pt-0.5">
        {isLatest ? (
          <Circle className="h-3 w-3 text-primary-400 fill-primary-400" />
        ) : (
          <Circle className="h-3 w-3 text-gray-600" />
        )}
        {!isLatest && <div className="w-px h-full bg-gray-700 mt-1" />}
      </div>

      {/* Commit info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500">
            {commit.shortHash}
          </span>
          {isLatest && (
            <span className="text-xs bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded">
              latest
            </span>
          )}
        </div>
        <p className="text-sm text-gray-300 truncate mt-0.5">
          {commit.message}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span>{commit.author}</span>
          <span>•</span>
          <span>{formatDate(commit.date)}</span>
        </div>
      </div>

      {/* Hover actions */}
      {isHovered && (
        <div className="flex items-center gap-1">
          <button
            className="p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded transition"
            title="View commit"
          >
            <GitCommit className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded transition"
            title="Copy hash"
            onClick={() => navigator.clipboard.writeText(commit.hash)}
          >
            <span className="text-xs font-mono">#</span>
          </button>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
