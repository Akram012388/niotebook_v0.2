type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  badge: string;
  timestampSec: number;
  createdAt: number;
  isStreaming?: boolean;
  /** Typewriter reveal in progress (stream may still be filling content). */
  isRevealing?: boolean;
  /** Set when a streaming message finishes — triggers typewriter reveal. */
  wasStreaming?: boolean;
  requestId?: string;
};

type ChatStreamState = "idle" | "streaming" | "error";

export type { ChatMessage, ChatRole, ChatStreamState };
