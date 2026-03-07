import { File, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface FileViewerProps {
  content: string | null;
  filePath: string;
  isLoading: boolean;
}

export default function FileViewer({ content, filePath, isLoading }: FileViewerProps) {
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const extension = filePath.split('.').pop()?.toLowerCase() || '';

  async function handleCopy() {
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900/50 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <File className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-300">{filePath}</span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="relative">
        <pre className="p-4 text-sm overflow-auto max-h-[calc(100vh-300px)]">
          <code className={`language-${getLanguageClass(extension)}`}>
            {content || 'No content'}
          </code>
        </pre>
      </div>
    </div>
  );
}

function getLanguageClass(extension: string): string {
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
  };

  return languageMap[extension] || 'text';
}
