import { useState, useEffect } from 'react';
import { ChevronDown, Check, GitBranch, Loader2, Plus, X } from 'lucide-react';
import { useGitStore, type BranchInfo } from '../../store/gitStore';

interface BranchSelectorProps {
  workspaceId?: string;
  className?: string;
}

export default function BranchSelector({ workspaceId, className = '' }: BranchSelectorProps) {
  const {
    status,
    branches,
    fetchBranches,
    checkout,
    createBranch,
    isLoadingStatus,
  } = useGitStore();

  const [isOpen, setIsOpen] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches(workspaceId);
  }, [workspaceId, fetchBranches]);

  const currentBranch = status?.currentBranch || 'main';

  const handleCheckout = async (branchName: string) => {
    setIsCheckingOut(branchName);
    const success = await checkout(branchName, workspaceId);
    setIsCheckingOut(null);
    if (success) {
      setIsOpen(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    setIsCreating(true);
    const success = await createBranch(newBranchName.trim(), currentBranch, workspaceId);
    setIsCreating(false);
    if (success) {
      setNewBranchName('');
      setShowCreateInput(false);
      setIsOpen(false);
    }
  };

  // Filter branches to show local branches first, then remotes
  const sortedBranches = [...branches].sort((a, b) => {
    // Current branch first
    if (a.current) return -1;
    if (b.current) return 1;
    // Local branches before remotes
    const aIsRemote = a.name.startsWith('remotes/');
    const bIsRemote = b.name.startsWith('remotes/');
    if (aIsRemote && !bIsRemote) return 1;
    if (!aIsRemote && bIsRemote) return -1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoadingStatus}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition disabled:opacity-50"
      >
        <GitBranch className="h-4 w-4 text-primary-400" />
        <span className="text-sm text-gray-200">{currentBranch}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Branches
              </span>
              <button
                onClick={() => setShowCreateInput(!showCreateInput)}
                className="p-1 text-gray-400 hover:text-primary-400 hover:bg-gray-700 rounded transition"
                title="Create branch"
              >
                {showCreateInput ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Create branch input */}
            {showCreateInput && (
              <div className="p-2 border-b border-gray-700 bg-gray-900/50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
                    placeholder="new-branch-name"
                    className="flex-1 px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500"
                    disabled={isCreating}
                    autoFocus
                  />
                  <button
                    onClick={handleCreateBranch}
                    disabled={!newBranchName.trim() || isCreating}
                    className="px-2 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50 transition"
                  >
                    {isCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Create'}
                  </button>
                </div>
              </div>
            )}

            {/* Branch list */}
            <div className="max-h-64 overflow-y-auto">
              {sortedBranches.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  No branches found
                </div>
              ) : (
                sortedBranches.map((branch) => {
                  const isCurrent = branch.name === currentBranch || branch.current;
                  const isCheckingOutThis = isCheckingOut === branch.name;

                  return (
                    <button
                      key={branch.name}
                      onClick={() => !isCurrent && handleCheckout(branch.name)}
                      disabled={isCurrent || isCheckingOutThis}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left transition ${
                        isCurrent
                          ? 'bg-primary-500/10 text-primary-400'
                          : 'text-gray-300 hover:bg-gray-700'
                      } disabled:cursor-default`}
                    >
                      {isCurrent ? (
                        <Check className="h-4 w-4 text-primary-400 flex-shrink-0" />
                      ) : isCheckingOutThis ? (
                        <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                      ) : (
                        <GitBranch className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      )}
                      <span className="text-sm truncate">{branch.name}</span>
                      {branch.name.startsWith('remotes/') && (
                        <span className="text-xs text-gray-500 ml-auto">remote</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
