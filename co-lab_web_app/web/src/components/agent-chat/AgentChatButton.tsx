interface AgentChatButtonProps {
  onClick: () => void;
  hasUnread?: boolean;
}

export function AgentChatButton({ onClick, hasUnread }: AgentChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40
        w-14 h-14 rounded-full
        bg-gradient-to-br from-orange-500 to-orange-600
        shadow-lg hover:shadow-xl hover:scale-105
        transition-all duration-200
        flex items-center justify-center
        group relative"
      aria-label="Open Project Agent Chat"
    >
      {/* Claude Code icon - simplified AI bot icon */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
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

      {/* Tooltip */}
      <span
        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2
          px-2 py-1 rounded text-xs font-medium
          bg-gray-900 text-gray-100 whitespace-nowrap
          opacity-0 group-hover:opacity-100
          transition-opacity pointer-events-none"
      >
        Project Agent
      </span>

      {/* Unread indicator */}
      {hasUnread && (
        <span
          className="absolute -top-1 -right-1
            w-4 h-4 rounded-full
            bg-red-500 border-2 border-gray-900
            flex items-center justify-center"
        >
          <span className="text-[10px] text-white font-bold">!</span>
        </span>
      )}
    </button>
  );
}
