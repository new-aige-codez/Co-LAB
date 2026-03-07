import { useState, useRef, useEffect } from 'react';

interface AgentChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function AgentChatInput({
  onSend,
  disabled = false,
  placeholder = 'Ask about the project...',
}: AgentChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 border-t border-gray-700 bg-gray-800">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none bg-gray-700 border border-gray-600
          rounded-lg px-3 py-2 text-sm text-gray-100
          placeholder-gray-500
          focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500
          disabled:opacity-50 disabled:cursor-not-allowed
          max-h-24 overflow-y-auto"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !input.trim()}
        className="flex-shrink-0 w-10 h-10 rounded-lg
          bg-orange-600 hover:bg-orange-700
          disabled:bg-gray-600 disabled:cursor-not-allowed
          flex items-center justify-center
          transition-colors"
        aria-label="Send message"
      >
        {disabled ? (
          <svg
            className="w-5 h-5 text-gray-400 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
