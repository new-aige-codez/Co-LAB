import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkspaceStore, type FileEntry } from '../store/workspaceStore';
import { useCollaborationStore } from '../store/collaborationStore';
import { useAuthStore } from '../store/authStore';
import { useGitStore } from '../store/gitStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { useProjectStore } from '../store/projectStore';
import PresenceIndicator from '../components/collaboration/PresenceIndicator';
import UserList from '../components/collaboration/UserList';
import LockedResourceBadge from '../components/collaboration/LockedResourceBadge';
import FileExplorer from '../components/workspace/FileExplorer';
import FileViewer from '../components/workspace/FileViewer';
import { GitPanel } from '../components/git';
import {
  FolderGit2,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Users,
  GitBranch,
  Activity,
  Clock,
  AlertCircle,
} from 'lucide-react';

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string; Icon: any }> = {
    active: { label: 'Active Project', cls: 'text-green-400 bg-green-900/30 border-green-700/40', Icon: Activity },
    paused: { label: 'Paused', cls: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/40', Icon: Clock },
    blocked: { label: 'Blocked', cls: 'text-red-400 bg-red-900/30 border-red-700/40', Icon: AlertCircle },
  };
  const { label, cls, Icon } = cfg[status] || cfg.active;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${cls}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const workspaceId = id || null;

  const { user } = useAuthStore();
  const { projects, setActiveProject } = useProjectStore();
  const {
    workspaces,
    currentWorkspace,
    files,
    currentPath,
    isLoading,
    fetchWorkspaces,
    setCurrentWorkspace,
    fetchFiles,
    syncWorkspace,
  } = useWorkspaceStore();

  const { locks, isConnected } = useCollaborationStore();
  const ws = useWebSocket(workspaceId);

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [showUserList, setShowUserList] = useState(false);
  const [showGitPanel, setShowGitPanel] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

  // Git store
  const { changedFiles: gitChangedFiles, fetchStatus, fetchChangedFiles } = useGitStore();

  // Set active project when workspace opens
  useEffect(() => {
    if (workspaceId) {
      setActiveProject(workspaceId);
    }
  }, [workspaceId, setActiveProject]);

  // Resolve project metadata from store (for heading)
  const activeProject = workspaceId ? projects.find((p) => p.id === workspaceId) : null;

  // Load workspaces and set current
  useEffect(() => {
    if (workspaces.length === 0) {
      fetchWorkspaces();
    }
  }, [fetchWorkspaces, workspaces.length]);

  useEffect(() => {
    if (workspaces.length > 0 && workspaceId) {
      const foundWorkspace = workspaces.find((w) => w.id === workspaceId);
      if (foundWorkspace) {
        setCurrentWorkspace(foundWorkspace);
      }
    }
  }, [workspaces, workspaceId, setCurrentWorkspace]);

  // Load files when workspace is selected
  useEffect(() => {
    if (workspaceId && currentWorkspace) {
      fetchFiles(workspaceId, currentPath);
    }
  }, [workspaceId, currentPath, currentWorkspace, fetchFiles]);

  // Update presence activity when viewing files
  useEffect(() => {
    if (selectedFile) {
      ws.updatePresence(undefined, `Viewing ${selectedFile}`);
    } else {
      ws.updatePresence(undefined);
    }
  }, [selectedFile, ws]);

  // Fetch git status when workspace changes
  useEffect(() => {
    if (workspaceId) {
      fetchStatus(workspaceId);
      fetchChangedFiles(workspaceId);
    }
  }, [workspaceId, fetchStatus, fetchChangedFiles]);

  async function handleFileClick(file: FileEntry) {
    if (file.type === 'directory') {
      // Navigate into directory
      const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      fetchFiles(workspaceId!, newPath);
      setSelectedFile(null);
      setFileContent(null);
    } else {
      // Load file content
      setSelectedFile(file.path);
      try {
        const token = useAuthStore.getState().token;
        const response = await fetch(
          `/api/workspaces/${workspaceId}/files/${file.path}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setFileContent(data.content);
        }
      } catch (error) {
        console.error('Failed to load file:', error);
      }
    }
  }

  function handleBackClick() {
    if (selectedFile) {
      setSelectedFile(null);
      setFileContent(null);
      return;
    }

    if (currentPath) {
      const parts = currentPath.split('/');
      parts.pop();
      const newPath = parts.join('/');
      fetchFiles(workspaceId!, newPath);
    }
  }

  async function handleSync() {
    if (workspaceId) {
      await syncWorkspace(workspaceId);
      fetchFiles(workspaceId, currentPath);
    }
  }

  function handleLockFile(filePath: string) {
    ws.acquireLock('file', filePath);
  }

  function handleUnlockFile(filePath: string) {
    ws.releaseLock(undefined, filePath);
  }

  const isFileLocked = useCallback(
    (path: string) => {
      const lock = locks.find((l) => l.resourcePath === path);
      return lock;
    },
    [locks]
  );

  const isFileLockedByMe = useCallback(
    (path: string) => {
      const lock = locks.find((l) => l.resourcePath === path);
      return lock?.lockedBy === user?.id;
    },
    [locks, user?.id]
  );

  // If there's no backend workspace, fall back to the projectStore entry.
  // This lets locally-defined projects (like 'claude-claw') render without needing a DB record.
  const effectiveWorkspace = currentWorkspace ?? (
    activeProject
      ? {
        id: activeProject.id,
        name: activeProject.name,
        description: activeProject.description,
        repoPath: activeProject.repoPath || '',
        repoUrl: null,
        currentCommitHash: null,
        createdAt: new Date().toISOString(),
        createdBy: null,
        lastSyncAt: null,
        isPublic: true,
      }
      : null
  );

  if (!effectiveWorkspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col">

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/workspace" className="p-1 hover:bg-gray-700 rounded transition">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <FolderGit2 className="h-6 w-6 text-primary-500" />
              <h1 className="text-lg font-bold">{effectiveWorkspace.name}</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Connection status */}
              <div className={`flex items-center gap-1.5 text-sm ${isConnected ? 'text-green-400' : 'text-gray-500'
                }`}>
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-500'
                  }`}></div>
                <span className="hidden sm:inline">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Sync button */}
              <button
                onClick={handleSync}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-white transition"
                title="Sync workspace"
              >
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Users button */}
              <button
                onClick={() => setShowUserList(!showUserList)}
                className="p-2 text-gray-400 hover:text-white transition relative"
                title="Online users"
              >
                <Users className="h-5 w-5" />
                <PresenceIndicator />
              </button>

              {/* Git panel toggle */}
              <button
                onClick={() => setShowGitPanel(!showGitPanel)}
                className={`p-2 transition ${showGitPanel ? 'text-primary-400' : 'text-gray-400 hover:text-white'
                  }`}
                title="Git panel"
              >
                <GitBranch className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Project Identity Block ── */}
      {activeProject && (
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">{activeProject.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <StatusPill status={activeProject.status} />
                {activeProject.description && (
                  <span className="text-xs text-gray-500">{activeProject.description}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Main content */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4 overflow-x-auto">
            <button
              onClick={handleBackClick}
              className="text-gray-400 hover:text-white transition flex items-center gap-1"
            >
              {(selectedFile || currentPath) && (
                <>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </>
              )}
            </button>

            {!selectedFile && !currentPath && (
              <span className="text-gray-500">Root</span>
            )}

            {currentPath && !selectedFile && pathParts.map((part, index) => (
              <span key={index} className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-gray-600" />
                <span className={index === pathParts.length - 1 ? 'text-white' : 'text-gray-400'}>
                  {part}
                </span>
              </span>
            ))}

            {selectedFile && (
              <span className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-gray-600" />
                <span className="text-white">{selectedFile}</span>
                <LockedResourceBadge
                  resourcePath={selectedFile}
                  isLocked={!!isFileLocked(selectedFile)}
                  isLockedByMe={isFileLockedByMe(selectedFile)}
                  onLock={() => handleLockFile(selectedFile)}
                  onUnlock={() => handleUnlockFile(selectedFile)}
                />
              </span>
            )}
          </div>

          {/* File explorer or viewer */}
          {selectedFile ? (
            <FileViewer
              content={fileContent}
              filePath={selectedFile}
              isLoading={isLoading}
            />
          ) : (
            <FileExplorer
              files={files}
              isLoading={isLoading}
              onFileClick={handleFileClick}
              isFileLocked={isFileLocked}
              isFileLockedByMe={isFileLockedByMe}
              currentUserId={user?.id}
              changedFiles={gitChangedFiles}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          )}
        </main>

        {/* Git panel sidebar */}
        {showGitPanel && (
          <aside className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Git
              </h2>
              <button
                onClick={() => setShowGitPanel(false)}
                className="p-1 text-gray-400 hover:text-gray-200 rounded"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
            <GitPanel workspaceId={workspaceId ?? undefined} />
          </aside>
        )}

        {/* User list sidebar */}
        {showUserList && (
          <aside className="w-72 bg-gray-800 border-l border-gray-700 p-4">
            <UserList />
          </aside>
        )}
      </div>
    </div>
  );
}
