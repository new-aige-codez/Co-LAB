import { useState } from 'react';
import {
  Plus,
  Minus,
  File,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  Trash2,
  Check,
} from 'lucide-react';
import { useGitStore, type ChangedFile } from '../../store/gitStore';

interface ChangedFilesListProps {
  workspaceId?: string;
  className?: string;
}

export default function ChangedFilesList({ workspaceId, className = '' }: ChangedFilesListProps) {
  const {
    changedFiles,
    stagedDiff,
    unstagedDiff,
    fetchDiff,
    stageFiles,
    stageAll,
    discardChanges,
  } = useGitStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isStaging, setIsStaging] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [hasLoadedDiff, setHasLoadedDiff] = useState(false);

  // Separate staged and unstaged files based on diff
  const stagedFiles: ChangedFile[] = [];
  const unstagedFiles: ChangedFile[] = [];

  changedFiles.forEach((file) => {
    // Simple heuristic: if the file is in stagedDiff, it's staged
    // More accurate would be to parse the diff
    if (stagedDiff.includes(`a/${file.path}`) || stagedDiff.includes(`b/${file.path}`)) {
      stagedFiles.push({ ...file, status: 'S' + file.status });
    } else {
      unstagedFiles.push(file);
    }
  });

  const hasUnstaged = unstagedFiles.length > 0;
  const hasStaged = stagedFiles.length > 0;
  const hasChanges = changedFiles.length > 0;

  const handleStageAll = async () => {
    setIsStaging(true);
    await stageAll(workspaceId);
    setIsStaging(false);
  };

  const handleStageFile = async (filePath: string) => {
    setIsStaging(true);
    await stageFiles([filePath], workspaceId);
    setIsStaging(false);
  };

  const handleDiscardAll = async () => {
    if (!confirm('Are you sure you want to discard all changes? This cannot be undone.')) {
      return;
    }
    setIsDiscarding(true);
    await discardChanges(workspaceId);
    setIsDiscarding(false);
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('A') || status === '??') {
      return <Plus className="h-3.5 w-3.5 text-green-400" />;
    }
    if (status.includes('D')) {
      return <Minus className="h-3.5 w-3.5 text-red-400" />;
    }
    if (status.includes('M') || status.includes('R')) {
      return <RefreshCw className="h-3.5 w-3.5 text-yellow-400" />;
    }
    if (status.includes('S')) {
      return <Check className="h-3.5 w-3.5 text-primary-400" />;
    }
    return <File className="h-3.5 w-3.5 text-gray-400" />;
  };

  const getStatusLabel = (status: string) => {
    if (status.includes('S')) return 'Staged';
    if (status === '??') return 'Untracked';
    if (status.includes('A')) return 'Added';
    if (status.includes('D')) return 'Deleted';
    if (status.includes('M')) return 'Modified';
    if (status.includes('R')) return 'Renamed';
    return status;
  };

  const getStatusColor = (status: string) => {
    if (status.includes('S')) return 'text-primary-400';
    if (status === '??') return 'text-gray-400';
    if (status.includes('A')) return 'text-green-400';
    if (status.includes('D')) return 'text-red-400';
    if (status.includes('M')) return 'text-yellow-400';
    if (status.includes('R')) return 'text-blue-400';
    return 'text-gray-400';
  };

  if (!hasChanges) {
    return (
      <div className={`px-4 py-6 ${className}`}>
        <div className="text-center text-gray-500 text-sm">
          <Check className="h-8 w-8 mx-auto mb-2 text-green-500/50" />
          <p>Working tree clean</p>
          <p className="text-xs mt-1 text-gray-600">No changes to commit</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-700/30 transition"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-300">
            Changed Files
          </span>
          <span className="text-xs text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">
            {changedFiles.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {hasUnstaged && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStageAll();
              }}
              disabled={isStaging}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-primary-400 hover:bg-gray-700 rounded transition disabled:opacity-50"
              title="Stage all changes"
            >
              {isStaging ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              Stage All
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDiscardAll();
            }}
            disabled={isDiscarding}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition disabled:opacity-50"
            title="Discard all changes"
          >
            {isDiscarding ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* File List */}
      {isExpanded && (
        <div className="border-t border-gray-700/50">
          {/* Staged Files */}
          {hasStaged && (
            <div className="border-b border-gray-700/50">
              <div className="px-4 py-1.5 text-xs font-medium text-primary-400 bg-primary-500/5">
                Staged Changes ({stagedFiles.length})
              </div>
              {stagedFiles.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center justify-between px-4 py-1.5 hover:bg-gray-700/20 transition"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStatusIcon(file.status)}
                    <span className="text-sm text-gray-300 truncate">
                      {file.path}
                    </span>
                    <span className={`text-xs ${getStatusColor(file.status)}`}>
                      {getStatusLabel(file.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Unstaged Files */}
          {hasUnstaged && (
            <div>
              <div className="px-4 py-1.5 text-xs font-medium text-gray-400 bg-gray-700/20">
                Unstaged Changes ({unstagedFiles.length})
              </div>
              {unstagedFiles.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center justify-between px-4 py-1.5 hover:bg-gray-700/20 transition"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStatusIcon(file.status)}
                    <span className="text-sm text-gray-300 truncate">
                      {file.path}
                    </span>
                    <span className={`text-xs ${getStatusColor(file.status)}`}>
                      {getStatusLabel(file.status)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleStageFile(file.path)}
                    disabled={isStaging}
                    className="p-1 text-gray-500 hover:text-primary-400 hover:bg-gray-700 rounded transition disabled:opacity-50"
                    title="Stage file"
                  >
                    {isStaging ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
