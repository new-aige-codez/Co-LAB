import { useState, useMemo } from 'react';
import {
  File,
  Folder,
  Lock,
  Search,
  X,
  Plus,
  Minus,
  RefreshCw,
  List,
  TreeDeciduous,
} from 'lucide-react';
import type { FileEntry } from '../../store/workspaceStore';
import type { ChangedFile } from '../../store/gitStore';

interface FileExplorerProps {
  files: FileEntry[];
  isLoading: boolean;
  onFileClick: (file: FileEntry) => void;
  isFileLocked: (path: string) => { lockedBy: string } | undefined;
  isFileLockedByMe: (path: string) => boolean;
  currentUserId?: string;
  changedFiles?: ChangedFile[]; // Git status per file
  viewMode?: 'list' | 'tree';
  onViewModeChange?: (mode: 'list' | 'tree') => void;
}

export default function FileExplorer({
  files,
  isLoading,
  onFileClick,
  isFileLocked,
  isFileLockedByMe,
  changedFiles = [],
  viewMode = 'list',
  onViewModeChange,
}: FileExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Build a map of file paths to git status
  const gitStatusMap = useMemo(() => {
    const map = new Map<string, ChangedFile>();
    for (const file of changedFiles) {
      map.set(file.path, file);
    }
    return map;
  }, [changedFiles]);

  // Filter files based on search
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;

    const query = searchQuery.toLowerCase();
    return files.filter((file) =>
      file.name.toLowerCase().includes(query) ||
      file.path.toLowerCase().includes(query)
    );
  }, [files, searchQuery]);

  const getGitStatusIndicator = (file: FileEntry) => {
    const gitFile = gitStatusMap.get(file.path);
    if (!gitFile) return null;

    const { status } = gitFile;

    if (status.includes('A') || status === '??') {
      return (
        <div className="flex items-center gap-1 text-xs text-green-400" title="Added / New file">
          <Plus className="h-3 w-3" />
          <span className="hidden sm:inline">A</span>
        </div>
      );
    }
    if (status.includes('D')) {
      return (
        <div className="flex items-center gap-1 text-xs text-red-400" title="Deleted">
          <Minus className="h-3 w-3" />
          <span className="hidden sm:inline">D</span>
        </div>
      );
    }
    if (status.includes('M') || status.includes('R')) {
      return (
        <div className="flex items-center gap-1 text-xs text-yellow-400" title="Modified">
          <RefreshCw className="h-3 w-3" />
          <span className="hidden sm:inline">M</span>
        </div>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Search and View Controls */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-700 bg-gray-900/30">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-8 pr-8 py-1.5 text-sm bg-gray-800 border border-gray-600 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-gray-300 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        {onViewModeChange && (
          <div className="flex items-center gap-0.5 bg-gray-700 rounded p-0.5">
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded transition ${
                viewMode === 'list'
                  ? 'bg-gray-600 text-primary-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('tree')}
              className={`p-1.5 rounded transition ${
                viewMode === 'tree'
                  ? 'bg-gray-600 text-primary-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Tree view"
            >
              <TreeDeciduous className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* File Count */}
      {(searchQuery || filteredFiles.length !== files.length) && (
        <div className="px-4 py-1 text-xs text-gray-500 border-b border-gray-700/50">
          Showing {filteredFiles.length} of {files.length} files
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}

      {/* Empty State */}
      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          {searchQuery ? (
            <>
              <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No files match your search</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-primary-400 text-sm mt-2 hover:underline"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <Folder className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">This directory is empty</p>
            </>
          )}
        </div>
      )}

      {/* File List */}
      {filteredFiles.length > 0 && (
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900/50 text-left text-sm text-gray-400">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Size</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Modified</th>
              <th className="px-4 py-3 font-medium w-24">Git</th>
              <th className="px-4 py-3 font-medium w-20">Lock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredFiles.map((file) => {
              const lock = isFileLocked(file.path);
              const lockedByMe = isFileLockedByMe(file.path);
              const isLocked = !!lock;

              return (
                <tr
                  key={file.path}
                  onClick={() => onFileClick(file)}
                  className={`group cursor-pointer hover:bg-gray-700/50 transition ${
                    isLocked && !lockedByMe ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {file.type === 'directory' ? (
                        <Folder className="h-5 w-5 text-primary-400" />
                      ) : (
                        <File className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="group-hover:text-primary-400 transition truncate">
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 hidden sm:table-cell">
                    {file.type === 'file' && file.size ? formatSize(file.size) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 hidden md:table-cell">
                    {file.modifiedAt ? new Date(file.modifiedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {getGitStatusIndicator(file) || (
                      <span className="text-xs text-gray-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isLocked ? (
                      <div className="flex items-center gap-1 text-xs">
                        <Lock
                          className={`h-3.5 w-3.5 ${
                            lockedByMe ? 'text-primary-400' : 'text-gray-500'
                          }`}
                        />
                        <span className={lockedByMe ? 'text-primary-400' : 'text-gray-500'}>
                          {lockedByMe ? 'You' : 'Locked'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-600">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
