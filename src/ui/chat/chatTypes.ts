type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  badge: string;
  timestampSec: number;
  createdAt: number;
  isStreaming?: boolean;
  /** Set when a streaming message finishes — triggers markdown parse. */
  wasStreaming?: boolean;
  requestId?: string;
};

type ChatStreamState = "idle" | "streaming" | "error";

export type { ChatMessage, ChatRole, ChatStreamState };
