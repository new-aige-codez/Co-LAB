import { useAgentChatStore } from '../../store/agentChatStore';
import { AgentChatButton } from './AgentChatButton';
import { AgentChatWindow } from './AgentChatWindow';

export function AgentChatWidget() {
  const { isOpen, toggleOpen, setOpen } = useAgentChatStore();

  return (
    <>
      {/* Floating button - always visible when chat is closed */}
      {!isOpen && <AgentChatButton onClick={toggleOpen} />}

      {/* Chat window - visible when open */}
      {isOpen && <AgentChatWindow onClose={() => setOpen(false)} />}
    </>
  );
}
