/**
 * Repo Import Dialog Component
 *
 * Dialog for importing Git repositories into brain dump
 */

'use client';

import { useState } from 'react';
import { X, GitBranch, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RepoImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (repoData: {
    url: string;
    name: string;
    context: {
      readme: string | null;
      claudeMd: string | null;
      packageJson: Record<string, unknown> | null;
    };
  }) => void;
}

type ImportStatus = 'idle' | 'cloning' | 'extracting' | 'success' | 'error';

export function RepoImportDialog({ isOpen, onClose, onImport }: RepoImportDialogProps) {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    name: string;
    context: {
      readme: string | null;
      claudeMd: string | null;
      packageJson: Record<string, unknown> | null;
    };
  } | null>(null);

  const isValidUrl = /^https?:\/\/.+\.(git|com|org|io)/.test(repoUrl);

  const handleClone = async () => {
    if (!isValidUrl) return;

    setStatus('cloning');
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/repos/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: repoUrl,
          branch: branch || undefined,
          depth: 1,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to clone repository');
      }

      setStatus('success');
      setResult({
        name: data.repo.name,
        context: data.context,
      });

      // Auto-import after success
      onImport({
        url: repoUrl,
        name: data.repo.name,
        context: data.context,
      });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleClose = () => {
    setRepoUrl('');
    setBranch('');
    setStatus('idle');
    setError(null);
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative bg-gray-900 rounded-xl border border-gray-800 w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <GitBranch className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-gray-100">Import Repository</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Repository URL
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo.git"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-orange-500"
              disabled={status !== 'idle'}
            />
          </div>

          {/* Branch Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Branch <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-orange-500"
              disabled={status !== 'idle'}
            />
          </div>

          {/* Status */}
          {status === 'cloning' && (
            <div className="flex items-center gap-3 text-yellow-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Cloning repository...</span>
            </div>
          )}

          {status === 'success' && result && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>Repository cloned successfully!</span>
              </div>

              {/* Context Preview */}
              <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                <div className="text-sm font-medium text-gray-300">Extracted Context:</div>
                <div className="flex flex-wrap gap-2">
                  {result.context.readme && (
                    <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                      README.md
                    </span>
                  )}
                  {result.context.claudeMd && (
                    <span className="text-xs px-2 py-1 bg-orange-900/30 text-orange-400 rounded">
                      CLAUDE.md
                    </span>
                  )}
                  {result.context.packageJson && (
                    <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                      package.json
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {status === 'error' && error && (
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleClone}
            disabled={!isValidUrl || status === 'cloning'}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              isValidUrl && status !== 'cloning'
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            )}
          >
            {status === 'cloning' ? 'Cloning...' : 'Clone & Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
