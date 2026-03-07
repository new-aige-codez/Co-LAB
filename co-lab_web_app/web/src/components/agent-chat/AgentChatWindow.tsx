import { useRef, useEffect } from 'react';
import { useAgentChatStore } from '../../store/agentChatStore';
import { useAgentStream } from '../../hooks/useAgentStream';
import { AgentChatMessage } from './AgentChatMessage';
import { AgentChatInput } from './AgentChatInput';

interface AgentChatWindowProps {
  onClose: () => void;
}

export function AgentChatWindow({ onClose }: AgentChatWindowProps) {
  const { messages, isLoading, error } = useAgentChatStore();
  const { sendMessage } = useAgentStream();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (message: string) => {
    sendMessage(message);
  };

  return (
    <div
      className="fixed bottom-24 right-6 z-40
        w-96 h-[32rem]
        bg-gray-800 rounded-lg shadow-2xl
        border border-gray-700
        flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="text-white"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              <circle cx="8" cy="10" r="1.5" fill="currentColor" />
              <circle cx="16" cy="10" r="1.5" fill="currentColor" />
              <path
                d="M8 15c1.5 2 6.5 2 8 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">Project Agent</h3>
            <p className="text-xs text-gray-500">Ask about tasks, status, blockers</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 transition-colors p-1"
          aria-label="Close chat"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-850">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <svg
              className="w-12 h-12 mb-3 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm font-medium mb-1">Start a conversation</p>
            <p className="text-xs">
              Try: "Where did we leave off?" or "What needs attention?"
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <AgentChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Error display */}
        {error && (
          <div className="mb-3 p-2 bg-red-900/50 border border-red-700 rounded text-red-200 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Quick actions */}
      {messages.length === 0 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {['Where did we leave off?', 'What tasks are blocked?', 'Project status'].map(
              (suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  disabled={isLoading}
                  className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600
                    text-gray-300 rounded transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {suggestion}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <AgentChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
