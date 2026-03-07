import { useState, useEffect, useCallback } from 'react';
import {
  Save,
  RotateCcw,
  X,
  File,
  Lock,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { fetchWithAuth } from '../../store/authStore';

interface FileEditorProps {
  filePath: string;
  workspaceId?: string;
  onClose?: () => void;
  onSave?: () => void;
  readOnly?: boolean;
  className?: string;
}

interface FileContent {
  content: string;
  lang: string;
  sizeBytes: number;
  filename: string;
}

export default function FileEditor({
  filePath,
  workspaceId,
  onClose,
  onSave,
  readOnly = false,
  className = '',
}: FileEditorProps) {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);

  const isDirty = content !== originalContent;
  const fileName = filePath.split('/').pop() || 'file';

  // Fetch file content
  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build API URL - use feature-dev endpoint for now
        const encodedPath = encodeURIComponent(filePath);
        const result = await fetchWithAuth<FileContent>(
          `/feature-dev/jobs/current/file?path=${encodedPath}`
        );

        if (result.error) {
          setError(result.error);
        } else if (result.data) {
            setContent(result.data.content);
            setOriginalContent(result.data.content);
          }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [filePath]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty && !isSaving && !readOnly) {
          handleSave();
        }
      }
      if (e.key === 'Escape') {
        if (onClose) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, isSaving, readOnly, onClose]);

  const handleSave = async () => {
    if (!isDirty || isSaving || readOnly) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = await fetchWithAuth<{ success: boolean; size: number }>(
        '/files/update',
        {
          method: 'PUT',
          body: JSON.stringify({
            path: filePath,
            content,
            workspaceId,
          }),
        }
      );

      if (result.error) {
        setError(result.error);
      } else if (result.data?.success) {
        setOriginalContent(content);
        onSave?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = () => {
    setContent(originalContent);
    setError(null);
  };

  // Get language for syntax highlighting display
  const getLanguage = (): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      ts: 'TypeScript',
      tsx: 'TypeScript',
      js: 'JavaScript',
      jsx: 'JavaScript',
      py: 'Python',
      rs: 'Rust',
      go: 'Go',
      java: 'Java',
      kt: 'Kotlin',
      cs: 'C#',
      cpp: 'C++',
      c: 'C',
      h: 'C',
      json: 'JSON',
      yaml: 'YAML',
      yml: 'YAML',
      md: 'Markdown',
      css: 'CSS',
      scss: 'SCSS',
      html: 'HTML',
      xml: 'XML',
      sql: 'SQL',
      sh: 'Shell',
      bash: 'Shell',
    };
    return langMap[ext || ''] || 'Plain Text';
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error && !content) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center gap-2">
          <File className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-300 font-mono">{filePath}</span>
          <span className="text-xs text-gray-500">({getLanguage()})</span>
          {isLocked && (
            <div className="flex items-center gap-1 text-xs text-yellow-500">
              <Lock className="h-3 w-3" />
              <span>Locked by {lockedBy}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isDirty && !readOnly && (
            <button
              onClick={handleRevert}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition"
              title="Discard changes"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Revert
            </button>
          )}
          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        {readOnly && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 bg-gray-700/80 rounded text-xs text-gray-400">
            <Lock className="h-3 w-3" />
            Read only
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          readOnly={readOnly || isLocked}
          className={`w-full h-full p-4 bg-gray-900 text-gray-300 font-mono text-sm resize-none focus:outline-none ${
            (readOnly || isLocked) ? 'cursor-not-allowed' : ''
          }`}
          style={{
            tabSize: 2,
          }}
          spellCheck={false}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-gray-700 bg-gray-800/50 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>Lines: {content.split('\n').length}</span>
          <span>Characters: {content.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && <span className="text-yellow-400">Modified</span>}
          {!isDirty && <span className="text-green-400">Saved</span>}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
