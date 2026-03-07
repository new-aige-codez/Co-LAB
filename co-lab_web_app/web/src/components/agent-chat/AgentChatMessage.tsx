import type { ChatMessage } from '../../types/agent-chat';

interface AgentChatMessageProps {
  message: ChatMessage;
}

export function AgentChatMessage({ message }: AgentChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 ${
          isUser
            ? 'bg-orange-600 text-white'
            : 'bg-gray-700 text-gray-100'
        }`}
      >
        {/* Message content with basic markdown support */}
        <div className="text-sm whitespace-pre-wrap break-words">
          <MessageContent content={message.content} isStreaming={message.isStreaming} />
        </div>

        {/* Timestamp */}
        <div
          className={`text-[10px] mt-1 ${
            isUser ? 'text-orange-200' : 'text-gray-500'
          }`}
        >
          {formatTime(message.timestamp)}
          {message.isStreaming && (
            <span className="ml-2 inline-flex items-center gap-1">
              <span className="animate-pulse">...</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  if (!content) {
    return isStreaming ? (
      <span className="inline-flex items-center gap-1">
        <span className="animate-bounce">.</span>
        <span className="animate-bounce delay-75">.</span>
        <span className="animate-bounce delay-150">.</span>
      </span>
    ) : null;
  }

  // Basic markdown: bold, italic, code blocks
  const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={index}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={index}
              className="bg-gray-800 text-orange-300 px-1 rounded text-xs"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={index}>{part}</span>;
      })}
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 bg-orange-400 animate-pulse ml-0.5" />
      )}
    </>
  );
}

function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
